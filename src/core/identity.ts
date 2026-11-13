/**
 * Token identity resolution — practice (spike-local only, NOT the
 * submission repo). A live audit starts from a category and nothing
 * else; this module turns the category into the name / symbol /
 * decimals a report header needs, from TokenStork — the second
 * source R26 integrated — or returns null and lets the report keep
 * its honest unnamed treatment.
 *
 * The trap R26 proved live shapes the whole module: TokenStork has
 * no single-token endpoint, and its listings carry ticker CLONES —
 * the captured PUSD symbol listing holds two "PUSD" tokens,
 * ParityUSD (listed first) and the real ParyonUSD. Identity is
 * therefore pinned by the exact category id INSIDE the resolver:
 * a same-symbol entry under a different category is not a match,
 * ever. The injected fetcher only supplies candidates.
 *
 * Null is the only failure shape: a malformed category, the
 * category absent from the candidates, the pinned entry malformed
 * (missing or empty name/symbol, negative / fractional / absurd
 * decimals), an unrecognisable payload, or a failed transport. An
 * audit must never die — or worse, invent a name — because an
 * identity lookup came back empty: the Cauldron read is the audit,
 * identity is only its header.
 */
export interface TokenIdentity {
  name: string;
  symbol: string;
  decimals: number;
  source: "tokenstork";
}

/**
 * Supplies candidate TokenStork entries for a category, in any of
 * the shapes the source answers: a `{ tokens: [...] }` listing, a
 * bare array of entries, or a single entry object. Pinning and
 * validation live in the resolver, never in the transport.
 */
export type FetchTokenStorkEntry = (category: string) => Promise<unknown>;

const CATEGORY_PATTERN = /^[0-9a-f]{64}$/;

// A CashToken decimals value is a byte in every registry that
// carries one; anything past 255 is a corrupt entry, not a token
// with exotic precision (and 10n ** decimals would eat memory).
const MAX_DECIMALS = 255;

function candidateEntries(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object" || payload === null) return [];
  const body = payload as Record<string, unknown>;
  if (Array.isArray(body.tokens)) return body.tokens;
  if (typeof body.id === "string") return [payload];
  return [];
}

function identityFromEntry(raw: unknown, category: string): TokenIdentity | null {
  if (typeof raw !== "object" || raw === null) return null;
  const entry = raw as Record<string, unknown>;
  // The pin: this entry, and only this entry, may speak for the
  // category. A clone under another id is skipped, not matched.
  if (entry.id !== category) return null;
  if (typeof entry.name !== "string" || entry.name.trim() === "") return null;
  if (typeof entry.symbol !== "string" || entry.symbol.trim() === "") return null;
  if (
    typeof entry.decimals !== "number" ||
    !Number.isInteger(entry.decimals) ||
    entry.decimals < 0 ||
    entry.decimals > MAX_DECIMALS
  ) {
    return null;
  }
  return {
    name: entry.name,
    symbol: entry.symbol,
    decimals: entry.decimals,
    source: "tokenstork",
  };
}

/**
 * Resolve the identity for one exact category, or null when no
 * candidate the source offered can stand behind the name. Never
 * throws: every failure is a null the caller renders honestly.
 */
export async function resolveIdentity(
  category: string,
  fetchTokenStorkEntry: FetchTokenStorkEntry,
): Promise<TokenIdentity | null> {
  if (!CATEGORY_PATTERN.test(category)) return null;
  let payload: unknown;
  try {
    payload = await fetchTokenStorkEntry(category);
  } catch {
    return null;
  }
  for (const raw of candidateEntries(payload)) {
    const identity = identityFromEntry(raw, category);
    if (identity !== null) return identity;
  }
  return null;
}

export const TOKENSTORK_API = "https://tokenstork.com/api/tokens";

