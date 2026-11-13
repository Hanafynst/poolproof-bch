/**
 * Send-flow logic — practice (spike-local only, NOT the submission
 * repo). The pure logic behind the locked Send confirmation sheet
 * (user requirements 2026-11-13 23:13/23:15 WIB, PLAN.md): keypad
 * amount parsing, the 25/50/75%/MAX shortcuts, the fee preview and
 * delivery estimate the sheet shows before any sign request, the
 * confirm gate that decides whether the confirm button is live,
 * and the receipt a finished send leaves behind — the receipt is
 * exactly what the History list renders.
 *
 * Everything here is deterministic: no I/O, no clock reads (the
 * caller passes timestamps in), no randomness. The builders in
 * transfer-tx.ts stay the only place transactions are assembled;
 * this module never builds, signs, or broadcasts — it prepares
 * what the user sees and checks before the wallet is asked.
 *
 * Fiat honesty, per the locked rules: a fiat figure appears ONLY
 * when the caller supplies a labelled reference rate (currency,
 * source, date). Nothing here invents, caches, or fetches a rate;
 * feePreview without a rate returns no fiat block at all, not a
 * placeholder.
 *
 * Explorer choice for receipts: Blockchair,
 * https://blockchair.com/bitcoin-cash/transaction/<txid> — a
 * long-standing BCH explorer with a stable transaction URL shape.
 * The URL is a display string the user taps; the app never fetches
 * it, so Blockchair's keyless-API limits (hit in R29) do not apply
 * to it, and a dead link could never corrupt a receipt's facts.
 */
import { cashAddressToLockingBytecode } from "@bitauth/libauth";
import { DUST_SATS } from "./anchor-tx.js";

const SATS_PER_BCH = 100_000_000n;
const EXPLORER_TX_URL = "https://blockchair.com/bitcoin-cash/transaction/";

/** Decimals are small in this domain (BCH 8, PUSD 2); the bound
 *  exists so a nonsense decimals value cannot make 10^decimals a
 *  denial of service. */
function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new RangeError(
      `decimals must be an integer between 0 and 255, got ${decimals}`,
    );
  }
}

/** Split a strict decimal string into its digit runs. The grammar
 *  the keypad is allowed to produce: digits, with at most one dot,
 *  and a dot must sit between digits (no lone, leading, or
 *  trailing dot). Signs, exponents, letters, spaces, and grouping
 *  commas all refuse with a plain reason. */
function decimalParts(
  text: string,
  what: string,
): { intPart: string; fracPart: string } {
  if (typeof text !== "string" || text.length === 0) {
    throw new Error(`send-flow: ${what} is empty`);
  }
  const parts = text.split(".");
  if (parts.length > 2) {
    throw new Error(`send-flow: ${what} has more than one decimal point`);
  }
  const intPart = parts[0] as string;
  if (!/^[0-9]+$/.test(intPart)) {
    throw new Error(
      `send-flow: ${what} must be digits, with at least one digit ` +
        "before any decimal point",
    );
  }
  let fracPart = "";
  if (parts.length === 2) {
    fracPart = parts[1] as string;
    if (!/^[0-9]+$/.test(fracPart)) {
      throw new Error(
        `send-flow: ${what} must have at least one digit after the ` +
          "decimal point",
      );
    }
  }
  return { intPart, fracPart };
}

/**
 * Parse keypad text into base units. `decimals` is the asset's
 * (BCH 8, PUSD 2): more fractional digits than the asset has is a
 * refusal, never a silent truncation — the user typed precision
 * the asset cannot hold, and rounding their amount for them would
 * change what they send. Leading zeros are fine.
 */
export function parseAmountInput(text: string, decimals: number): bigint {
  assertDecimals(decimals);
  const { intPart, fracPart } = decimalParts(text, "amount");
  if (fracPart.length > decimals) {
    throw new Error(
      `send-flow: amount has ${fracPart.length} decimal places, ` +
        `this asset allows ${decimals}`,
    );
  }
  const scale = 10n ** BigInt(decimals);
  const fracPadded = fracPart.padEnd(decimals, "0");
  return BigInt(intPart) * scale + BigInt(fracPadded === "" ? "0" : fracPadded);
}

