import { useEffect, useMemo, useRef, useState } from "react";
import { binToHex, hexToBin } from "@bitauth/libauth";
import qrcode from "qrcode-generator";
import { languageOption, type Lang, type UiStrings } from "./i18n";
import { formatBch, formatTokenAmount, shortenMiddle } from "./format";
import type { WalletSession } from "./WalletConnect";
import type { ElectrumSession } from "./core/electrum-wss";
import { DUST_SATS } from "./core/anchor-tx";
import type { TokenIdentity } from "./core/identity";
import {
  confirmGate,
  detectRecipient,
  feePreview,
  formatBaseUnits,
  parseAmountInput,
  shortcutAmount,
  type GateReason,
  type Receipt,
  type ShortcutKind,
} from "./core/send-flow";
import {
  SignFlowError,
  executeBchSendFlow,
  executeTokenSendFlow,
  type SignFlowReceiptFields,
} from "./core/sign-flow";
import {
  buildBchTransfer,
  buildTokenTransfer,
  type TokenTransferTemplate,
  type TransferTxTemplate,
  type SpendableUtxo,
} from "./core/transfer-tx";
import type { WalletHoldings } from "./core/wallet-utxos";

const PRESENTATION_URL =
  "https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?usp=sharing";
const REPO_URL = "https://github.com/Hanafynst/poolproof-bch";

/** The wallet read's state, owned by App: idle before any wallet
 *  address exists, loading during the UTXO read, ready with the
 *  indexed holdings, unavailable when the indexer cannot be
 *  reached. Panels render these states in words, never as a
 *  fabricated zero. */
export type UtxoPhase = "idle" | "loading" | "ready" | "unavailable";

export type HomePanel = "send" | "receive" | "history";

/**
 * The mandatory BCH BLAZE banner, styled per the user's orders
 * (2026-11-14): a compact solid scarlet strip at the very top
 * of the page, its elements flowing inline as fine print.
 * Exactly the four required elements: the Widget Factory
 * presentation link, the GitHub repo link, the EMBER2026
 * CashTokens address, and the pre-existing-work disclosure.
 * The EMBER2026 slot shows the connected wallet's token-aware
 * address (a copy button, since a tipping address is only useful
 * if it can be copied exactly) and the pack's placeholder sentence
 * until a wallet is connected. No address is ever written into
 * the source.
 */
export function TopBanner({
  t,
  tokenAddress,
}: {
  t: UiStrings;
  tokenAddress: string | null;
}) {
  const [emberCopied, setEmberCopied] = useState(false);
  const [emberCopyFailed, setEmberCopyFailed] = useState(false);
  const copyEmber = async () => {
    if (tokenAddress === null) return;
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setEmberCopied(true);
      setEmberCopyFailed(false);
      setTimeout(() => setEmberCopied(false), 2000);
    } catch {
      setEmberCopyFailed(true);
      setTimeout(() => setEmberCopyFailed(false), 3000);
    }
  };
  return (
    <div className="top-banner">
      <a href={PRESENTATION_URL} target="_blank" rel="noreferrer">
        {t.presentation}
      </a>
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        {t.source}
      </a>
      {tokenAddress !== null ? (
        <button
          type="button"
          className="banner-ember mono"
          title={tokenAddress}
          onClick={() => void copyEmber()}
        >
          {emberCopied
            ? t.copied
            : `EMBER2026 · ${shortenMiddle(tokenAddress, 12)}`}
        </button>
      ) : (
        <span className="banner-ember">{t.ember}</span>
      )}
      {emberCopyFailed && (
        <span className="banner-status" role="status">
          {t.copyFailed}
        </span>
      )}
      <span className="banner-disclosure">{t.preExistingDisclosure}</span>
    </div>
  );
}

