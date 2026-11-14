import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  concentrationReport,
  type ConcentrationReport,
  type GiniTier,
} from "./core/concentration";
import {
  fetchLivePoolFacts,
  normalizeCategory,
} from "./core/cauldron-live";
import {
  fetchTokenStorkCandidates,
  resolveIdentity,
} from "./core/identity";
import { runLiveAuditReads } from "./core/live-audit";
import { fetchRouteQuote } from "./core/router-quote";
import { type LiveReportInput } from "./core/live-report";
import { classifyLookup } from "./core/lookup";
import { judgePool, type FlagCode, type PoolJudgement } from "./core/poolproof-core";
import { exitGaugeModel, poolShareModel, scalePercent } from "./core/gauge";
import {
  buildAnchorTxTemplateForWallet,
  estimateAnchorFeeSats,
  minimumAnchorFundingSats,
  selectAnchorFundingUtxo,
} from "./core/anchor-tx";
import {
  SignFlowError,
  executeAnchorSignFlow,
} from "./core/sign-flow";
import { hexToBin } from "@bitauth/libauth";
import {
  createElectrumSession,
  type ElectrumSession,
} from "./core/electrum-wss";
import { HistoryStore, HistoryStoreError } from "./core/history-store";
import type { HistoryEntry } from "./core/history-store";
import { fetchConfirmationUpdates } from "./core/history-status";
import type { Receipt } from "./core/send-flow";
import type { SpendableUtxo } from "./core/transfer-tx";
import {
  fetchAddressUtxos,
  indexWalletHoldings,
  parseListunspent,
  scripthashForAddress,
  type WalletHoldings,
} from "./core/wallet-utxos";
import {
  confirmationFlips,
  diffReceivedUtxos,
  dismissToast,
  emptyToastQueue,
  failureReasonForCode,
  pushToast,
  type ToastEvent,
  type ToastFailureReason,
  type ToastQueueState,
  type WatchedUtxo,
} from "./core/toast";
import { ToastLayer } from "./Toasts";
import {
  formatBch,
  formatBchShort,
  formatTokenAmount,
  latinDateTimeFormat,
  latinNumberFormat,
  shortenHash,
} from "./format";
import {
  HistoryPanel,
  ReceivePanel,
  SendPanel,
  TopBanner,
  WalletCard,
  type HomePanel,
  type UtxoPhase,
} from "./WalletHome";
import {
  DISCONNECTED_SESSION,
  type WalletSession,
} from "./wallet-session";
import { CheckIcon, CopyIcon, DownloadIcon, LinkIcon } from "./icons";
import { SNAPSHOTS, type TokenSnapshot } from "./data/snapshots";
import {
  ENGLISH_PACK,
  LANGUAGE_OPTIONS,
  isLang,
  languageOption,
  loadLanguagePack,
  type Lang,
  type LanguagePack,
  type UiStrings,
} from "./i18n";
// The WizardConnect stack (relay + crypto) is ~800 kB, heavier than
// the whole report. Lazy-load it like the anchor module (R5): the
// topbar paints a same-shaped disabled button instantly and swaps in
// the live control when the chunk lands.
const WalletConnect = lazy(() => import("./WalletConnect"));

