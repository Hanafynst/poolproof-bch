/**
 * Live BCH/USD rate — the portfolio card's fiat anchor (R83).
 *
 * Until R83 the app's only BCH/USD figure was the labelled
 * reference captured with the bundled snapshots (Selene market
 * page, 13 Nov 2026), and the user's order was plain: the rate
 * must be live. This module reads it from keyless, CORS-open
 * public price endpoints in a fixed fallback order. Each source
 * is parsed strictly against its real payload shape (captured
 * fixtures pin all three shapes in the suite) and the candidate
 * must land inside the sanity band below; the first valid quote
 * wins. Total failure returns null — the caller then shows its
 * prices-unavailable state. This module never falls back to a
 * cached, stale, or invented number: a rate is either fresh
 * from a named source or absent.
 *
 * The band is a sanity rail, not a price opinion: BCH has traded
 * between roughly $85 and $790 across 2024–2026, so a quote
 * outside $10–$10,000 is a broken or hostile payload, never a
 * market move this app should print.
 */

/** A live quote: the rate, the source that served it, and the
 *  moment it was read (epoch milliseconds, caller's clock). */
export interface FxRate {
  rateUsd: number;
  source: string;
  fetchedAt: number;
}

export const FX_RATE_MIN_USD = 10;
export const FX_RATE_MAX_USD = 10_000;
export const FX_DEFAULT_TIMEOUT_MS = 6_000;

/** The band itself, shared by every parser: a finite number,
 *  positive, inside $10–$10,000. Strings are not rates here —
 *  parsers convert explicitly before asking. */
export function isSaneBchUsd(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= FX_RATE_MIN_USD &&
    value <= FX_RATE_MAX_USD
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** A payload field that must be a numeric string ("214.210000")
 *  or a number, converted and band-checked. Anything else —
 *  missing, empty, non-numeric, out of band — is null. */
function rateField(value: unknown): number | null {
  let candidate: number;
  if (typeof value === "number") {
    candidate = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    candidate = Number(value);
  } else {
    return null;
  }
  return isSaneBchUsd(candidate) ? candidate : null;
}

/**
 * Kraken public Ticker for BCHUSD:
 * {"error":[],"result":{"BCHUSD":{"c":["214.210000","0.776"],...}}}
 * The rate is the last trade price, c[0]. A non-empty error
 * array is a refusal, not a quote.
 */
export function parseKrakenBchUsd(payload: unknown): number | null {
  const root = asRecord(payload);
  if (root === null) return null;
  if (!Array.isArray(root.error) || root.error.length !== 0) return null;
  const pair = asRecord(asRecord(root.result)?.BCHUSD);
  if (pair === null || !Array.isArray(pair.c)) return null;
  return rateField(pair.c[0]);
}

/**
 * Coinbase spot price:
 * {"data":{"amount":"214.085","base":"BCH","currency":"USD"}}
 * Base and currency are checked, not assumed: the same endpoint
 * serves every pair, and a BTC quote is not a BCH rate.
 */
export function parseCoinbaseBchUsd(payload: unknown): number | null {
  const data = asRecord(asRecord(payload)?.data);
  if (data === null) return null;
  if (data.base !== "BCH" || data.currency !== "USD") return null;
  return rateField(data.amount);
}

/**
 * CoinGecko simple price:
 * {"bitcoin-cash":{"usd":214.35}}
 */
export function parseCoinGeckoBchUsd(payload: unknown): number | null {
  const entry = asRecord(asRecord(payload)?.["bitcoin-cash"]);
  if (entry === null) return null;
  return rateField(entry.usd);
}

export interface FxSource {
  name: string;
  url: string;
  parse: (payload: unknown) => number | null;
}

/**
 * The fallback order. Kraken first (an exchange's own last
 * trade, and it echoes the caller's origin in its CORS header),
 * Coinbase second (spot quote, wildcard CORS), CoinGecko last
 * (an aggregator whose free tier rate-limits soonest). All
 * three were verified answering with Access-Control-Allow-Origin
 * from this machine on 2026-11-14 before being wired.
 */
export const FX_SOURCES: readonly FxSource[] = [
  {
    name: "Kraken",
    url: "https://api.kraken.com/0/public/Ticker?pair=BCHUSD",
    parse: parseKrakenBchUsd,
  },
  {
    name: "Coinbase",
    url: "https://api.coinbase.com/v2/prices/BCH-USD/spot",
    parse: parseCoinbaseBchUsd,
  },
  {
    name: "CoinGecko",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-cash&vs_currencies=usd",
    parse: parseCoinGeckoBchUsd,
  },
];

/** The slice of a fetch Response this module reads. */
export interface FxFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type FxFetch = (
  url: string,
  init: { signal: AbortSignal },
) => Promise<FxFetchResponse>;

/** Injectable seams, for the suite: the fetch implementation,
 *  the per-source timeout, and the clock stamped on a success. */
export interface FxDeps {
  fetchImpl?: FxFetch;
  timeoutMs?: number;
  now?: () => number;
}

async function fetchOne(
  source: FxSource,
  fetchImpl: FxFetch,
  timeoutMs: number,
): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(source.url, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return source.parse(await response.json());
  } catch {
    // A throw, an abort, a malformed body: this source simply
    // did not answer. The next one gets its turn.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read the live BCH/USD rate: sources in FX_SOURCES order, the
 * first valid quote wins. Null when every source failed — the
 * caller's prices-unavailable state, never a fallback number.
 */
export async function fetchBchUsdRate(
  deps: FxDeps = {},
): Promise<FxRate | null> {
  const fetchImpl: FxFetch =
    deps.fetchImpl ??
    ((url, init) => fetch(url, { ...init, headers: { accept: "application/json" } }));
  const timeoutMs = deps.timeoutMs ?? FX_DEFAULT_TIMEOUT_MS;
  const now = deps.now ?? Date.now;
  for (const source of FX_SOURCES) {
    const rateUsd = await fetchOne(source, fetchImpl, timeoutMs);
    if (rateUsd !== null) {
      return { rateUsd, source: source.name, fetchedAt: now() };
    }
  }
  return null;
}