// The list endpoint paginates (21,556 tokens at the R40 read) and
// there is no by-category query — R26 proved ?category= / ?id= are
// ignored and /api/tokens/<category> returns the SPA shell; R40
// re-proved ?search= is ignored too. The app-side transport
// therefore scans pages of 500 (the page size the R15 dead-hunt
// proved) and hands the resolver a page that carries the
// category — spotting an id in a page is transport efficiency
// only; the resolver re-pins and re-validates whatever it gets.
// The scan is bounded: past the cap the identity is honestly null,
// never a slower audit — the Cauldron read must not wait on a
// registry walk.
//
// R41: the pages are fetched with bounded concurrency instead of
// one at a time. The sequential walk paid one page latency per
// page — ~13 s for PUSD (past entry 1,000), ~23 s for a category
// the list does not carry at all. Page arrival order must not
// matter, and it does not: the resolver pins by exact id inside
// whichever page carried the category, and a same-symbol clone on
// an earlier or faster page is never the answer (the scan spots
// ids, never symbols).
export const TOKENSTORK_SCAN_PAGE_SIZE = 500;
export const TOKENSTORK_SCAN_MAX_PAGES = 8;
// At most this many page requests in flight at once — a courtesy
// bound for the service as much as a latency one: four parallel
// reads, no unbounded fan-out, and a failed page is never retried.
export const TOKENSTORK_SCAN_MAX_IN_FLIGHT = 4;

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/** Live: candidate entries for a category from the list endpoint. */
export async function fetchTokenStorkCandidates(
  category: string,
  fetchFn: FetchFn = fetch,
): Promise<unknown> {
  const payloads = new Map<number, unknown>();
  let foundPage = -1; // lowest page index carrying the category
  let endPage = -1; // lowest page index that ends the list (short)
  let nextPage = 0;
  let failure: unknown = null;

  const recordPage = (page: number, payload: unknown) => {
    payloads.set(page, payload);
    const entries = candidateEntries(payload);
    if (
      entries.length < TOKENSTORK_SCAN_PAGE_SIZE &&
      (endPage === -1 || page < endPage)
    ) {
      endPage = page;
    }
    const spotted = entries.some(
      (raw) =>
        typeof raw === "object" &&
        raw !== null &&
        (raw as Record<string, unknown>).id === category,
    );
    if (spotted && (foundPage === -1 || page < foundPage)) {
      foundPage = page;
    }
  };

  // Issue while the scan still has somewhere to go: no page has
  // carried the category, no failure is recorded, the page cap is
  // not reached, and issuance has not passed a known end of list
  // (pages issue in order, so a known end page is always issued
  // already — that last check is belt on braces).
  const shouldIssue = () =>
    failure === null &&
    foundPage === -1 &&
    nextPage < TOKENSTORK_SCAN_MAX_PAGES &&
    (endPage === -1 || nextPage <= endPage);

  const worker = async () => {
    while (shouldIssue()) {
      const page = nextPage++;
      try {
        const offset = page * TOKENSTORK_SCAN_PAGE_SIZE;
        const response = await fetchFn(
          `${TOKENSTORK_API}?limit=${TOKENSTORK_SCAN_PAGE_SIZE}&offset=${offset}`,
          {
            headers: { "User-Agent": "Mozilla/5.0 (PoolProof practice)" },
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (!response.ok) {
          throw new Error(`tokenstork HTTP ${response.status}`);
        }
        recordPage(page, await response.json());
      } catch (error) {
        // A failed page must not strand the pages still in flight:
        // record the first failure, stop issuing, let the pool
        // drain. Whether the failure is thrown is decided once
        // every page has settled — a page that already carried
        // the category outranks a speculative page's failure (the
        // sequential walk would have stopped before fetching it).
        if (failure === null) failure = error;
        return;
      }
    }
  };
  await Promise.all(
    Array.from({ length: TOKENSTORK_SCAN_MAX_IN_FLIGHT }, () => worker()),
  );

  if (foundPage !== -1) return payloads.get(foundPage);
  if (failure !== null) throw failure;
  // No hit: answer with the page the sequential walk would have
  // ended on — the page that ended the list, else the deepest
  // page the cap allowed. The resolver pins nothing in either;
  // the null it returns is the honest answer.
  if (endPage !== -1) return payloads.get(endPage);
  let deepest = -1;
  for (const page of payloads.keys()) {
    if (page > deepest) deepest = page;
  }
  return deepest === -1 ? null : payloads.get(deepest);
}
