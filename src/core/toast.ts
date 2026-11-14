/**
 * Transaction feedback queue — practice (spike-local only, NOT
 * the submission repo). The pure decision core behind the app's
 * toast layer (R51): given a REAL transaction event, decide
 * whether a toast is admitted, which visible toast it evicts,
 * how long it stays, and how a screen reader should announce
 * it. The React layer renders what this module admits and
 * builds the fact line's words; no decision about stacking,
 * dedupe, or dwell lives in the components.
 *
 * The honesty rule (DESIGN-REFERENCE-2 §5, binding): an event
 * exists only because a signal in the app already proved the
 * thing happened — a broadcast that resolved (the receipt the
 * sign flow minted), a stored status the History watcher saw
 * flip, a failure the panel is showing, a new UTXO the chain
 * read returned. This module never invents an event; it only
 * arbitrates among the ones it is handed.
 *
 * Dedupe, stated once:
 *  - A txid-bearing event (sent / confirmed / received) is
 *    admitted at most once per kind per txid per session. The
 *    seen set outlives the visible toast on purpose: a
 *    confirmation the user already saw must not re-announce
 *    itself after the card expires, and a send must not toast
 *    twice if its success path is somehow re-entered.
 *  - A failure carries no txid (a failed flow mints no
 *    receipt), so it dedupes on its fact line against the
 *    failures currently VISIBLE: the same failure surfacing
 *    twice while its card is up is one event, but once the
 *    card is gone a fresh occurrence may announce again,
 *    because it IS a fresh occurrence.
 *
 * Eviction: the stack holds at most MAX_VISIBLE_TOASTS, oldest
 * first, newest last. Admitting beyond the cap evicts the
 * oldest NON-failure; failures are the cards the user most
 * needs to act on, so one is evicted only when the whole
 * stack is failures, and then the oldest failure goes.
 *
 * Dwell: failures stay roughly twice as long as successes.
 * The numbers are the module's one opinion about time, and
 * the renderer takes them from here, never from its own
 * constants.
 */

export type ToastKind = "sent" | "confirmed" | "failed" | "received";

/** Why a send/anchor flow failed, tagged at the catch site from
 *  the SignFlowError code (or "other" for anything untyped).
 *  The toast's fact line is the panel's own string, passed
 *  through untouched; this tag records WHICH failure it was,
 *  so the event record never has to parse prose. */
export type ToastFailureReason =
  | "wallet-refused"
  | "tampered"
  | "broadcast-failed"
  | "malformed"
  | "other";

/** Map a sign-flow error code to its failure reason. Kept as
 *  data-shaped code so the lab can pin all four codes. */
export function failureReasonForCode(code: string): ToastFailureReason {
  switch (code) {
    case "WALLET_REFUSED":
      return "wallet-refused";
    case "TAMPERED":
      return "tampered";
    case "BROADCAST_FAILED":
      return "broadcast-failed";
    case "MALFORMED":
      return "malformed";
    default:
      return "other";
  }
}

/** What tapping a toast's body does, decided here from the
 *  event's own data: our own receipts live in the History
 *  panel, so their toasts open it; an incoming payment is not
 *  in that record, so its toast copies the txid instead; a
 *  failure has no txid and no target. */
export type ToastAction = "history" | "copy-txid" | "none";

export interface ToastEvent {
  kind: ToastKind;
  /** The transaction the event is about; null only for
   *  failures, which mint no receipt. */
  txid: string | null;
  /** The one fact line, already worded by the caller from the
   *  app's localized strings. Carried, never composed here. */
  fact: string;
  /** Failures only: which failure this was. */
  reason?: ToastFailureReason;
}

export interface ToastItem extends ToastEvent {
  id: number;
  createdAtMs: number;
  action: ToastAction;
}

export interface ToastQueueState {
  /** Oldest first, newest last. */
  items: readonly ToastItem[];
  /** Session dedupe keys, "kind:txid" for txid-bearing kinds. */
  seenKeys: ReadonlySet<string>;
  nextId: number;
}

export const MAX_VISIBLE_TOASTS = 3;

const LIFETIME_MS: Record<ToastKind, number> = {
  sent: 6_000,
  confirmed: 6_000,
  received: 7_000,
  failed: 10_000,
};

/** How long a toast of this kind stays up, milliseconds. */
export function toastLifetimeMs(kind: ToastKind): number {
  return LIFETIME_MS[kind];
}

/** Screen-reader urgency for a kind: failure is assertive,
 *  everything else is polite. (role="alert" / role="status"
 *  in the renderer are these same two values.) */
export function toastPoliteness(kind: ToastKind): "polite" | "assertive" {
  return kind === "failed" ? "assertive" : "polite";
}

export function emptyToastQueue(): ToastQueueState {
  return { items: [], seenKeys: new Set(), nextId: 1 };
}

function actionFor(event: ToastEvent): ToastAction {
  if (event.txid === null) return "none";
  return event.kind === "received" ? "copy-txid" : "history";
}

export interface PushResult {
  state: ToastQueueState;
  /** The admitted toast, or null when dedupe refused it. */
  admitted: ToastItem | null;
  /** Visible toasts the admission evicted (at most one). */
  evicted: readonly ToastItem[];
}

/** Admit one event to the queue, applying the dedupe and
 *  eviction rules above. Pure: the input state is untouched. */