function TileIcon({ panel }: { panel: HomePanel | "audit" }) {
  const paths =
    panel === "send" ? (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ) : panel === "receive" ? (
      <>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </>
    ) : panel === "history" ? (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ) : (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.5-4.5" />
      </>
    );
  return (
    <svg
      className="tile-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

/**
 * The wallet card under the header row: the connected wallet's BCH
 * balance in large type, then the four action tiles. Disconnected,
 * the card carries the pack's connect hint and the tiles still
 * work: Send, Receive and History open their panels, which state
 * the disconnected case in words, and Audit scrolls to the audit
 * form. No balance figure is ever rendered for a wallet whose
 * UTXOs have not actually been read.
 */
export function WalletCard({
  t,
  session,
  utxoPhase,
  holdings,
  openPanel,
  onTogglePanel,
  onAudit,
}: {
  t: UiStrings;
  session: WalletSession;
  utxoPhase: UtxoPhase;
  holdings: WalletHoldings | null;
  openPanel: HomePanel | null;
  onTogglePanel: (panel: HomePanel) => void;
  onAudit: () => void;
}) {
  const tiles: Array<{ panel: HomePanel; label: string }> = [
    { panel: "send", label: t.actionSend },
    { panel: "receive", label: t.actionReceive },
    { panel: "history", label: t.actionHistory },
  ];
  return (
    <section className="wallet-card" aria-label={t.walletBalance}>
      {!session.connected ? (
        <p className="balance-hint">{t.walletDisconnectedHint}</p>
      ) : utxoPhase === "loading" || utxoPhase === "idle" ? (
        <p className="balance-hint" aria-busy="true">
          {t.walletBalanceLoading}
        </p>
      ) : utxoPhase === "unavailable" || holdings === null ? (
        <p className="balance-hint">{t.walletBalanceUnavailable}</p>
      ) : (
        <>
          <p className="balance-label">{t.walletBalance}</p>
          <p className="balance-value">{formatBch(holdings.bchSats)} BCH</p>
          {(holdings.fungibles.length > 0 || holdings.nfts.length > 0) && (
            <p className="balance-sub">
              {t.holdingsTokens}: {holdings.fungibles.length} · {t.holdingsNfts}:{" "}
              {holdings.nfts.length}
            </p>
          )}
        </>
      )}
      <div className="tiles">
        {tiles.map(({ panel, label }) => (
          <button
            key={panel}
            type="button"
            className="tile"
            aria-expanded={openPanel === panel}
            onClick={() => onTogglePanel(panel)}
          >
            <TileIcon panel={panel} />
            <span>{label}</span>
          </button>
        ))}
        <button type="button" className="tile" onClick={onAudit}>
          <TileIcon panel="audit" />
          <span>{t.actionAudit}</span>
        </button>
      </div>
    </section>
  );
}

function AddressQr({ value, caption }: { value: string; caption: string }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 12, scalable: true });
  }, [value]);
  return (
    <div
      className="qr"
      role="img"
      aria-label={caption}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function CopyAddressButton({
  t,
  address,
  label,
}: {
  t: UiStrings;
  address: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    }
  };
  return (
    <>
      <button type="button" onClick={() => void copy()}>
        {copied ? t.copied : label}
      </button>
      {failed && (
        <span className="action-status" role="status">
          {t.copyFailed}
        </span>
      )}
    </>
  );
}

/**
 * Receive: the derived addresses with their types labelled, the
 * token-aware one first with its QR (it is the safe address for
 * BCH, tokens and NFTs alike). The QR encodes the token address,
 * never the shortened display form.
 */