/**
 * Canonical display form of a base-unit amount: the exact inverse
 * of parseAmountInput for representable values. Trailing fraction
 * zeros are trimmed (750 units at 2 decimals prints "7.5", not
 * "7.50") and a zero fraction drops the dot entirely.
 */
export function formatBaseUnits(amount: bigint, decimals: number): string {
  assertDecimals(decimals);
  if (amount < 0n) {
    throw new RangeError(`amount must not be negative, got ${amount}`);
  }
  if (decimals === 0) return amount.toString();
  const scale = 10n ** BigInt(decimals);
  const intPart = amount / scale;
  const fracPart = amount % scale;
  if (fracPart === 0n) return intPart.toString();
  const frac = fracPart
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${intPart}.${frac}`;
}

/** Longest integer part the keypad will build. Twelve digits of
 *  whole units is past any amount a wallet send plausibly names
 *  (a trillion BCH is 47,000× the supply); the cap exists so the
 *  field can never grow an amount the user did not mean to type. */
const MAX_AMOUNT_INTEGER_DIGITS = 12;

/**
 * One keypad press applied to the amount text: the single source
 * of truth for what the Send amount field may contain, shared by
 * the on-screen keypad and any other caller that edits the field
 * one key at a time. Keys are "0".."9", ".", and "backspace";
 * anything else returns the text unchanged.
 *
 * The rules keep every reachable state inside the grammar
 * parseAmountInput accepts, plus the two transient states an
 * editor must allow mid-typing: the empty field and a trailing
 * dot ("5." on the way to "5.25"). Concretely: at most one dot;
 * fraction digits never exceed the asset's decimals; the integer
 * part never exceeds twelve digits; a lone leading zero collapses
 * into the next digit ("0" then "5" is "5", never "05"), while
 * "0" then "." is "0." so a sub-unit amount can start; a dot on
 * an empty field yields "0." for the same reason; at zero
 * decimals the dot is a no-op because the asset has no fraction
 * to enter. Backspace on a single character empties the field.
 */
export function applyAmountKey(
  current: string,
  key: string,
  decimals: number,
): string {
  assertDecimals(decimals);
  if (key === "backspace") {
    return current.slice(0, -1);
  }
  if (key === ".") {
    if (decimals === 0) return current;
    if (current.includes(".")) return current;
    if (current === "") return "0.";
    return `${current}.`;
  }
  if (/^[0-9]$/.test(key)) {
    const dotAt = current.indexOf(".");
    if (dotAt !== -1) {
      const fractionDigits = current.length - dotAt - 1;
      return fractionDigits < decimals ? current + key : current;
    }
    if (current === "0") return key;
    if (current.length >= MAX_AMOUNT_INTEGER_DIGITS) return current;
    return current + key;
  }
  return current;
}

export type ShortcutKind = 25 | 50 | 75 | "MAX";

export interface ShortcutOptions {
  /** True when the network fee is paid out of the asset being sent
   *  (a BCH send: amount and fee share one balance). False for a
   *  token send: the amount is tokens, the fee is BCH from a
   *  separate balance, so the token MAX is the full balance. */
  feePaidInSameAsset: boolean;
}

/**
 * The keypad shortcut row. Percents are exact floor math on the
 * available balance (999 at 75% is 749, never 750); whether the
 * result is actually sendable is the confirm gate's question, not
 * this function's. Only MAX looks at the fee, and only when the
 * fee comes out of the same asset: MAX = available - fee, floored
 * at zero — a fee that eats the whole balance yields 0, and the
 * gate then blocks on amount_zero with a localisable reason.
 */
export function shortcutAmount(
  kind: ShortcutKind,
  availableBaseUnits: bigint,
  feeSats: bigint,
  options: ShortcutOptions,
): bigint {
  if (availableBaseUnits < 0n) {
    throw new RangeError(
      `availableBaseUnits must not be negative, got ${availableBaseUnits}`,
    );
  }
  if (feeSats < 0n) {
    throw new RangeError(`feeSats must not be negative, got ${feeSats}`);
  }
  if (typeof options?.feePaidInSameAsset !== "boolean") {
    throw new TypeError(
      "send-flow: shortcut options.feePaidInSameAsset must be a boolean",
    );
  }
  if (kind === "MAX") {
    if (!options.feePaidInSameAsset) return availableBaseUnits;
    return availableBaseUnits > feeSats ? availableBaseUnits - feeSats : 0n;
  }
  if (kind === 25 || kind === 50 || kind === 75) {
    return (availableBaseUnits * BigInt(kind)) / 100n;
  }
  throw new RangeError(
    `shortcut kind must be 25, 50, 75 or "MAX", got ${JSON.stringify(kind)}`,
  );
}

/** A labelled fiat reference rate, supplied by the caller from a
 *  named source on a named date. perBch is a decimal STRING ("the
 *  fiat price of 1 BCH") so the math below is exact bigint work,
 *  never float. */
export interface FiatRate {
  /** Currency code the figure is expressed in, e.g. "USD". */
  currency: string;
  perBch: string;
  source: string;
  /** ISO date the rate was read, e.g. "2026-11-13". */
  date: string;
}

export interface FeeFiat {
  /** Exactly two decimals, no grouping separators: "0.50". */
  amountText: string;
  currency: string;
  rateSource: string;
  rateDate: string;
}

export interface FeePreview {
  feeSats: bigint;
  /** The fee is priced on an estimated signed size (the transfer-tx
   *  convention), so the preview is labelled an estimate in its own
   *  shape — a consumer cannot render it as an exact figure without
   *  dropping a field the type carries. */
  isEstimate: true;
  /** Present ONLY when the caller passed a rate. */
  feeFiat?: FeeFiat;
}

function rateToRational(perBch: string): { num: bigint; den: bigint } {
  const { intPart, fracPart } = decimalParts(perBch, "fiat rate");
  const num = BigInt(intPart + fracPart);
  if (num === 0n) {
    throw new Error("send-flow: fiat rate perBch must be positive");
  }
  return { num, den: 10n ** BigInt(fracPart.length) };
}

/**
 * What the confirmation sheet shows for the fee: the sats figure,
 * plus a fiat rendering ONLY when a labelled rate is supplied.
 * `feeSats` is the caller's total BCH cost estimate for the send
 * (for a token send that means fee plus the token outputs' dust —
 * pricing lives with the caller and the builders; this function
 * only renders). Fiat rounds half-up to the currency's usual two
 * decimals, in exact bigint math.
 */
export function feePreview(feeSats: bigint, rate?: FiatRate): FeePreview {
  if (feeSats < 0n) {
    throw new RangeError(`feeSats must not be negative, got ${feeSats}`);
  }
  const preview: FeePreview = { feeSats, isEstimate: true };
  if (rate === undefined) return preview;
  for (const field of ["currency", "source", "date"] as const) {
    if (typeof rate[field] !== "string" || rate[field].length === 0) {
      throw new Error(`send-flow: fiat rate ${field} must be a non-empty string`);
    }
  }
  const { num, den } = rateToRational(rate.perBch);
  // cents = round-half-up(feeSats * perBch / SATS_PER_BCH * 100)
  const numerator = feeSats * num * 100n;
  const denominator = SATS_PER_BCH * den;
  const cents = (2n * numerator + denominator) / (2n * denominator);
  const amountText =
    `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;
  preview.feeFiat = {
    amountText,
    currency: rate.currency,
    rateSource: rate.source,
    rateDate: rate.date,
  };
  return preview;
}

