/**
 * PoolProof verdict core — practice port (spike-local only, NOT the
 * submission repo).
 *
 * Semantics are ported 1:1 from the Dead Pool Detector core
 * (earning-agent/kiroween/dead-pool-detector/detector.py, 11/11 tests):
 * a displayed number is a rumor; reserves plus a simulated sell are the
 * truth. Adaptations for BCH/Cauldron:
 *  - amounts are bigint base units (satoshis for BCH) — no float money math
 *  - the sell simulation is Cauldron's constant-product math; a Router
 *    route quote, when the caller has one, takes the role getAmountsOut
 *    had on BSC (it captures fees/route effects CPMM alone cannot see)
 *  - when the facts carry per-pool reserves, the sell is ROUTED across
 *    the pools (each pool repricing independently, the LP fee charged
 *    on every swap) instead of being priced once against the summed
 *    reserves — one blended curve overstates a multi-pool exit (R39)
 */

export type Verdict = "NO_MARKET" | "DEAD" | "LYING_DISPLAY" | "RISKY" | "ALIVE";

/** One Cauldron pool's reserves, as the indexer reports them. The
 *  facts carry the list (deepest first) alongside the aggregate pair
 *  so the exit simulation can route the reference sell across the
 *  real pools instead of pretending they are one curve (R39). */
export interface PoolReserve {
  satsReserve: bigint;
  tokenReserve: bigint;
}

export interface PoolFacts {
  /** Token contract/category answered basic reads (identity + supply). */
  tokenReadable: boolean;
  /** A Cauldron pool exists for this token against BCH. */
  hasPool: boolean;
  reserveTokenRaw: bigint;
  reserveQuoteSats: bigint;
  /** Per-pool reserves, deepest first (by sats). When present and
   *  non-empty, the exit simulation routes the reference sell across
   *  these pools (routedCpmmOutSats). When absent, the simulation
   *  falls back to the single aggregate curve — the pre-R39 model,
   *  kept for facts built from captures that never recorded the
   *  per-pool split. */
  pools?: PoolReserve[];
  totalSupplyRaw: bigint;
  /** Liquidity figure a site displays, if one is being cross-checked. */
  displayedLiquidityUsd?: number;
  /** USD price of BCH, needed only for the display cross-check. */
  bchUsd?: number;
  /** Swap fee in basis points for the CPMM simulation. Default is
   *  Cauldron's documented LP fee (CAULDRON_FEE_BPS); a caller with a
   *  Router quote overrides via routeQuoteSats instead. */
  feeBps?: number;
  /** Router route quote for the reference sell, in sats. null = the
   *  route call was attempted and failed; undefined = not attempted,
   *  fall back to the CPMM simulation. */
  routeQuoteSats?: bigint | null;
}

/** Diagnostic flag codes. The core reports WHAT fired, in a
 *  locale-neutral shape; each UI renders its own language's template
 *  and interpolates `values`. `flags` on the judgement keeps the
 *  English rendering for plain-text consumers and existing tests. */
export type FlagCode =
  | "TOKEN_UNREADABLE"
  | "NO_POOL"
  | "DUST_RESERVE"
  | "DISPLAYED_LIQUIDITY_LIES"
  | "EXIT_WORTHLESS"
  | "EXIT_LEAKS_VALUE"
  | "ROUTE_UNSIMULATED";

export interface PoolFlag {
  code: FlagCode;
  values: Record<string, string>;
}

/** Which model produced a judgement's simulatedOutSats. */
export type SimulationModel =
  | "router-quote"
  | "routed-cpmm"
  | "aggregate-cpmm"
  | "none";

export interface PoolJudgement {
  verdict: Verdict;
  /** One plain-English sentence a judge can repeat — the product speaks
   *  in verdicts a person understands, not in raw ratios. */
  summary: string;
  exitRatio: number | null;
  /** The verdict's simulated proceeds, from the model named by
   *  simulationModel — the routed figure whenever per-pool data
   *  exists, never the blended-curve figure (R39). */
  simulatedOutSats: bigint | null;
  /** The pre-R39 single-curve figure for the same sell. Kept ONLY as
   *  a labelled comparison so a report can show what the naive
   *  aggregate model would have claimed; it never decides a verdict
   *  when a Router quote or a routed figure exists. Null when the
   *  judgement returned before the simulation step. */
  aggregateSimulatedOutSats: bigint | null;
  /** The routed CPMM figure for the same sell (the R39 model),
   *  computed whenever the per-pool split exists — including when
   *  a Router quote decides the verdict, where it rides along as
   *  the cross-check the quote is measured against, so a report
   *  never shows a quote without the figure it was checked
   *  against. Null when the judgement returned before the
   *  simulation step or the facts carry no per-pool split. */
  routedSimulatedOutSats: bigint | null;
  simulationModel: SimulationModel;
  spotOutSats: number | null;
  referenceSellRaw: bigint;
  flags: string[];
  flagDetails: PoolFlag[];
}

