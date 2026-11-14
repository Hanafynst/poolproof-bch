/**
 * Exit gauge model — practice (spike-local only, NOT the
 * submission repo). The pure geometry behind the report's
 * signature visual (R50): the exit truth, displayed vs real, as
 * bars. Every figure the gauge draws is a figure the report
 * already carries — the exit ratio and spot value from the
 * judgement, the reserve and the dust threshold from the facts
 * and the verdict's own flag — so the visual can never claim a
 * number the rows do not. This module decides only WHICH gauge
 * a judgement gets and the exact fractions it rests at:
 *
 *  - "ratio": the judgement carries an exit ratio. The real bar
 *    rests at the ratio on the verdict's own 0..1 scale, with
 *    the two lines the verdict was graded against (the core's
 *    EXIT_RATIO_DEAD / EXIT_RATIO_RISKY, imported, never
 *    re-typed). The thinner displayed bar rests at 1: the spot
 *    value is what the displayed price promises for the same
 *    reference sell, and measured against itself it is the
 *    whole scale — the gap between the two bars IS the exit
 *    loss, readable at a glance.
 *  - "reserve": the verdict is DEAD by the dust rule, which
 *    returns before any simulation exists (no ratio, no spot —
 *    inventing one for the visual would be a displayed number
 *    dressed as a measurement). The honest pair for that
 *    verdict is the reserve the pool actually holds against
 *    the dust threshold it failed to reach: the real bar rests
 *    at reserve / threshold, the thinner bar at the full
 *    threshold. Both figures already stand in the report (the
 *    reserve row, the dust flag's own wording).
 *  - null: no gauge. NO_MARKET and unreadable tokens have no
 *    exit to draw, and a route-failed RISKY judgement has
 *    reserves but no ratio — a bar there would perform a
 *    number nobody measured.
 */
import {
  EXIT_RATIO_DEAD,
  EXIT_RATIO_RISKY,
  QUOTE_DUST_SATS,
  type PoolFacts,
  type PoolJudgement,
  type PoolReserve,
} from "./poolproof-core.js";

/** Clamp a fraction to the gauge's 0..1 scale. A non-finite
 *  input rests at 0: the bar shows nothing rather than a
 *  length nobody computed. */