export interface DeliveryEstimate {
  /** A signed send leaves the wallet the moment the user confirms;
   *  broadcasting is not the slow part. */
  broadcast: "immediate";
  /** BCH's average block interval. An average, labelled as an
   *  estimate in the shape — the next block can land in seconds or
   *  take an hour, and this object never pretends otherwise. */
  firstConfirmationMinutes: 10;
  isEstimate: true;
}

export function deliveryEstimate(): DeliveryEstimate {
  return { broadcast: "immediate", firstConfirmationMinutes: 10, isEstimate: true };
}

export type SendKind = "bch" | "fungible" | "nft";

export interface ReceiptInput {
  /** Transaction id in display order (the order explorers print),
   *  64 hex characters. */
  txid: string;
  kind: SendKind;
  /** What the user calls the asset: "BCH", "ParyonUSD", an NFT name. */
  assetLabel: string;
  /** Category id (display-order hex) — required for token kinds,
   *  forbidden for a plain BCH send. */
  categoryId?: string;
  /** NFT commitment hex (at most 40 bytes; may be empty) — required
   *  for kind "nft", forbidden otherwise. */
  commitment?: string;
  /** For an NFT receipt this is the fungible amount that rode in
   *  the NFT's UTXO and moved with it (often 0). */
  amountBaseUnits: bigint;
  decimals: number;
  recipient: string;
  /** The fee actually paid, in sats — a fact on a receipt, not an
   *  estimate. */
  feeSats: bigint;
  /** ISO timestamp of the send, passed in by the caller (this
   *  module never reads a clock). */
  sentAtIso: string;
}