export function ReceivePanel({
  t,
  session,
}: {
  t: UiStrings;
  session: WalletSession;
}) {
  if (!session.connected) {
    return (
      <section className="panel" aria-label={t.actionReceive}>
        <p>{t.walletDisconnectedHint}</p>
      </section>
    );
  }
  if (session.address === null || session.tokenAddress === null) {
    return (
      <section className="panel" aria-label={t.actionReceive}>
        <p>{t.walletAddressMissing}</p>
      </section>
    );
  }
  return (
    <section className="panel" aria-label={t.actionReceive}>
      <h2>{t.receiveAddressLabel}</h2>
      <p className="panel-note">{t.receiveTokenNote}</p>
      <AddressQr value={session.tokenAddress} caption={t.receiveQrCaption} />
      <p className="mono panel-address">{session.tokenAddress}</p>
      <div className="panel-actions">
        <CopyAddressButton t={t} address={session.tokenAddress} label={t.copyAddress} />
      </div>
      <h3>{t.receivePlainLabel}</h3>
      <p className="panel-note">{t.receivePlainNote}</p>
      <p className="mono panel-address">{session.address}</p>
      <div className="panel-actions">
        <CopyAddressButton t={t} address={session.address} label={t.copyAddress} />
      </div>
    </section>
  );
}

/**
 * History: the receipts this browser recorded, newest first, from
 * the history store. A receipt is the record of a broadcast send:
 * asset, amount, recipient, fee and the explorer link. A store
 * that failed to load says so above the (empty) list instead of
 * pretending nothing ever happened.
 */
