/**
 * History store — practice (spike-local only, NOT the submission
 * repo). The data layer behind the History view (the Riwayat tile
 * in the locked home skeleton): every receipt the sign flows mint
 * (R31's buildReceipt, produced by R36 only after verification +
 * broadcast) lands here, so the view that lists our anchors and
 * sends with txids and explorer links has something to render.
 *
 * The module does no I/O of its own: persistence goes through an
 * injected storage adapter ({ read, write } of one text blob), so
 * the Day-1 app picks its backend (localStorage there, a memory
 * fake in tests) and this file stays pure logic.
 *
 * Discipline carried over from send-flow / sign-flow:
 * - No clock reads. Ordering is the receipts' own sentAtIso, with
 *   insertion order as the deterministic tie-break — two receipts
 *   stamped in the same second still list in a stable order.
 * - Bigints never pass through Number or raw JSON. Amounts ride in
 *   the serialised form as decimal strings and are rebuilt exactly;
 *   a value past 2^53 must survive a round-trip bit-for-bit.
 * - Entries are canonical frozen receipts: append and load both
 *   rebuild through buildReceipt, so what the store holds always
 *   satisfies the receipt's own invariants (kind discipline,
 *   derived amountText / explorerUrl / copy block), and what list()
 *   hands out cannot be mutated behind the store's back.
 * - Corrupt stored text is an honest failure, never a silent
 *   reset. Starting empty over unreadable data happens ONLY when
 *   the caller passes onCorrupt: "start-empty" to load() — wiping
 *   a user's transaction history is a decision, and this API makes
 *   whoever takes it say so. Even then the corrupt text is left in
 *   place until the caller explicitly saves over it.
 */
import { buildReceipt, type Receipt, type ReceiptInput } from "./send-flow.js";

/** Serialisation format version. Loading anything else is an
 *  UNSUPPORTED_VERSION error: a newer app's history is migrated by
 *  that app, never guessed at by this one. */
export const HISTORY_FORMAT_VERSION = 1;

/** One text blob in, one text blob out. read() returns null when
 *  nothing was ever written — a fresh install, NOT corruption. */
export interface HistoryStorageAdapter {
  read(): string | null;
  write(text: string): void;
}

export type HistoryStoreErrorCode = "CORRUPT_DATA" | "UNSUPPORTED_VERSION";

/**
 * A load failure with its machine-readable code: CORRUPT_DATA for
 * text that is not a valid history (broken JSON, wrong shape,
 * values that disagree with each other), UNSUPPORTED_VERSION for a
 * well-formed history written by a different format version.
 * Callers branch on `code`, never on message text.
 */
export class HistoryStoreError extends Error {
  readonly code: HistoryStoreErrorCode;

  constructor(code: HistoryStoreErrorCode, message: string) {
    super(message);
    this.name = "HistoryStoreError";
    this.code = code;
  }
}

export type AppendResult = "appended" | "duplicate";

/** What load() does with corrupt stored text. "throw" (the
 *  default) surfaces the HistoryStoreError; "start-empty" returns
 *  an empty store and leaves the corrupt text untouched until the
 *  caller saves. There is no third, silent option. */
export type CorruptDataPolicy = "throw" | "start-empty";

export interface LoadHistoryOptions {
  onCorrupt?: CorruptDataPolicy;
}

/** The wire shape of one receipt: the receipt's own fields, with
 *  the two bigint fields as decimal strings. Derived fields
 *  (amountText, explorerUrl, copy) are stored too — and checked
 *  against the rebuilt receipt on load, so a hand-edited file
 *  whose numbers disagree with each other fails as corrupt
 *  instead of rendering a lie in the History list. */
interface StoredReceipt {
  txid: string;
  kind: Receipt["kind"];
  assetLabel: string;
  categoryId?: string;
  commitment?: string;
  amountBaseUnits: string;
  amountText: string;
  decimals: number;
  recipient: string;
  feeSats: string;
  sentAtIso: string;
  status: Receipt["status"];
  explorerUrl: string;
  copy: Receipt["copy"];
}

/** Rebuild a canonical frozen receipt from anything claiming to
 *  be one. buildReceipt does the validation (txid shape, kind
 *  discipline, non-negative amounts, parseable timestamp) and the
 *  freezing; this wrapper only extracts the input fields, so stray
 *  extra fields on the caller's object never reach the store. */
function canonicalReceipt(candidate: Receipt): Receipt {
  if (candidate === null || typeof candidate !== "object") {
    throw new TypeError("history-store: append expects a receipt object");
  }
  const input: ReceiptInput = {
    txid: candidate.txid,
    kind: candidate.kind,
    assetLabel: candidate.assetLabel,
    amountBaseUnits: candidate.amountBaseUnits,
    decimals: candidate.decimals,
    recipient: candidate.recipient,
    feeSats: candidate.feeSats,
    sentAtIso: candidate.sentAtIso,
  };
  if (candidate.categoryId !== undefined) input.categoryId = candidate.categoryId;
  if (candidate.commitment !== undefined) input.commitment = candidate.commitment;
  return buildReceipt(input);
}

