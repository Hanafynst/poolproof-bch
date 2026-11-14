/**
 * Live audit orchestration — practice (spike-local only, NOT the
 * submission repo). A live audit stands on two independent reads:
 * the Cauldron pool read (the audit itself — reserves, verdict)
 * and the TokenStork identity read (its header — name, symbol,
 * decimals). R40 wired them sequentially: the report waited for
 * the pool read AND THEN the identity scan, ~13 s of scanning for
 * PUSD and ~23 s for a category the list does not carry, even
 * though the verdict never depends on the name. This module runs
 * the two reads concurrently and lands them in the order the
 * reader needs: the report the moment the pool read lands, the
 * identity as an in-place upgrade if it arrives after.
 *
 * Attempt discipline is the caller's: isCurrent() answers "is
 * this still the audit on screen?" and is consulted before the
 * report lands and again before the upgrade — a superseded audit
 * (a newer submit, a snapshot switch) is never upgraded by a
 * stale identity. An identity that beats the pool read is simply
 * part of the first report; the upgrade callback then never
 * fires, so an upgrade happens at most once and only late.
 *
 * Failure discipline mirrors the reads themselves. A pool failure
 * REJECTS out of this function — promptly, without waiting for
 * the identity read to finish — and the caller renders its error
 * state; no report callback has fired. An identity failure is a
 * null: resolveIdentity never throws by contract, and a resolver
 * that breaks that contract still only costs the report its
 * header, never the audit. Both reads are injected (production:
 * cauldron-live + identity; tests: delayed fakes), so the
 * ordering is provable without a clock or a network.
 *
 * A third read joins in R48: the Cauldron Router's own quote for
 * the audit's reference sell (router-quote.ts). It can only start
 * once the pool facts have landed — the sell amount is a pure
 * function of them — and only for an audit with pools to route
 * across. Its failure discipline is the identity's: a null, never
 * a rejection, costing the report only its cross-check. Upgrades
 * compose in either order because every one rebuilds the report
 * input from the audit's latest state (facts + identity below):
 * a late identity keeps a landed quote, a late quote keeps a
 * landed identity.
 */
import type { LiveFacts } from "./cauldron-live.js";
import type { TokenIdentity } from "./identity.js";
import { referenceSellRaw } from "./poolproof-core.js";
import { liveReportInput, type LiveReportInput } from "./live-report.js";

export interface LiveAuditReads {
  fetchPoolFacts: (
    category: string,
  ) => Promise<LiveFacts & { category: string; checkedAt: Date }>;
  resolveIdentity: (category: string) => Promise<TokenIdentity | null>;
  /** Optional (R48): the Router quote for this audit's reference
   *  sell, in sats. Resolves null on any failure — the quote is a
   *  cross-check, never a dependency. */
  fetchRouteQuote?: (
    category: string,
    amountRaw: bigint,
  ) => Promise<bigint | null>;
}

export interface LiveAuditHooks {
  /** The report, the moment the pool read lands. Carries the
   *  identity when it beat the pool read; carries null while the
   *  identity is still in flight (the header renders unnamed
   *  until the upgrade, or stays unnamed if none resolves). */
  onReport: (input: LiveReportInput) => void;
  /** At most once: the same report input with the identity now
   *  carried. Fires only when the identity lands after the
   *  report, resolves non-null, and the attempt is still
   *  current at that moment. */
  onIdentityUpgrade: (input: LiveReportInput) => void;
  /** At most once (R48): the same report input with the Router
   *  quote now carried in its facts. Fires only when a quote
   *  lands after the report, resolves non-null, and the attempt
   *  is still current at that moment. The input is rebuilt from
   *  the audit's latest state, so it preserves whichever upgrade
   *  landed before it. */
  onQuoteUpgrade?: (input: LiveReportInput) => void;
}

export async function runLiveAuditReads(
  category: string,
  reads: LiveAuditReads,
  isCurrent: () => boolean,
  hooks: LiveAuditHooks,
): Promise<void> {
  // Both reads start together, in this same turn: the identity
  // scan is already walking while the pool read is in flight.
  // The tracked promise never rejects — a resolver failure is
  // recorded as "landed, with nothing" (identity failure = an
  // unnamed report, silently, exactly as designed in R40).
  let identity: TokenIdentity | null = null;
  let identityLanded = false;
  const identityPromise = reads.resolveIdentity(category).then(
    (resolved) => {
      identity = resolved;
      identityLanded = true;
      return resolved;
    },
    () => {
      identityLanded = true;
      return null;
    },
  );
  // A pool failure throws out of this await — before any report
  // callback, and without waiting on the identity read above.
  const live = await reads.fetchPoolFacts(category);
  if (!isCurrent()) return; // superseded mid-read: land nothing

  // The audit's latest state. Every landing and upgrade below is
  // built from these two, so the upgrades compose in either
  // order: an identity upgrade emitted after the quote landed
  // still carries the quote in its facts, and the quote upgrade
  // still carries the identity.
  let facts = live.facts;
  const emit = (): LiveReportInput =>
    liveReportInput({ ...live, facts }, identity);

  // The Router quote read starts now, with the pool facts in
  // hand: the reference sell is a pure function of them. Only a
  // routable audit asks — pools to route across and a positive
  // sell. The tracked promise never rejects, and the read itself
  // is optional: older wirings (and most tests) never ask, and
  // their flow below is unchanged.
  const sellRaw = referenceSellRaw(
    facts.totalSupplyRaw,
    facts.reserveTokenRaw,
  );
  const quotePromise =
    reads.fetchRouteQuote !== undefined &&
    facts.pools !== undefined &&
    facts.pools.length > 0 &&
    sellRaw > 0n
      ? reads.fetchRouteQuote(category, sellRaw).then(
          (landed) => landed,
          () => null,
        )
      : null;

  hooks.onReport(emit());
  // Each upgrade fires as its own read lands, built from the
  // latest state at that moment — the two continuations below
  // are independent, so whichever lands second carries the
  // first one's result. The function itself resolves only after
  // both have settled: the caller's end-of-audit decision (the
  // R44 classification) reads the final landing record, and for
  // a pool-bearing audit the report has long since landed, so
  // waiting on the cross-check costs the reader nothing.
  const identityUpgrade = (async () => {
    if (identityLanded) return;
    const late = await identityPromise;
    if (late !== null && isCurrent()) {
      hooks.onIdentityUpgrade(emit());
    }
  })();
  const quoteUpgrade =
    quotePromise === null
      ? null
      : (async () => {
          const quote = await quotePromise;
          if (quote !== null && isCurrent()) {
            facts = { ...facts, routeQuoteSats: quote };
            hooks.onQuoteUpgrade?.(emit());
          }
        })();
  await identityUpgrade;
  if (quoteUpgrade !== null) await quoteUpgrade;
}