export function clampFraction(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** A position on the 0..1 scale as a percentage of the track,
 *  for the threshold ticks: the dead line at 1%, the alive
 *  line at 80%, from the core's constants. */
export function scalePercent(fraction: number): number {
  return clampFraction(fraction) * 100;
}

export interface RatioGauge {
  kind: "ratio";
  /** The judgement's exit ratio, exactly as reported. */
  ratio: number;
  /** The real bar's resting fraction: the ratio, clamped. */
  fill: number;
  /** The displayed bar's resting fraction: the spot promise
   *  measured against itself, always the full scale. */
  displayedFill: 1;
  /** The verdict lines, from the core's own constants. */
  deadLine: number;
  aliveLine: number;
  /** The spot value of the reference sell (the displayed
   *  bar's figure, already in the report's exit sentence). */
  spotOutSats: number;
  /** The simulated proceeds (the real bar's figure). */
  simulatedOutSats: bigint;
}

export interface ReserveGauge {
  kind: "reserve";
  /** The pool's real BCH reserve, in sats. */
  reserveSats: bigint;
  /** The dust threshold the reserve failed to reach, in sats. */
  thresholdSats: bigint;
  /** The real bar's resting fraction: reserve / threshold. */
  fill: number;
  /** The thinner bar's resting fraction: the full threshold. */
  displayedFill: 1;
}

export type ExitGaugeModel = RatioGauge | ReserveGauge;

/** The gauge a judgement gets, or null when no honest gauge
 *  exists for it. The dust branch reads the threshold from the
 *  verdict's own flag values (the numbers the flag sentence
 *  prints), falling back to the core's constant when a flag
 *  value cannot be parsed — either way the bar is drawn
 *  against the threshold the verdict itself applied. */
export function exitGaugeModel(
  judgement: PoolJudgement,
  facts: PoolFacts,
): ExitGaugeModel | null {
  if (
    judgement.exitRatio !== null &&
    judgement.simulatedOutSats !== null &&
    judgement.spotOutSats !== null
  ) {
    return {
      kind: "ratio",
      ratio: judgement.exitRatio,
      fill: clampFraction(judgement.exitRatio),
      displayedFill: 1,
      deadLine: EXIT_RATIO_DEAD,
      aliveLine: EXIT_RATIO_RISKY,
      spotOutSats: judgement.spotOutSats,
      simulatedOutSats: judgement.simulatedOutSats,
    };
  }
  const dust = judgement.flagDetails.find(
    (flag) => flag.code === "DUST_RESERVE",
  );
  if (dust !== undefined) {
    let threshold = QUOTE_DUST_SATS;
    try {
      const parsed = BigInt(dust.values.dustSats ?? "");
      if (parsed > 0n) threshold = parsed;
    } catch {
      // The flag's figure is unparseable: the core's constant
      // is the same number the verdict applied; use it.
    }
    const fill =
      threshold > 0n
        ? clampFraction(
            Number(facts.reserveQuoteSats) / Number(threshold),
          )
        : 0;
    return {
      kind: "reserve",
      reserveSats: facts.reserveQuoteSats,
      thresholdSats: threshold,
      fill,
      displayedFill: 1,
    };
  }
  return null;
}

/** The default number of pools the share list draws before
 *  the remainder folds into one "and N more" line. */
export const POOL_SHARE_SHOWN = 5;

export interface PoolShareRow {
  satsReserve: bigint;
  tokenReserve: bigint;
  /** This pool's share of the total BCH reserve, 0..1. */
  share: number;
}

export interface PoolShareModel {
  /** The pools drawn as bars, deepest first. */
  shown: PoolShareRow[];
  /** Every pool's BCH reserve summed, in sats. */
  totalSats: bigint;
  /** Pools folded into the remainder line (0 = no line). */
  hiddenCount: number;
  /** The folded pools' BCH reserve summed, in sats. */
  hiddenSats: bigint;
}

/** Per-pool shares of the total BCH reserve, for the scanner's
 *  exit group. The input list is the facts' per-pool split
 *  (the adapter orders it deepest first; this helper sorts its
 *  own copy the same way, so the model is right whoever built
 *  the facts). Shares are computed on the sats side — an exit
 *  is paid in sats, so sats are what a share is a share OF.
 *  Returns null when there is nothing to draw: no per-pool
 *  split, a single pool (one bar at 100% says nothing), or a
 *  zero total (no shares exist to take). */
export function poolShareModel(
  pools: readonly PoolReserve[] | undefined,
  shownLimit: number = POOL_SHARE_SHOWN,
): PoolShareModel | null {
  if (pools === undefined || pools.length < 2) return null;
  const sorted = [...pools].sort((a, b) => {
    if (a.satsReserve !== b.satsReserve) {
      return a.satsReserve > b.satsReserve ? -1 : 1;
    }
    if (a.tokenReserve !== b.tokenReserve) {
      return a.tokenReserve > b.tokenReserve ? -1 : 1;
    }
    return 0;
  });
  let totalSats = 0n;
  for (const pool of sorted) totalSats += pool.satsReserve;
  if (totalSats <= 0n) return null;
  const limit = Math.max(1, Math.floor(shownLimit));
  const shownPools = sorted.slice(0, limit);
  const hiddenPools = sorted.slice(limit);
  let hiddenSats = 0n;
  for (const pool of hiddenPools) hiddenSats += pool.satsReserve;
  const total = Number(totalSats);
  return {
    shown: shownPools.map((pool) => ({
      satsReserve: pool.satsReserve,
      tokenReserve: pool.tokenReserve,
      share: Number(pool.satsReserve) / total,
    })),
    totalSats,
    hiddenCount: hiddenPools.length,
    hiddenSats,
  };
}