/** 0.001 BCH — the detector's dust threshold, in satoshis.
 *  Exported (R50) so the report's reserve gauge reads the same
 *  threshold the verdict used, never a second copy of the number. */
export const QUOTE_DUST_SATS = 100_000n;
/** Real liquidity under 1% of the displayed figure = the display lies. */
const LYING_DISPLAY_MAX_REAL_FRACTION = 0.01;
/** The exit-ratio verdict lines. Exported (R50) so the report's
 *  exit gauge marks the lines the verdict itself was graded
 *  against; the gauge is a rendering of this scale, not a
 *  parallel one. */
export const EXIT_RATIO_DEAD = 0.01;
export const EXIT_RATIO_RISKY = 0.8;
/** Reference sell is capped at 10% of the pool's token reserve: beyond
 *  that, constant-product impact dominates and even a healthy pool
 *  grades as a bad exit (same cap as the source detector). */
const RESERVE_SELL_CAP = 10n;

/** Cauldron LP fee 0.3% (docs.riftenlabs.com/cauldron/swap, verified 2026-11-13). */
const CAULDRON_FEE_BPS = 30;

function validateFeeBps(feeBps: number): void {
  // A fee outside [0, 10000] is a caller bug — and a negative one is
  // worse than a crash: it inflates the simulated exit and can grade
  // a RISKY pool ALIVE. Fail loud instead of grading on garbage.
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new RangeError(`feeBps must be an integer in [0, 10000], got ${feeBps}`);
  }
}

/** Constant-product out for selling `amountInRaw` into the pool. */
export function cpmmOutSats(
  amountInRaw: bigint,
  reserveTokenRaw: bigint,
  reserveQuoteSats: bigint,
  feeBps = CAULDRON_FEE_BPS,
): bigint {
  validateFeeBps(feeBps);
  const afterFee = (amountInRaw * BigInt(10_000 - feeBps)) / 10_000n;
  return (reserveQuoteSats * afterFee) / (reserveTokenRaw + afterFee);
}

/** Chunk count for the routed exit simulation. 256 chunks track the
 *  equal-marginal-price optimum closely on a real Cauldron book (on
 *  the captured 61-pool PUSD fixture, 256 chunks land within ~0.22%
 *  of a 1024-chunk refinement) while keeping the computation trivial:
 *  chunks x pools constant-product evaluations, all bigint. */
export const ROUTED_EXIT_CHUNKS = 256;

/**
 * Routed exit simulation: sell `amountInRaw` across `pools` the way
 * a real seller (or the Cauldron Router) must — every pool reprices
 * independently and the LP fee is charged on every swap, not once on
 * the whole amount against one blended curve.
 *
 * Routing: the sale is split into `chunks` equal chunks (the last
 * chunk takes the remainder). Each chunk is sold into the pool where
 * THAT chunk realizes the most sats right now — the chunk's realized
 * price, not the pool's spot quote, which a shallow pool cannot
 * honour for a fat chunk. Ties go to the deepest pool (list order).
 * After each chunk the pool's reserves move exactly as a real swap
 * moves them: the token reserve grows by the after-fee chunk (the
 * fee stays in the pool, as cpmmOutSats prices it) and the sats
 * reserve falls by the amount paid out.
 *
 * A single routable pool is NOT chunked: routing across one pool is
 * one swap, and cpmmOutSats prices it exactly — chunking it would
 * only shave sats to integer flooring, an artifact, not a model.
 * Pools with a zero reserve on either side cannot quote or pay and
 * are skipped. The caller's pool objects are never mutated.
 */