export interface Receipt {
  txid: string;
  kind: SendKind;
  assetLabel: string;
  categoryId?: string;
  commitment?: string;
  amountBaseUnits: bigint;
  /** formatBaseUnits(amountBaseUnits, decimals) — the exact string
   *  the History list shows. */
  amountText: string;
  decimals: number;
  recipient: string;
  feeSats: bigint;
  sentAtIso: string;
  /** The state at mint time: the transaction has been broadcast
   *  and awaits its first confirmation. A later status is a new
   *  object, never a mutation — receipts are frozen records. */
  status: "broadcast";
  explorerUrl: string;
  /** Copy-ready strings for the receipt's copy buttons. */
  copy: {
    txid: string;
    recipient: string;
    amount: string;
    explorerUrl: string;
  };
}

const HEX_64 = /^[0-9a-f]{64}$/;
const HEX_EVEN = /^([0-9a-f]{2})*$/;

/**
 * Build the receipt for a send that has been broadcast. Every
 * field the confirmation sheet promised is on it — asset,
 * recipient, amount, fee paid — plus the txid, the timestamp, and
 * the explorer link, with the token identity carried in BCH-native
 * vocabulary: the category id is the token's identity (BCH has no
 * contract addresses), the commitment is the individual NFT's.
 * Token fields are disciplined by kind: a receipt that mixes them
 * up is a caller bug and throws instead of rendering a lie.
 */
