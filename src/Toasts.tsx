/**
 * The toast layer (R51): renders what the pure queue in
 * core/toast.ts admits, and nothing else. There is no way to
 * raise a toast from this file: every card on screen is a
 * ToastItem App built from a real signal (a minted receipt, a
 * watcher-observed confirmation flip, a panel failure string,
 * a chain-read payment), and the queue's dedupe, eviction, and
 * dwell rules have already decided it belongs here.
 *
 * The layer is fixed-position and pointer-transparent except
 * on the cards themselves, so a toast never moves the content
 * under it and never blocks a tap meant for the page. Each
 * card owns its dwell timer (the lifetime comes from the
 * core, never from a constant here) and its exit: dismissal
 * and expiry both play the short exit first, then ask App to
 * remove the item, the same enter-slower-than-exit doctrine
 * the panels follow.
 */
import { useEffect, useRef, useState } from "react";
import {
  toastLifetimeMs,
  toastPoliteness,
  type ToastItem,
} from "./core/toast";
import type { UiStrings } from "./i18n-types";
import { DismissIcon, ToastGlyph } from "./icons";

/** Matches --dur-dialog-exit in style.css: the exit plays,
 *  then the item leaves the queue. */
const EXIT_MS = 190;

function ToastCard({
  item,
  t,
  onDismiss,
  onOpenHistory,
  onCopyTxid,
}: {
  item: ToastItem;
  t: UiStrings;
  onDismiss: (id: number) => void;
  onOpenHistory: () => void;
  onCopyTxid: (txid: string) => Promise<boolean>;
}) {
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const leave = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => dismissRef.current(item.id), EXIT_MS);
  };
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  useEffect(() => {
    const remaining =
      item.createdAtMs + toastLifetimeMs(item.kind) - Date.now();
    const timer = window.setTimeout(
      () => leaveRef.current(),
      Math.max(0, remaining),
    );
    return () => window.clearTimeout(timer);
    // Dwell is set once, at the card's mount: the core stamped
    // the creation time, and later re-renders of the same item
    // must never restart its clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const politeness = toastPoliteness(item.kind);
  const tap = () => {
    if (item.action === "history") {
      onOpenHistory();
      leave();
    } else if (item.action === "copy-txid" && item.txid !== null) {
      const txid = item.txid;
      void onCopyTxid(txid).then((copied) => {
        // The card leaves only when the copy actually landed;
        // a failed copy keeps the txid on screen rather than
        // performing a success it did not earn.
        if (copied) leave();
      });
    }
  };
  return (
    <div
      className={`toast toast-${item.kind}${leaving ? " toast-leaving" : ""}`}
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
    >
      <span className="toast-disc" aria-hidden="true">
        <ToastGlyph kind={item.kind} />
      </span>
      {item.action === "none" ? (
        <span className="toast-fact">{item.fact}</span>
      ) : (
        <button type="button" className="toast-fact toast-tap" onClick={tap}>
          {item.fact}
        </button>
      )}
      <button
        type="button"
        className="toast-dismiss"
        aria-label={t.toastDismiss}
        onClick={leave}
      >
        <DismissIcon />
      </button>
    </div>
  );
}

export function ToastLayer({
  items,
  t,
  onDismiss,
  onOpenHistory,
  onCopyTxid,
}: {
  items: readonly ToastItem[];
  t: UiStrings;
  onDismiss: (id: number) => void;
  onOpenHistory: () => void;
  onCopyTxid: (txid: string) => Promise<boolean>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="toast-layer">
      {items.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          t={t}
          onDismiss={onDismiss}
          onOpenHistory={onOpenHistory}
          onCopyTxid={onCopyTxid}
        />
      ))}
    </div>
  );
}