export function routedCpmmOutSats(
  amountInRaw: bigint,
  pools: PoolReserve[],
  feeBps = CAULDRON_FEE_BPS,
  chunks = ROUTED_EXIT_CHUNKS,
): bigint {
  validateFeeBps(feeBps);
  if (!Number.isInteger(chunks) || chunks < 1) {
    throw new RangeError(`chunks must be a positive integer, got ${chunks}`);
  }
  if (amountInRaw < 0n) {
    throw new RangeError(`amountInRaw must not be negative, got ${amountInRaw}`);
  }
  if (amountInRaw === 0n) return 0n;
  const routable: PoolReserve[] = [];
  for (const pool of pools) {
    if (pool.satsReserve < 0n || pool.tokenReserve < 0n) {
      throw new RangeError(
        `pool reserves must not be negative, got ${pool.satsReserve}/${pool.tokenReserve}`,
      );
    }
    if (pool.satsReserve > 0n && pool.tokenReserve > 0n) {
      routable.push({ satsReserve: pool.satsReserve, tokenReserve: pool.tokenReserve });
    }
  }
  if (routable.length === 0) return 0n;
  if (routable.length === 1) {
    return cpmmOutSats(amountInRaw, routable[0].tokenReserve, routable[0].satsReserve, feeBps);
  }
  let baseChunk = amountInRaw / BigInt(chunks);
  if (baseChunk === 0n) baseChunk = 1n;
  let remaining = amountInRaw;
  let totalOut = 0n;
  while (remaining > 0n) {
    const chunk = remaining < baseChunk ? remaining : baseChunk;
    const afterFee = (chunk * BigInt(10_000 - feeBps)) / 10_000n;
    let bestIndex = 0;
    let bestOut = -1n;
    for (let i = 0; i < routable.length; i++) {
      const out = cpmmOutSats(chunk, routable[i].tokenReserve, routable[i].satsReserve, feeBps);
      if (out > bestOut) {
        bestOut = out;
        bestIndex = i;
      }
    }
    routable[bestIndex].tokenReserve += afterFee;
    routable[bestIndex].satsReserve -= bestOut;
    totalOut += bestOut;
    remaining -= chunk;
  }
  return totalOut;
}

/** 1% of supply, capped at 10% of the pool's token reserve (source rule). */
export function referenceSellRaw(totalSupplyRaw: bigint, reserveTokenRaw: bigint): bigint {
  const onePercentOfSupply = totalSupplyRaw / 100n;
  const reserveCap = reserveTokenRaw / RESERVE_SELL_CAP;
  const capped = onePercentOfSupply < reserveCap ? onePercentOfSupply : reserveCap;
  return capped > 0n ? capped : 1n;
}