export function buildReceipt(input: ReceiptInput): Receipt {
  const txid = typeof input.txid === "string" ? input.txid.toLowerCase() : "";
  if (!HEX_64.test(txid)) {
    throw new Error(
      "send-flow: receipt txid must be 64 hex characters in display order",
    );
  }
  if (input.kind !== "bch" && input.kind !== "fungible" && input.kind !== "nft") {
    throw new RangeError(
      `send-flow: receipt kind must be "bch", "fungible" or "nft", ` +
        `got ${JSON.stringify(input.kind)}`,
    );
  }
  if (typeof input.assetLabel !== "string" || input.assetLabel.length === 0) {
    throw new Error("send-flow: receipt assetLabel must be a non-empty string");
  }
  const hasCategory = input.categoryId !== undefined;
  const hasCommitment = input.commitment !== undefined;
  if (input.kind === "bch" && (hasCategory || hasCommitment)) {
    throw new Error(
      "send-flow: a BCH receipt carries no token category or commitment",
    );
  }
  if (input.kind !== "bch" && !hasCategory) {
    throw new Error("send-flow: a token receipt requires the category id");
  }
  if (
    hasCategory &&
    (typeof input.categoryId !== "string" ||
      !HEX_64.test(input.categoryId.toLowerCase()))
  ) {
    throw new Error(
      "send-flow: receipt categoryId must be 64 hex characters",
    );
  }
  if (input.kind === "fungible" && hasCommitment) {
    throw new Error("send-flow: a fungible receipt carries no NFT commitment");
  }
  if (input.kind === "nft" && !hasCommitment) {
    throw new Error("send-flow: an NFT receipt requires the commitment");
  }
  if (
    hasCommitment &&
    (typeof input.commitment !== "string" ||
      !HEX_EVEN.test(input.commitment.toLowerCase()) ||
      input.commitment.length > 80)
  ) {
    throw new Error(
      "send-flow: NFT commitment must be even-length hex of at most 40 bytes",
    );
  }
  if (input.amountBaseUnits < 0n) {
    throw new RangeError(
      `receipt amountBaseUnits must not be negative, got ${input.amountBaseUnits}`,
    );
  }
  assertDecimals(input.decimals);
  if (typeof input.recipient !== "string" || input.recipient.length === 0) {
    throw new Error("send-flow: receipt recipient must be a non-empty string");
  }
  if (input.feeSats < 0n) {
    throw new RangeError(
      `receipt feeSats must not be negative, got ${input.feeSats}`,
    );
  }
  if (
    typeof input.sentAtIso !== "string" ||
    Number.isNaN(Date.parse(input.sentAtIso))
  ) {
    throw new Error(
      "send-flow: receipt sentAtIso must be a parseable ISO timestamp",
    );
  }
  const amountText = formatBaseUnits(input.amountBaseUnits, input.decimals);
  const explorerUrl = `${EXPLORER_TX_URL}${txid}`;
  const receipt: Receipt = {
    txid,
    kind: input.kind,
    assetLabel: input.assetLabel,
    amountBaseUnits: input.amountBaseUnits,
    amountText,
    decimals: input.decimals,
    recipient: input.recipient,
    feeSats: input.feeSats,
    sentAtIso: input.sentAtIso,
    status: "broadcast",
    explorerUrl,
    copy: {
      txid,
      recipient: input.recipient,
      amount: amountText,
      explorerUrl,
    },
  };
  if (hasCategory) receipt.categoryId = (input.categoryId as string).toLowerCase();
  if (hasCommitment) {
    receipt.commitment = (input.commitment as string).toLowerCase();
  }
  Object.freeze(receipt.copy);
  return Object.freeze(receipt);
}

/** What entering an address in the Send panel finds. Detection is
 *  a separate, forgiving step from gating: it runs on every
 *  keystroke, so it never throws — undecodable text is simply
 *  "not valid". */
export interface RecipientDetection {
  /** Checksum and format decode cleanly. */
  valid: boolean;
  network: "mainnet" | "testnet" | "unknown";
  /** The address advertises CashToken support. Tokens sent to an
   *  address without it land in wallets that may not index them —
   *  the stranded-funds trap the gate blocks. */
  tokenSupport: boolean;
}

export function detectRecipient(address: string): RecipientDetection {
  const invalid: RecipientDetection = {
    valid: false,
    network: "unknown",
    tokenSupport: false,
  };
  if (typeof address !== "string" || address.length === 0) return invalid;
  try {
    const decoded = cashAddressToLockingBytecode(address);
    if (typeof decoded === "string") return invalid;
    return {
      valid: true,
      network:
        decoded.prefix === "bitcoincash"
          ? "mainnet"
          : decoded.prefix === "bchtest"
            ? "testnet"
            : "unknown",
      tokenSupport: decoded.tokenSupport,
    };
  } catch {
    return invalid;
  }
}

/** Stable machine codes for why a send cannot confirm. The UI
 *  localises them; this module never renders prose for them. */
export type GateReason =
  | "wrong_network"
  | "invalid_address"
  | "token_to_plain_address"
  | "amount_missing"
  | "amount_invalid"
  | "amount_zero"
  | "amount_below_dust"
  | "insufficient_balance"
  | "insufficient_fee_balance";

