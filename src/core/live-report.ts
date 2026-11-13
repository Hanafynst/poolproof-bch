/**
 * Live report adapter — practice (spike-local only, NOT the
 * submission repo). Turns a live Cauldron read (cauldron-live.ts)
 * into the input shape the report layer consumes, so a pasted
 * category renders through the SAME report components as the saved
 * snapshots — one rendering path, no live-only fork that could
 * drift from the proven one.
 *
 * The adapter decides only what the read itself proves:
 *  - id: `live-<category>` — also the share-link key, so a copied
 *    link can name the live audit it points at;
 *  - checkedAt: the FETCH time carried through untouched — the
 *    report labels the result with when the data was read, never
 *    with when it happened to be rendered;
 *  - poolCount and supplyIsStandIn: passed through from the
 *    aggregation / facts mapping. The stand-in flag in particular
 *    must survive the adapter untouched: a stand-in supply that
 *    loses its label on the way to the report becomes a displayed
 *    number dressed as a measurement (the R7 lesson).
 *
 * Identity (R40) crosses the adapter the same way: carried
 * untouched from identity.ts, or null. Null is a sourced fact too
 * — it means TokenStork offered no entry that could stand behind
 * a name for this category — and the presentation layer renders
 * that absence honestly (unnamed label, raw base units) instead
 * of inventing words no source said.
 */
import type { LiveFacts } from "./cauldron-live.js";
import type { TokenIdentity } from "./identity.js";
import type { PoolFacts } from "./poolproof-core.js";

export interface LiveReportInput {
  /** Snapshot-style id: `live-<category>`. */
  id: string;
  category: string;
  /** When the indexer read happened (the fetch, not the render). */
  checkedAt: Date;
  poolCount: number;
  /** True while the total supply is the documented stand-in. */
  supplyIsStandIn: boolean;
  /** TokenStork identity pinned to this exact category, or null. */
  identity: TokenIdentity | null;
  facts: PoolFacts;
}

export function liveReportInput(
  live: LiveFacts & { category: string; checkedAt: Date },
  identity: TokenIdentity | null = null,
): LiveReportInput {
  return {
    id: `live-${live.category}`,
    category: live.category,
    checkedAt: live.checkedAt,
    poolCount: live.poolCount,
    supplyIsStandIn: live.supplyStandIn,
    identity,
    facts: live.facts,
  };
}