function toStoredReceipt(receipt: Receipt): StoredReceipt {
  const stored: StoredReceipt = {
    txid: receipt.txid,
    kind: receipt.kind,
    assetLabel: receipt.assetLabel,
    amountBaseUnits: receipt.amountBaseUnits.toString(),
    amountText: receipt.amountText,
    decimals: receipt.decimals,
    recipient: receipt.recipient,
    feeSats: receipt.feeSats.toString(),
    sentAtIso: receipt.sentAtIso,
    status: receipt.status,
    explorerUrl: receipt.explorerUrl,
    copy: { ...receipt.copy },
  };
  if (receipt.categoryId !== undefined) stored.categoryId = receipt.categoryId;
  if (receipt.commitment !== undefined) stored.commitment = receipt.commitment;
  return stored;
}

function corruptError(reason: string): HistoryStoreError {
  return new HistoryStoreError(
    "CORRUPT_DATA",
    `history-store: stored history is corrupt — ${reason}`,
  );
}

function storedField(
  entry: Record<string, unknown>,
  field: string,
): unknown {
  const value = entry[field];
  if (value === undefined) {
    throw new Error(`field "${field}" is missing`);
  }
  return value;
}

function storedString(entry: Record<string, unknown>, field: string): string {
  const value = storedField(entry, field);
  if (typeof value !== "string") {
    throw new Error(`field "${field}" is not a string`);
  }
  return value;
}

function storedBigint(entry: Record<string, unknown>, field: string): bigint {
  const text = storedString(entry, field);
  // Receipts never carry negative or fractional base units, so the
  // stored decimal is digits only. Anything else (a float's "1.5",
  // an exponent form, a sign) is a hand-edit or a torn write.
  if (!/^[0-9]+$/.test(text)) {
    throw new Error(`field "${field}" is not a plain decimal integer`);
  }
  return BigInt(text);
}

/** Parse one stored entry back into a canonical receipt. Throws a
 *  plain Error naming the defect; parseStoredHistory wraps it as
 *  CORRUPT_DATA with the entry's position. */
function receiptFromStored(value: unknown): Receipt {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("entry is not an object");
  }
  const entry = value as Record<string, unknown>;
  const status = storedField(entry, "status");
  if (status !== "broadcast") {
    throw new Error(
      `status is ${JSON.stringify(status)}, not "broadcast" — a later ` +
        "status belongs to a newer format version",
    );
  }
  const decimalsValue = storedField(entry, "decimals");
  if (typeof decimalsValue !== "number") {
    throw new Error('field "decimals" is not a number');
  }
  const input: ReceiptInput = {
    txid: storedString(entry, "txid"),
    kind: storedString(entry, "kind") as ReceiptInput["kind"],
    assetLabel: storedString(entry, "assetLabel"),
    amountBaseUnits: storedBigint(entry, "amountBaseUnits"),
    decimals: decimalsValue,
    recipient: storedString(entry, "recipient"),
    feeSats: storedBigint(entry, "feeSats"),
    sentAtIso: storedString(entry, "sentAtIso"),
  };
  if (entry.categoryId !== undefined) {
    input.categoryId = storedString(entry, "categoryId");
  }
  if (entry.commitment !== undefined) {
    input.commitment = storedString(entry, "commitment");
  }
  let receipt: Receipt;
  try {
    receipt = buildReceipt(input);
  } catch (error) {
    throw new Error(
      `receipt fields fail validation: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
  const copyValue = storedField(entry, "copy");
  if (copyValue === null || typeof copyValue !== "object") {
    throw new Error('field "copy" is not an object');
  }
  const copy = copyValue as Record<string, unknown>;
  const derivedDisagrees =
    receipt.amountText !== storedString(entry, "amountText") ||
    receipt.explorerUrl !== storedString(entry, "explorerUrl") ||
    receipt.copy.txid !== storedString(copy, "txid") ||
    receipt.copy.recipient !== storedString(copy, "recipient") ||
    receipt.copy.amount !== storedString(copy, "amount") ||
    receipt.copy.explorerUrl !== storedString(copy, "explorerUrl");
  if (derivedDisagrees) {
    throw new Error("derived fields disagree with the receipt's own values");
  }
  return receipt;
}

/** Parse the whole stored blob. Every failure is a typed
 *  HistoryStoreError — CORRUPT_DATA for anything malformed (a
 *  version field that is not even a number counts as malformed,
 *  not as a version), UNSUPPORTED_VERSION for a version this
 *  module does not read. */
function parseStoredHistory(text: string): Receipt[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw corruptError("not valid JSON (torn or truncated write)");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw corruptError("top level is not an object");
  }
  const root = parsed as Record<string, unknown>;
  const version = root.version;
  if (typeof version !== "number") {
    throw corruptError("version field is missing or not a number");
  }
  if (version !== HISTORY_FORMAT_VERSION) {
    throw new HistoryStoreError(
      "UNSUPPORTED_VERSION",
      `history-store: stored history is format version ${version}, ` +
        `this module reads version ${HISTORY_FORMAT_VERSION}`,
    );
  }
  const entries = root.receipts;
  if (!Array.isArray(entries)) {
    throw corruptError("receipts field is not a list");
  }
  const receipts: Receipt[] = [];
  const seenTxids = new Set<string>();
  entries.forEach((entry, index) => {
    let receipt: Receipt;
    try {
      receipt = receiptFromStored(entry);
    } catch (error) {
      throw corruptError(
        `entry ${index}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (seenTxids.has(receipt.txid)) {
      // save() can never write a duplicate; one on disk means the
      // file was tampered with or two writes interleaved.
      throw corruptError(`entry ${index}: duplicate txid ${receipt.txid}`);
    }
    seenTxids.add(receipt.txid);
    receipts.push(receipt);
  });
  return receipts;
}

