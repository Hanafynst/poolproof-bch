import { useEffect, useRef, useState } from "react";
import { useWizardConnect, WizardConnectQRDialog } from "@wizardconnect/react";
import type { UiStrings } from "./i18n";
import { pubkeyToCashAddress } from "./core/wallet-address";

/**
 * WizardConnect integration — practice (spike-local only).
 *
 * The connect flow is the protocol's own, not a mock: connect()
 * opens the Riften relay (wss, relay.riften.net), generates the key
 * exchange URI, and the QR dialog IS the window the wallet sees —
 * Paytaca / Selene / Cashonize / OPTN scan it (or open the wiz://
 * URI) and approve inside the wallet app. There is no server-side
 * sign-in and no window.alert anywhere in this flow: the hook's
 * error state renders inline below the button.
 *
 * On "connected" the dapp derives its receive address from the
 * wallet's first receive pubkey (manager.getPubkey(0, 0)) — the
 * EMBER2026 banner line needs exactly this address.
 */
export default function WalletConnect({ t }: { t: UiStrings }) {
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
  const [addressMissing, setAddressMissing] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  // Set only by the connect button's own click: focus return (and
  // only that) is scoped to dialogs the user actually opened — an
  // auto-reconnect on page load must never steal focus.
  const dialogOpenedByUser = useRef(false);

  // The library dialog dismisses on backdrop click and its close
  // button, but it has no Escape handling and never moves focus
  // (verified in the installed @wizardconnect/react source).
  // Supply both here: Escape takes the same path as the dialog's
  // onClose, and when the dialog goes away focus returns to the
  // button that opened it.
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
    // place); on dismissal it is back — give it the focus.
    if (state !== "connected") connectButtonRef.current?.focus();
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    if (state !== "connected" || manager === null) {
      setAddress(null);
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
            const derived = await pubkeyToCashAddress(pubkey);
            if (!cancelled) setAddress(derived);
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

  return (
    <div className="wallet">
      {state === "connected" ? (
        <>
          <span className="wallet-status">
            {t.walletConnected.replace("{name}", walletName ?? "WizardConnect")}
          </span>
          {address !== null && (
            <span className="mono wallet-address" title={address}>
              {`${address.slice(0, 20)}…${address.slice(-8)}`}
            </span>
          )}
          {address === null && addressMissing && (
            <span className="wallet-note">{t.walletAddressMissing}</span>
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
      {uri !== null && qrUri !== null && (
        <WizardConnectQRDialog
          show={state === "connecting"}
          onClose={() => void disconnect()}
          uri={uri}
          qrUri={qrUri}
        />
      )}
    </div>
  );
}