export interface ConfirmGateState {
  assetKind: SendKind;
  /** The network the app is operating on. Only "mainnet" can ever
   *  confirm — the submission build has no testnet mode. */
  network: string;
  /** The parsed amount, or null while the field is empty or
   *  unparseable. Ignored for kind "nft": the NFT itself is the
   *  amount, and the fungible amount riding with it is not the
   *  user's to choose. */
  amountBaseUnits: bigint | null;
  /** The parse failure's reason when the amount text did not
   *  parse; null/absent when it did. Wins over amountBaseUnits: a
   *  failed parse means the number on screen is not the number
   *  that would be sent. */
  amountError?: string | null;
  /** Spendable balance of the asset being sent, in its base units
   *  (plain-BCH sats for "bch", the category's fungible total for
   *  "fungible"). Ignored for "nft". */
  availableBaseUnits: bigint;
  /** The caller's total BCH cost estimate for this send, in sats
   *  (see feePreview). */
  feeSats: bigint;
  /** Satoshis available to pay that cost. For a BCH send this is
   *  the same pool as availableBaseUnits and the fee is checked
   *  together with the amount; for token sends it is the separate
   *  BCH balance and is checked on its own. */
  feeAvailableSats: bigint;
  /** Detection result for the entered recipient; null while the
   *  field is empty. */
  recipient: RecipientDetection | null;
}

export interface ConfirmGateResult {
  canConfirm: boolean;
  /** Every applicable reason, in the fixed order the checks run:
   *  network, address, token support, amount, dust, balance, fee. */
  reasons: GateReason[];
}

/**
 * The confirm button's brain. Collects EVERY reason the send is
 * blocked (the sheet can show them all at once) in a stable order,
 * and confirms only when the list is empty. Money rules: a BCH
 * amount below dust never confirms (the builders refuse it too —
 * the gate exists so the user learns why before signing, not from
 * a thrown error after); a BCH send must cover amount + fee from
 * the one balance; a token send must cover the amount from the
 * token balance AND the fee cost from the BCH balance; tokens
 * never confirm to an address that does not advertise token
 * support.
 */
export function confirmGate(state: ConfirmGateState): ConfirmGateResult {
  if (
    state.assetKind !== "bch" &&
    state.assetKind !== "fungible" &&
    state.assetKind !== "nft"
  ) {
    throw new RangeError(
      `send-flow: assetKind must be "bch", "fungible" or "nft", ` +
        `got ${JSON.stringify(state.assetKind)}`,
    );
  }
  if (
    state.availableBaseUnits < 0n ||
    state.feeSats < 0n ||
    state.feeAvailableSats < 0n
  ) {
    throw new RangeError("send-flow: gate balances and fee must not be negative");
  }
  if (state.amountBaseUnits !== null && state.amountBaseUnits < 0n) {
    throw new RangeError("send-flow: gate amount must not be negative");
  }
  const reasons: GateReason[] = [];
  if (state.network !== "mainnet") reasons.push("wrong_network");
  const recipient = state.recipient;
  const recipientUsable =
    recipient !== null && recipient.valid && recipient.network === "mainnet";
  if (!recipientUsable) {
    reasons.push("invalid_address");
  } else if (state.assetKind !== "bch" && !recipient.tokenSupport) {
    reasons.push("token_to_plain_address");
  }
  if (state.assetKind !== "nft") {
    const amount = state.amountBaseUnits;
    if (state.amountError != null) {
      reasons.push("amount_invalid");
    } else if (amount === null) {
      reasons.push("amount_missing");
    } else if (amount === 0n) {
      reasons.push("amount_zero");
    } else {
      if (state.assetKind === "bch" && amount < DUST_SATS) {
        reasons.push("amount_below_dust");
      }
      if (amount > state.availableBaseUnits) {
        reasons.push("insufficient_balance");
      } else if (
        state.assetKind === "bch" &&
        amount + state.feeSats > state.availableBaseUnits
      ) {
        reasons.push("insufficient_balance");
      }
    }
  }
  if (
    state.assetKind !== "bch" &&
    state.feeAvailableSats < state.feeSats
  ) {
    reasons.push("insufficient_fee_balance");
  }
  return { canConfirm: reasons.length === 0, reasons };
}
