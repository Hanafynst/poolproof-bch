/**
 * Unsigned anchor transaction template — practice (spike-local only,
 * NOT the submission repo). Builds the full BCH transaction that
 * would carry a PoolProof report hash on mainnet: one OP_RETURN
 * output (0 sats) + one change output back to the anchor address.
 *
 * OFFLINE ONLY: the practice key is a fixed throwaway (never funded,
 * never used elsewhere) and the input UTXO is invented. In the real
 * app the same shape is handed to WizardConnect, which owns the key
 * and the UTXOs; nothing here signs or broadcasts.
 *
 * Fee honesty: the fee is charged on the ESTIMATED SIGNED size, not
 * the smaller unsigned template — a P2PKH unlock adds ~107 bytes
 * (signature push + public key push), and a template that priced
 * only its own bytes would underpay the fee once signed.
 */
import {
  encodeTransactionBCH,
  privateKeyToP2pkhCashAddress,
  privateKeyToP2pkhLockingBytecode,
  type TransactionBCH,
} from "@bitauth/libauth";
import { buildAnchorScript } from "./anchor.js";

/** Bytes a signed P2PKH unlocking script adds over the empty
 *  unlocking bytecode of the unsigned template. */
export const P2PKH_SIGNED_UNLOCK_BYTES = 107;
/** Change below this is dust: it costs more to spend later than it
 *  is worth, so the template refuses to create it. */
export const DUST_SATS = 546n;
/** The most satoshis that can exist: the 21M BCH supply cap. A
 *  larger "value" cannot be a real UTXO, and past 2^64 the uint64
 *  value field would silently wrap modulo 2^64 while the template
 *  reported the unwrapped figure — refuse it instead (R30). */
export const MAX_MONEY_SATS = 2_100_000_000_000_000n;
const SEQUENCE_FINAL = 0xffffffff;

export interface AnchorTxRequest {
  /** Key that owns the input and receives the change. Practice:
   *  throwaway. Real app: never present — the wallet signs. */
  privateKey: Uint8Array;
  /** Outpoint txid in libauth's internal (little-endian) order. */
  utxoTxid: Uint8Array;
  utxoIndex: number;
  utxoValueSats: bigint;
  /** 32-byte report hash, from hashReport(). */
  reportHash: Uint8Array;
  /** Satoshis per byte. Default 1 — BCH's long-standing relay fee. */
  feeRateSatsPerByte?: number;
}

export interface AnchorTxTemplate {
  transaction: TransactionBCH;
  encoded: Uint8Array;
  feeSats: bigint;
  changeSats: bigint;
  changeAddress: string;
  estimatedSignedSizeBytes: number;
}

export function buildAnchorTxTemplate(request: AnchorTxRequest): AnchorTxTemplate {
  const changeLocking = privateKeyToP2pkhLockingBytecode({
    privateKey: request.privateKey,
  });
  // Both derivation helpers default to the mainnet CashAddress prefix.
  const changeAddress = privateKeyToP2pkhCashAddress({
    privateKey: request.privateKey,
  }).address;
  return buildAnchorTxTemplateForWallet({
    utxoTxid: request.utxoTxid,
    utxoIndex: request.utxoIndex,
    utxoValueSats: request.utxoValueSats,
    reportHash: request.reportHash,
    changeLockingBytecode: changeLocking,
    changeAddress,
    feeRateSatsPerByte: request.feeRateSatsPerByte,
  });
}

/**
 * The wallet form of the anchor request (R45): everything the
 * practice builder took from a private key, the real app takes
 * from the connected wallet's derived receive address — its
 * P2PKH locking bytecode and the address itself. The app holds
 * no keys, ever; the wallet signs. The funding UTXO sits under
 * the same lock (the app reads all of the wallet's UTXOs at that
 * one address), which is what lets the sign bridge name the
 * change lock as the source output's lock.
 */
export interface AnchorWalletTxRequest {
  /** Outpoint txid in libauth's internal (little-endian) order. */
  utxoTxid: Uint8Array;
  utxoIndex: number;
  utxoValueSats: bigint;
  /** 32-byte report hash, from hashReport(). */
  reportHash: Uint8Array;
  /** The wallet's P2PKH locking bytecode — exactly 25 bytes. The
   *  length is enforced because the fee prices a P2PKH unlock
   *  (P2PKH_SIGNED_UNLOCK_BYTES); a different lock shape would
   *  silently misprice it. */
  changeLockingBytecode: Uint8Array;
  /** The address the change locking bytecode belongs to, kept on
   *  the template for display and for the receipt's recipient. */
  changeAddress: string;
  /** Satoshis per byte. Default 1 — BCH's long-standing relay fee. */
  feeRateSatsPerByte?: number;
}