export class HistoryStore {
  private readonly adapter?: HistoryStorageAdapter;
  /** Insertion order — the list() sort's tie-break input and the
   *  serialisation order. */
  private readonly insertionOrder: Receipt[] = [];
  private readonly byTxid = new Map<string, Receipt>();

  constructor(adapter?: HistoryStorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Record a receipt. Deduplicated by txid: a transaction can only
   * have happened once, so re-appending the same txid (a flow
   * retried after an ambiguous failure, a receipt loaded twice) is
   * reported as "duplicate" and the FIRST record stands — the
   * store never rewrites history.
   */
  append(receipt: Receipt): AppendResult {
    const canonical = canonicalReceipt(receipt);
    if (this.byTxid.has(canonical.txid)) return "duplicate";
    this.byTxid.set(canonical.txid, canonical);
    this.insertionOrder.push(canonical);
    return "appended";
  }

  /**
   * Newest first: sentAtIso descending, and for equal timestamps
   * the later insertion first (it is the more recent action the
   * user took). Returns a fresh array of the store's frozen
   * receipts — callers can reorder or discard the array, and the
   * frozen entries cannot be edited, so the store's internals are
   * unreachable from the result.
   */
  list(): Receipt[] {
    return this.insertionOrder
      .map((receipt, index) => ({ receipt, index }))
      .sort((a, b) => {
        const byTime =
          Date.parse(b.receipt.sentAtIso) - Date.parse(a.receipt.sentAtIso);
        return byTime !== 0 ? byTime : b.index - a.index;
      })
      .map(({ receipt }) => receipt);
  }

  /** The stored receipt for a txid, or undefined. Txids are hex,
   *  so the lookup is case-insensitive; stored txids are the
   *  lowercase form buildReceipt produces. */
  findByTxid(txid: string): Receipt | undefined {
    if (typeof txid !== "string") return undefined;
    return this.byTxid.get(txid.toLowerCase());
  }

  count(): number {
    return this.insertionOrder.length;
  }

  /** The versioned text form — exactly what save() writes. */
  serialize(): string {
    return JSON.stringify({
      version: HISTORY_FORMAT_VERSION,
      receipts: this.insertionOrder.map(toStoredReceipt),
    });
  }

  /** Persist through the bound adapter. A store built without one
   *  is memory-only and says so instead of failing silently. */
  save(): void {
    if (this.adapter === undefined) {
      throw new Error(
        "history-store: save() needs a store bound to a storage adapter",
      );
    }
    this.adapter.write(this.serialize());
  }

  /**
   * Load the store bound to an adapter. Nothing stored yet (read()
   * → null) is a fresh empty store. Corrupt text follows the
   * caller's explicit policy (default: throw); an unknown format
   * version ALWAYS throws UNSUPPORTED_VERSION — it is not
   * corruption, and a start-empty choice made for torn writes must
   * never silently discard a newer app's intact history.
   */
  static load(
    adapter: HistoryStorageAdapter,
    options: LoadHistoryOptions = {},
  ): HistoryStore {
    const text = adapter.read();
    if (text === null) return new HistoryStore(adapter);
    let receipts: Receipt[];
    try {
      receipts = parseStoredHistory(text);
    } catch (error) {
      const callerChoseRecovery =
        error instanceof HistoryStoreError &&
        error.code === "CORRUPT_DATA" &&
        options.onCorrupt === "start-empty";
      if (!callerChoseRecovery) throw error;
      return new HistoryStore(adapter);
    }
    const store = new HistoryStore(adapter);
    for (const receipt of receipts) {
      store.byTxid.set(receipt.txid, receipt);
      store.insertionOrder.push(receipt);
    }
    return store;
  }
}