export function pushToast(
  state: ToastQueueState,
  event: ToastEvent,
  nowMs: number,
): PushResult {
  if (event.txid !== null) {
    const key = `${event.kind}:${event.txid}`;
    if (state.seenKeys.has(key)) {
      return { state, admitted: null, evicted: [] };
    }
    const item: ToastItem = {
      ...event,
      id: state.nextId,
      createdAtMs: nowMs,
      action: actionFor(event),
    };
    const seenKeys = new Set(state.seenKeys);
    seenKeys.add(key);
    return admit(
      { items: state.items, seenKeys, nextId: state.nextId + 1 },
      item,
    );
  }
  // Failures: dedupe on the fact line against visible failures.
  const duplicate = state.items.some(
    (item) => item.kind === "failed" && item.fact === event.fact,
  );
  if (duplicate) return { state, admitted: null, evicted: [] };
  const item: ToastItem = {
    ...event,
    id: state.nextId,
    createdAtMs: nowMs,
    action: "none",
  };
  return admit(
    { items: state.items, seenKeys: state.seenKeys, nextId: state.nextId + 1 },
    item,
  );
}

function admit(state: ToastQueueState, item: ToastItem): PushResult {
  const items = [...state.items, item];
  const evicted: ToastItem[] = [];
  while (items.length > MAX_VISIBLE_TOASTS) {
    const nonFailure = items.findIndex((entry) => entry.kind !== "failed");
    const index = nonFailure === -1 ? 0 : nonFailure;
    evicted.push(items[index]);
    items.splice(index, 1);
  }
  return {
    state: { items, seenKeys: state.seenKeys, nextId: state.nextId },
    admitted: item,
    evicted,
  };
}

/** Remove one visible toast (manual dismiss or dwell expiry).
 *  The dedupe set is NOT touched: removal never re-arms a
 *  txid-bearing event. Unknown ids are a no-op. */
export function dismissToast(
  state: ToastQueueState,
  id: number,
): ToastQueueState {
  if (!state.items.some((item) => item.id === id)) return state;
  return {
    items: state.items.filter((item) => item.id !== id),
    seenKeys: state.seenKeys,
    nextId: state.nextId,
  };
}

/** The minimal status shape the flip check needs, structural
 *  so the app's ConfirmationStatus satisfies it directly. */
export interface StatusLike {
  state: "broadcast" | "confirmed";
}

/** Which transactions flipped broadcast -> confirmed between
 *  the stored statuses and a fresh update set, in the update
 *  set's iteration order. A transaction already stored as
 *  confirmed can never flip again (the store only moves
 *  forward), and an update that still says broadcast is not
 *  a flip, so this fires exactly once per confirmation. */
export function confirmationFlips(
  before: ReadonlyMap<string, StatusLike>,
  updates: ReadonlyMap<string, StatusLike>,
): string[] {
  const flips: string[] = [];
  for (const [txid, update] of updates) {
    if (update.state !== "confirmed") continue;
    if (before.get(txid)?.state === "broadcast") flips.push(txid);
  }
  return flips;
}

/** One UTXO of the watched address, reduced to what the
 *  receive check needs. txid is display-order hex, the order
 *  the Electrum read returns and the history store keeps. */
export interface WatchedUtxo {
  txid: string;
  index: number;
  valueSats: bigint;
  /** True when the read attached token data to this UTXO. */
  hasToken: boolean;
}

/** One incoming payment: every new plain-BCH outpoint created
 *  by the same external transaction, summed. */
export interface ReceivedPayment {
  txid: string;
  totalSats: bigint;
  outpoints: number;
}

export interface ReceivedDiff {
  /** True when this call only seeded the baseline (the first
   *  read after the watch starts): the wallet's existing
   *  contents are not news, so nothing is reported. */
  seeded: boolean;
  /** True when the outpoint set differs from the baseline in
   *  any way at all (arrivals, spends, our own change): the
   *  caller's cue to refresh its holdings read. */
  changed: boolean;
  received: readonly ReceivedPayment[];
  nextBaseline: Map<string, WatchedUtxo>;
}

function outpointKey(utxo: WatchedUtxo): string {
  return `${utxo.txid}:${utxo.index}`;
}

/**
 * Diff one fresh UTXO read of the watched address against the
 * baseline. The receive rule, and why it is sound:
 *
 * A new outpoint is an incoming payment only if the
 * transaction that created it is not one of our own. Our own
 * change is created BY our own send/anchor transaction, whose
 * txid stands in the history store, so change can never pass
 * this filter no matter when it lands or how much it is; no
 * amount-matching or in-flight guessing is needed. New
 * outpoints carrying token data are excluded from the payment
 * list (their sats ride along as a token's carrier, and
 * wording them as a BCH amount would misdescribe the event),
 * but they still count toward `changed`, and every new
 * outpoint joins the baseline whether reported or not, so
 * nothing is ever reported twice.
 */
export function diffReceivedUtxos(
  baseline: ReadonlyMap<string, WatchedUtxo> | null,
  current: readonly WatchedUtxo[],
  ownTxids: ReadonlySet<string>,
): ReceivedDiff {
  const nextBaseline = new Map<string, WatchedUtxo>();
  for (const utxo of current) nextBaseline.set(outpointKey(utxo), utxo);
  if (baseline === null) {
    return { seeded: true, changed: false, received: [], nextBaseline };
  }
  let changed = nextBaseline.size !== baseline.size;
  if (!changed) {
    for (const key of nextBaseline.keys()) {
      if (!baseline.has(key)) {
        changed = true;
        break;
      }
    }
  }
  const byTxid = new Map<string, ReceivedPayment>();
  for (const utxo of current) {
    if (baseline.has(outpointKey(utxo))) continue;
    if (ownTxids.has(utxo.txid)) continue;
    if (utxo.hasToken) continue;
    const payment = byTxid.get(utxo.txid) ?? {
      txid: utxo.txid,
      totalSats: 0n,
      outpoints: 0,
    };
    payment.totalSats += utxo.valueSats;
    payment.outpoints += 1;
    byTxid.set(utxo.txid, payment);
  }
  return {
    seeded: false,
    changed,
    received: [...byTxid.values()],
    nextBaseline,
  };
}
