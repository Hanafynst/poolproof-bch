import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { type LiveReportInput } from "./core/live-report";
import { judgePool, type FlagCode, type PoolJudgement } from "./core/poolproof-core";
import { createElectrumSession } from "./core/electrum-wss";
import { HistoryStore, HistoryStoreError } from "./core/history-store";
import type { HistoryEntry } from "./core/history-store";
import { fetchConfirmationUpdates } from "./core/history-status";
import type { Receipt } from "./core/send-flow";
import type { SpendableUtxo } from "./core/transfer-tx";
import { fetchAddressUtxos, indexWalletHoldings, type WalletHoldings } from "./core/wallet-utxos";
import {
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
import { DISCONNECTED_SESSION, type WalletSession } from "./WalletConnect";
import { SNAPSHOTS, type TokenSnapshot } from "./data/snapshots";
import {
  ENGLISH_PACK,
  LANGUAGE_OPTIONS,
  isLang,
  languageOption,
  loadLanguagePack,
  type Currency,
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
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, serialized);
    } catch {
      // Private mode or a full quota: the receipt still shows in
      // the running list; it just does not survive a reload.
    }
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
      return { store: new HistoryStore(), loadFailed: true };
    }
  }
}

// Fiat is orientation only (the verdict is computed in BCH). It is
// shown solely where the snapshot carries labelled reference rates;
// a snapshot without rates gets no fiat figure at all.
function fiatText(
  sats: bigint,
  snapshot: TokenSnapshot,
  currency: Currency,
): string | null {
  if (!snapshot.fiat) return null;
  const usd = (Number(sats) / 1e8) * snapshot.fiat.bchUsd;
  const value = currency === "USD" ? usd : usd * snapshot.fiat.usdIdr;
  return latinNumberFormat({
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function withFiat(
  bchText: string,
  sats: bigint,
  snapshot: TokenSnapshot,
  currency: Currency,
): string {
  const fiat = fiatText(sats, snapshot, currency);
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
  currency,
  lang,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
  currency: Currency;
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
          const fiat = fiatText(simOut, snapshot, currency);
          return fiat === null ? out : `${out} (≈ ${fiat})`;
        });
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
        currency,
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
    [
      t.exitRatio,
      judgement.exitRatio === null
        ? "n/a"
        : latinNumberFormat({
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          }).format(judgement.exitRatio),
    ],
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
// The words live on as each button's aria-label and title; a
// successful copy swaps the glyph for a check, the feedback the
// old "Copied" text swap used to give.
function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
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
      const conc = snapshotConcentrationReport(snapshot);
      const report = {
        token: snapshot.name,
        symbol: snapshot.symbol,
        category: snapshot.category,
        decimals: snapshot.decimals,
        verdict: judgement.verdict,
        exitRatio: judgement.exitRatio,
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
      const blob = new Blob([JSON.stringify(report, null, 2)], {
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
        {copiedKey === "category" ? <CheckIcon /> : <CopyIcon />}
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label={t.copyLink}
        title={t.copyLink}
        onClick={() => void copy("link", shareUrl())}
      >
        {copiedKey === "link" ? <CheckIcon /> : <LinkIcon />}
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
  children,
}: {
  title: string;
  status: ScanStatus;
  t: UiStrings;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={wide ? "scan-group span-2" : "scan-group"}>
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
type LiveState =
  | { phase: "idle" }
  | { phase: "fetching" }
  | { phase: "failed" }
  | { phase: "done"; input: LiveReportInput };

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
  currency,
  lang,
  flagTemplates,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  summary: string;
  t: UiStrings;
  currency: Currency;
  lang: Lang;
  flagTemplates: Record<FlagCode, string>;
}) {
  const { facts } = snapshot;
  const exitStatus = exitStatusOf(judgement);
  const concReport = snapshotConcentrationReport(snapshot);
  const concStatus = concentrationStatus(concReport);
  return (
    <section className="scanner" aria-label={t.reportLabel}>
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

      <div className="scan-groups">
      <ScanGroup
        title={t.groupIdentity}
        status={snapshot.bcmrHashVerified ? "pass" : "unknown"}
        t={t}
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

      <ScanGroup title={t.groupSupply} status="unknown" t={t}>
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

      <ScanGroup title={t.groupExit} status={exitStatus} t={t} wide>
        <EvidenceRows
          snapshot={snapshot}
          judgement={judgement}
          t={t}
          currency={currency}
          lang={lang}
        />
        {snapshot.fiat && <p className="fiat-note">{snapshot.fiat.note[lang]}</p>}
        <FlagsList judgement={judgement} t={t} flagTemplates={flagTemplates} />
      </ScanGroup>

      <ScanGroup title={t.groupConcentration} status={concStatus} t={t} wide>
        {concReport === null ? (
          <p className="scan-note">{t.concentrationUnknown}</p>
        ) : (
          <ConcentrationTable report={concReport} t={t} lang={lang} />
        )}
      </ScanGroup>
      </div>

      <ReportActions snapshot={snapshot} judgement={judgement} t={t} />
      <AnchorBlock snapshot={snapshot} judgement={judgement} t={t} />
      <footer className="provenance">{snapshot.provenance[lang]}</footer>
    </section>
  );
}

function AnchorBlock({
  snapshot,
  judgement,
  t,
}: {
  snapshot: TokenSnapshot;
  judgement: PoolJudgement;
  t: UiStrings;
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
  useEffect(() => {
    let cancelled = false;
    // A new report must never wear the previous report's hash while
    // its own is computed: reset to the loading state first.
    setAnchor(null);
    setAnchorFailed(false);
    const reportText = JSON.stringify({
      token: snapshot.symbol,
      category: snapshot.category,
      verdict: judgement.verdict,
      exitRatio: judgement.exitRatio,
    });
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

  return (
    <section className="anchor">
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
                {hashCopied ? <CheckIcon /> : <CopyIcon />}
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
  // Basic features the user ordered (2026-11-13): language choice
  // with English as the default, currency choice for fiat reference
  // figures with USD as the default. Both persist per visitor.
  const [lang, setLang] = useState<Lang>(() => {
    const stored = storedPref("poolproof-lang");
    return isLang(stored) ? stored : "en";
  });
  const [currency, setCurrency] = useState<Currency>(() =>
    storedPref("poolproof-currency") === "IDR" ? "IDR" : "USD",
  );
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
  useEffect(() => {
    try {
      localStorage.setItem("poolproof-currency", currency);
    } catch {
      // Same as above: persistence is a nicety, not a requirement.
    }
  }, [currency]);

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
  const [history] = useState(loadHistoryStore);
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    history.store.list(),
  );
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
  const handleSent = useCallback(
    (receipt: Receipt) => {
      history.store.append(receipt);
      history.store.save();
      setEntries(history.store.list());
      setOpenPanel("history");
    },
    [history],
  );
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
          history.store.save();
          setEntries(history.store.list());
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
  }, [openPanel, history, electrum]);
  const togglePanel = useCallback(
    (panel: HomePanel) =>
      setOpenPanel((current) => (current === panel ? null : panel)),
    [],
  );
  const focusAudit = useCallback(() => {
    const input = document.getElementById("live-category");
    if (input === null) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      input.focus({ preventScroll: true });
    }, 350);
  }, []);

  const [liveInput, setLiveInput] = useState("");
  const [liveInvalid, setLiveInvalid] = useState(false);
  const [liveState, setLiveState] = useState<LiveState>({ phase: "idle" });
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
      await runLiveAuditReads(
        category,
        {
          fetchPoolFacts: fetchLivePoolFacts,
          resolveIdentity: (c) =>
            resolveIdentity(c, fetchTokenStorkCandidates),
        },
        () => liveAttempt.current === attempt,
        {
          onReport: (input) => setLiveState({ phase: "done", input }),
          onIdentityUpgrade: (input) =>
            setLiveState({ phase: "done", input }),
        },
      );
    } catch {
      if (liveAttempt.current !== attempt) return;
      setLiveState({ phase: "failed" });
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
            <WalletConnect t={t} onSessionChange={setWalletSession} />
          </Suspense>
        </LazyBoundary>
      </header>

      <main>
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
        {openPanel === "send" && (
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
          />
        )}
        {openPanel === "receive" && (
          <ReceivePanel t={t} session={walletSession} />
        )}
        {openPanel === "history" && (
          <HistoryPanel
            t={t}
            lang={packLang}
            entries={entries}
            loadFailed={history.loadFailed}
          />
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
          <label>
            {t.currency}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <option value="USD">USD</option>
              <option value="IDR">IDR</option>
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
                liveInvalid ? "live-category-error" : undefined
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
              }}
            >
              {s.switchLabel[packLang]}
            </button>
          ))}
        </div>

        <div className="switcher view-switch" role="group" aria-label={t.viewsLabel}>
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
          <p className="live-status" role="status" aria-busy="true">
            {t.liveFetching}
          </p>
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
            currency={currency}
            lang={packLang}
            flagTemplates={flagTemplates}
          />
        ) : (
        <section className="report" aria-label={t.reportLabel}>
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

          <ScanGroup title={t.groupExit} status={exitStatusOf(judgement)} t={t}>
            <EvidenceRows
              snapshot={snapshot}
              judgement={judgement}
              t={t}
              currency={currency}
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

          <AnchorBlock snapshot={snapshot} judgement={judgement} t={t} />

          <footer className="provenance">{snapshot.provenance[packLang]}</footer>
        </section>
            )}
          </>
        )}
        </div>
      </main>
    </>
  );
}
