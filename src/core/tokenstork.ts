// TokenStork second source: identity, supply, mint authority and
// holder concentration for one CashToken category, independent of
// the Cauldron indexer. Two-source rule (REFERENCE-TEARDOWN): a
// figure PoolProof prints should survive a second source saying it.
//
// Lookup shape, proven live 2026-11-13: there is no single-token
// endpoint. GET /api/tokens?symbol=<SYM> returns every token with
// that symbol — including ticker clones — so the caller pins the
// exact category id and anything else is rejected. Holders live at
// GET /api/tokens/<category>/holders and are capped at 100 entries.
//
// Supply trap, also proven live: PUSD's currentSupply is
// 9,223,372,036,854,773,316 — int64 max minus 2,491. That is a
// genesis sentinel, not a count. Supplies at or above 2^62 are
// flagged, and no share-of-supply is computed against them.

export const TOKENSTORK_API = "https://tokenstork.com/api/tokens";

const SENTINEL_SUPPLY_FLOOR = 1n << 62n;
export const HOLDERS_LIST_CAP = 100;

export interface TokenStorkRow {
  category: string;
  name: string;
  symbol: string;
  decimals: number;
  supplyRaw: bigint;
  supplyIsSentinel: boolean;
  holderCount: number;
  hasActiveMinting: boolean;
  isFullyBurned: boolean;
}

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`tokenstork: ${what} is not an object`);
  }
  return value as Record<string, unknown>;
}

function asCount(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`tokenstork: ${what} is not a non-negative integer`);
  }
  return value;
}

/** Normalize one raw API row; throws on any malformed field. */
export function normalizeTokenRow(raw: unknown): TokenStorkRow {
  const row = asRecord(raw, "token row");
  if (typeof row.id !== "string" || !/^[0-9a-f]{64}$/.test(row.id)) {
    throw new Error("tokenstork: token row id is not a category id");
  }
  if (typeof row.currentSupply !== "string" || !/^[0-9]+$/.test(row.currentSupply)) {
    throw new Error("tokenstork: currentSupply is not a base-unit string");
  }
  const supplyRaw = BigInt(row.currentSupply);
  return {
    category: row.id,
    name: typeof row.name === "string" ? row.name : "",
    symbol: typeof row.symbol === "string" ? row.symbol : "",
    decimals: asCount(row.decimals, "decimals"),
    supplyRaw,
    supplyIsSentinel: supplyRaw >= SENTINEL_SUPPLY_FLOOR,
    holderCount: asCount(row.holderCount, "holderCount"),
    hasActiveMinting: row.hasActiveMinting === true,
    isFullyBurned: row.isFullyBurned === true,
  };
}

/**
 * Pick the row for the EXACT category out of a ?symbol= response.
 * Throws when it is absent — a same-symbol clone is not a match.
 */
export function pickCategoryRow(payload: unknown, category: string): TokenStorkRow {
  const body = asRecord(payload, "symbol response");
  if (!Array.isArray(body.tokens)) {
    throw new Error("tokenstork: symbol response has no tokens array");
  }
  for (const raw of body.tokens) {
    const row = normalizeTokenRow(raw);
    if (row.category === category) return row;
  }
  throw new Error(`tokenstork: category ${category} not in symbol results`);
}

export interface HolderBalance {
  address: string;
  balanceRaw: bigint;
}

/** Parse a holders response; the echoed category must match. Sorted richest first. */
export function parseHolders(payload: unknown, category: string): HolderBalance[] {
  const body = asRecord(payload, "holders response");
  if (body.category !== category) {
    throw new Error("tokenstork: holders response is for a different category");
  }
  if (!Array.isArray(body.holders)) {
    throw new Error("tokenstork: holders response has no holders array");
  }
  const holders = body.holders.map((raw) => {
    const entry = asRecord(raw, "holder entry");
    if (typeof entry.address !== "string" || entry.address.length === 0) {
      throw new Error("tokenstork: holder entry has no address");
    }
    if (typeof entry.balance !== "string" || !/^[0-9]+$/.test(entry.balance)) {
      throw new Error("tokenstork: holder balance is not a base-unit string");
    }
    return { address: entry.address, balanceRaw: BigInt(entry.balance) };
  });
  holders.sort((a, b) => (a.balanceRaw < b.balanceRaw ? 1 : a.balanceRaw > b.balanceRaw ? -1 : 0));
  return holders;
}

export interface Concentration {
  listedHolders: number;
  /** Share of total supply held by the largest holder; null when supply is a sentinel. */
  top1ShareOfSupply: number | null;
  /** Share of total supply held by the 10 largest; null when supply is a sentinel. */
  top10ShareOfSupply: number | null;
  /** Share of the LISTED balances held by the largest holder — always computable. */
  top1ShareOfListed: number;
}

function shareOf(part: bigint, whole: bigint): number {
  if (whole <= 0n) return 0;
  // Scale before dividing so bigint precision survives the float.
  return Number((part * 1_000_000n) / whole) / 1_000_000;
}

export function concentration(
  holders: HolderBalance[],
  supplyRaw: bigint,
  supplyIsSentinel: boolean,
): Concentration {
  const sum = (list: HolderBalance[]) => list.reduce((acc, h) => acc + h.balanceRaw, 0n);
  const listedTotal = sum(holders);
  return {
    listedHolders: holders.length,
    top1ShareOfSupply:
      supplyIsSentinel || holders.length === 0
        ? null
        : shareOf(holders[0].balanceRaw, supplyRaw),
    top10ShareOfSupply:
      supplyIsSentinel || holders.length === 0
        ? null
        : shareOf(sum(holders.slice(0, 10)), supplyRaw),
    top1ShareOfListed: holders.length === 0 ? 0 : shareOf(holders[0].balanceRaw, listedTotal),
  };
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`tokenstork: GET ${url} -> HTTP ${response.status}`);
  }
  return response.json();
}

/** Live: the row for an exact category, found via its symbol listing. */
export async function fetchTokenStorkRow(
  symbol: string,
  category: string,
): Promise<TokenStorkRow> {
  const payload = await getJson(
    `${TOKENSTORK_API}?symbol=${encodeURIComponent(symbol)}`,
  );
  return pickCategoryRow(payload, category);
}

/** Live: the (capped) holder list for a category. */
export async function fetchHolders(category: string): Promise<HolderBalance[]> {
  const payload = await getJson(`${TOKENSTORK_API}/${category}/holders`);
  return parseHolders(payload, category);
}
