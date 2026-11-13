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
 */
import type { LiveFacts } from "./cauldron-live.js";
import type { TokenIdentity } from "./identity.js";
import { liveReportInput, type LiveReportInput } from "./live-report.js";

export interface LiveAuditReads {
  fetchPoolFacts: (
    category: string,
  ) => Promise<LiveFacts & { category: string; checkedAt: Date }>;
  resolveIdentity: (category: string) => Promise<TokenIdentity | null>;
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
  if (identityLanded) {
    hooks.onReport(liveReportInput(live, identity));
    return;
  }
  hooks.onReport(liveReportInput(live, null));
  const late = await identityPromise;
  if (late !== null && isCurrent()) {
    hooks.onIdentityUpgrade(liveReportInput(live, late));
  }
}
