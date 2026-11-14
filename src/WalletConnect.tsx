import { useEffect, useRef, useState } from "react";
import { AlphanumericQRCode, useWizardConnect } from "@wizardconnect/react";
import type { UiStrings } from "./i18n";
import type { SignFlowManager } from "./core/sign-flow";
import {
  pubkeyToCashAddress,
  pubkeyToTokenAddress,
} from "./core/wallet-address";
import { trapTabIndex } from "./core/focus-nav";

/**
 * WizardConnect integration.
 *
 * The connect flow is the protocol's own, not a mock: connect()
 * opens the Riften relay (wss, relay.riften.net), generates the key
 * exchange URI, and the pairing dialog is the window the wallet
 * sees. Paytaca, Selene, Cashonize and OPTN can approve two ways:
 * by opening the wiz:// URI directly (the dialog's primary button,
 * which is the only route that works when the wallet and this page
 * share one phone), or by scanning the QR code from another device.
 * There is no server-side sign-in and no window.alert anywhere in
 * this flow: the hook's error state renders inline below the button.
 *
 * On "connected" the dapp derives its addresses from the wallet's
 * first receive pubkey (manager.getPubkey(0, 0)): the plain
 * cashaddr for the header chip, and the token-aware form of the
 * same payload for the EMBER2026 banner line and the Receive panel.
 * The session is reported to the parent so the home panels share
 * this one connection instead of each wiring their own.
 */
export type { WalletSession } from "./wallet-session";
export { DISCONNECTED_SESSION } from "./wallet-session";
import type { WalletSession } from "./wallet-session";

/**
 * The one seam between the library's manager and sign-flow's
 * structural slice. The check is real (the method must exist)
 * rather than a blind cast: a manager without signTransaction
 * would fail every send at runtime, so it is rejected here, where
 * the failure is still explainable.
 */
function asSignManager(manager: unknown): SignFlowManager | null {
  if (manager === null || typeof manager !== "object") return null;
  const candidate = manager as { signTransaction?: unknown };
  return typeof candidate.signTransaction === "function"
    ? (manager as SignFlowManager)
    : null;
}

/**
 * Our own pairing dialog. The stock WizardConnectQRDialog cannot
 * grow the one control a phone-only user needs (it renders a QR
 * code and nothing else, and a QR on the same phone that would
 * scan it is a dead end), so the dialog is rebuilt around the
 * hook: the connection URI as a tappable deep link first, the QR
 * and a copyable URI as the cross-device fallback.
 *
 * The QR is drawn exactly the way the stock dialog draws it: the
 * hook's qrUri is a payload string (the connection URI uppercased
 * and percent-escaped for QR alphanumeric mode), NOT an image URL.
 * The library's AlphanumericQRCode encodes that payload onto a
 * canvas. An earlier version of this dialog put qrUri in an img
 * src, which renders as an empty white box: the bug the user
 * reported from his phone on 2026-11-14.
 *
 * A phone with no supported wallet installed answers the deep
 * link with silence, so a tap on the pairing button also arms a
 * 2-second watch (watchForWallet below): if the page never hid,
 * no wallet app took over, and the dialog offers install links
 * instead of sitting at a dead end.
 */
