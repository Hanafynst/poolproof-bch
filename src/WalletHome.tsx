import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { binToHex, hexToBin } from "@bitauth/libauth";
import qrcode from "qrcode-generator";
import { languageOption, type Lang, type UiStrings } from "./i18n";
import {
  formatBch,
  formatTokenAmount,
  latinDateTimeFormat,
  latinNumberFormat,
  shortenMiddle,
} from "./format";
import type { WalletSession } from "./wallet-session";
import { DismissIcon, TileIcon } from "./icons";
import type { ElectrumSession } from "./core/electrum-wss";
import { DUST_SATS } from "./core/anchor-tx";
import type { TokenIdentity } from "./core/identity";
import {
  applyAmountKey,
  confirmGate,
  detectRecipient,
  feePreview,
  formatBaseUnits,
  parseAmountInput,
  shortcutAmount,
  type FiatRate,
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
import {
  buildPortfolio,
  type PortfolioModel,
  type PortfolioPrice,
} from "./core/portfolio";
import { fetchLivePoolFacts } from "./core/cauldron-live";
import type { HistoryEntry } from "./core/history-store";
import { listWindow, LIST_WINDOW_SIZE } from "./core/list-window";
import {
  phaseFocusTarget,
  trapTabIndex,
  type SendPhase,
} from "./core/focus-nav";
import {
  failureReasonForCode,
  type ToastFailureReason,
} from "./core/toast";

export const PRESENTATION_URL =
  "https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?usp=sharing";
export const REPO_URL = "https://github.com/Hanafynst/poolproof-bch";
export const X_URL = "https://x.com/0xhannnx";

/** The wallet read's state, owned by App: idle before any wallet
 *  address exists, loading during the UTXO read, ready with the
 *  indexed holdings, unavailable when the indexer cannot be
 *  reached. Panels render these states in words, never as a
 *  fabricated zero. */
export type UtxoPhase = "idle" | "loading" | "ready" | "unavailable";

export type HomePanel = "send" | "receive" | "history";

/**
 * The mandatory BCH BLAZE banner, styled per the user's orders
 * (2026-11-14): a compact fine-print strip at the very top of
 * the page, black with a scarlet glow. Exactly the four required
 * elements, stacked as three blocks (R80): the EMBER2026
 * CashTokens address on its own line, the pre-existing-work
 * disclosure as its own paragraph under it, and the Widget
 * Factory presentation link and the GitHub repo link closing
 * the band on their own row underneath.
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
      <p className="banner-line">
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
            {" "}
            {t.copyFailed}
          </span>
        )}
      </p>
      <p className="banner-text banner-disclosure">
        {t.preExistingDisclosure}
      </p>
      <div className="banner-links">
        <a href={PRESENTATION_URL} target="_blank" rel="noreferrer">
          {t.presentation}
        </a>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          {t.source}
        </a>
      </div>
    </div>
  );
}

// The tile glyphs come from src/icons.tsx (R50), the app's one
// icon system: the four tiles and the report actions are drawn
// to a single stroke spec there.

/**
 * The wallet card under the header row: the connected wallet's BCH
 * balance in large type, then the four action tiles. Disconnected,
 * the card carries the pack's connect hint and the tiles still
 * work: Send and History open their panels and Receive opens its
 * modal window, each stating the disconnected case in words, and
 * Audit scrolls to the audit
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
      ) : session.addressMissing ? (
        <p className="balance-hint">{t.walletAddressMissing}</p>
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
            id={`wallet-tile-${panel}`}
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

/**
 * The portfolio ring (R81, deepened in R83): the priced
 * composition as a donut, drawn from the same model the rows
 * render, so ring and rows can never disagree. R83 makes it
 * the card's hero: a thicker band with rounded caps and a soft
 * glow in each segment's own colour, and a three-line centre —
 * the total's label, the total itself, the same total in BCH
 * under it. Segments sweep in once on mount (the progress
 * state starts at 0 and the effect raises it; refresh
 * re-renders reuse the node and the raised state, so a balance
 * poll never replays the sweep). With more than one segment
 * the dash gap is sized against the round caps: a cap extends
 * half the stroke width past each dash end, so a gap of 11 on
 * this circumference lands the painted arcs within a unit of
 * their true shares. A single full-circle segment keeps butt
 * caps, so its seam closes cleanly.
 */
function PortfolioRing({
  model,
  centreLabel,
  centreText,
  centreSub,
  label,
}: {
  model: PortfolioModel;
  centreLabel: string;
  centreText: string;
  centreSub: string;
  label: string;
}) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(1);
  }, []);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const segments: Array<{
    key: string;
    color: string;
    start: number;
    share: number;
  }> = [];
  let acc = 0;
  for (const row of model.rows) {
    if (row.share === null || row.share <= 0) continue;
    segments.push({
      key: `${row.kind}:${row.category ?? ""}`,
      color: row.color,
      start: acc,
      share: row.share,
    });
    acc += row.share;
  }
  const multi = segments.length > 1;
  const gap = multi ? 11 : 0;
  return (
    <div className="portfolio-ring" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="portfolio-track" cx="60" cy="60" r={radius} />
        {segments.map((segment) => (
          <circle
            key={segment.key}
            className="portfolio-seg"
            cx="60"
            cy="60"
            r={radius}
            stroke={segment.color}
            strokeLinecap={multi ? "round" : "butt"}
            style={{ filter: `drop-shadow(0 0 5px ${segment.color}59)` }}
            strokeDasharray={`${Math.max(segment.share * circumference * progress - gap, 0.5)} ${circumference}`}
            strokeDashoffset={-segment.start * circumference * progress}
          />
        ))}
      </svg>
      <div className="portfolio-ring-centre">
        <span className="portfolio-ring-label">{centreLabel}</span>
        <span className="portfolio-ring-value">{centreText}</span>
        <span className="portfolio-ring-sub">{centreSub}</span>
      </div>
    </div>
  );
}

