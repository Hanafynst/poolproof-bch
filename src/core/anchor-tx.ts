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
  const anchorScript = buildAnchorScript(request.reportHash); // validates 32 bytes
  const changeLocking = privateKeyToP2pkhLockingBytecode({
    privateKey: request.privateKey,
  });
  // Both derivation helpers default to the mainnet CashAddress prefix.
  const changeAddress = privateKeyToP2pkhCashAddress({
    privateKey: request.privateKey,
  }).address;

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
    changeAddress,
    estimatedSignedSizeBytes,
  };
}