function PairingDialog({
  t,
  uri,
  qrUri,
  onClose,
}: {
  t: UiStrings;
  uri: string;
  qrUri: string;
  onClose: () => void;
}) {
  const openWalletRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [uriCopied, setUriCopied] = useState(false);
  const [uriCopyFailed, setUriCopyFailed] = useState(false);
  const [noWallet, setNoWallet] = useState(false);
  // The exit (P5): the dialog's own close paths play the
  // shorter exit first and unmount after it, instead of
  // vanishing in one frame. Closes the component does not
  // originate (a connection landing, the parent's Escape
  // handling) still unmount instantly; they cannot be
  // intercepted from here and are not disguised as animated.
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 190);
  };
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);
  // Disarms the no-wallet watch armed by the latest tap on the
  // pairing button (its timer and its listeners). Kept in a ref
  // so the unmount effect below can run it too.
  const watchCleanup = useRef<(() => void) | null>(null);

  // Focus starts on the primary action: on a phone that is the
  // button the user came for, and keyboard users land inside the
  // dialog instead of behind it.
  useEffect(() => {
    openWalletRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => watchCleanup.current?.();
  }, []);

  // A tap on the pairing button either hands over to a wallet app
  // (the page hides or the window blurs on the way out, which
  // disarms the watch) or nothing answers at all, because no
  // supported wallet is installed. The second case used to sit
  // silent forever; now, if the page is still visible after 2 s,
  // the install fallback appears under the buttons. The dialog
  // unmounts when it closes and when a connection lands, so the
  // fallback state resets with it; a fresh tap also hides it and
  // re-arms the watch.
  const watchForWallet = () => {
    setNoWallet(false);
    watchCleanup.current?.();
    let timer = 0;
    const cancel = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", cancel);
      watchCleanup.current = null;
    };
    const onHidden = () => {
      if (document.hidden) cancel();
    };
    timer = window.setTimeout(() => {
      cancel();
      if (!document.hidden) setNoWallet(true);
    }, 2000);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", cancel);
    watchCleanup.current = cancel;
  };

  // The dialog declares aria-modal, so Tab must cycle inside it:
  // a keyboard user who tabs past the last control would
  // otherwise land on the page behind the overlay and lose the
  // dialog entirely. The focusable set is re-read per keypress:
  // the no-wallet fallback adds links while the dialog is open.
  // The boundary ruling is the core's trapTabIndex (pinned by
  // the suite); this handler only reads the live set and the
  // live focus, then applies the ruling.
  const trapTab = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const card = cardRef.current;
    if (card === null) return;
    const focusables = card.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    const target = trapTabIndex(
      focusables.length,
      Array.from(focusables).indexOf(
        document.activeElement as HTMLElement,
      ),
      event.shiftKey,
    );
    if (target < 0) return;
    event.preventDefault();
    focusables[target].focus();
  };

  const copyUri = async () => {
    try {
      await navigator.clipboard.writeText(uri);
      setUriCopied(true);
      setUriCopyFailed(false);
      setTimeout(() => setUriCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the failure is announced in words,
      // and the URI stays reachable through the button and the QR.
      setUriCopyFailed(true);
      setTimeout(() => setUriCopyFailed(false), 3000);
    }
  };

  return (
    <div
      className={closing ? "pairing-overlay closing" : "pairing-overlay"}
      onClick={(event) => {
        // Backdrop dismiss takes the same path as the dialog's own
        // close controls (the stock dialog behaved this way too).
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        className={closing ? "pairing-card closing" : "pairing-card"}
        role="dialog"
        aria-modal="true"
        aria-label={t.connectWallet}
        ref={cardRef}
        onKeyDown={trapTab}
      >
        <h2>{t.connectWallet}</h2>
        <a
          ref={openWalletRef}
          className="pairing-open"
          href={uri}
          onClick={watchForWallet}
        >
          {t.openWalletApp}
        </a>
        <p className="pairing-hint">{t.pairingScanHint}</p>
        <div className="pairing-qr" role="img" aria-label={t.pairingScanHint}>
          <AlphanumericQRCode value={qrUri} size={210} />
        </div>
        <div className="pairing-actions">
          <button type="button" onClick={() => void copyUri()}>
            {uriCopied ? t.copied : t.copyConnectionLink}
          </button>
          <button type="button" onClick={requestClose}>
            {t.sendCancel}
          </button>
        </div>
        {uriCopyFailed && (
          <p className="action-status" role="status">
            {t.copyFailed}
          </p>
        )}
        {noWallet && (
          <div className="pairing-nowallet">
            <h3>{t.noWalletHeading}</h3>
            <p>{t.noWalletBody}</p>
            <div className="pairing-wallets">
              <a
                href="https://www.paytaca.com"
                target="_blank"
                rel="noreferrer"
              >
                Paytaca
              </a>
              <a href="https://selene.cash" target="_blank" rel="noreferrer">
                Selene
              </a>
              <a
                href="https://cashonize.com"
                target="_blank"
                rel="noreferrer"
              >
                Cashonize
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WalletConnect({
  t,
  onSessionChange,
  connectSignal,
  onDialogClose,
}: {
  t: UiStrings;
  onSessionChange?: (session: WalletSession) => void;
  /** External "open the pairing dialog" requests (the report's
   *  anchor action is the caller): each INCREASE asks for the
   *  dialog, so a report-side button can route a wallet-less
   *  visitor into pairing without owning any wallet state. */
  connectSignal?: number;
  /** Fires when a signal-opened dialog closes WITHOUT a
   *  connection, so the caller can return focus to the control
   *  that asked for the dialog. */
  onDialogClose?: () => void;
}) {
  const {
    state,
    manager,
    uri,
    qrUri,
    walletName,
    connect,
    disconnect,
    error,
  } = useWizardConnect({ dappName: "PoolProof" });
  const [address, setAddress] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [addressMissing, setAddressMissing] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [addressCopyFailed, setAddressCopyFailed] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  // Set only by the connect button's own click: focus return (and
  // only that) is scoped to dialogs the user actually opened. An
  // auto-reconnect on page load must never steal focus.
  const dialogOpenedByUser = useRef(false);
  // Signal-opened dialogs (see the connectSignal prop): the last
  // signal value acted on, and whether the currently open dialog
  // came from a signal: its unconnected close belongs to the
  // caller (onDialogClose), not to the connect button's focus
  // return. The counter starts at 0, NOT at the prop's first
  // value: this component is lazy-loaded, and a signal bumped
  // before the chunk landed must still be acted on when it does.
  const lastConnectSignal = useRef(0);
  const signalOpenedDialog = useRef(false);

  useEffect(() => {
    const signal = connectSignal ?? 0;
    if (signal <= lastConnectSignal.current) {
      lastConnectSignal.current = signal;
      return;
    }
    lastConnectSignal.current = signal;
    // A signal that lands while a dialog is already open, while
    // connected, or while a session is reconnecting has nothing
    // to do: the visitor is already where the signal points.
    if (state !== "idle" && state !== "disconnected") return;
    dialogOpenedByUser.current = true;
    signalOpenedDialog.current = true;
    connect();
  }, [connectSignal, state, connect]);

  // The dialog dismisses on backdrop click and its buttons, and
  // Escape takes the same path as its onClose. When the dialog
  // goes away, focus returns to the button that opened it.
  useEffect(() => {
    if (state !== "connecting") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void disconnect();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, disconnect]);

  useEffect(() => {
    if (state === "connecting" || !dialogOpenedByUser.current) return;
    dialogOpenedByUser.current = false;
    if (signalOpenedDialog.current) {
      signalOpenedDialog.current = false;
      // A signal-opened dialog's close is the caller's to finish:
      // on an unconnected close it returns focus to the control
      // that asked for pairing; on success the caller sees the
      // session flip and does the same.
      if (state !== "connected") onDialogClose?.();
      return;
    }
    // On success the connect button unmounts (status takes its
    // place); on dismissal it is back, so give it the focus.
    if (state !== "connected") connectButtonRef.current?.focus();
  }, [state, onDialogClose]);

  useEffect(() => {
    let cancelled = false;
    if (state !== "connected" || manager === null) {
      setAddress(null);
      setTokenAddress(null);
      setAddressMissing(false);
      return;
    }
    (async () => {
      // The xpub arrives with the wallet handshake; poll briefly
      // rather than assuming it is stored the moment state flips.
      for (let attempt = 0; attempt < 10 && !cancelled; attempt++) {
        try {
          const pubkey = manager.getPubkey(0, 0n);
          if (pubkey !== undefined) {
            const plain = await pubkeyToCashAddress(pubkey);
            const token = await pubkeyToTokenAddress(pubkey);
            if (!cancelled) {
              setAddress(plain);
              setTokenAddress(token);
            }
            return;
          }
        } catch {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      // The poll gave up: say so instead of leaving a silent gap
      // where the address (and the EMBER2026 line) belongs.
      if (!cancelled) setAddressMissing(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [state, manager]);

  // The parent (home panels, banner) shares this connection. The
  // effect fires only when a field actually changes, so the parent
  // is not re-rendered by this component's own renders.
  const signManager = asSignManager(manager);
  useEffect(() => {
    onSessionChange?.({
      connected: state === "connected",
      walletName: walletName ?? null,
      address,
      tokenAddress,
      manager: signManager,
      addressMissing,
    });
  }, [
    state,
    walletName,
    address,
    tokenAddress,
    signManager,
    addressMissing,
    onSessionChange,
  ]);

  const copyAddress = async () => {
    if (address === null) return;
    try {
      // The chip displays a shortened address; the button copies
      // the FULL address. Copying the ellipsis form would be a
      // silent lie.
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      setAddressCopyFailed(false);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      setAddressCopyFailed(true);
      setTimeout(() => setAddressCopyFailed(false), 3000);
    }
  };

  return (
    <div className="wallet">
      {state === "connected" ? (
        <>
          <span className="wallet-status">
            {t.walletConnected.replace("{name}", walletName ?? "WizardConnect")}
          </span>
          {address !== null && (
            <>
              <span className="mono wallet-address" title={address}>
                {`${address.slice(0, 20)}…${address.slice(-8)}`}
              </span>
              <button
                type="button"
                className="copy-inline"
                onClick={() => void copyAddress()}
              >
                {addressCopied ? t.copied : t.copyAddress}
              </button>
            </>
          )}
          {address === null && addressMissing && (
            <span className="wallet-note">{t.walletAddressMissing}</span>
          )}
          {addressCopyFailed && (
            <span className="action-status" role="status">
              {t.copyFailed}
            </span>
          )}
          <button type="button" onClick={() => void disconnect()}>
            {t.disconnectWallet}
          </button>
        </>
      ) : (
        <button
          type="button"
          ref={connectButtonRef}
          disabled={state === "connecting"}
          onClick={() => {
            dialogOpenedByUser.current = true;
            connect();
          }}
        >
          {state === "connecting" ? t.walletConnecting : t.connectWallet}
        </button>
      )}
      {error !== null && (
        <span className="wallet-error" role="alert">
          {error}
        </span>
      )}
      {state === "connecting" && uri !== null && qrUri !== null && (
        <PairingDialog
          t={t}
          uri={uri}
          qrUri={qrUri}
          onClose={() => void disconnect()}
        />
      )}
    </div>
  );
}