/**
 * The portfolio card (R81, redesigned in R83): the connected
 * wallet's composition — a donut of the priced rows with the
 * priced total in USD at its centre, one row per asset below.
 * All pricing lives in the pure core (core/portfolio.ts); this
 * component only fetches and renders. Identities come through
 * the caller's resolver (the audit path's TokenStork pinning),
 * pool reserves through the audit path's own Cauldron adapter,
 * and the BCH/USD rate is the caller's LIVE quote (core/fx-rate
 * via App): its source is named in the card's footnote, and
 * when every source failed the card shows amounts and shares
 * without dollar values and says so. While pool prices or the
 * rate are still loading the card shows a skeleton, never
 * placeholder figures. A category whose pool read failed is
 * unpriced like one with no pool, and the card says prices
 * could not be loaded; unpriced holdings keep their amounts
 * and carry no value. NFTs render as a count.
 */
export function PortfolioCard({
  t,
  holdings,
  resolveIdentity,
  bchUsd,
  rateSource,
  rateSettled,
}: {
  t: UiStrings;
  holdings: WalletHoldings;
  resolveIdentity: (category: string) => Promise<TokenIdentity | null>;
  /** The live BCH/USD quote, or null when every source failed. */
  bchUsd: number | null;
  /** The source that served the quote, for the footnote. */
  rateSource: string | null;
  /** False while the first rate read is still in flight: the
   *  card stays on its skeleton rather than guessing whether
   *  dollar figures exist. */
  rateSettled: boolean;
}) {
  const [identities, setIdentities] = useState<
    Record<string, TokenIdentity | null>
  >({});
  const [prices, setPrices] = useState<Record<string, PortfolioPrice | null>>(
    {},
  );
  const [priceFailed, setPriceFailed] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const identityAsked = useRef(new Set<string>());
  const priceAsked = useRef(new Set<string>());
  const categoriesKey = holdings.fungibles
    .map((fungible) => fungible.category)
    .join(",");
  useEffect(() => {
    for (const { category } of holdings.fungibles) {
      if (!identityAsked.current.has(category)) {
        identityAsked.current.add(category);
        void resolveIdentity(category).then((identity) => {
          setIdentities((prev) => ({ ...prev, [category]: identity }));
        });
      }
      if (!priceAsked.current.has(category)) {
        priceAsked.current.add(category);
        void fetchLivePoolFacts(category)
          .then((live) => {
            setPrices((prev) => ({
              ...prev,
              [category]:
                live.poolCount > 0
                  ? {
                      reserveQuoteSats: live.facts.reserveQuoteSats,
                      reserveTokenRaw: live.facts.reserveTokenRaw,
                    }
                  : null,
            }));
          })
          .catch(() => {
            setPrices((prev) => ({ ...prev, [category]: null }));
            setPriceFailed((prev) => new Set(prev).add(category));
          });
      }
    }
  }, [categoriesKey, holdings.fungibles, resolveIdentity]);

  // The holdings index sums the token amount riding in NFT
  // UTXOs into the category total, so a pure-NFT category shows
  // up here with a zero fungible amount. It is not a portfolio
  // asset row; its NFTs speak through the NFT count instead.
  const assetFungibles = holdings.fungibles.filter(
    (fungible) => fungible.totalAmount > 0n,
  );
  const settled = assetFungibles.every((fungible) =>
    Object.prototype.hasOwnProperty.call(prices, fungible.category),
  );
  const model = useMemo<PortfolioModel | null>(() => {
    if (!settled) return null;
    return buildPortfolio({
      bchSats: holdings.bchSats,
      fungibles: assetFungibles.map((fungible) => {
        const identity = identities[fungible.category] ?? null;
        return {
          category: fungible.category,
          label:
            identity !== null
              ? `${identity.name} (${identity.symbol})`
              : shortenMiddle(fungible.category, 6),
          amountBase: fungible.totalAmount,
          decimals: identity?.decimals ?? 0,
        };
      }),
      nftCount: holdings.nfts.length,
      prices: new Map(
        holdings.fungibles.map((fungible) => [
          fungible.category,
          prices[fungible.category] ?? null,
        ]),
      ),
      bchUsd,
    });
  }, [settled, holdings, identities, prices, bchUsd]);

  const usdFormat = latinNumberFormat({
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const percentFormat = latinNumberFormat({
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const symbolOf = (category: string | null): string =>
    category === null ? "" : (identities[category]?.symbol ?? "");
  const isEmpty =
    holdings.bchSats === 0n &&
    holdings.fungibles.length === 0 &&
    holdings.nfts.length === 0;

  return (
    <section className="portfolio-card" aria-label={t.portfolioTitle}>
      <h2>{t.portfolioTitle}</h2>
      {isEmpty ? (
        <p className="balance-hint">{t.holdingsEmpty}</p>
      ) : model === null || !rateSettled ? (
        <div
          className="portfolio-skeleton"
          role="status"
          aria-busy="true"
          aria-label={t.liveFetching}
        >
          <div className="portfolio-skeleton-ring" aria-hidden="true" />
          <div aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="portfolio-skeleton-row" key={i}>
                <span className="portfolio-skeleton-chip" />
                <span className="portfolio-skeleton-lines">
                  <span className="portfolio-skeleton-line" />
                  <span className="portfolio-skeleton-line portfolio-skeleton-line-short" />
                </span>
                <span className="portfolio-skeleton-side" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <PortfolioRing
            model={model}
            centreLabel={t.portfolioTotalLabel}
            centreText={
              model.totalUsd === null
                ? "n/a"
                : usdFormat.format(model.totalUsd)
            }
            centreSub={`${formatBch(model.totalValueSats)} BCH`}
            label={`${t.portfolioTitle}: ${
              model.totalUsd === null
                ? "n/a"
                : usdFormat.format(model.totalUsd)
            }`}
          />
          <ul className="portfolio-rows">
            {model.rows.map((row) => {
              const name =
                row.kind === "other" ? t.portfolioOther : row.label;
              const initial = (
                row.kind === "bch" ? "B" : symbolOf(row.category) || name
              )
                .charAt(0)
                .toUpperCase();
              const amount =
                row.kind === "bch"
                  ? `${formatBch(row.amountBase ?? 0n)} BCH`
                  : row.kind === "token"
                    ? `${formatTokenAmount(row.amountBase ?? 0n, row.decimals)} ${symbolOf(row.category)}`.trim()
                    : row.groupedCategories
                        .map((category) => symbolOf(category))
                        .filter((symbol) => symbol !== "")
                        .join(", ");
              return (
                <li
                  className="portfolio-row"
                  key={`${row.kind}:${row.category ?? ""}`}
                >
                  <span
                    className="portfolio-chip"
                    style={{
                      background: `${row.color}24`,
                      color: row.color,
                    }}
                    aria-hidden="true"
                  >
                    {initial}
                  </span>
                  <span className="portfolio-row-main">
                    <span className="portfolio-name">{name}</span>
                    {amount !== "" && (
                      <span className="portfolio-row-sub">{amount}</span>
                    )}
                  </span>
                  <span className="portfolio-row-side">
                    {row.usdValue !== null && (
                      <span className="portfolio-value">
                        {usdFormat.format(row.usdValue)}
                      </span>
                    )}
                    <span
                      className="portfolio-pill"
                      style={{
                        background: `${row.color}24`,
                        color: row.color,
                      }}
                    >
                      {row.share === null
                        ? "n/a"
                        : `${percentFormat.format(row.share * 100)}%`}
                    </span>
                  </span>
                </li>
              );
            })}
            {model.unpriced.map((holding) => (
              <li
                className="portfolio-row"
                key={`unpriced:${holding.category}`}
              >
                <span
                  className="portfolio-chip portfolio-chip-hollow"
                  aria-hidden="true"
                >
                  {(symbolOf(holding.category) || holding.label)
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <span className="portfolio-row-main">
                  <span className="portfolio-name">{holding.label}</span>
                  <span className="portfolio-row-sub">
                    {`${formatTokenAmount(holding.amountBase, holding.decimals)} ${symbolOf(holding.category)}`.trim()}
                  </span>
                </span>
                <span className="portfolio-row-side">
                  <span className="portfolio-pill portfolio-pill-none">
                    n/a
                  </span>
                </span>
              </li>
            ))}
            {model.nftCount > 0 && (
              <li className="portfolio-row" key="nfts">
                <span
                  className="portfolio-chip portfolio-chip-hollow"
                  aria-hidden="true"
                >
                  <span className="portfolio-chip-gem" />
                </span>
                <span className="portfolio-row-main">
                  <span className="portfolio-name">{t.holdingsNfts}</span>
                </span>
                <span className="portfolio-row-side">
                  <span className="portfolio-value">
                    {latinNumberFormat().format(model.nftCount)}
                  </span>
                </span>
              </li>
            )}
          </ul>
          {priceFailed.size > 0 && (
            <p className="panel-note">{t.portfolioPricesUnavailable}</p>
          )}
          {model.unpriced.length > 0 && (
            <p className="panel-note">{t.portfolioUnpricedNote}</p>
          )}
          {bchUsd !== null && rateSource !== null ? (
            <p className="panel-note">
              {t.portfolioRateNote
                .replace("{rate}", usdFormat.format(bchUsd))
                .replace("{source}", rateSource)}
            </p>
          ) : (
            <p className="panel-note">{t.portfolioRateUnavailable}</p>
          )}
        </>
      )}
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
 * Receive: a modal window on the pairing dialog's overlay system
 * (the .receive-* rules in style.css share the .pairing-*
 * geometry), rendered through a portal to <body>. The portal is
 * load-bearing, not cosmetic: this component mounts under the
 * sticky topbar's subtree, whose backdrop-filter would make it
 * the containing block for a fixed overlay and size the window
 * to the bar instead of the viewport (the R68 field bug).
 *
 * One address only: the token-aware form, which accepts BCH,
 * CashTokens and NFTs alike. The wallet still derives the plain
 * form internally (Send's address-type checks rely on it), but
 * the user cut it from this window on 2026-11-14: two addresses
 * read as a choice, and the wrong pick loses a token deposit.
 * The QR encodes the token address, never a shortened form.
 *
 * Close paths mirror the pairing dialog: the small × at the
 * card's top right, a backdrop click, and Escape (this window
 * listens for its own Escape; App's panel state has no key
 * handling) all play the short exit before unmounting. Tab
 * cycles inside via the core's trapTabIndex, focus starts on
 * the ×, and closing returns focus to the Receive tile.
 */
export function ReceivePanel({
  t,
  session,
  onClose,
}: {
  t: UiStrings;
  session: WalletSession;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      onClose();
      document.getElementById("wallet-tile-receive")?.focus();
    }, 190);
  };
  // requestClose is rebuilt per render; the Escape listener
  // reads the latest through a ref so it never goes stale.
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);
  // Focus starts on the × button: it is inside the trap set,
  // and preventScroll keeps the overlay from jumping on short
  // viewports, where the card can be taller than the overlay's
  // visible band.
  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  // The dialog declares aria-modal, so Tab cycles inside it,
  // exactly as in the pairing dialog: the boundary ruling is
  // the core's trapTabIndex, this handler only reads the live
  // focusable set and the live focus.
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

  const tokenAddress = session.tokenAddress;
  return createPortal(
    <div
      className={closing ? "receive-overlay closing" : "receive-overlay"}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        className={closing ? "receive-card closing" : "receive-card"}
        role="dialog"
        aria-modal="true"
        aria-label={t.actionReceive}
        ref={cardRef}
        onKeyDown={trapTab}
      >
        <button
          type="button"
          className="receive-close"
          ref={closeButtonRef}
          onClick={requestClose}
          aria-label={t.dialogClose}
        >
          <DismissIcon />
        </button>
        {!session.connected ? (
          <p>{t.walletDisconnectedHint}</p>
        ) : tokenAddress === null ? (
          <p>{t.walletAddressMissing}</p>
        ) : (
          <>
            <h2>{t.receiveAddressLabel}</h2>
            <p className="panel-note">{t.receiveTokenNote}</p>
            <AddressQr value={tokenAddress} caption={t.receiveQrCaption} />
            <p className="mono panel-address">{tokenAddress}</p>
            <div className="panel-actions">
              <CopyAddressButton
                t={t}
                address={tokenAddress}
                label={t.copyAddress}
              />
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * The receipt's confirmation chip. The colour crossfade is the
 * chip class's own transition; the settle tint (P10) is added
 * only when THIS row's status changes from broadcast to
 * confirmed while the panel is open — a real status change
 * observed by the refresh, never a first render: the previous
 * state is seeded from the first props the row receives, so a
 * receipt that was already confirmed when the panel opened
 * shows its green chip plainly, with no tint.
 */
function HistoryStatusChip({
  t,
  status,
}: {
  t: UiStrings;
  status: HistoryEntry["status"];
}) {
  const confirmed = status.state === "confirmed";
  const wasConfirmed = useRef(confirmed);
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    const changed = confirmed && !wasConfirmed.current;
    wasConfirmed.current = confirmed;
    if (!changed) return;
    setSettling(true);
    const timer = window.setTimeout(() => setSettling(false), 650);
    return () => window.clearTimeout(timer);
  }, [confirmed]);
  if (!confirmed) {
    return <span className="chip">{t.receiptStatusBroadcast}</span>;
  }
  return (
    <span
      className={settling ? "chip chip-settle" : "chip"}
      data-status="pass"
    >
      {t.receiptStatusConfirmedCount.replace(
        "{count}",
        String(status.confirmations),
      )}
    </span>
  );
}

/**
 * History: the receipts this browser recorded, newest first, from
 * the history store, each joined with its confirmation status. A
 * receipt is the record of a broadcast send: asset, amount,
 * recipient, fee and the explorer link. The status chip starts at
 * Broadcast and moves to Confirmed with its count once App's
 * refresh (which runs while this panel is open) has seen the
 * transaction in a block; a reopen shows the last known status
 * immediately, from the persisted store. A store that failed to
 * load says so above the (empty) list instead of pretending
 * nothing ever happened. The list renders through the list
 * window (R63): past the window size the remaining receipts
 * fold behind a show-all control, so a long history cannot
 * grow the DOM without bound.
 */
export function HistoryPanel({
  t,
  lang,
  entries,
  loadFailed,
  saveFailed,
}: {
  t: UiStrings;
  lang: Lang;
  entries: HistoryEntry[];
  loadFailed: boolean;
  saveFailed: boolean;
}) {
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);
  const [failedTxid, setFailedTxid] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const windowed = listWindow(entries, expanded);
  const copyTxid = async (txid: string) => {
    try {
      await navigator.clipboard.writeText(txid);
      setCopiedTxid(txid);
      setFailedTxid(null);
      setTimeout(() => setCopiedTxid(null), 2000);
    } catch {
      // A failed copy is announced in words, like every other
      // copy control in the app; the txid stays visible in the
      // row either way.
      setFailedTxid(txid);
      setTimeout(() => setFailedTxid(null), 3000);
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
      {saveFailed && (
        <p className="panel-note" role="note">
          {t.historySaveFailed}
        </p>
      )}
      {entries.length === 0 ? (
        <p>{t.historyEmpty}</p>
      ) : (
        windowed.shown.map(({ receipt, status }, index) => (
          <article
            className={
              index >= LIST_WINDOW_SIZE
                ? "history-row fold-in"
                : "history-row"
            }
            style={
              index >= LIST_WINDOW_SIZE
                ? ({
                    "--fold-i": Math.min(index - LIST_WINDOW_SIZE, 8),
                  } as CSSProperties)
                : undefined
            }
            key={receipt.txid}
          >
            <div className="history-main">
              <span className="history-asset">{receipt.assetLabel}</span>
              {receipt.kind !== "anchor" && (
                <span className="history-amount">{receipt.amountText}</span>
              )}
              <HistoryStatusChip t={t} status={status} />
            </div>
            <p className="mono history-recipient" title={receipt.recipient}>
              {shortenMiddle(receipt.recipient, 14)}
            </p>
            <p className="history-meta">
              {latinDateTimeFormat(languageOption(lang).locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(receipt.sentAtIso))}{" "}
              · {receipt.kind === "anchor" ? t.historyAnchored : t.historySent}
            </p>
            <div className="panel-actions">
              <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                {t.receiptExplorer}
              </a>
              <button type="button" onClick={() => void copyTxid(receipt.txid)}>
                {copiedTxid === receipt.txid ? t.copied : t.copyTxid}
              </button>
              {failedTxid === receipt.txid && (
                <span className="action-status" role="status">
                  {t.copyFailed}
                </span>
              )}
            </div>
          </article>
        ))
      )}
      {windowed.hiddenCount > 0 && (
        <div className="panel-actions">
          <button
            type="button"
            aria-expanded={false}
            onClick={() => setExpanded(true)}
          >
            {t.historyShowAll.replace("{count}", String(windowed.total))}
          </button>
        </div>
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
 *
 * The picker's two token sections render through the list
 * window (R63): past the window size the remaining assets fold
 * behind a show-all row, so an NFT-heavy wallet cannot bury
 * the panel under thousands of buttons. Selection is state,
 * not rendering: expanding or folding never changes which
 * asset is picked.
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
  fiatRate,
  onSent,
  onSendFailed,
}: {
  t: UiStrings;
  lang: Lang;
  session: WalletSession;
  electrum: ElectrumSession;
  utxoPhase: UtxoPhase;
  utxos: SpendableUtxo[];
  holdings: WalletHoldings | null;
  resolveIdentity: (category: string) => Promise<TokenIdentity | null>;
  /** The caller's live BCH/USD quote in send-flow's labelled
   *  shape (R83), or null when every rate source failed: the
   *  confirmation sheet then shows the fee in BCH alone. */
  fiatRate: FiatRate | null;
  onSent: (receipt: Receipt) => void;
  /** The toast layer's failure feed (R51): called with the
   *  exact string the confirm sheet is about to show, so the
   *  pop-up and the panel can never disagree about what went
   *  wrong. */
  onSendFailed: (reason: ToastFailureReason, message: string) => void;
}) {
  const [selection, setSelection] = useState<AssetSelection>({ kind: "bch" });
  const [recipient, setRecipient] = useState("");
  const [amountText, setAmountText] = useState("");
  const [phase, setPhase] = useState<SendPhase>("form");
  const [sendError, setSendError] = useState<string | null>(null);
  const [identities, setIdentities] = useState<
    Record<string, TokenIdentity | null>
  >({});
  const identityAsked = useRef(new Set<string>());
  const [fungiblesExpanded, setFungiblesExpanded] = useState(false);
  const [nftsExpanded, setNftsExpanded] = useState(false);

  // A phase swap unmounts the control that caused it (the
  // review button going into the sheet, the confirm button
  // coming back, disabled while signing), so the browser drops
  // focus to the document body and a keyboard user restarts
  // tabbing from the page top. The core rules the landing
  // (focus-nav): the incoming phase's heading takes focus on
  // every real transition.
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const confirmTitleRef = useRef<HTMLHeadingElement>(null);
  const phaseBefore = useRef<SendPhase>("form");
  useEffect(() => {
    const target = phaseFocusTarget(phaseBefore.current, phase);
    phaseBefore.current = phase;
    if (target === "confirm-heading") confirmTitleRef.current?.focus();
    if (target === "panel-heading") panelTitleRef.current?.focus();
  }, [phase]);

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
  if (session.addressMissing) {
    return (
      <section className="panel" aria-label={t.actionSend}>
        <p>{t.walletAddressMissing}</p>
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
        : `${amount === null ? amountText : formatTokenAmount(amount, decimals)} ${identity?.symbol ?? ""}`.trim();
  const balanceAfter =
    selection.kind === "bch" && amount !== null && template !== null
      ? `${formatBch(available - amount - template.feeSats)} BCH`
      : selection.kind === "fungible" && amount !== null
        ? `${formatTokenAmount(available - amount, decimals)} ${identity?.symbol ?? ""}`.trim()
        : null;

  // Every keypad press routes through applyAmountKey with the
  // selected asset's decimals, editing the same amountText the
  // input edits — the two entry paths can never diverge.
  const pressKey = (key: string) => {
    setAmountText((text) => applyAmountKey(text, key, decimals));
  };

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
        const message =
          error.code === "WALLET_REFUSED"
            ? t.signRejected
            : error.code === "TAMPERED"
              ? t.sendTampered
              : error.code === "BROADCAST_FAILED"
                ? t.sendBroadcastFailed
                : t.sendMalformed;
        setSendError(message);
        onSendFailed(failureReasonForCode(error.code), message);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        setSendError(message);
        onSendFailed("other", message);
      }
    }
  };

  const percentLabel = (kind: 25 | 50 | 75) =>
    latinNumberFormat({
      style: "percent",
      maximumFractionDigits: 0,
    }).format(kind / 100);
  // The fee's fiat rendering (R83): feePreview prices the fee
  // only when a rate is passed, so with no live quote the sheet
  // shows the BCH figure alone — the suffix is empty, never a
  // stale or invented dollar figure.
  const feeFiatSuffix = (feeSats: bigint): string => {
    if (fiatRate === null) return "";
    const fiat = feePreview(feeSats, fiatRate).feeFiat;
    if (fiat === undefined) return "";
    const usd = latinNumberFormat({
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(fiat.amountText));
    return ` ≈ ${usd}`;
  };
  const walletEmpty =
    holdings.bchSats === 0n &&
    holdings.fungibles.length === 0 &&
    holdings.nfts.length === 0;
  const fungibleWindow = listWindow(holdings.fungibles, fungiblesExpanded);
  const nftWindow = listWindow(holdings.nfts, nftsExpanded);

  return (
    <section className="panel" aria-label={t.actionSend}>
      <h2 ref={panelTitleRef} tabIndex={-1}>
        {t.sendTitle}
      </h2>
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
            {fungibleWindow.shown.map((holding, index) => {
              const held = identities[holding.category] ?? null;
              const selected =
                selection.kind === "fungible" &&
                selection.category === holding.category;
              return (
                <button
                  key={holding.category}
                  type="button"
                  className={
                    index >= LIST_WINDOW_SIZE
                      ? "asset-row fold-in"
                      : "asset-row"
                  }
                  style={
                    index >= LIST_WINDOW_SIZE
                      ? ({
                          "--fold-i": Math.min(index - LIST_WINDOW_SIZE, 8),
                        } as CSSProperties)
                      : undefined
                  }
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
                    )}{" "}
                    {held?.symbol ?? ""}
                  </span>
                </button>
              );
            })}
            {fungibleWindow.hiddenCount > 0 && (
              <button
                type="button"
                className="asset-row asset-more"
                aria-expanded={false}
                onClick={() => setFungiblesExpanded(true)}
              >
                <span className="asset-name">
                  {t.assetShowAll.replace(
                    "{count}",
                    String(fungibleWindow.total),
                  )}
                </span>
              </button>
            )}
            {nftWindow.shown.map((nft, index) => {
              const held = identities[nft.category] ?? null;
              const selected =
                selection.kind === "nft" &&
                selection.category === nft.category &&
                selection.commitment === nft.commitment;
              return (
                <button
                  key={`${nft.category}:${nft.commitment}`}
                  type="button"
                  className={
                    index >= LIST_WINDOW_SIZE
                      ? "asset-row fold-in"
                      : "asset-row"
                  }
                  style={
                    index >= LIST_WINDOW_SIZE
                      ? ({
                          "--fold-i": Math.min(index - LIST_WINDOW_SIZE, 8),
                        } as CSSProperties)
                      : undefined
                  }
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
            {nftWindow.hiddenCount > 0 && (
              <button
                type="button"
                className="asset-row asset-more"
                aria-expanded={false}
                onClick={() => setNftsExpanded(true)}
              >
                <span className="asset-name">
                  {t.assetShowAll.replace("{count}", String(nftWindow.total))}
                </span>
              </button>
            )}
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
              <div className="keypad" role="group" aria-label={t.sendAmount}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                  (digit) => (
                    <button
                      key={digit}
                      type="button"
                      aria-label={digit}
                      onClick={() => pressKey(digit)}
                    >
                      {digit}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  aria-label="."
                  onClick={() => pressKey(".")}
                >
                  .
                </button>
                <button
                  type="button"
                  aria-label="0"
                  onClick={() => pressKey("0")}
                >
                  0
                </button>
                <button
                  type="button"
                  aria-label={t.sendKeypadBackspace}
                  onClick={() => pressKey("backspace")}
                >
                  ⌫
                </button>
              </div>
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
          <h3 ref={confirmTitleRef} tabIndex={-1}>
            {t.confirmTitle}
          </h3>
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
                  ? `${formatBch(feePreview(template.feeSats).feeSats)} BCH${feeFiatSuffix(template.feeSats)}`
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