export function HistoryPanel({
  t,
  lang,
  receipts,
  loadFailed,
}: {
  t: UiStrings;
  lang: Lang;
  receipts: Receipt[];
  loadFailed: boolean;
}) {
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);
  const copyTxid = async (txid: string) => {
    try {
      await navigator.clipboard.writeText(txid);
      setCopiedTxid(txid);
      setTimeout(() => setCopiedTxid(null), 2000);
    } catch {
      // The txid stays visible in the explorer link's row; a failed
      // copy changes nothing about the record.
    }
  };
  return (
    <section className="panel" aria-label={t.historyTitle}>
      <h2>{t.historyTitle}</h2>
      {loadFailed && (
        <p className="panel-note" role="note">
          {t.historyUnavailable}
        </p>
      )}
      {receipts.length === 0 ? (
        <p>{t.historyEmpty}</p>
      ) : (
        receipts.map((receipt) => (
          <article className="history-row" key={receipt.txid}>
            <div className="history-main">
              <span className="history-asset">{receipt.assetLabel}</span>
              <span className="history-amount">{receipt.amountText}</span>
              <span className="chip" data-status="pass">
                {t.receiptStatusBroadcast}
              </span>
            </div>
            <p className="mono history-recipient" title={receipt.recipient}>
              {shortenMiddle(receipt.recipient, 14)}
            </p>
            <p className="history-meta">
              {new Intl.DateTimeFormat(languageOption(lang).locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(receipt.sentAtIso))}{" "}
              · {t.historySent}
            </p>
            <div className="panel-actions">
              <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                {t.receiptExplorer}
              </a>
              <button type="button" onClick={() => void copyTxid(receipt.txid)}>
                {copiedTxid === receipt.txid ? t.copied : t.copyTxid}
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

type AssetSelection =
  | { kind: "bch" }
  | { kind: "fungible"; category: string }
  | { kind: "nft"; category: string; commitment: string };

function selectionKey(selection: AssetSelection): string {
  return selection.kind === "bch"
    ? "bch"
    : selection.kind === "fungible"
      ? `fungible:${selection.category}`
      : `nft:${selection.category}:${selection.commitment}`;
}

const GATE_STRINGS: Record<GateReason, (t: UiStrings) => string> = {
  wrong_network: (t) => t.gateWrongNetwork,
  invalid_address: (t) => t.gateInvalidAddress,
  token_to_plain_address: (t) => t.gateTokenToPlainAddress,
  amount_missing: (t) => t.gateAmountMissing,
  amount_invalid: (t) => t.gateAmountInvalid,
  amount_zero: (t) => t.gateAmountZero,
  amount_below_dust: (t) =>
    t.gateAmountBelowDust.replace("{dustSats}", DUST_SATS.toString()),
  insufficient_balance: (t) => t.gateInsufficientBalance,
  insufficient_fee_balance: (t) => t.gateInsufficientFeeBalance,
};

/**
 * Send: asset picker fed by the indexed holdings, recipient entry
 * with live address-type detection, amount entry with the shortcut
 * row, and a confirmation sheet before anything is signed. The
 * chain is the proven one: the transfer builders price and select,
 * the confirm gate decides, sign-flow asks the wallet, verifies
 * the signed transaction byte for byte against the confirmed
 * template, and only then broadcasts through the same Electrum
 * session that read the wallet. A confirmed send's receipt goes
 * to the history store via onSent.
 *
 * Token amounts are entered in the asset's own units once its
 * identity (and with it, its decimals) has resolved from
 * TokenStork; before that they are base units. Changing the asset
 * or the decimals clears the amount field, so a typed number can
 * never be silently reinterpreted under different decimals.
 */
export function SendPanel({
  t,
  lang,
  session,
  electrum,
  utxoPhase,
  utxos,
  holdings,
  resolveIdentity,
  onSent,
}: {
  t: UiStrings;
  lang: Lang;
  session: WalletSession;
  electrum: ElectrumSession;
  utxoPhase: UtxoPhase;
  utxos: SpendableUtxo[];
  holdings: WalletHoldings | null;
  resolveIdentity: (category: string) => Promise<TokenIdentity | null>;
  onSent: (receipt: Receipt) => void;
}) {
  const [selection, setSelection] = useState<AssetSelection>({ kind: "bch" });
  const [recipient, setRecipient] = useState("");
  const [amountText, setAmountText] = useState("");
  const [phase, setPhase] = useState<"form" | "confirm" | "signing">("form");
  const [sendError, setSendError] = useState<string | null>(null);
  const [identities, setIdentities] = useState<
    Record<string, TokenIdentity | null>
  >({});
  const identityAsked = useRef(new Set<string>());

  const selectedCategory =
    selection.kind === "bch" ? null : selection.category;
  useEffect(() => {
    if (selectedCategory === null) return;
    if (identityAsked.current.has(selectedCategory)) return;
    identityAsked.current.add(selectedCategory);
    let live = true;
    void resolveIdentity(selectedCategory).then((identity) => {
      if (live) {
        setIdentities((prev) => ({ ...prev, [selectedCategory]: identity }));
      }
    });
    return () => {
      live = false;
    };
  }, [selectedCategory, resolveIdentity]);

  const identity =
    selectedCategory === null ? null : (identities[selectedCategory] ?? null);
  const decimals =
    selection.kind === "bch" ? 8 : (identity?.decimals ?? 0);
  // A decimals change reinterprets every typed digit: clear the
  // field instead (see the component note above).
  const decimalsRef = useRef(decimals);
  useEffect(() => {
    if (decimalsRef.current !== decimals) {
      decimalsRef.current = decimals;
      setAmountText("");
    }
  }, [decimals]);

  if (!session.connected) {
    return (
      <section className="panel" aria-label={t.actionSend}>
        <p>{t.walletDisconnectedHint}</p>
      </section>
    );
  }
  if (utxoPhase === "loading" || utxoPhase === "idle") {
    return (
      <section className="panel" aria-label={t.actionSend}>
        <p aria-busy="true">{t.walletBalanceLoading}</p>
      </section>
    );
  }
  if (utxoPhase === "unavailable" || holdings === null) {
    return (
      <section className="panel" aria-label={t.actionSend}>
        <p>{t.walletBalanceUnavailable}</p>
      </section>
    );
  }

  const fungibleHolding =
    selection.kind === "fungible"
      ? (holdings.fungibles.find((h) => h.category === selection.category) ??
        null)
      : null;
  const available =
    selection.kind === "bch"
      ? holdings.bchSats
      : selection.kind === "fungible"
        ? (fungibleHolding?.totalAmount ?? 0n)
        : 0n;

  let amount: bigint | null = null;
  let amountError: string | null = null;
  if (selection.kind !== "nft" && amountText.trim() !== "") {
    try {
      amount = parseAmountInput(amountText.trim(), decimals);
    } catch {
      amountError = "unparseable";
    }
  }
  const detection =
    recipient.trim() === "" ? null : detectRecipient(recipient.trim());

  const built = ((): {
    template: TransferTxTemplate | TokenTransferTemplate | null;
    buildError: string | null;
  } => {
    if (
      detection === null ||
      !detection.valid ||
      detection.network !== "mainnet"
    ) {
      return { template: null, buildError: null };
    }
    if (selection.kind !== "nft" && amount === null) {
      return { template: null, buildError: null };
    }
    try {
      if (selection.kind === "bch") {
        return {
          template: buildBchTransfer({
            utxos,
            toCashAddress: recipient.trim(),
            amountSats: amount as bigint,
          }),
          buildError: null,
        };
      }
      if (selection.kind === "fungible") {
        return {
          template: buildTokenTransfer({
            utxos,
            category: hexToBin(selection.category),
            toCashAddress: recipient.trim(),
            fungibleAmount: amount as bigint,
          }),
          buildError: null,
        };
      }
      return {
        template: buildTokenTransfer({
          utxos,
          category: hexToBin(selection.category),
          toCashAddress: recipient.trim(),
          fungibleAmount: 0n,
          nftCommitment: hexToBin(selection.commitment),
        }),
        buildError: null,
      };
    } catch (error) {
      // The builders refuse with precise reasons (insufficient
      // plain UTXOs, dust, a token the wallet does not hold). The
      // refusal is shown as-is: it is the accurate answer.
      return {
        template: null,
        buildError: error instanceof Error ? error.message : String(error),
      };
    }
  })();
  const template = built.template;

  const gate = confirmGate({
    assetKind: selection.kind,
    network: "mainnet",
    amountBaseUnits: amount,
    amountError,
    availableBaseUnits: available,
    feeSats: template?.feeSats ?? 0n,
    feeAvailableSats: holdings.bchSats,
    recipient: detection,
  });
  const canReview = gate.canConfirm && template !== null;

  const assetLabel =
    selection.kind === "bch"
      ? "BCH"
      : identity !== null
        ? `${identity.name} (${identity.symbol})`
        : shortenMiddle(selection.category, 8);
  const receiptAssetLabel =
    selection.kind === "bch"
      ? "BCH"
      : (identity?.symbol ?? shortenMiddle(selection.category, 6));
  const amountDisplay =
    selection.kind === "nft"
      ? `${t.holdingsCommitment}: ${shortenMiddle(selection.commitment, 8)}`
      : selection.kind === "bch"
        ? `${amount === null ? amountText : formatBch(amount)} BCH`
        : `${amount === null ? amountText : formatTokenAmount(amount, decimals, lang)} ${identity?.symbol ?? ""}`.trim();
  const balanceAfter =
    selection.kind === "bch" && amount !== null && template !== null
      ? `${formatBch(available - amount - template.feeSats)} BCH`
      : selection.kind === "fungible" && amount !== null
        ? `${formatTokenAmount(available - amount, decimals, lang)} ${identity?.symbol ?? ""}`.trim()
        : null;

  const applyShortcut = (kind: ShortcutKind) => {
    const value = shortcutAmount(kind, available, template?.feeSats ?? 0n, {
      feePaidInSameAsset: selection.kind === "bch",
    });
    setAmountText(formatBaseUnits(value, decimals));
  };

  const executeSend = async () => {
    const manager = session.manager;
    if (manager === null || template === null) return;
    if (selection.kind !== "nft" && amount === null) return;
    setPhase("signing");
    setSendError(null);
    const broadcast = async (signedTxHex: string): Promise<void> => {
      await electrum.call("blockchain.transaction.broadcast", [signedTxHex]);
    };
    const ridingAmount =
      selection.kind === "nft"
        ? (utxos.find(
            (utxo) =>
              utxo.token?.nft !== undefined &&
              binToHex(utxo.token.category) === selection.category &&
              binToHex(utxo.token.nft.commitment) === selection.commitment,
          )?.token?.amount ?? 0n)
        : null;
    const receiptFields: SignFlowReceiptFields = {
      kind: selection.kind,
      assetLabel: receiptAssetLabel,
      amountBaseUnits:
        selection.kind === "nft" ? (ridingAmount as bigint) : (amount as bigint),
      decimals,
      recipient: recipient.trim(),
      feeSats: template.feeSats,
      sentAtIso: new Date().toISOString(),
    };
    if (selection.kind !== "bch") receiptFields.categoryId = selection.category;
    if (selection.kind === "nft") receiptFields.commitment = selection.commitment;
    try {
      const result =
        selection.kind === "bch"
          ? await executeBchSendFlow(manager, broadcast, template, {
              receiptFields,
              userPrompt: t.signPromptSend,
            })
          : await executeTokenSendFlow(
              manager,
              broadcast,
              template as TokenTransferTemplate,
              { receiptFields, userPrompt: t.signPromptSend },
            );
      onSent(result.receipt);
      setAmountText("");
      setRecipient("");
      setPhase("form");
    } catch (error) {
      setPhase("confirm");
      if (error instanceof SignFlowError) {
        setSendError(
          error.code === "WALLET_REFUSED"
            ? t.signRejected
            : error.code === "TAMPERED"
              ? t.sendTampered
              : error.code === "BROADCAST_FAILED"
                ? t.sendBroadcastFailed
                : t.sendMalformed,
        );
      } else {
        setSendError(error instanceof Error ? error.message : String(error));
      }
    }
  };

  const percentLabel = (kind: 25 | 50 | 75) =>
    new Intl.NumberFormat(languageOption(lang).locale, {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(kind / 100);
  const walletEmpty =
    holdings.bchSats === 0n &&
    holdings.fungibles.length === 0 &&
    holdings.nfts.length === 0;

  return (
    <section className="panel" aria-label={t.actionSend}>
      <h2>{t.sendTitle}</h2>
      <p className="panel-note">{t.sendNetwork}</p>
      {walletEmpty ? (
        <p>{t.holdingsEmpty}</p>
      ) : phase === "form" ? (
        <>
          <div className="asset-list" role="group" aria-label={t.sendTitle}>
            <button
              type="button"
              className="asset-row"
              aria-pressed={selection.kind === "bch"}
              onClick={() => setSelection({ kind: "bch" })}
            >
              <span className="asset-name">BCH</span>
              <span className="asset-amount">
                {formatBch(holdings.bchSats)} BCH
              </span>
            </button>
            {holdings.fungibles.map((holding) => {
              const held = identities[holding.category] ?? null;
              const selected =
                selection.kind === "fungible" &&
                selection.category === holding.category;
              return (
                <button
                  key={holding.category}
                  type="button"
                  className="asset-row"
                  aria-pressed={selected}
                  onClick={() =>
                    setSelection({ kind: "fungible", category: holding.category })
                  }
                >
                  <span className="asset-name">
                    {held !== null
                      ? `${held.name} (${held.symbol})`
                      : shortenMiddle(holding.category, 8)}
                  </span>
                  <span className="asset-amount">
                    {formatTokenAmount(
                      holding.totalAmount,
                      held?.decimals ?? 0,
                      lang,
                    )}{" "}
                    {held?.symbol ?? ""}
                  </span>
                </button>
              );
            })}
            {holdings.nfts.map((nft) => {
              const held = identities[nft.category] ?? null;
              const selected =
                selection.kind === "nft" &&
                selection.category === nft.category &&
                selection.commitment === nft.commitment;
              return (
                <button
                  key={`${nft.category}:${nft.commitment}`}
                  type="button"
                  className="asset-row"
                  aria-pressed={selected}
                  onClick={() =>
                    setSelection({
                      kind: "nft",
                      category: nft.category,
                      commitment: nft.commitment,
                    })
                  }
                >
                  <span className="asset-name">
                    {held !== null
                      ? `${held.name} (${held.symbol})`
                      : shortenMiddle(nft.category, 8)}
                  </span>
                  <span className="asset-amount">
                    {t.holdingsCommitment}: {shortenMiddle(nft.commitment, 8)}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="field-label" htmlFor="send-recipient">
            {t.sendRecipient}
          </label>
          <input
            id="send-recipient"
            className="mono panel-input"
            type="text"
            value={recipient}
            placeholder={t.sendRecipientPlaceholder}
            onChange={(event) => setRecipient(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {detection !== null && detection.valid && (
            <p className="panel-note">
              {detection.tokenSupport ? t.sendAddressToken : t.sendAddressPlain}
            </p>
          )}

          {selection.kind !== "nft" && (
            <>
              <label className="field-label" htmlFor="send-amount">
                {t.sendAmount}
              </label>
              <input
                id="send-amount"
                className="panel-input"
                type="text"
                inputMode="decimal"
                value={amountText}
                onChange={(event) => setAmountText(event.target.value)}
                autoComplete="off"
              />
              <div className="shortcut-row">
                {([25, 50, 75] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => applyShortcut(kind)}
                  >
                    {percentLabel(kind)}
                  </button>
                ))}
                <button type="button" onClick={() => applyShortcut("MAX")}>
                  {t.sendMax}
                </button>
              </div>
            </>
          )}

          {(recipient.trim() !== "" || amountText.trim() !== "") &&
            gate.reasons.length > 0 && (
              <ul className="gate-reasons">
                {gate.reasons.map((reason) => (
                  <li key={reason}>{GATE_STRINGS[reason](t)}</li>
                ))}
              </ul>
            )}
          {built.buildError !== null && (
            <p className="live-error" role="alert">
              {built.buildError}
            </p>
          )}
          <div className="panel-actions">
            <button
              type="button"
              className="primary-action"
              disabled={!canReview}
              onClick={() => {
                setSendError(null);
                setPhase("confirm");
              }}
            >
              {t.confirmTitle}
            </button>
          </div>
        </>
      ) : (
        <div className="confirm-sheet">
          <h3>{t.confirmTitle}</h3>
          <dl className="confirm-rows">
            <div>
              <dt>{t.confirmAsset}</dt>
              <dd>{assetLabel}</dd>
            </div>
            <div>
              <dt>{t.confirmRecipient}</dt>
              <dd className="mono" title={recipient.trim()}>
                {shortenMiddle(recipient.trim(), 14)}
              </dd>
            </div>
            <div>
              <dt>{t.confirmAmount}</dt>
              <dd>{amountDisplay}</dd>
            </div>
            <div>
              <dt>{t.confirmFee}</dt>
              <dd>
                {template !== null
                  ? `${formatBch(feePreview(template.feeSats).feeSats)} BCH`
                  : ""}
              </dd>
            </div>
            {balanceAfter !== null && (
              <div>
                <dt>{t.confirmBalanceAfter}</dt>
                <dd>{balanceAfter}</dd>
              </div>
            )}
          </dl>
          <p className="panel-note">{t.feeEstimateNote}</p>
          <p className="panel-note">{t.deliveryEstimate}</p>
          {sendError !== null && (
            <p className="live-error" role="alert">
              {sendError}
            </p>
          )}
          <div className="panel-actions">
            <button
              type="button"
              className="primary-action"
              disabled={phase === "signing"}
              onClick={() => void executeSend()}
            >
              {phase === "signing" ? t.sendInProgress : t.sendConfirm}
            </button>
            <button
              type="button"
              disabled={phase === "signing"}
              onClick={() => setPhase("form")}
            >
              {t.sendCancel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