// A lazy chunk that fails (slow network, dead tunnel) must surface as
// words, never as a silently dead button. The 2026-11-13 tunnel test
// sat on the disabled fallback for 15 s with no clue why. This
// boundary renders the localised failure line; the Suspense fallback
// below it renders the localised loading line.
class LazyBoundary extends Component<
  { label: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="wallet">
          <span className="wallet-error" role="alert">
            {this.props.label}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

// The wallet home state lives in App: the WizardConnect session
// (reported up by the lazy WalletConnect chunk), one Electrum
// session shared by the balance read, the send panel and the
// broadcast, the indexed holdings, and the send receipts persisted
// in this browser's history store.
const HISTORY_STORAGE_KEY = "poolproof-history-v1";

const historyStorageAdapter = {
  read(): string | null {
    try {
      return window.localStorage.getItem(HISTORY_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(serialized: string): void {
    // No swallow here: a failed write (private mode, a full
    // quota) must reach the caller. HistoryStore.save()
    // propagates it, and App's persistHistory turns it into
    // the save-failed note in the History panel. A receipt
    // that will not survive a reload is never silently
    // presented as saved.
    window.localStorage.setItem(HISTORY_STORAGE_KEY, serialized);
  },
};

function loadHistoryStore(): { store: HistoryStore; loadFailed: boolean } {
  try {
    return { store: HistoryStore.load(historyStorageAdapter), loadFailed: false };
  } catch (error) {
    if (!(error instanceof HistoryStoreError)) throw error;
    // Explicit recovery only: a corrupt store is reported via the
    // loadFailed flag and starts empty, never silently merged.
    try {
      return {
        store: HistoryStore.load(historyStorageAdapter, {
          onCorrupt: "start-empty",
        }),
        loadFailed: true,
      };
    } catch {
      // The fallback store stays bound to the adapter: an
      // adapter-less store refuses every save(), so an
      // unbound fallback would make the NEXT successful send
      // throw inside its own bookkeeping.
      return {
        store: new HistoryStore(historyStorageAdapter),
        loadFailed: true,
      };
    }
  }
}

// Fiat is orientation only (the verdict is computed in BCH). It is
// shown solely where the snapshot carries labelled reference rates;
// a snapshot without rates gets no fiat figure at all.
// Currency is USD only (user order 2026-11-14, R49): the
// selector is gone and every fiat figure is a USD figure.
function fiatText(sats: bigint, snapshot: TokenSnapshot): string | null {
  if (!snapshot.fiat) return null;
  const usd = (Number(sats) / 1e8) * snapshot.fiat.bchUsd;
  return latinNumberFormat({
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

function withFiat(
  bchText: string,
  sats: bigint,
  snapshot: TokenSnapshot,
): string {
  const fiat = fiatText(sats, snapshot);
  return fiat === null ? bchText : `${bchText} ≈ ${fiat}`;
}

function simulatedExitText(
  judgement: PoolJudgement,
  t: UiStrings,
): string {
  if (judgement.simulatedOutSats !== null) {
    const spot =
      judgement.spotOutSats === null
        ? "n/a"
        : formatBchShort(BigInt(Math.round(judgement.spotOutSats)));
    return t.exitOfSpot
      .replace("{out}", formatBchShort(judgement.simulatedOutSats))
      .replace("{spot}", spot);
  }
  // No simulation ran, for two different reasons that must not share
  // one label: spot was never computed (reserves alone decided the
  // verdict), or the route quote failed while reserves exist.
  return judgement.spotOutSats === null
    ? t.exitNotSimulated
    : t.exitRouteFailed;
}

function EvidenceRows({
  snapshot,
  judgement,
  t,
  lang,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
  lang: Lang;
}) {
  const { facts } = snapshot;
  const simOut = judgement.simulatedOutSats;
  const exitValue =
    simOut === null
      ? simulatedExitText(judgement, t)
      : simulatedExitText(judgement, t).replace(formatBchShort(simOut), (out) => {
          // The fiat figure belongs to the simulated out, so it sits
          // directly behind that number, not at the end of the
          // sentence, where it would read as the spot value's.
          const fiat = fiatText(simOut, snapshot);
          return fiat === null ? out : `${out} (≈ ${fiat})`;
        });
  const spotText =
    judgement.spotOutSats === null
      ? "n/a"
      : formatBchShort(BigInt(Math.round(judgement.spotOutSats)));
  const modelName =
    judgement.simulationModel === "router-quote"
      ? t.exitModelRouterQuote
      : judgement.simulationModel === "routed-cpmm"
        ? t.exitModelRoutedCpmm
        : t.exitModelAggregateCpmm;
  const rows: Array<[string, string]> = [
    [
      t.pools,
      snapshot.poolCount === null
        ? "n/a"
        : latinNumberFormat().format(snapshot.poolCount),
    ],
    [
      t.bchReserve,
      withFiat(
        `${formatBchShort(facts.reserveQuoteSats)} BCH`,
        facts.reserveQuoteSats,
        snapshot,
      ),
    ],
    [
      t.tokenReserve.replace("{symbol}", snapshot.symbol),
      `${formatTokenAmount(facts.reserveTokenRaw, snapshot.decimals)} ${snapshot.symbol}`,
    ],
    [
      t.referenceSell,
      `${formatTokenAmount(judgement.referenceSellRaw, snapshot.decimals)} ` +
        `${snapshot.symbol} ${t.referenceSellCap}`,
    ],
    [t.simulatedExit, exitValue],
    // The cross-check (R48): when the headline figure is the
    // Router's own quote, our routed simulation stays on screen
    // beside it: a quote is never presented without the figure
    // it was checked against.
    ...(judgement.simulationModel === "router-quote" &&
    judgement.routedSimulatedOutSats !== null
      ? [
          [
            t.routedCrossCheck,
            t.exitOfSpot
              .replace(
                "{out}",
                formatBchShort(judgement.routedSimulatedOutSats),
              )
              .replace("{spot}", spotText),
          ] as [string, string],
        ]
      : []),
    [
      t.exitRatio,
      judgement.exitRatio === null
        ? "n/a"
        : latinNumberFormat({
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          }).format(judgement.exitRatio),
    ],
    // The model behind the headline figure, named in words
    // (R48): a figure without its model is a displayed number
    // dressed as a measurement. Model "none" adds no row: the
    // exit row already says in words that nothing was simulated.
    ...(judgement.simulationModel !== "none"
      ? [[t.exitModel, modelName] as [string, string]]
      : []),
  ];
  return (
    <table className="evidence">
      <tbody>
        {rows.map(([term, value]) => (
          <tr key={term}>
            <th scope="row">{term}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// The headline figures as a stat strip (R76): the report's four
// load-bearing numbers, lifted out of the exit group's rows into
// a band under the verdict head. Every cell reads the same field
// through the same formatter as its EvidenceRows counterpart, so
// the strip is a view of the rows, never a second measurement:
// the exit ratio from judgement.exitRatio, the reserve from
// facts.reserveQuoteSats, the pool count from snapshot.poolCount,
// and the exit figure from judgement.simulatedOutSats (the
// reference sell stands in under its own row's label when no
// exit was simulated).
function StatStrip({
  snapshot,
  judgement,
  t,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
}) {
  const { facts } = snapshot;
  const exitCell: [string, string] =
    judgement.simulatedOutSats !== null
      ? [
          t.simulatedExit,
          `${formatBchShort(judgement.simulatedOutSats)} BCH`,
        ]
      : [
          t.referenceSell,
          `${formatTokenAmount(judgement.referenceSellRaw, snapshot.decimals)} ${snapshot.symbol}`,
        ];
  const cells: Array<[string, string]> = [
    [
      t.exitRatio,
      judgement.exitRatio === null
        ? "n/a"
        : latinNumberFormat({
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          }).format(judgement.exitRatio),
    ],
    [t.bchReserve, `${formatBchShort(facts.reserveQuoteSats)} BCH`],
    [
      t.pools,
      snapshot.poolCount === null
        ? "n/a"
        : latinNumberFormat().format(snapshot.poolCount),
    ],
    exitCell,
  ];
  return (
    <div className="stat-strip">
      {cells.map(([label, value]) => (
        <div className="stat-cell" key={label}>
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

function FlagsList({
  judgement,
  t,
  flagTemplates,
}: {
  judgement: PoolJudgement;
  t: UiStrings;
  flagTemplates: Record<FlagCode, string>;
}) {
  if (judgement.flagDetails.length === 0) return null;
  return (
    <ul className="flags">
      {judgement.flagDetails.map((flag) => {
        // The core reports locale-neutral codes + values; the UI
        // renders its own language's template around them.
        const text = Object.entries(flag.values).reduce(
          (acc, [key, value]) => acc.replace(`{${key}}`, value),
          flagTemplates[flag.code],
        );
        return <li key={flag.code}>{text}</li>;
      })}
    </ul>
  );
}

// Icon-only report actions: white glyphs on solid scarlet.
// The glyphs themselves live in src/icons.tsx, the app's one
// icon system (R50): one stroke spec, path-only geometry. The
// words live on as each button's aria-label and title; a
// successful copy swaps the glyph for a check, the feedback the
// old "Copied" text swap used to give.

// The copy confirmation crossfade (P10): both glyphs stay
// mounted, stacked, and the copied state crossfades between
// them (opacity plus a small settle rotation in the CSS)
// instead of swapping one for the other in a single frame.
function CopyGlyphs({
  copied,
  icon = "copy",
}: {
  copied: boolean;
  icon?: "copy" | "link";
}) {
  return (
    <span className="glyph-stack" aria-hidden="true">
      <span className={copied ? "glyph glyph-hide" : "glyph glyph-show"}>
        {icon === "link" ? <LinkIcon /> : <CopyIcon />}
      </span>
      <span className={copied ? "glyph glyph-show" : "glyph glyph-hide"}>
        <CheckIcon />
      </span>
    </span>
  );
}

/** The report record as ONE canonical text. The download writes
 *  exactly this string and the proof anchor hashes exactly this
 *  string, so the file a user downloads is the artifact the
 *  anchored hash commits to: re-hash the downloaded file and the
 *  digest must equal the report hash on screen and in the
 *  OP_RETURN output. Two serializations of "the report" (this
 *  one for the file, a shorter summary for the anchor) would
 *  make the anchored hash unverifiable from the file, which is
 *  the one thing a proof anchor must never be. */
function buildReportJson(
  snapshot: TokenSnapshot,
  judgement: PoolJudgement,
): string {
  const conc = snapshotConcentrationReport(snapshot);
  const report = {
    token: snapshot.name,
    symbol: snapshot.symbol,
    category: snapshot.category,
    decimals: snapshot.decimals,
    verdict: judgement.verdict,
    exitRatio: judgement.exitRatio,
    // The simulation record (R48): which model produced the
    // headline figure, and every figure that was computed,
    // so the JSON names its own provenance like the screen
    // does. routeQuoteSats is the Router's answer when one
    // landed; null means no quote is behind this report.
    simulationModel: judgement.simulationModel,
    simulatedOutSats:
      judgement.simulatedOutSats === null
        ? null
        : judgement.simulatedOutSats.toString(),
    routedSimulatedOutSats:
      judgement.routedSimulatedOutSats === null
        ? null
        : judgement.routedSimulatedOutSats.toString(),
    aggregateSimulatedOutSats:
      judgement.aggregateSimulatedOutSats === null
        ? null
        : judgement.aggregateSimulatedOutSats.toString(),
    routeQuoteSats:
      snapshot.facts.routeQuoteSats === undefined ||
      snapshot.facts.routeQuoteSats === null
        ? null
        : snapshot.facts.routeQuoteSats.toString(),
    reserveQuoteSats: snapshot.facts.reserveQuoteSats.toString(),
    reserveTokenRaw: snapshot.facts.reserveTokenRaw.toString(),
    totalSupplyRaw: snapshot.facts.totalSupplyRaw.toString(),
    supplyIsStandIn: snapshot.supplyIsStandIn ?? false,
    flags: judgement.flags,
    // Full precision, locale-neutral: the JSON is the record,
    // the on-screen figures are its rounded rendering.
    concentration:
      conc === null
        ? null
        : {
            basis: conc.basis,
            listedCount: conc.listedCount,
            totalHolderCount: conc.totalHolderCount,
            gini: conc.gini,
            tier: conc.tier,
            top1ShareOfListed: conc.top1ShareOfListed,
            top10ShareOfListed: conc.top10ShareOfListed,
            hhi: conc.hhi,
            top1ShareOfSupply: conc.top1ShareOfSupply,
          },
  };
  return JSON.stringify(report, null, 2);
}

// DETAIL TERKUNCI (9b) actions: copy the category, copy a shareable
// link (the snapshot travels in the URL), download the report as
// JSON. Present in both views: a feature that exists in only one
// direction is a feature half the judges never see.
function ReportActions({
  snapshot,
  judgement,
  t,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // Every action answers in words next to the buttons, success AND
  // failure. A silent failure (clipboard denied, download blocked)
  // leaves the user guessing whether anything happened at all.
  const [status, setStatus] = useState<
    "copy-failed" | "downloaded" | "download-failed" | null
  >(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashStatus = (next: typeof status, ms: number) => {
    if (statusTimer.current !== null) clearTimeout(statusTimer.current);
    setStatus(next);
    statusTimer.current = setTimeout(() => setStatus(null), ms);
  };
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      if (statusTimer.current !== null) clearTimeout(statusTimer.current);
      setStatus(null);
    } catch {
      // Clipboard unavailable (permissions): say so, never fake a
      // "copied" state. The value stays visible on the page to copy
      // by hand, and the status line says exactly that.
      flashStatus("copy-failed", 3000);
    }
  };
  const shareUrl = () => {
    const url = new URL(window.location.href);
    if (snapshot.id.startsWith("live-")) {
      // A live result is named by its category (?cat=), not by a
      // snapshot id the loader would not find: a link that lands
      // on the default snapshot instead would be a silent lie.
      url.searchParams.delete("snap");
      url.searchParams.set("cat", snapshot.category);
    } else {
      url.searchParams.set("snap", snapshot.id);
    }
    return url.toString();
  };
  const download = () => {
    try {
      // The canonical report text (see buildReportJson): the
      // file IS the artifact the proof anchor hashes.
      const blob = new Blob([buildReportJson(snapshot, judgement)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `poolproof-${snapshot.symbol.toLowerCase()}-report.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      flashStatus("downloaded", 2500);
    } catch {
      flashStatus("download-failed", 3000);
    }
  };
  return (
    <div className="actions">
      <button
        type="button"
        className="icon-btn"
        aria-label={t.copyCategory}
        title={t.copyCategory}
        onClick={() => void copy("category", snapshot.category)}
      >
        <CopyGlyphs copied={copiedKey === "category"} />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label={t.copyLink}
        title={t.copyLink}
        onClick={() => void copy("link", shareUrl())}
      >
        <CopyGlyphs copied={copiedKey === "link"} icon="link" />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label={t.downloadJson}
        title={t.downloadJson}
        onClick={download}
      >
        <DownloadIcon />
      </button>
      {status !== null && (
        <span className="action-status" role="status">
          {status === "copy-failed"
            ? t.copyFailed
            : status === "downloaded"
              ? t.downloaded
              : t.downloadFailed}
        </span>
      )}
    </div>
  );
}

type ScanStatus = "pass" | "warn" | "fail" | "unknown";

function StatusChip({ status, t }: { status: ScanStatus; t: UiStrings }) {
  const label =
    status === "pass"
      ? t.statusPass
      : status === "warn"
        ? t.statusWarn
        : status === "fail"
          ? t.statusFail
          : t.statusUnknown;
  // The word is the signal; colour only reinforces it (ui-ux-pro-max:
  // never convey status by colour alone).
  return (
    <span className="chip" data-status={status}>
      {label}
    </span>
  );
}

function ScanGroup({
  title,
  status,
  t,
  wide,
  index,
  children,
}: {
  title: string;
  status: ScanStatus;
  t: UiStrings;
  wide?: boolean;
  /** Position in the report's reveal stagger (P6): the CSS
   *  multiplies it by the stagger step. Never above 5. */
  index: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className={wide ? "scan-group span-2" : "scan-group"}
      style={{ "--i": index } as CSSProperties}
    >
      <div className="scan-group-head">
        <h3>{title}</h3>
        <StatusChip status={status} t={t} />
      </div>
      {children}
    </section>
  );
}

// Holder concentration (R35): the R32 module, computed at render
// time from the snapshot's captured holder list (R26 fixtures).
// A snapshot without captured holders returns null here and its
// group keeps the honest unknown note, never a silent pass.
function snapshotConcentrationReport(
  snapshot: TokenSnapshot,
): ConcentrationReport | null {
  if (!snapshot.concentration) return null;
  const { holders, totalHolderCount, supplyRaw, supplyIsSentinel } =
    snapshot.concentration;
  return concentrationReport(holders, {
    totalHolderCount,
    supply: supplyRaw,
    supplyIsSentinel,
  });
}

// Live audit (R38): the R13 pipeline finally gets its front door.
// idle shows the selected snapshot; fetching replaces the report
// with the loading line; failed shows the error with a retry of the
// same category; done renders the live result as a snapshot.
// not-found (R44) is its own phase, not a done input: a category no
// source attests is a lookup miss, and a miss must never be dressed
// as a report (see core/lookup.ts).
type LiveState =
  | { phase: "idle" }
  | { phase: "fetching" }
  | { phase: "failed" }
  | { phase: "not-found"; category: string }
  | { phase: "done"; input: LiveReportInput };

// The audit progress checklist's step states (R50). A step is
// "waiting" until its stage starts, "active" while its real
// read is in flight, and reaches a terminal state only when
// that stage actually resolves: "done", or the honest endings
// "skipped" (the stage never applied, a pool-less audit has no
// exit to simulate and nothing to route), "missing" (the
// identity read settled without a listing) and "unavailable"
// (the Router was asked and did not answer). Nothing here is
// timed: the orchestration's stage signals (core/live-audit.ts)
// are the only writers, besides the submit that starts a run.
type AuditStepState =
  | "waiting"
  | "active"
  | "done"
  | "skipped"
  | "missing"
  | "unavailable";

interface AuditSteps {
  pools: AuditStepState;
  simulate: AuditStepState;
  identity: AuditStepState;
  quote: AuditStepState;
}

// Both reads start together at submit (the orchestration's
// contract), so pools and identity open active; the simulation
// waits on the pool facts it prices, and the quote on both.
const AUDIT_STEPS_START: AuditSteps = {
  pools: "active",
  simulate: "waiting",
  identity: "active",
  quote: "waiting",
};

function AuditStepsCard({ steps, t }: { steps: AuditSteps; t: UiStrings }) {
  const rows: Array<{
    label: string;
    state: AuditStepState;
    word: string | null;
  }> = [
    { label: t.stepPools, state: steps.pools, word: null },
    { label: t.stepSimulate, state: steps.simulate, word: null },
    {
      label: t.stepIdentity,
      state: steps.identity,
      word: steps.identity === "missing" ? t.stepIdentityMissing : null,
    },
    {
      label: t.stepQuote,
      state: steps.quote,
      word: steps.quote === "unavailable" ? t.stepQuoteUnavailable : null,
    },
  ];
  return (
    <div className="scan-group audit-steps">
      <ol className="steps">
        {rows.map((row) => (
          <li
            key={row.label}
            className="step"
            data-state={row.state}
          >
            <span className="step-dot" aria-hidden="true">
              {row.state === "done" && <CheckIcon />}
            </span>
            <span className="step-label">{row.label}</span>
            {(row.word ?? (row.state === "skipped" ? t.stepSkipped : null)) !==
              null && (
              <span className="step-word">
                {row.word ?? t.stepSkipped}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// The honest lookup miss (R44): one plain card. No verdict stamp,
// no group cards, no exit simulation, no anchor offer, no report
// actions: there is no token to judge, so there is nothing to
// dress up. The category is shown shortened with the report
// header's copy discipline (the button copies the FULL id; a
// failed copy says so in words), and the one action returns to
// the category input with the typed ID left in place, because
// the likely fix is correcting a single character of it.
function NotFoundCard({
  category,
  t,
  onCheckAnother,
}: {
  category: string;
  t: UiStrings;
  onCheckAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyCategory = async () => {
    try {
      await navigator.clipboard.writeText(category);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: say so in words, never fake a
      // copied state (the ReportActions rule).
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };
  return (
    <section className="scan-group not-found">
      <h2>{t.notFoundTitle}</h2>
      <p className="not-found-body">{t.notFoundBody}</p>
      <div className="not-found-category">
        <p className="mono category" title={category}>
          {shortenHash(category)}
        </p>
        <button
          type="button"
          className="icon-btn"
          aria-label={t.copyCategory}
          title={t.copyCategory}
          onClick={() => void copyCategory()}
        >
          <CopyGlyphs copied={copied} />
        </button>
        {copyFailed && (
          <span className="action-status" role="status">
            {t.copyFailed}
          </span>
        )}
      </div>
      <p className="scan-note">{t.notFoundHint}</p>
      <button
        type="button"
        className="not-found-action"
        onClick={onCheckAnother}
      >
        {t.notFoundAction}
      </button>
    </section>
  );
}

// A live audit result dressed as a snapshot so BOTH report views
// render it through the exact components the saved snapshots use, and
// one rendering path, no live-only fork. Only what the reads prove
// is real: the category, the pool count, the reserves, and, since
// R40, the identity when TokenStork resolved one for this exact
// category: the real name, symbol and decimals, so amounts render
// in units (PUSD at 2 decimals), not raw base units. When identity
// is null the header says so instead: the name is the pack's
// "unnamed" label, the symbol is the category's own first six hex
// characters, decimals stay 0 so amounts render as the raw base
// units they are, and there is no fiat block and no holder list,
// those absences render as the honest unknown notes, never as
// invented figures. The
// switchLabel/provenance records exist only to satisfy the shared
// snapshot shape: this function re-derives the snapshot from the
// CURRENT pack on every render, so only the current language's
// values are ever read and a language switch re-renders the live
// report like any other.
function liveSnapshot(
  input: LiveReportInput,
  t: UiStrings,
  lang: Lang,
): TokenSnapshot {
  const time = latinDateTimeFormat(languageOption(lang).locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(input.checkedAt);
  const everyLang = (value: string): Record<Lang, string> =>
    Object.fromEntries(
      LANGUAGE_OPTIONS.map((option) => [option.code, value]),
    ) as Record<Lang, string>;
  return {
    id: input.id,
    switchLabel: everyLang(input.identity?.name ?? t.liveUnnamed),
    provenance: everyLang(
      (input.identity ? t.liveProvenanceIdentity : t.liveProvenance).replace(
        "{time}",
        time,
      ),
    ),
    name: input.identity?.name ?? t.liveUnnamed,
    symbol: input.identity?.symbol ?? input.category.slice(0, 6).toUpperCase(),
    category: input.category,
    decimals: input.identity?.decimals ?? 0,
    bcmrHashVerified: false,
    bcmrSource: "none",
    poolCount: input.poolCount,
    supplyIsStandIn: input.supplyIsStandIn,
    facts: input.facts,
  };
}

// Ratios (Gini, HHI) render like the exit ratio: three decimals.
// Shares render as percents, two decimals. Both go through the
// app-wide Latin number format (see format.ts): figures never
// follow the UI locale.
function formatRatio(value: number): string {
  return latinNumberFormat({
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatShare(value: number): string {
  return latinNumberFormat({
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function concentrationTierLabel(tier: GiniTier, t: UiStrings): string {
  switch (tier) {
    case "Well-distributed":
      return t.concTierWellDistributed;
    case "Good":
      return t.concTierGood;
    case "Fair":
      return t.concTierFair;
    case "Poor":
      return t.concTierPoor;
    case "Whale-controlled":
      return t.concTierWhaleControlled;
  }
}

// The group's status word follows the tier: a whale-controlled
// distribution is a failure of distribution, stated as one:
// the word is the signal, colour only reinforces it.
function concentrationStatus(report: ConcentrationReport | null): ScanStatus {
  if (report === null || report.tier === null) return "unknown";
  if (report.tier === "Well-distributed" || report.tier === "Good") {
    return "pass";
  }
  if (report.tier === "Fair") return "warn";
  return "fail";
}

// The exit group's status word follows the verdict, in both
// report views: alive passes, risky warns, everything else fails.
function exitStatusOf(judgement: PoolJudgement): ScanStatus {
  return judgement.verdict === "ALIVE"
    ? "pass"
    : judgement.verdict === "RISKY"
      ? "warn"
      : "fail";
}

// The exit gauge (R50): the report's signature visual, the exit
// truth as two bars on one scale: what the displayed price
// promises for the reference sell, and what the exit actually
// keeps. core/gauge.ts builds the model from the judgement
// itself, so every length and figure here already stands in the
// rows below; the gauge is their rendering, never a second
// measurement. The fill's resting transform IS the exact
// fraction: on a report landing (the section's reveal gate) a
// one-shot grow runs, on an in-place upgrade (identity, Router
// quote) the fill glides by transition to the new exact value
// and never restarts, and under reduced motion it simply rests
// at the value. Verdicts with no honest figure (NO_MARKET, a
// route that could not be simulated) get no gauge at all.
function ExitGauge({
  snapshot,
  judgement,
  t,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
}) {
  const model = exitGaugeModel(judgement, snapshot.facts);
  if (model === null) return null;
  const fractionText = (value: number) =>
    latinNumberFormat({
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value);
  if (model.kind === "ratio") {
    return (
      <div
        className="exit-gauge"
        data-verdict={judgement.verdict}
        role="img"
        aria-label={`${t.exitRatio}: ${fractionText(model.ratio)}`}
      >
        <div className="gauge-row">
          <span className="gauge-label">{t.gaugeReal}</span>
          <span className="gauge-track">
            <span
              className="gauge-fill"
              style={{ "--fill": model.fill } as CSSProperties}
            />
            <span
              className="gauge-tick"
              style={
                { insetInlineStart: `${scalePercent(model.deadLine)}%` } as CSSProperties
              }
            />
            <span
              className="gauge-tick"
              style={
                { insetInlineStart: `${scalePercent(model.aliveLine)}%` } as CSSProperties
              }
            />
          </span>
          <span className="gauge-value">{fractionText(model.ratio)}</span>
        </div>
        <div className="gauge-row gauge-row-displayed">
          <span className="gauge-label">{t.gaugeDisplayed}</span>
          <span className="gauge-track gauge-track-thin">
            <span
              className="gauge-fill gauge-fill-displayed"
              style={{ "--fill": model.displayedFill } as CSSProperties}
            />
          </span>
          <span className="gauge-value">
            {fractionText(model.displayedFill)}
          </span>
        </div>
        <p className="gauge-caption">
          {t.gaugeTickDead} {fractionText(model.deadLine)} · {t.gaugeTickAlive}{" "}
          {fractionText(model.aliveLine)}
        </p>
      </div>
    );
  }
  const satsText = (sats: bigint) =>
    `${latinNumberFormat().format(sats)} sats`;
  return (
    <div
      className="exit-gauge"
      data-verdict={judgement.verdict}
      role="img"
      aria-label={`${t.gaugeReserve}: ${satsText(model.reserveSats)}`}
    >
      <div className="gauge-row">
        <span className="gauge-label">{t.gaugeReserve}</span>
        <span className="gauge-track">
          <span
            className="gauge-fill"
            style={{ "--fill": model.fill } as CSSProperties}
          />
        </span>
        <span className="gauge-value">{satsText(model.reserveSats)}</span>
      </div>
      <div className="gauge-row gauge-row-displayed">
        <span className="gauge-label">{t.gaugeDustLine}</span>
        <span className="gauge-track gauge-track-thin">
          <span
            className="gauge-fill gauge-fill-displayed"
            style={{ "--fill": model.displayedFill } as CSSProperties}
          />
        </span>
        <span className="gauge-value">{satsText(model.thresholdSats)}</span>
      </div>
      <p className="gauge-caption">{t.gaugeReserveNote}</p>
    </div>
  );
}

// Pool share bars (R50, scanner exit group): where the BCH
// reserve actually sits, pool by pool, deepest first: the top
// pools as bars and the long tail folded into one line with
// its count and its sats. The model comes from the facts'
// per-pool split (a live read carries it; a saved snapshot
// without the split renders nothing here, never an invented
// distribution). Shares are of the sats total: an exit is paid
// in sats.
function PoolShareBars({
  snapshot,
  t,
}: {
  snapshot: TokenSnapshot;
  t: UiStrings;
}) {
  const model = poolShareModel(snapshot.facts.pools);
  if (model === null) return null;
  return (
    <div className="pool-shares">
      <p className="pool-shares-title">{t.poolShareTitle}</p>
      {model.shown.map((row, index) => (
        <div className="pool-share-row" key={index}>
          <span className="pool-share-label">
            {t.poolShareRow.replace("{n}", String(index + 1))}
          </span>
          <span className="pool-share-track">
            <span
              className="pool-share-fill"
              style={{ "--fill": row.share } as CSSProperties}
            />
          </span>
          <span className="pool-share-value">
            {formatBchShort(row.satsReserve)} BCH · {formatShare(row.share)}
          </span>
        </div>
      ))}
      {model.hiddenCount > 0 && (
        <p className="pool-share-more">
          {t.poolShareMore.replace(
            "{count}",
            latinNumberFormat().format(model.hiddenCount),
          )}{" "}
          · {formatBchShort(model.hiddenSats)} BCH ·{" "}
          {formatShare(Number(model.hiddenSats) / Number(model.totalSats))}
        </p>
      )}
    </div>
  );
}

function ConcentrationTable({
  report,
  t,
  lang,
}: {
  report: ConcentrationReport;
  t: UiStrings;
  lang: Lang;
}) {
  const count = latinNumberFormat().format(report.listedCount);
  return (
    <>
      <table className="evidence">
        <tbody>
          <tr>
            <th scope="row">{t.concGini}</th>
            <td>
              {report.gini === null || report.tier === null
                ? t.concUnavailable
                : `${formatRatio(report.gini)} · ` +
                  concentrationTierLabel(report.tier, t)}
            </td>
          </tr>
          <tr>
            <th scope="row">{t.concTopHolder}</th>
            <td>
              {report.top1ShareOfListed === null
                ? t.concUnavailable
                : formatShare(report.top1ShareOfListed)}
            </td>
          </tr>
          <tr>
            <th scope="row">{t.concTopHolderSupply}</th>
            <td>
              {report.top1ShareOfSupply === null
                ? t.concUnavailable
                : formatShare(report.top1ShareOfSupply)}
            </td>
          </tr>
          {report.top10ShareOfListed !== null && (
            <tr>
              <th scope="row">{t.concTop10}</th>
              <td>{formatShare(report.top10ShareOfListed)}</td>
            </tr>
          )}
          {report.hhi !== null && (
            <tr>
              <th scope="row">{t.concHhi}</th>
              <td>{formatRatio(report.hhi)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="scan-note">
        {report.basis === "listed-top-100"
          ? t.concBasisListed.replace("{count}", count)
          : t.concBasisFull.replace("{count}", count)}
      </p>
    </>
  );
}

// Variant B, the grouped scanner (REFERENCE-TEARDOWN: GoPlus grouping,
// Honeypot flag severity, Selene snapshot honesty). Same data, same
// core, different question order: identity, supply, exit, concentration.
// A check we cannot source is UNKNOWN in words, never a silent pass.
function ScannerReport({
  snapshot,
  judgement,
  summary,
  t,
  lang,
  flagTemplates,
  wiring,
  reveal,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  summary: string;
  t: UiStrings;
  lang: Lang;
  flagTemplates: Record<FlagCode, string>;
  wiring: AnchorWiring;
  /** True only while a fresh report's reveal sequence runs
   *  (P6); re-renders of the same report pass false. */
  reveal: boolean;
}) {
  const { facts } = snapshot;
  const exitStatus = exitStatusOf(judgement);
  const concReport = snapshotConcentrationReport(snapshot);
  const concStatus = concentrationStatus(concReport);
  return (
    <section
      className={reveal ? "scanner reveal" : "scanner"}
      aria-label={t.reportLabel}
    >
      <div className="scan-head">
        <div>
          <h2>
            {snapshot.name} <span className="symbol">({snapshot.symbol})</span>
          </h2>
          <p className="mono category" title={snapshot.category}>
            {shortenHash(snapshot.category)}
          </p>
        </div>
        <div className="stamp" data-verdict={judgement.verdict} aria-live="polite">
          {judgement.verdict.replace("_", " ")}
        </div>
      </div>
      <p className="summary">{summary}</p>
      <p className="caveat">{t.caveat}</p>

      <StatStrip snapshot={snapshot} judgement={judgement} t={t} />

      <div className="scan-groups">
      <ScanGroup
        title={t.groupIdentity}
        status={snapshot.bcmrHashVerified ? "pass" : "unknown"}
        t={t}
        index={0}
      >
        <table className="evidence">
          <tbody>
            <tr>
              <th scope="row">{t.identity}</th>
              <td>
                {snapshot.bcmrHashVerified
                  ? t.identityVerified.replace("{source}", snapshot.bcmrSource)
                  : t.identityNone}
              </td>
            </tr>
            <tr>
              <th scope="row">{t.decimals}</th>
              <td>{snapshot.decimals}</td>
            </tr>
          </tbody>
        </table>
      </ScanGroup>

      <ScanGroup title={t.groupSupply} status="unknown" t={t} index={1}>
        <table className="evidence">
          <tbody>
            <tr>
              <th scope="row">{t.totalSupply}</th>
              <td>
                {formatTokenAmount(facts.totalSupplyRaw, snapshot.decimals)}{" "}
                {snapshot.symbol}
              </td>
            </tr>
            <tr>
              <th scope="row">{t.tokenReserve.replace("{symbol}", snapshot.symbol)}</th>
              <td>
                {formatTokenAmount(facts.reserveTokenRaw, snapshot.decimals)}{" "}
                {snapshot.symbol}
              </td>
            </tr>
          </tbody>
        </table>
        {snapshot.supplyIsStandIn && (
          <p className="scan-note">{t.supplyStandInNote}</p>
        )}
        <p className="scan-note">{t.authorityUnknown}</p>
      </ScanGroup>

      <ScanGroup title={t.groupExit} status={exitStatus} t={t} wide index={2}>
        <ExitGauge snapshot={snapshot} judgement={judgement} t={t} />
        <PoolShareBars snapshot={snapshot} t={t} />
        <EvidenceRows
          snapshot={snapshot}
          judgement={judgement}
          t={t}
          lang={lang}
        />
        {snapshot.fiat && <p className="fiat-note">{snapshot.fiat.note[lang]}</p>}
        <FlagsList judgement={judgement} t={t} flagTemplates={flagTemplates} />
      </ScanGroup>

      <ScanGroup title={t.groupConcentration} status={concStatus} t={t} wide index={3}>
        {concReport === null ? (
          <p className="scan-note">{t.concentrationUnknown}</p>
        ) : (
          <ConcentrationTable report={concReport} t={t} lang={lang} />
        )}
      </ScanGroup>
      </div>

      <ReportActions snapshot={snapshot} judgement={judgement} t={t} />
      <AnchorBlock snapshot={snapshot} judgement={judgement} t={t} wiring={wiring} index={4} />
      <footer className="provenance">{snapshot.provenance[lang]}</footer>
    </section>
  );
}

/** What the proof anchor needs from the wallet home: the shared
 *  session, the UTXO read over that wallet, the broadcast channel,
 *  and the two ways out: ask App to open pairing (App owns the
 *  signal the header's WalletConnect listens to), and hand a
 *  finished anchor's receipt to the history store. */
interface AnchorWiring {
  session: WalletSession;
  utxoPhase: UtxoPhase;
  utxos: SpendableUtxo[];
  electrum: ElectrumSession;
  onConnectRequest: () => void;
  onAnchored: (receipt: Receipt) => void;
  /** The toast layer's failure feed (R51): called with the
   *  exact string the report is about to show under the
   *  anchor action, so pop-up and panel never disagree. */
  onAnchorFailed: (reason: ToastFailureReason, message: string) => void;
}

function AnchorBlock({
  snapshot,
  judgement,
  t,
  wiring,
  index,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
  wiring: AnchorWiring;
  /** Position in the report's reveal stagger (P6). */
  index: number;
}) {
  const [anchor, setAnchor] = useState<{ hash: string; script: string } | null>(null);
  const [anchorFailed, setAnchorFailed] = useState(false);
  const [anchorAttempt, setAnchorAttempt] = useState(0);
  const [hashCopied, setHashCopied] = useState(false);
  const [hashCopyFailed, setHashCopyFailed] = useState(false);
  const copyHash = async () => {
    if (anchor === null) return;
    try {
      // The row displays a shortened hash; the button copies the
      // FULL hash. Copying the ellipsis form would be a silent lie.
      await navigator.clipboard.writeText(anchor.hash);
      setHashCopied(true);
      setHashCopyFailed(false);
      setTimeout(() => setHashCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the failure is announced in words
      // (same rule as ReportActions: never fake a copied state).
      setHashCopyFailed(true);
      setTimeout(() => setHashCopyFailed(false), 3000);
    }
  };
  // The anchor action (R45): until this round the block was
  // display-only: the hash and script rendered, but nothing in
  // the app called the sign flow, so the headline mainnet feature
  // was unreachable. The action below runs the proven chain with
  // the hash this block computed: keyless template from the
  // selected funding UTXO, wallet sign, byte-level verification,
  // broadcast, receipt to History. Its states are all words: no
  // wallet (with the pairing route), wallet still being read,
  // nothing that can fund the fee, signing, done (txid in the
  // report, as the plan locks), or the failure that stopped it.
  const [anchorPhase, setAnchorPhase] = useState<"idle" | "signing">("idle");
  const [anchoredReceipt, setAnchoredReceipt] = useState<Receipt | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [txidCopied, setTxidCopied] = useState(false);
  const [txidCopyFailed, setTxidCopyFailed] = useState(false);
  const copyTxid = async () => {
    if (anchoredReceipt === null) return;
    try {
      await navigator.clipboard.writeText(anchoredReceipt.txid);
      setTxidCopied(true);
      setTxidCopyFailed(false);
      setTimeout(() => setTxidCopied(false), 2000);
    } catch {
      setTxidCopyFailed(true);
      setTimeout(() => setTxidCopyFailed(false), 3000);
    }
  };
  const runAnchor = async (funding: SpendableUtxo) => {
    const { session, electrum, onAnchored, onAnchorFailed } = wiring;
    const manager = session.manager;
    const address = session.address;
    if (manager === null || address === null || anchor === null) return;
    setAnchorPhase("signing");
    setAnchorError(null);
    try {
      const reportHash = hexToBin(anchor.hash);
      // Change returns to the funding UTXO's own lock, which is
      // the wallet's derived receive address, the lock the sign
      // bridge names as the source output's lock.
      const template = buildAnchorTxTemplateForWallet({
        utxoTxid: funding.txid,
        utxoIndex: funding.index,
        utxoValueSats: funding.valueSats,
        reportHash,
        changeLockingBytecode: funding.lockingBytecode,
        changeAddress: address,
      });
      const result = await executeAnchorSignFlow(
        manager,
        async (signedTxHex) => {
          await electrum.call("blockchain.transaction.broadcast", [
            signedTxHex,
          ]);
        },
        {
          template,
          fundingUtxo: {
            txid: funding.txid,
            index: funding.index,
            valueSats: funding.valueSats,
          },
          reportHash,
          receiptFields: {
            kind: "anchor",
            assetLabel: `${t.anchorTitle} · ${snapshot.symbol}`,
            categoryId: snapshot.category,
            amountBaseUnits: 0n,
            decimals: 0,
            recipient: address,
            feeSats: template.feeSats,
            sentAtIso: new Date().toISOString(),
          },
          userPrompt: t.signPromptAnchor,
        },
      );
      setAnchoredReceipt(result.receipt);
      setAnchorPhase("idle");
      onAnchored(result.receipt);
    } catch (error) {
      setAnchorPhase("idle");
      if (error instanceof SignFlowError) {
        const message =
          error.code === "WALLET_REFUSED"
            ? t.signRejected
            : error.code === "TAMPERED"
              ? t.anchorTampered
              : error.code === "BROADCAST_FAILED"
                ? t.sendBroadcastFailed
                : t.sendMalformed;
        setAnchorError(message);
        onAnchorFailed(failureReasonForCode(error.code), message);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        setAnchorError(message);
        onAnchorFailed("other", message);
      }
    }
  };
  useEffect(() => {
    let cancelled = false;
    // A new report must never wear the previous report's hash while
    // its own is computed: reset to the loading state first.
    setAnchor(null);
    setAnchorFailed(false);
    // Nor the previous report's anchor outcome: a txid earned by
    // one report must never sit under another report's hash.
    setAnchoredReceipt(null);
    setAnchorError(null);
    setAnchorPhase("idle");
    // The anchored text is the downloadable report itself, byte
    // for byte (see buildReportJson): anyone holding the file
    // can re-hash it and check the digest against this block
    // and against the OP_RETURN output on chain.
    const reportText = buildReportJson(snapshot, judgement);
    // libauth is heavy (WASM) and only this block needs it: load it
    // lazily so the verdict report renders without waiting for it.
    (async () => {
      try {
        const { anchorScriptForReport, toHex } = await import("./core/anchor");
        const { hash, script } = await anchorScriptForReport(reportText);
        if (!cancelled) setAnchor({ hash: toHex(hash), script: toHex(script) });
      } catch {
        // A failed chunk must not leave "hashing…" up forever: the
        // block says it failed and offers a retry instead.
        if (!cancelled) setAnchorFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [snapshot, judgement, anchorAttempt]);

  // The action area under the hash. Every state is words plus,
  // where an action exists, a real button: the connect button
  // (App routes it to the pairing dialog; the report is never
  // touched), or the anchor button itself. The one disabled
  // state (nothing can fund the fee) carries its reason in the
  // note directly above it, the Send gate's pattern.
  const { session, utxoPhase, utxos, onConnectRequest } = wiring;
  let actionArea: ReactNode = null;
  if (anchor !== null && anchoredReceipt !== null) {
    actionArea = (
      <div className="anchor-done">
        <p className="anchor-done-line">{t.anchorDone}</p>
        <p className="mono" title={anchoredReceipt.txid}>
          {shortenHash(anchoredReceipt.txid)}
        </p>
        <div className="panel-actions">
          <a
            href={anchoredReceipt.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t.receiptExplorer}
          </a>
          <button type="button" onClick={() => void copyTxid()}>
            {txidCopied ? t.copied : t.copyTxid}
          </button>
          {txidCopyFailed && (
            <span className="action-status" role="status">
              {t.copyFailed}
            </span>
          )}
        </div>
      </div>
    );
  } else if (anchor !== null) {
    if (!session.connected || session.manager === null) {
      actionArea = (
        <>
          <p className="scan-note">{t.anchorNeedsWallet}</p>
          <button
            id="anchor-action"
            type="button"
            className="primary-action"
            onClick={onConnectRequest}
          >
            {t.connectWallet}
          </button>
        </>
      );
    } else if (session.addressMissing || session.address === null) {
      actionArea = <p className="scan-note">{t.walletAddressMissing}</p>;
    } else if (utxoPhase === "loading" || utxoPhase === "idle") {
      actionArea = (
        <p className="scan-note" aria-busy="true">
          {t.walletBalanceLoading}
        </p>
      );
    } else if (utxoPhase === "unavailable") {
      actionArea = <p className="scan-note">{t.walletBalanceUnavailable}</p>;
    } else {
      const feeSats = estimateAnchorFeeSats();
      const funding = selectAnchorFundingUtxo(utxos, feeSats);
      actionArea =
        funding === null ? (
          <>
            <p className="scan-note">
              {t.anchorNoFunds.replace(
                "{sats}",
                latinNumberFormat().format(minimumAnchorFundingSats(feeSats)),
              )}
            </p>
            <button type="button" className="primary-action" disabled>
              {t.anchorAction}
            </button>
          </>
        ) : (
          <button
            id="anchor-action"
            type="button"
            className="primary-action"
            disabled={anchorPhase === "signing"}
            onClick={() => void runAnchor(funding)}
          >
            {anchorPhase === "signing" ? t.sendInProgress : t.anchorAction}
          </button>
        );
    }
  }

  return (
    <section
      className="anchor"
      style={{ "--i": index } as CSSProperties}
    >
      <h2>{t.anchorTitle}</h2>
      <p>{t.anchorBody}</p>
      {anchorFailed ? (
        <p className="anchor-error" role="alert">
          {t.anchorLoadFailed}{" "}
          <button
            type="button"
            className="copy-inline"
            onClick={() => setAnchorAttempt((n) => n + 1)}
          >
            {t.retry}
          </button>
        </p>
      ) : anchor === null ? (
        <p className="mono">{t.hashing}</p>
      ) : (
        <>
          <dl className="mono">
            <div>
              <dt>{t.reportHash}</dt>
              <dd title={anchor.hash}>{shortenHash(anchor.hash)}</dd>
              <button
                type="button"
                className="icon-btn"
                aria-label={t.copyHash}
                title={t.copyHash}
                onClick={() => void copyHash()}
              >
                <CopyGlyphs copied={hashCopied} />
              </button>
            </div>
            <div>
              <dt>{t.opReturnScript}</dt>
              <dd title={anchor.script}>{shortenHash(anchor.script)}</dd>
            </div>
          </dl>
          {hashCopyFailed && (
            <p className="action-status" role="status">
              {t.copyFailed}
            </p>
          )}
        </>
      )}
      {actionArea}
      {anchorError !== null && (
        <p className="anchor-error" role="alert">
          {anchorError}
        </p>
      )}
    </section>
  );
}

function storedPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function App() {
  // A shared link names its snapshot (?snap=<id>): opening one lands
  // on that report, not on the default. Unknown ids fall back.
  const [selectedId, setSelectedId] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get("snap");
    return SNAPSHOTS.some((s) => s.id === wanted) ? wanted! : SNAPSHOTS[0].id;
  });
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("snap", selectedId);
    window.history.replaceState(null, "", url);
  }, [selectedId]);
  // Basic feature the user ordered (2026-11-13): language choice
  // with English as the default, persisted per visitor. Currency
  // was a choice until 2026-11-14, when the user locked it to USD
  // only (R49): there is no currency state any more.
  const [lang, setLang] = useState<Lang>(() => {
    const stored = storedPref("poolproof-lang");
    return isLang(stored) ? stored : "en";
  });
  // UI experiment (R16): direction A (audit report) vs variant B
  // (grouped scanner) on the same data. A stays the default; the
  // choice persists like the other preferences.
  const [view, setView] = useState<"report" | "scanner">(() =>
    storedPref("poolproof-view") === "scanner" ? "scanner" : "report",
  );
  useEffect(() => {
    try {
      localStorage.setItem("poolproof-view", view);
    } catch {
      // Persistence is a nicety, not a requirement.
    }
  }, [view]);
  useEffect(() => {
    try {
      localStorage.setItem("poolproof-lang", lang);
    } catch {
      // Storage unavailable (private mode): the choice just won't persist.
    }
    const option = languageOption(lang);
    document.documentElement.lang = option.locale;
    document.documentElement.dir = option.direction;
  }, [lang]);

  // The active language pack: English until the selected pack's
  // chunk lands (usually one frame, as the packs are ~10 kB each).
  // Everything language-dependent renders from packLang (the pack
  // actually on screen), never from the bare selection: the
  // data-layer strings used to flip with the selection while the UI
  // strings waited for the chunk, leaving a mixed-language page,
  // and, on a failed chunk, a permanently mixed one. A failed load
  // now also speaks up instead of stranding the UI silently.
  const [pack, setPack] = useState<LanguagePack>(ENGLISH_PACK);
  const [packLang, setPackLang] = useState<Lang>("en");
  const [packFailed, setPackFailed] = useState(false);
  const [packAttempt, setPackAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadLanguagePack(lang)
      .then((loaded) => {
        if (!live) return;
        setPack(loaded);
        setPackLang(lang);
        setPackFailed(false);
      })
      .catch(() => {
        if (live) setPackFailed(true);
      });
    return () => {
      live = false;
    };
  }, [lang, packAttempt]);
  const t = pack.strings;
  const flagTemplates = pack.flags;
  // The toast callbacks are stable useCallbacks (history is
  // their only state dependency), so they read the CURRENT
  // language's strings through this ref instead of closing
  // over one pack: a toast always speaks the language on
  // screen at the moment its event fires.
  const stringsRef = useRef(t);
  stringsRef.current = t;

  const [walletSession, setWalletSession] =
    useState<WalletSession>(DISCONNECTED_SESSION);
  const [electrum] = useState(() => createElectrumSession());
  useEffect(() => {
    // Close the read socket when App unmounts. A remount (React
    // StrictMode in dev) creates a fresh session; the old one is
    // closed here, never leaked.
    return () => electrum.close();
  }, [electrum]);
  const [utxoPhase, setUtxoPhase] = useState<UtxoPhase>("idle");
  const [walletUtxos, setWalletUtxos] = useState<SpendableUtxo[]>([]);
  const [walletHoldings, setWalletHoldings] =
    useState<WalletHoldings | null>(null);
  const [openPanel, setOpenPanel] = useState<HomePanel | null>(null);
  // Panel switching and closing (R50): openPanel is what the
  // tiles say; renderedPanel is what is on screen. Switching
  // replaces the panel at once and the new one's entry
  // animation carries the change (the P5 doctrine: replaced
  // content does not exit). Closing to nothing is different:
  // the panel stays mounted under a closing class for one
  // exit duration (the dialog-exit token), then unmounts, so
  // a close reads as a close instead of a vanish.
  const [renderedPanel, setRenderedPanel] = useState<HomePanel | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  useEffect(() => {
    if (openPanel !== null) {
      setRenderedPanel(openPanel);
      setPanelClosing(false);
      return;
    }
    if (renderedPanel === null) return;
    setPanelClosing(true);
    const timer = window.setTimeout(() => {
      setRenderedPanel(null);
      setPanelClosing(false);
    }, 190);
    return () => window.clearTimeout(timer);
  }, [openPanel, renderedPanel]);
  const [history] = useState(loadHistoryStore);
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    history.store.list(),
  );
  const [historySaveFailed, setHistorySaveFailed] = useState(false);
  // Every history save goes through here. HistoryStore.save()
  // propagates a failed write (private mode, a full quota),
  // and a bookkeeping failure must never break the send that
  // already succeeded: it surfaces as the History panel's
  // save-failed note instead, while the receipt stays in the
  // running list for this session.
  const persistHistory = () => {
    try {
      history.store.save();
    } catch {
      setHistorySaveFailed(true);
    }
  };
  const walletAddress = walletSession.address;
  useEffect(() => {
    if (walletAddress === null) {
      setUtxoPhase("idle");
      setWalletUtxos([]);
      setWalletHoldings(null);
      return;
    }
    let live = true;
    setUtxoPhase("loading");
    void fetchAddressUtxos(walletAddress, electrum.call)
      .then((utxos) => {
        if (!live) return;
        setWalletUtxos(utxos);
        setWalletHoldings(indexWalletHoldings(utxos));
        setUtxoPhase("ready");
      })
      .catch(() => {
        if (!live) return;
        setUtxoPhase("unavailable");
      });
    return () => {
      live = false;
    };
  }, [walletAddress, electrum]);
  const resolveTokenIdentity = useCallback(
    (category: string) => resolveIdentity(category, fetchTokenStorkCandidates),
    [],
  );
  // Transaction feedback (R51): App owns the toast queue; the
  // pure core in core/toast.ts decides admission, dedupe,
  // eviction, and dwell, and Toasts.tsx only renders. Events
  // enter exclusively from real signals: the two receipt sinks
  // below (a broadcast that resolved), the failure callbacks
  // the send panel and anchor block feed with their own panel
  // strings, the History watcher's observed confirmation
  // flips, and the receive watcher's chain reads. Nothing
  // else in the app can raise a toast.
  const [toastQueue, setToastQueue] = useState<ToastQueueState>(
    emptyToastQueue,
  );
  const pushToastEvent = useCallback((event: ToastEvent) => {
    setToastQueue((prev) => pushToast(prev, event, Date.now()).state);
  }, []);
  const dismissToastById = useCallback((id: number) => {
    setToastQueue((prev) => dismissToast(prev, id));
  }, []);
  const handleTxFailed = useCallback(
    (reason: ToastFailureReason, message: string) => {
      pushToastEvent({ kind: "failed", txid: null, fact: message, reason });
    },
    [pushToastEvent],
  );
  const copyToastTxid = useCallback(async (txid: string) => {
    try {
      await navigator.clipboard.writeText(txid);
      return true;
    } catch {
      return false;
    }
  }, []);
  const handleSent = useCallback(
    (receipt: Receipt) => {
      history.store.append(receipt);
      persistHistory();
      setEntries(history.store.list());
      setOpenPanel("history");
      // The SENT toast fires here, inside the same success
      // path that appends the receipt: the sign flow minted
      // that receipt only after the broadcast resolved, so
      // the pop-up can never announce a send that has not
      // actually left.
      const s = stringsRef.current;
      pushToastEvent({
        kind: "sent",
        txid: receipt.txid,
        fact: s.toastSent
          .replace("{amount}", receipt.amountText)
          .replace("{asset}", receipt.assetLabel),
      });
    },
    [history, pushToastEvent],
  );
  // An anchor's receipt joins the same store, but the panel does
  // NOT switch: the txid lands in the report the user is looking
  // at (the plan locks the txid in the report), and History is
  // one tile tap away when they want the record.
  const handleAnchored = useCallback(
    (receipt: Receipt) => {
      history.store.append(receipt);
      persistHistory();
      setEntries(history.store.list());
      // Same rule as a send: the toast rides the receipt sink,
      // so it exists only because the anchor broadcast resolved.
      pushToastEvent({
        kind: "sent",
        txid: receipt.txid,
        fact: stringsRef.current.anchorDone,
      });
    },
    [history, pushToastEvent],
  );
  // Pairing requests from inside the report (the anchor action's
  // connect button): App owns the signal the header's
  // WalletConnect listens to, and the focus bookkeeping around
  // it. The report itself is never touched by a connect round
  // trip: opening, dismissing, or completing pairing changes
  // only the wallet session.
  const [connectSignal, setConnectSignal] = useState(0);
  const anchorConnectPending = useRef(false);
  const requestAnchorConnect = useCallback(() => {
    anchorConnectPending.current = true;
    setConnectSignal((n) => n + 1);
  }, []);
  const focusAnchorAction = useCallback(() => {
    document.getElementById("anchor-action")?.focus();
  }, []);
  const handlePairingDialogClose = useCallback(() => {
    if (!anchorConnectPending.current) return;
    anchorConnectPending.current = false;
    focusAnchorAction();
  }, [focusAnchorAction]);
  useEffect(() => {
    if (!walletSession.connected || !anchorConnectPending.current) return;
    anchorConnectPending.current = false;
    focusAnchorAction();
  }, [walletSession.connected, focusAnchorAction]);
  const anchorWiring: AnchorWiring = {
    session: walletSession,
    utxoPhase,
    utxos: walletUtxos,
    electrum,
    onConnectRequest: requestAnchorConnect,
    onAnchored: handleAnchored,
    onAnchorFailed: handleTxFailed,
  };
  // Confirmation statuses refresh while the History panel is
  // open: once on open, then every 30 seconds until it closes.
  // The fetch never guesses, so a transaction whose check fails
  // keeps its last recorded status, and the store refuses to
  // move a status backward, so this loop can only ever advance
  // the record, and a failed cycle shows no error.
  const historyRefreshInFlight = useRef(false);
  useEffect(() => {
    if (openPanel !== "history") return;
    let cancelled = false;
    const refresh = async () => {
      if (historyRefreshInFlight.current) return;
      historyRefreshInFlight.current = true;
      try {
        const targets = history.store.list().slice(0, 20);
        if (targets.length === 0) return;
        // The CONFIRMED toast (R51) hooks this same refresh:
        // the stored statuses are snapshotted before the
        // updates land, and the core's flip check names the
        // transactions this cycle observed crossing from
        // broadcast to confirmed. Same poller, same cadence,
        // no second watcher.
        const before = new Map(
          targets.map((entry) => [entry.receipt.txid, entry.status]),
        );
        const updates = await fetchConfirmationUpdates(
          electrum.call,
          targets.map((entry) => entry.receipt.txid),
        );
        if (cancelled || updates.size === 0) return;
        const checkedAtIso = new Date().toISOString();
        let applied = false;
        for (const [txid, status] of updates) {
          if (history.store.updateConfirmation(txid, status, checkedAtIso)) {
            applied = true;
          }
        }
        if (applied) {
          persistHistory();
          setEntries(history.store.list());
        }
        if (!cancelled) {
          const byTxid = new Map(
            targets.map((entry) => [entry.receipt.txid, entry.receipt]),
          );
          const s = stringsRef.current;
          for (const txid of confirmationFlips(before, updates)) {
            const receipt = byTxid.get(txid);
            if (receipt === undefined) continue;
            pushToastEvent({
              kind: "confirmed",
              txid,
              fact:
                receipt.kind === "anchor"
                  ? s.toastAnchorConfirmed
                  : s.toastConfirmed
                      .replace("{amount}", receipt.amountText)
                      .replace("{asset}", receipt.assetLabel),
            });
          }
        }
      } catch {
        // fetchConfirmationUpdates already turns per-call
        // failures into missing updates; anything that still
        // escapes changes nothing. The last known statuses
        // stand, and no error is shown for a status check.
      } finally {
        historyRefreshInFlight.current = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [openPanel, history, electrum, pushToastEvent]);
  // The receive watch (R51): while a wallet is connected, the
  // derived receive address (the same address the balance read
  // uses) is re-read on the app's one existing poll cadence,
  // the History refresh's 30 seconds, never faster. The
  // Electrum client is request/response only (its message
  // handler drops server pushes), so a scripthash subscription
  // cannot surface events through it; polling listunspent is
  // the read path the client already supports, and it is the
  // same call the balance read makes. The pure diff in
  // core/toast.ts decides what counts as a payment: a new
  // outpoint whose creating transaction is not one of our own
  // receipts (our change is created BY our own transaction,
  // so it can never pass) and which carries no token data.
  // The first read after connect only seeds the baseline, the
  // wallet's existing contents are not news. Any set change
  // at all refreshes the holdings read, so the balance and
  // holdings the user sees stay true after receives AND after
  // our own sends land their change.
  const receiveBaseline = useRef<{
    address: string;
    map: Map<string, WatchedUtxo> | null;
  }>({ address: "", map: null });
  const receivePollInFlight = useRef(false);
  useEffect(() => {
    if (walletAddress === null) return;
    let cancelled = false;
    if (receiveBaseline.current.address !== walletAddress) {
      receiveBaseline.current = { address: walletAddress, map: null };
    }
    const poll = async () => {
      if (receivePollInFlight.current) return;
      receivePollInFlight.current = true;
      try {
        const scripthash = await scripthashForAddress(walletAddress);
        const entries = parseListunspent(
          await electrum.call("blockchain.scripthash.listunspent", [
            scripthash,
            "include_tokens",
          ]),
        );
        const current: WatchedUtxo[] = entries.map((entry) => ({
          txid: entry.txid,
          index: entry.index,
          valueSats: entry.valueSats,
          hasToken: entry.token !== undefined,
        }));
        const ownTxids = new Set(
          history.store.list().map((entry) => entry.receipt.txid),
        );
        const diff = diffReceivedUtxos(
          receiveBaseline.current.map,
          current,
          ownTxids,
        );
        receiveBaseline.current = {
          address: walletAddress,
          map: diff.nextBaseline,
        };
        if (cancelled) return;
        const s = stringsRef.current;
        for (const payment of diff.received) {
          pushToastEvent({
            kind: "received",
            txid: payment.txid,
            fact: s.toastReceived.replace(
              "{amount}",
              formatBch(payment.totalSats),
            ),
          });
        }
        if (diff.changed) {
          // Advisory refresh: on failure the last good read
          // stands and the next cycle retries; the wallet
          // view never flips to unavailable over a watch read.
          void fetchAddressUtxos(walletAddress, electrum.call)
            .then((utxos) => {
              if (cancelled) return;
              setWalletUtxos(utxos);
              setWalletHoldings(indexWalletHoldings(utxos));
              setUtxoPhase("ready");
            })
            .catch(() => {});
        }
      } catch {
        // A failed watch read changes nothing: the baseline
        // stands, no toast fires, and the next cycle retries.
        // The watch is advisory and never shows an error.
      } finally {
        receivePollInFlight.current = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [walletAddress, electrum, history, pushToastEvent]);
  const togglePanel = useCallback(
    (panel: HomePanel) =>
      setOpenPanel((current) => (current === panel ? null : panel)),
    [],
  );
  // The Receive window's own close paths (its Close button,
  // backdrop, Escape) land here: they close outright rather
  // than toggling, whatever state the window was opened from.
  const closePanel = useCallback(() => setOpenPanel(null), []);
  const focusAudit = useCallback(() => {
    const input = document.getElementById("live-category");
    if (input === null) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      input.focus({ preventScroll: true });
    }, 350);
  }, []);

  // The report reveal (P6): the reveal class rides on the
  // report section only while a fresh report's stagger runs.
  // It is set by exactly three events: the first mount, a
  // snapshot select, and a live audit landing (the call sites
  // in runLiveAudit distinguish a landing from the identity
  // upgrade of an already visible report). A timer clears it
  // once the sequence is done (R76 cadence: the last group
  // starts at 280ms and lands by 520ms; the gauge grow and
  // the stamp settle both complete at 740ms), so re-renders
  // of the same report (the identity upgrade in place, a
  // language switch) never carry the class and never re-run
  // the stagger. In-place refinements (a Router quote
  // settling, a balance refresh) therefore never re-run the
  // stamp or the stagger either: the gauge alone moves, by
  // its transform transition, to the refined figure.
  const [revealing, setRevealing] = useState(true);
  const revealTimer = useRef<number | null>(null);
  const triggerReveal = useCallback(() => {
    setRevealing(true);
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current);
    }
    revealTimer.current = window.setTimeout(() => setRevealing(false), 850);
  }, []);
  useEffect(() => {
    triggerReveal();
    return () => {
      if (revealTimer.current !== null) {
        window.clearTimeout(revealTimer.current);
      }
    };
  }, [triggerReveal]);

  const [liveInput, setLiveInput] = useState("");
  const [liveInvalid, setLiveInvalid] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>({ phase: "idle" });
  // The fetching phase's staged checklist (R50): started fresh
  // at every submit, advanced only by the audit's real stage
  // signals below.
  const [auditSteps, setAuditSteps] = useState<AuditSteps>(AUDIT_STEPS_START);
  const liveAttempt = useRef(0);
  const liveCategory = useRef<string | null>(null);
  const runLiveAudit = async (raw: string) => {
    let category: string;
    try {
      category = normalizeCategory(raw);
    } catch {
      // Malformed input is rejected here, in words, before any
      // fetch, never an alert, never a silent no-op (R34 rule).
      setLiveInvalid(true);
      return;
    }
    setLiveInvalid(false);
    setLiveInput(category);
    liveCategory.current = category;
    const attempt = ++liveAttempt.current;
    setLiveState({ phase: "fetching" });
    setAuditSteps(AUDIT_STEPS_START);
    // The classification's landing record (R44): the last report
    // input this attempt produced and whether it already landed,
    // kept in a box because the decision below reads it after the
    // orchestration settles, not at render time (and a plain let
    // assigned inside the callbacks narrows to never there).
    const landing: { input: LiveReportInput | null; landed: boolean } = {
      input: null,
      landed: false,
    };
    try {
      // The pool read and the identity read run concurrently
      // (R41, core/live-audit.ts): the report lands the moment
      // the pool read does. TokenStork's identity scan no
      // longer gates it, with the identity already carried when
      // it won the race, or as an in-place upgrade when it lands
      // after. The orchestration consults the attempt guard
      // before each landing, so a superseded audit is never
      // upgraded by a stale identity; a pool failure rejects
      // promptly (below) without waiting on the identity read,
      // and an identity failure is a null: the report renders
      // unnamed, the audit never dies on a lookup.
      //
      // R44 adds one hold to that landing: a pool read with zero
      // pools and no identity yet cannot be classified. It may
      // be a real pool-less token whose identity is still in
      // flight, or a category nothing attests. Landing the
      // report immediately would flash exactly the dressed-up
      // miss the user rejected (an "unnamed token" NO_MARKET
      // report for a typo'd category), so that one case stays
      // in "fetching" until the identity read settles; the
      // orchestration's own promise resolves only after it has.
      await runLiveAuditReads(
        category,
        {
          fetchPoolFacts: fetchLivePoolFacts,
          resolveIdentity: (c) =>
            resolveIdentity(c, fetchTokenStorkCandidates),
          // The Router cross-check (R48): the venue's own quote
          // for the reference sell, asked once the pool facts
          // land. fetchRouteQuote resolves null on every failure,
          // so a dead router silently costs the report only its
          // cross-check row; the routed CPMM figure stands.
          fetchRouteQuote: (c, amountRaw) => fetchRouteQuote(c, amountRaw),
        },
        () => liveAttempt.current === attempt,
        {
          // The checklist's stage signals (R50): each fires at
          // most once per attempt, only while this attempt is
          // current, and only when its real stage resolves.
          onPoolsLanded: (poolCount) => {
            setAuditSteps((prev) => ({
              ...prev,
              pools: "done",
              simulate:
                poolCount === 0
                  ? "skipped"
                  : prev.simulate === "waiting"
                    ? "active"
                    : prev.simulate,
              quote:
                poolCount === 0
                  ? "skipped"
                  : prev.quote === "waiting"
                    ? "active"
                    : prev.quote,
            }));
          },
          onIdentitySettled: (found) => {
            setAuditSteps((prev) => ({
              ...prev,
              identity: found ? "done" : "missing",
            }));
          },
          onQuoteSettled: (landed) => {
            setAuditSteps((prev) => ({
              ...prev,
              quote:
                landed === null
                  ? "skipped"
                  : landed
                    ? "done"
                    : "unavailable",
            }));
          },
          onReport: (input) => {
            // The report on screen embodies the simulation:
            // the simulate step completes as it lands (a
            // pool-less audit already marked it skipped).
            setAuditSteps((prev) =>
              prev.simulate === "active"
                ? { ...prev, simulate: "done" }
                : prev,
            );
            landing.input = input;
            if (input.poolCount > 0 || input.identity !== null) {
              landing.landed = true;
              setLiveState({ phase: "done", input });
              // A fresh report lands: its reveal runs (P6).
              triggerReveal();
            }
          },
          onIdentityUpgrade: (input) => {
            // The held report's first appearance also lands
            // through here: that is a landing, so it reveals.
            // An upgrade of an already visible report does not.
            const firstAppearance = !landing.landed;
            landing.input = input;
            landing.landed = true;
            setLiveState({ phase: "done", input });
            if (firstAppearance) triggerReveal();
          },
          onQuoteUpgrade: (input) => {
            // The Router quote upgrades the visible report in
            // place, the identity pattern: the headline figure
            // becomes the venue's own quote and the routed
            // figure stays on screen as its cross-check. A
            // quote only exists for a pool-bearing audit, whose
            // report has always landed already, so this never
            // reveals; the landing bookkeeping still updates so
            // the end-of-audit classification reads final facts.
            landing.input = input;
            landing.landed = true;
            setLiveState({ phase: "done", input });
          },
        },
      );
    } catch {
      if (liveAttempt.current !== attempt) return;
      setLiveState({ phase: "failed" });
      return;
    }
    if (liveAttempt.current !== attempt || landing.landed) return;
    const finalInput = landing.input;
    if (finalInput === null) return;
    // The identity read has settled and nothing upgraded the
    // held report: classify on the full evidence. In this wiring
    // the pinned TokenStork entry that resolves an identity is
    // also the supply / holder record for the category, so
    // supplyKnown rises with identityFound; the classifier keeps
    // them separate for wirings that learn one without the other
    // (core/lookup.ts). poolReadOk is true here by construction:
    // a failed pool read rejected into the catch above, which is
    // the classifier's "error" outcome rendered as the existing
    // failed state.
    const outcome = classifyLookup({
      poolReadOk: true,
      poolCount: finalInput.poolCount,
      identityFound: finalInput.identity !== null,
      supplyKnown: finalInput.identity !== null,
    });
    if (outcome === "not-found") {
      setLiveState({ phase: "not-found", category: finalInput.category });
    } else {
      // "report": a real token with no pools and no name yet,
      // the honest unnamed NO_MARKET report.
      setLiveState({ phase: "done", input: finalInput });
      triggerReveal();
    }
  };
  // A shared live link (?cat=<category>) lands on the audit itself,
  // not on the default snapshot: run the same flow once on mount.
  const liveBooted = useRef(false);
  useEffect(() => {
    if (liveBooted.current) return;
    liveBooted.current = true;
    const cat = new URLSearchParams(window.location.search).get("cat");
    if (cat !== null) {
      setLiveInput(cat);
      void runLiveAudit(cat);
    }
  }, []);

  const selectedSnapshot =
    SNAPSHOTS.find((s) => s.id === selectedId) ?? SNAPSHOTS[0];
  const liveSnap = useMemo(
    () =>
      liveState.phase === "done"
        ? liveSnapshot(liveState.input, t, packLang)
        : null,
    [liveState, t, packLang],
  );
  const snapshot = liveSnap ?? selectedSnapshot;
  const judgement = useMemo(() => judgePool(snapshot.facts), [snapshot]);
  const liveTime =
    liveState.phase === "done"
      ? latinDateTimeFormat(languageOption(packLang).locale, {
          dateStyle: "medium",
          timeStyle: "medium",
        }).format(liveState.input.checkedAt)
      : null;
  const summary =
    packLang === "en"
      ? judgement.summary
      : t.summaryByVerdict[judgement.verdict].replace(
          "{ratio}",
          judgement.exitRatio === null
            ? "n/a"
            : latinNumberFormat({
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              }).format(judgement.exitRatio),
        );

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipToMain}
      </a>
      <TopBanner t={t} tokenAddress={walletSession.tokenAddress} />
      <header className="topbar">
        <span className="wordmark">POOLPROOF</span>
        <LazyBoundary label={t.walletLoadFailed}>
          <Suspense
            fallback={
              <div className="wallet">
                <button type="button" disabled aria-busy="true">
                  {t.walletLoading}
                </button>
              </div>
            }
          >
            <WalletConnect
              t={t}
              onSessionChange={setWalletSession}
              connectSignal={connectSignal}
              onDialogClose={handlePairingDialogClose}
            />
          </Suspense>
        </LazyBoundary>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="layout-wallet">
        <WalletCard
          t={t}
          session={walletSession}
          utxoPhase={utxoPhase}
          holdings={walletHoldings}
          openPanel={openPanel}
          onTogglePanel={togglePanel}
          onAudit={focusAudit}
        />
        {renderedPanel !== null && (
          <div
            key={renderedPanel}
            className={panelClosing ? "panel-exit" : undefined}
          >
            {renderedPanel === "send" && (
              <SendPanel
                t={t}
                lang={packLang}
                session={walletSession}
                electrum={electrum}
                utxoPhase={utxoPhase}
                utxos={walletUtxos}
                holdings={walletHoldings}
                resolveIdentity={resolveTokenIdentity}
                onSent={handleSent}
                onSendFailed={handleTxFailed}
              />
            )}
            {renderedPanel === "receive" && (
              <ReceivePanel
                t={t}
                session={walletSession}
                onClose={closePanel}
              />
            )}
            {renderedPanel === "history" && (
              <HistoryPanel
                t={t}
                lang={packLang}
                entries={entries}
                loadFailed={history.loadFailed}
                saveFailed={historySaveFailed}
              />
            )}
          </div>
        )}
        </div>
        <div className="layout-head">
        <h1>{t.headline}</h1>
        <p className="lede">{t.lede}</p>
        </div>
        <div className="layout-controls">
        <div className="controls">
          <label>
            {t.language}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {packFailed && (
          <p className="pack-error" role="alert">
            {t.languageLoadFailed}{" "}
            <button
              type="button"
              className="copy-inline"
              onClick={() => setPackAttempt((n) => n + 1)}
            >
              {t.retry}
            </button>
          </p>
        )}

        <form
          className="live-audit"
          onSubmit={(e) => {
            e.preventDefault();
            void runLiveAudit(liveInput);
          }}
        >
          <label htmlFor="live-category">{t.liveCategoryLabel}</label>
          <div className="live-audit-row">
            <input
              id="live-category"
              className="mono"
              type="text"
              value={liveInput}
              placeholder={t.liveCategoryPlaceholder}
              onChange={(e) => setLiveInput(e.target.value)}
              aria-invalid={liveInvalid}
              aria-describedby={
                liveInvalid
                  ? "live-category-hint live-category-error"
                  : "live-category-hint"
              }
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={liveState.phase === "fetching"}
            >
              {t.liveAuditAction}
            </button>
          </div>
          <p className="live-hint" id="live-category-hint">
            {t.liveCategoryHint}
          </p>
          {liveInvalid && (
            <p className="live-error" id="live-category-error" role="alert">
              {t.liveCategoryInvalid}
            </p>
          )}
        </form>

        <div className="switcher" role="group" aria-label={t.snapshotsLabel}>
          {SNAPSHOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === selectedId}
              onClick={() => {
                // Leaving a live result is always one click: the
                // switcher cancels any in-flight read and returns
                // the report to the chosen snapshot.
                liveAttempt.current++;
                setLiveState({ phase: "idle" });
                setSelectedId(s.id);
                triggerReveal();
              }}
            >
              {s.switchLabel[packLang]}
            </button>
          ))}
        </div>

        <div className="switcher view-switch" role="group" aria-label={t.viewsLabel}>
          {/* The sliding thumb (P4): the active indicator
              travels between the segments; the buttons above it
              only change their label colour. */}
          <span
            className="view-thumb"
            data-on={view}
            aria-hidden="true"
          />
          <button
            type="button"
            aria-pressed={view === "report"}
            onClick={() => setView("report")}
          >
            {t.viewReport}
          </button>
          <button
            type="button"
            aria-pressed={view === "scanner"}
            onClick={() => setView("scanner")}
          >
            {t.viewScanner}
          </button>
        </div>

        </div>
        <div className="layout-report">
        {liveState.phase === "fetching" ? (
          // The loading state (P7 + R50): the skeleton head
          // bar holds the report's silhouette, and under it
          // the staged checklist (AuditStepsCard) replaces the
          // old group-shaped skeleton cards. The checklist is
          // not a skeleton: each step is a real stage of this
          // audit and completes only when its read resolves
          // (the stage signals in runLiveAudit), so the wait
          // shows the work, with skipped stages named as
          // skipped. The loading words stay as the block's
          // accessible label.
          <div
            className="report-skeleton"
            role="status"
            aria-busy="true"
            aria-label={t.liveFetching}
          >
            <div className="skeleton-head shimmer" aria-hidden="true" />
            <AuditStepsCard steps={auditSteps} t={t} />
            <span className="visually-hidden">{t.liveFetching}</span>
          </div>
        ) : liveState.phase === "failed" ? (
          <p className="live-error" role="alert">
            {t.liveFetchFailed}{" "}
            <button
              type="button"
              className="copy-inline"
              onClick={() => {
                if (liveCategory.current !== null) {
                  void runLiveAudit(liveCategory.current);
                }
              }}
            >
              {t.retry}
            </button>
          </p>
        ) : liveState.phase === "not-found" ? (
          <NotFoundCard
            category={liveState.category}
            t={t}
            onCheckAnother={() => {
              // Back to the input with the typed ID left in
              // place and selected: the likely fix is correcting
              // one character of it, not retyping all 64.
              liveAttempt.current++;
              setLiveState({ phase: "idle" });
              focusAudit();
              window.setTimeout(() => {
                const input = document.getElementById("live-category");
                if (input instanceof HTMLInputElement) input.select();
              }, 400);
            }}
          />
        ) : (
          <>
            {liveSnap !== null && liveTime !== null && (
              <p className="live-banner">
                {t.liveResultLabel.replace("{time}", liveTime)}
                {liveState.phase === "done" &&
                  liveState.input.supplyIsStandIn && (
                    <> {t.supplyStandInNote}</>
                  )}
              </p>
            )}
            {view === "scanner" ? (
          <ScannerReport
            snapshot={snapshot}
            judgement={judgement}
            summary={summary}
            t={t}
              lang={packLang}
            flagTemplates={flagTemplates}
            wiring={anchorWiring}
            reveal={revealing}
          />
        ) : (
        <section
          className={revealing ? "report reveal" : "report"}
          aria-label={t.reportLabel}
        >
          <div className="report-head">
            <div>
              <h2>
                {snapshot.name} <span className="symbol">({snapshot.symbol})</span>
              </h2>
              <p className="mono category" title={snapshot.category}>
                {shortenHash(snapshot.category)}
              </p>
            </div>
            <div className="stamp" data-verdict={judgement.verdict} aria-live="polite">
              {judgement.verdict.replace("_", " ")}
            </div>
          </div>

          <p className="summary">{summary}</p>
          <p className="caveat">{t.caveat}</p>

          <StatStrip snapshot={snapshot} judgement={judgement} t={t} />

          <ScanGroup title={t.groupExit} status={exitStatusOf(judgement)} t={t} index={0}>
            <ExitGauge snapshot={snapshot} judgement={judgement} t={t} />
            <EvidenceRows
              snapshot={snapshot}
              judgement={judgement}
              t={t}
                  lang={packLang}
            />
            {snapshot.fiat && (
              <p className="fiat-note">{snapshot.fiat.note[packLang]}</p>
            )}
            <FlagsList judgement={judgement} t={t} flagTemplates={flagTemplates} />
          </ScanGroup>

          <ScanGroup
            title={t.groupIdentity}
            status={snapshot.bcmrHashVerified ? "pass" : "unknown"}
            t={t}
            index={1}
          >
            <table className="evidence identity">
              <tbody>
                <tr>
                  <th scope="row">{t.identity}</th>
                  <td>
                    {snapshot.bcmrHashVerified
                      ? t.identityVerified.replace("{source}", snapshot.bcmrSource)
                      : t.identityNone}
                  </td>
                </tr>
                <tr>
                  <th scope="row">{t.decimals}</th>
                  <td>{snapshot.decimals}</td>
                </tr>
              </tbody>
            </table>
          </ScanGroup>

          <ReportActions snapshot={snapshot} judgement={judgement} t={t} />

          <AnchorBlock snapshot={snapshot} judgement={judgement} t={t} wiring={anchorWiring} index={2} />

          <footer className="provenance">{snapshot.provenance[packLang]}</footer>
        </section>
            )}
          </>
        )}
        </div>
      </main>
      <ToastLayer
        items={toastQueue.items}
        t={t}
        onDismiss={dismissToastById}
        onOpenHistory={() => setOpenPanel("history")}
        onCopyTxid={copyToastTxid}
      />
    </>
  );
}
