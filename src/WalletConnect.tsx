import { useEffect, useRef, useState } from "react";
import { useWizardConnect } from "@wizardconnect/react";
import type { UiStrings } from "./i18n";
import type { SignFlowManager } from "./core/sign-flow";
import {
  pubkeyToCashAddress,
  pubkeyToTokenAddress,
} from "./core/wallet-address";

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
export interface WalletSession {
  connected: boolean;
  walletName: string | null;
  address: string | null;
  tokenAddress: string | null;
  manager: SignFlowManager | null;
}

export const DISCONNECTED_SESSION: WalletSession = {
  connected: false,
  walletName: null,
  address: null,
  tokenAddress: null,
  manager: null,
};

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
  const [uriCopied, setUriCopied] = useState(false);
  const [uriCopyFailed, setUriCopyFailed] = useState(false);

  // Focus starts on the primary action: on a phone that is the
  // button the user came for, and keyboard users land inside the
  // dialog instead of behind it.
  useEffect(() => {
    openWalletRef.current?.focus();
  }, []);

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
      className="pairing-overlay"
      onClick={(event) => {
        // Backdrop dismiss takes the same path as the dialog's own
        // close controls (the stock dialog behaved this way too).
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="pairing-card"
        role="dialog"
        aria-modal="true"
        aria-label={t.connectWallet}
      >
        <h2>{t.connectWallet}</h2>
        <a ref={openWalletRef} className="pairing-open" href={uri}>
          {t.openWalletApp}
        </a>
        <p className="pairing-hint">{t.pairingScanHint}</p>
        <img className="pairing-qr" src={qrUri} alt="" />
        <div className="pairing-actions">
          <button type="button" onClick={() => void copyUri()}>
            {uriCopied ? t.copied : t.copyConnectionLink}
          </button>
          <button type="button" onClick={onClose}>
            {t.sendCancel}
          </button>
        </div>
        {uriCopyFailed && (
          <p className="action-status" role="status">
            {t.copyFailed}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WalletConnect({
  t,
  onSessionChange,
}: {
  t: UiStrings;
  onSessionChange?: (session: WalletSession) => void;
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
    // On success the connect button unmounts (status takes its
    // place); on dismissal it is back, so give it the focus.
    if (state !== "connected") connectButtonRef.current?.focus();
  }, [state]);

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
    });
  }, [state, walletName, address, tokenAddress, signManager, onSessionChange]);

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
