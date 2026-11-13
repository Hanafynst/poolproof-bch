// Holder concentration: Gini coefficient + tier, top-1/top-10
// shares, and the Herfindahl index (HHI) over a richest-first
// holder list — the distribution block of the PoolProof report.
//
// The tier system is the mechanic published by TokenStork and
// recorded in TOKENSTORK-TEARDOWN.md; the implementation here is
// ours, written from the teardown's facts, not from their code.
//
// Two honesty rules carried over from the R26 second-source work:
// - A list capped by the source (TokenStork serves at most 100
//   holders) yields LISTED-basis figures. The report labels its
//   basis and never presents a capped list as whole-supply truth.
// - Share-of-supply is computed only against a real supply. PUSD's
//   reported supply is an int64 genesis sentinel (see
//   tokenstork.ts), and no share is ever divided by it.
//
// All accumulation is bigint. Balances approach int64 max, where
// float64 keeps only ~9e15 exactly — summing or squaring them as
// JS numbers would lose whole tokens. Each metric is one exact
// bigint fraction, converted to a float once, at the end.

const RATIO_SCALE = 1_000_000_000_000n; // 1e12 fixed-point for the single conversion

/** Exact bigint fraction -> float, error below 1e-12. Denominator must be > 0. */
function scaledRatio(numerator: bigint, denominator: bigint): number {
  return Number((numerator * RATIO_SCALE) / denominator) / 1e12;
}

function totalOf(balances: bigint[]): bigint {
  return balances.reduce((acc, b) => acc + b, 0n);
}

/**
 * Gini coefficient of a balance list (balances are non-negative
 * base-unit counts, any order). 0 = perfectly equal, 1 = one
 * holder has everything.
 *
 * Sorted-ascending formula, 1-based i:
 *   G = (2 * sum(i * x_i)) / (n * sum(x_i)) - (n + 1) / n
 * computed as a single bigint fraction so no intermediate float
 * ever appears. Null for an empty list or a zero total.
 *
 * Convention: a single holder returns 0 — the formula has no
 * spread to measure. With one holder the top-1 share (1.0) is
 * the signal; the Gini is not.
 */
export function giniCoefficient(balances: bigint[]): number | null {
  const n = balances.length;
  if (n === 0) return null;
  const sorted = [...balances].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  let weighted = 0n;
  for (let i = 0; i < n; i++) weighted += BigInt(i + 1) * sorted[i];
  const total = totalOf(sorted);
  if (total === 0n) return null;
  const bn = BigInt(n);
  // G = [2 * weighted * n - (n + 1) * n * total] / [n^2 * total]
  const numerator = 2n * weighted * bn - (bn + 1n) * bn * total;
  return scaledRatio(numerator, bn * bn * total);
}

export type GiniTier =
  | "Well-distributed"
  | "Good"
  | "Fair"
  | "Poor"
  | "Whale-controlled";

/**
 * The teardown's single tier function. Boundaries belong to the
 * HIGHER tier: exactly 0.40 is "Good", not "Well-distributed".
 * Null in -> null out (the UI omits the badge on a null Gini).
 */
export function giniTier(gini: number | null): GiniTier | null {
  if (gini === null) return null;
  if (gini < 0.4) return "Well-distributed";
  if (gini < 0.6) return "Good";
  if (gini < 0.75) return "Fair";
  if (gini < 0.9) return "Poor";
  return "Whale-controlled";
}

/**
 * Share of the listed total held by the top n balances (0..1).
 * Null when the list is empty or its total is 0.
 */
export function shareOfTop(balances: bigint[], n: number): number | null {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("concentration: shareOfTop n must be a positive integer");
  }
  if (balances.length === 0) return null;
  const total = totalOf(balances);
  if (total === 0n) return null;
  const sortedDesc = [...balances].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return scaledRatio(totalOf(sortedDesc.slice(0, n)), total);
}

/**
 * Herfindahl-Hirschman index: sum of squared shares, 0..1 scale
 * (1 = a single holder). Null when the list is empty or its
 * total is 0.
 */
export function hhi(balances: bigint[]): number | null {
  if (balances.length === 0) return null;
  const total = totalOf(balances);
  if (total === 0n) return null;
  let squares = 0n;
  for (const b of balances) squares += b * b;
  return scaledRatio(squares, total * total);
}

export interface ConcentrationHolder {
  address: string;
  balance: bigint;
}

export interface ConcentrationReportOpts {
  /** Holders known to exist beyond the list, when the source reports it. */
  totalHolderCount?: number;
  /** Current supply in base units, when a source reports it. */
  supply?: bigint | null;
  /** True when `supply` is a genesis sentinel, not a count (R26 flag). */
  supplyIsSentinel?: boolean;
}

export type ConcentrationBasis = "full" | "listed-top-100";

export interface ConcentrationReport {
  listedCount: number;
  /** Echoed from opts when the total is known, else null. */
  totalHolderCount: number | null;
  /**
   * "full" when every holder is listed; "listed-top-100" when the
   * source capped the list — every figure below is then over the
   * listed balances only, and the UI must say so.
   */
  basis: ConcentrationBasis;
  gini: number | null;
  tier: GiniTier | null;
  top1ShareOfListed: number | null;
  /** Suppressed (null) when fewer than 5 holders are listed. */
  top10ShareOfListed: number | null;
  /** Suppressed (null) when fewer than 10 holders are listed. */
  hhi: number | null;
  /**
   * Present only against a real supply: null when no supply is
   * given, when the supply is a sentinel, or when the listed
   * total exceeds the supply (the two sources disagree — refuse
   * rather than print a share above 1).
   */
  top1ShareOfSupply: number | null;
}

/** The report object the UI renders. `holders` is richest-first. */
export function concentrationReport(
  holders: ConcentrationHolder[],
  opts: ConcentrationReportOpts = {},
): ConcentrationReport {
  const balances = holders.map((h) => h.balance);
  const listedCount = holders.length;
  const totalHolderCount =
    opts.totalHolderCount !== undefined ? opts.totalHolderCount : null;
  const basis: ConcentrationBasis =
    totalHolderCount !== null && listedCount < totalHolderCount
      ? "listed-top-100"
      : "full";
  const gini = giniCoefficient(balances);
  const listedTotal = totalOf(balances);

  let top1ShareOfSupply: number | null = null;
  const supply = opts.supply !== undefined ? opts.supply : null;
  if (
    supply !== null &&
    supply > 0n &&
    opts.supplyIsSentinel !== true &&
    listedCount > 0 &&
    listedTotal <= supply
  ) {
    const top1 = balances.reduce((max, b) => (b > max ? b : max), 0n);
    top1ShareOfSupply = scaledRatio(top1, supply);
  }

  return {
    listedCount,
    totalHolderCount,
    basis,
    gini,
    tier: giniTier(gini),
    top1ShareOfListed: shareOfTop(balances, 1),
    top10ShareOfListed: listedCount < 5 ? null : shareOfTop(balances, 10),
    hhi: listedCount < 10 ? null : hhi(balances),
    top1ShareOfSupply,
  };
}