export function buildAnchorTxTemplateForWallet(
  request: AnchorWalletTxRequest,
): AnchorTxTemplate {
  const feeRate = request.feeRateSatsPerByte ?? 1;
  if (!Number.isFinite(feeRate) || feeRate <= 0) {
    throw new RangeError(`feeRateSatsPerByte must be positive, got ${feeRate}`);
  }
  if (request.utxoTxid.length !== 32) {
    throw new RangeError(`utxoTxid must be 32 bytes, got ${request.utxoTxid.length}`);
  }
  if (
    !Number.isInteger(request.utxoIndex) ||
    request.utxoIndex < 0 ||
    request.utxoIndex > 0xffffffff
  ) {
    // Past uint32 the encoder silently wraps the index modulo 2^32
    // and the transaction spends a different outpoint (R30).
    throw new RangeError(`utxoIndex must be a uint32 (0..4294967295), got ${request.utxoIndex}`);
  }
  if (request.utxoValueSats < 0n || request.utxoValueSats > MAX_MONEY_SATS) {
    throw new RangeError(
      `utxoValueSats must be between 0 and the 21M BCH supply cap (${MAX_MONEY_SATS}), got ${request.utxoValueSats}`,
    );
  }
  if (request.changeLockingBytecode.length !== 25) {
    throw new RangeError(
      `changeLockingBytecode must be a 25-byte P2PKH locking bytecode, got ${request.changeLockingBytecode.length}`,
    );
  }
  if (typeof request.changeAddress !== "string" || request.changeAddress.length === 0) {
    throw new Error("anchor-tx: changeAddress must be a non-empty string");
  }
  const anchorScript = buildAnchorScript(request.reportHash); // validates 32 bytes
  const changeLocking = request.changeLockingBytecode;

  const assemble = (changeSats: bigint): TransactionBCH => ({
    version: 2,
    inputs: [
      {
        outpointTransactionHash: request.utxoTxid,
        outpointIndex: request.utxoIndex,
        sequenceNumber: SEQUENCE_FINAL,
        unlockingBytecode: new Uint8Array(),
      },
    ],
    outputs: [
      { lockingBytecode: anchorScript, valueSatoshis: 0n },
      { lockingBytecode: changeLocking, valueSatoshis: changeSats },
    ],
    locktime: 0,
  });

  // The value field is fixed-width, so the encoded size does not
  // depend on the change amount: measure with a zero placeholder,
  // price the signed size, then assemble the real template.
  const unsignedSize = encodeTransactionBCH(assemble(0n)).length;
  const estimatedSignedSizeBytes = unsignedSize + P2PKH_SIGNED_UNLOCK_BYTES;
  const feeSats = BigInt(Math.ceil(feeRate * estimatedSignedSizeBytes));
  const changeSats = request.utxoValueSats - feeSats;
  if (changeSats < DUST_SATS) {
    throw new RangeError(
      `input ${request.utxoValueSats} sats cannot fund fee ${feeSats} sats ` +
        `and leave at least dust (${DUST_SATS}) change`,
    );
  }
  const transaction = assemble(changeSats);
  return {
    transaction,
    encoded: encodeTransactionBCH(transaction),
    feeSats,
    changeSats,
    changeAddress: request.changeAddress,
    estimatedSignedSizeBytes,
  };
}

/**
 * The anchor's fee at a fee rate, measured on a probe template
 * (the anchor's shape is fixed, so the fee cannot depend on the
 * funding UTXO or the report). The UI needs the figure BEFORE a
 * UTXO is chosen — it is what funding selection is measured
 * against — so it cannot wait for the real template.
 */
export function estimateAnchorFeeSats(feeRateSatsPerByte = 1): bigint {
  const probe = buildAnchorTxTemplateForWallet({
    utxoTxid: new Uint8Array(32),
    utxoIndex: 0,
    utxoValueSats: MAX_MONEY_SATS,
    reportHash: new Uint8Array(32),
    changeLockingBytecode: new Uint8Array(25),
    changeAddress: "anchor-fee-probe",
    feeRateSatsPerByte,
  });
  return probe.feeSats;
}

/** The least a funding UTXO may hold: the fee, plus change that
 *  is not dust (the builder refuses dust change, so a UTXO below
 *  this can never anchor). */
export function minimumAnchorFundingSats(feeSats: bigint): bigint {
  return feeSats + DUST_SATS;
}

/** A UTXO as funding selection sees it — structural, so this
 *  module does not import the transfer module that imports it.
 *  `token` present = the UTXO carries CashTokens. */
export interface AnchorFundingCandidate {
  txid: Uint8Array;
  index: number;
  valueSats: bigint;
  token?: { amount: bigint };
}

/**
 * Choose the UTXO an anchor spends: the SMALLEST plain UTXO that
 * covers the fee and leaves at least dust change, so anchoring
 * disturbs the wallet as little as possible. Token UTXOs are
 * never eligible, however large: the anchor template's change
 * output carries no token data, so spending one would burn its
 * tokens. Ties go to the first candidate. Null = nothing in the
 * wallet can fund an anchor yet (the UI says exactly that, with
 * the minimum figure from minimumAnchorFundingSats).
 */
export function selectAnchorFundingUtxo<T extends AnchorFundingCandidate>(
  candidates: readonly T[],
  feeSats: bigint,
): T | null {
  const minimum = minimumAnchorFundingSats(feeSats);
  let best: T | null = null;
  for (const candidate of candidates) {
    if (candidate.token !== undefined) continue;
    if (candidate.valueSats < minimum) continue;
    if (best === null || candidate.valueSats < best.valueSats) {
      best = candidate;
    }
  }
  return best;
}