function judgePoolInner(facts: PoolFacts): PoolJudgement {
  const flags: string[] = [];
  const flagDetails: PoolFlag[] = [];
  const pushFlag = (
    code: FlagCode,
    english: string,
    values: Record<string, string> = {},
  ) => {
    flags.push(english);
    flagDetails.push({ code, values });
  };
  const base: PoolJudgement = {
    verdict: "NO_MARKET",
    summary: "",
    exitRatio: null,
    simulatedOutSats: null,
    aggregateSimulatedOutSats: null,
    routedSimulatedOutSats: null,
    simulationModel: "none",
    spotOutSats: null,
    referenceSellRaw: 0n,
    flags,
    flagDetails,
  };

  if (!facts.tokenReadable) {
    pushFlag("TOKEN_UNREADABLE", "token identity/supply reads failed");
    return base;
  }
  if (!facts.hasPool) {
    pushFlag("NO_POOL", "no Cauldron pool against BCH: no market to sell into");
    return base;
  }

  // DEAD rule first, as in the source: zero/dust reserves beat every
  // other consideration, including a pretty displayed figure.
  if (
    facts.reserveQuoteSats === 0n ||
    facts.reserveTokenRaw === 0n ||
    facts.reserveQuoteSats < QUOTE_DUST_SATS
  ) {
    pushFlag(
      "DUST_RESERVE",
      `quote reserve is ${facts.reserveQuoteSats} sats (dust threshold ${QUOTE_DUST_SATS})`,
      {
        reserveSats: facts.reserveQuoteSats.toString(),
        dustSats: QUOTE_DUST_SATS.toString(),
      },
    );
    return { ...base, verdict: "DEAD" };
  }

  const sellRaw = referenceSellRaw(facts.totalSupplyRaw, facts.reserveTokenRaw);
  const spotOutSats =
    (Number(sellRaw) * Number(facts.reserveQuoteSats)) / Number(facts.reserveTokenRaw);
  const feeBps = facts.feeBps ?? CAULDRON_FEE_BPS;

  // The pre-R39 figure: the whole sell priced once against the one
  // blended curve. Computed always; used for the verdict ONLY when
  // nothing better exists (no Router quote, no per-pool data). When
  // a better figure decides the verdict, this one rides along as a
  // clearly-labelled comparison — never as the exit claim.
  const aggregateOutSats = cpmmOutSats(
    sellRaw,
    facts.reserveTokenRaw,
    facts.reserveQuoteSats,
    feeBps,
  );

  // The routed figure: the same sell walked across the real
  // pools, each repricing as the sell moves through it, each
  // charging its fee. Computed whenever the per-pool split
  // exists, whichever model decides the verdict, so a judgement
  // whose headline is a Router quote still carries the figure
  // the quote is cross-checked against (R48).
  const routedOutSats =
    facts.pools !== undefined && facts.pools.length > 0
      ? routedCpmmOutSats(sellRaw, facts.pools, feeBps)
      : null;

  let simOutSats: bigint | null;
  let simulationModel: SimulationModel;
  if (facts.routeQuoteSats === null) {
    simOutSats = null; // route attempted and failed
    simulationModel = "none";
  } else if (facts.routeQuoteSats !== undefined) {
    // A Router quote outranks both simulations: it is the venue's
    // own routed pricing for this exact sell.
    simOutSats = facts.routeQuoteSats;
    simulationModel = "router-quote";
  } else if (routedOutSats !== null) {
    simOutSats = routedOutSats;
    simulationModel = "routed-cpmm";
  } else {
    simOutSats = aggregateOutSats;
    simulationModel = "aggregate-cpmm";
  }
  const exitRatio = simOutSats === null ? null : Number(simOutSats) / spotOutSats;

  const judgement: PoolJudgement = {
    ...base,
    referenceSellRaw: sellRaw,
    simulatedOutSats: simOutSats,
    aggregateSimulatedOutSats: aggregateOutSats,
    routedSimulatedOutSats: routedOutSats,
    simulationModel,
    spotOutSats,
    exitRatio,
  };

  // Display cross-check before exit-ratio verdicts (source order).
  if (facts.displayedLiquidityUsd !== undefined && facts.bchUsd) {
    const realLiquidityUsd = 2 * Number(facts.reserveQuoteSats) / 1e8 * facts.bchUsd;
    if (realLiquidityUsd < LYING_DISPLAY_MAX_REAL_FRACTION * facts.displayedLiquidityUsd) {
      pushFlag(
        "DISPLAYED_LIQUIDITY_LIES",
        `displayed liquidity $${facts.displayedLiquidityUsd} but real reserves imply ` +
          `~$${realLiquidityUsd.toFixed(2)} (<1% of the claim)`,
        {
          displayedUsd: String(facts.displayedLiquidityUsd),
          realUsd: realLiquidityUsd.toFixed(2),
        },
      );
      return { ...judgement, verdict: "LYING_DISPLAY" };
    }
  }

  if (exitRatio !== null && exitRatio < EXIT_RATIO_DEAD) {
    pushFlag(
      "EXIT_WORTHLESS",
      `sell simulation returns ${exitRatio.toFixed(4)} of spot value: exit is worthless`,
      { ratio: exitRatio.toFixed(4) },
    );
    return { ...judgement, verdict: "DEAD" };
  }
  if (exitRatio !== null && exitRatio < EXIT_RATIO_RISKY) {
    pushFlag(
      "EXIT_LEAKS_VALUE",
      `sell simulation keeps only ${exitRatio.toFixed(2)} of spot value (fees and/or price impact)`,
      { ratio: exitRatio.toFixed(2) },
    );
    return { ...judgement, verdict: "RISKY" };
  }
  if (simOutSats === null) {
    pushFlag(
      "ROUTE_UNSIMULATED",
      "reserves exist but the sell route could not be simulated",
    );
    return { ...judgement, verdict: "RISKY" };
  }
  return { ...judgement, verdict: "ALIVE" };
}

const VERDICT_SUMMARIES: Record<Verdict, string> = {
  NO_MARKET: "No market: the token cannot be read, or it has no BCH pool to sell into.",
  DEAD: "Dead pool: reserves are dust, or the simulated exit returns almost nothing.",
  LYING_DISPLAY: "Lying display: the liquidity shown is not backed by real reserves.",
  RISKY: "Risky: the simulated sell keeps only part of the spot value, or the sell route could not be simulated.",
  ALIVE: "Alive: reserves are real and the simulated sell exits near the spot price.",
};

export function judgePool(facts: PoolFacts): PoolJudgement {
  const judgement = judgePoolInner(facts);
  return { ...judgement, summary: VERDICT_SUMMARIES[judgement.verdict] };
}
