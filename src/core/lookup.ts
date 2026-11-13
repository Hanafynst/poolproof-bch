/**
 * Lookup classification — practice (spike-local only, NOT the
 * submission repo). A live audit can end three ways, and the
 * presentation layer must never blur them:
 *
 *  - "report": the category names a REAL token. Any one piece of
 *    positive evidence is enough: a Cauldron pool exists, an
 *    identity resolved for this exact category, or supply /
 *    holder data exists. A real token with no pools earns the
 *    NO_MARKET verdict — that is a judgement about something that
 *    exists, rendered as a full report.
 *  - "not-found": every read succeeded and nothing, anywhere,
 *    attests the category exists. That is a lookup miss, not a
 *    verdict: there is no token to name, no reserves to simulate,
 *    no supply to stand in. Dressing the miss up as a report
 *    (an "unnamed token" header, a NO_MARKET stamp, rows of zero
 *    reserves under a FAIL chip, a substitute-supply note) would
 *    present invented structure as measurement — the exact
 *    failure the user caught by pasting a one-character-off PUSD
 *    category on 2026-11-14.
 *  - "error": the pool read itself failed. A failed read proves
 *    nothing about existence in either direction, so it stays
 *    the caller's existing error state: error beats empty. An
 *    indexer outage must never be rendered as "this token does
 *    not exist".
 *
 * The classifier is pure and takes the evidence as plain fields
 * so each wiring decides what feeds them. In the app wiring:
 * poolReadOk / poolCount come from the Cauldron pool read;
 * identityFound is the exact-category identity resolution
 * (TokenStork's pinned entry); supplyKnown is that same pinned
 * entry's existence — the entry carries the category's supply
 * and holder count, so the two rise together there. They stay
 * separate fields because other wirings (a BCMR-first resolver,
 * a holder read) can know a supply without holding a name, and
 * either one alone proves the token is real.
 */
export interface LookupEvidence {
  /** The Cauldron pool read completed (payload parsed, no throw). */
  poolReadOk: boolean;
  /** Active Cauldron pools aggregated for the category. */
  poolCount: number;
  /** An identity resolved for this exact category. */
  identityFound: boolean;
  /** Supply or holder data exists for the category. */
  supplyKnown: boolean;
}

export type LookupClass = "report" | "not-found" | "error";

export function classifyLookup(input: LookupEvidence): LookupClass {
  // A failed read is neither evidence of existence nor of
  // absence: it outranks every other field, including a
  // completely empty result set.
  if (!input.poolReadOk) return "error";
  if (input.poolCount > 0 || input.identityFound || input.supplyKnown) {
    return "report";
  }
  return "not-found";
}
