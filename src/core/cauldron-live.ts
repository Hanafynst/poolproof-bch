/**
 * Live Cauldron adapter — practice (spike-local only, NOT the
 * submission repo). Maps the Riften Cauldron indexer's responses into
 * PoolFacts for the verdict core: this is the wiring the practice app
 * was missing (R3/R4 gap — until now it rendered saved snapshots).
 *
 * Endpoint proven live from this machine on 2026-11-13:
 *   GET {CAULDRON_INDEXER}pool/active?token=<category>
 *     -> { active: [{ sats, tokens, ... }] }
 * An unknown category answers 200 with an empty list — a clean
 * NO_MARKET, not an error. Live PUSD aggregates from this endpoint
 * matched the saved fixture to the satoshi (61 pools,
 * 49,973,609,463 sats) on the same day.
 *
 * Scope honesty: this adapter resolves only what the indexer itself
 * proves — that the category trades against BCH, and its reserves:
 * the aggregate pair AND the per-pool list, so the core's exit
 * simulation can route across the real pools (R39). Name/symbol/
 * decimals come from the BCMR authchain (Day-2 work) and total
 * supply is not sourced yet, so the facts carry the documented
 * supply stand-in and the caller must disclose it: totalSupplyRaw =
 * 10x the pool token reserve, which makes the core's reference sell
 * land exactly on its 10%-of-reserve cap.
 */
import type { PoolFacts, PoolReserve } from "./poolproof-core.js";

export const CAULDRON_INDEXER = "https://indexer.riften.net/cauldron/";

/** A CashToken category is the 32-byte genesis txid, hex-encoded. */
export function normalizeCategory(input: string): string {
  const category = input.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(category)) {
    throw new RangeError(
      `category must be exactly 64 hex characters, got "${input}"`,
    );
  }
  return category;
}

export interface AggregatedPools {
  poolCount: number;
  reserveQuoteSats: bigint;
  reserveTokenRaw: bigint;
  /** The same reserves, un-summed: one entry per active pool,
   *  deepest first (sats descending, tokens descending on ties,
   *  indexer order on full ties — the sort is stable). The routed
   *  exit simulation consumes this list; the aggregate pair above
   *  remains for the spot price, the dust rule and the labelled
   *  single-curve comparison. */
  pools: PoolReserve[];
}

interface ActivePoolEntry {
  sats: number;
  tokens: number;
}

function isActivePoolEntry(value: unknown): value is ActivePoolEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    Number.isInteger(entry.sats) &&
    Number.isInteger(entry.tokens) &&
    (entry.sats as number) >= 0 &&
    (entry.tokens as number) >= 0
  );
}

/** Sum the indexer's per-pool reserves — and keep the per-pool list
 *  itself, deepest first: until R39 the list was thrown away here,
 *  which forced the core to price exits against the blended curve.
 *  Malformed data fails loud: a reserves figure built by silently
 *  dropping pools could understate the exit and flip a verdict —
 *  the R7 lesson applied to data, not just parameters. */
export function aggregateActivePools(payload: unknown): AggregatedPools {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !Array.isArray((payload as Record<string, unknown>).active)
  ) {
    throw new TypeError("indexer payload has no active pool list");
  }
  const active = (payload as { active: unknown[] }).active;
  let reserveQuoteSats = 0n;
  let reserveTokenRaw = 0n;
  const pools: PoolReserve[] = [];
  for (const entry of active) {
    if (!isActivePoolEntry(entry)) {
      throw new TypeError(
        `malformed pool entry in indexer payload: ${JSON.stringify(entry)}`,
      );
    }
    reserveQuoteSats += BigInt(entry.sats);
    reserveTokenRaw += BigInt(entry.tokens);
    pools.push({ satsReserve: BigInt(entry.sats), tokenReserve: BigInt(entry.tokens) });
  }
  // Deepest first: sats decide depth (an exit is paid in sats);
  // tokens break ties; full ties keep indexer order (stable sort),
  // so the list — and every routed figure built on it — is
  // deterministic for a given payload.
  pools.sort((a, b) => {
    if (a.satsReserve !== b.satsReserve) return a.satsReserve > b.satsReserve ? -1 : 1;
    if (a.tokenReserve !== b.tokenReserve) return a.tokenReserve > b.tokenReserve ? -1 : 1;
    return 0;
  });
  return { poolCount: active.length, reserveQuoteSats, reserveTokenRaw, pools };
}

export interface LiveFacts {
  facts: PoolFacts;
  poolCount: number;
  /** True while total supply is unsourced and the stand-in applies.
   *  The report layer must say so — a stand-in shown as a measured
   *  supply would be a displayed number dressed as proof. */
  supplyStandIn: boolean;
}

export function factsFromPools(pools: AggregatedPools): LiveFacts {
  const facts: PoolFacts = {
    // The indexer's well-formed answer IS the basic read in this
    // pass: the category is known to Cauldron, with pools or cleanly
    // without. BCMR identity (Day 2) can only add flags on top.
    tokenReadable: true,
    hasPool: pools.poolCount > 0,
    reserveQuoteSats: pools.reserveQuoteSats,
    reserveTokenRaw: pools.reserveTokenRaw,
    // The per-pool list crosses untouched: it is what lets the core
    // route the exit simulation across the real pools (R39).
    pools: pools.pools,
    totalSupplyRaw: pools.reserveTokenRaw * 10n,
  };
  return { facts, poolCount: pools.poolCount, supplyStandIn: true };
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/** Fetch one category's live facts. Throws on transport/HTTP/data
 *  errors — the caller renders an honest error state, never a
 *  verdict built on a failed read. */
export async function fetchLivePoolFacts(
  categoryInput: string,
  fetchFn: FetchFn = fetch,
): Promise<LiveFacts & { category: string; checkedAt: Date }> {
  const category = normalizeCategory(categoryInput);
  const response = await fetchFn(
    `${CAULDRON_INDEXER}pool/active?token=${category}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (PoolProof practice)" },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    throw new Error(`cauldron indexer HTTP ${response.status}`);
  }
  const pools = aggregateActivePools(await response.json());
  return {
    ...factsFromPools(pools),
    category,
    checkedAt: new Date(),
  };
}
