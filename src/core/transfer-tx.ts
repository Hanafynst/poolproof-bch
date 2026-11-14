/**
 * Unsigned transfer transaction templates — practice (spike-local
 * only, NOT the submission repo). The two basic mainnet sends that
 * sit next to the anchor: plain BCH, and CashTokens (fungible or one
 * NFT). Same contract as anchor-tx.ts: this module builds the full
 * unsigned transaction and the metadata the WizardConnect sign
 * bridge needs (spent UTXOs in input order = sourceOutputs
 * material); the wallet owns the keys, picks nothing, and signs
 * only after the user confirms. Nothing here signs or broadcasts.
 *
 * Byte order (R60, decode-proven): outpoint txids AND token
 * categories are both display order in libauth's transaction
 * model — the order explorers and UIs print, and the order a
 * decoded transaction returns them. (An earlier draft of this
 * header claimed outpoint txids were little-endian "internal"
 * order; that was wrong, and following it made built templates
 * reference reversed, nonexistent outpoints.)
 *
 * Fee honesty, as in anchor-tx: fees are priced on the ESTIMATED
 * SIGNED size (each P2PKH unlock adds ~107 bytes), measured on the
 * assembled template itself — output values are fixed-width, so the
 * placeholder amounts used while pricing do not change the size,
 * while token prefixes carry their real category/commitment bytes.
 */
import {
  binToHex,
  cashAddressToLockingBytecode,
  encodeTransactionBCH,
  type TransactionBCH,
} from "@bitauth/libauth";
import {
  DUST_SATS,
  MAX_MONEY_SATS,
  P2PKH_SIGNED_UNLOCK_BYTES,
} from "./anchor-tx.js";

const SEQUENCE_FINAL = 0xffffffff;
/** CashTokens caps NFT commitments at 40 bytes (CHIP-2022-02). */
const MAX_NFT_COMMITMENT_BYTES = 40;
/** Largest fungible amount the CashTokens wire format holds: the
 *  amount is an int64 on the wire. libauth encodes 2^63 - 1 exactly
 *  (round-trip proven) and crashes inside its own encoder past it,
 *  so the range is enforced here with a readable reason (R30). */
export const MAX_TOKEN_AMOUNT = (1n << 63n) - 1n;

export type NftCapability = "none" | "mutable" | "minting";

export interface UtxoTokenContents {
  /** 32-byte category, display (big-endian) order — see header. */
  category: Uint8Array;
  amount: bigint;
  nft?: {
    capability: NftCapability;
    commitment: Uint8Array;
  };
}

/** A UTXO the sender's wallet offers for spending. */
export interface SpendableUtxo {
  /** Outpoint txid in display order (libauth's model order). */
  txid: Uint8Array;
  index: number;
  valueSats: bigint;
  /** Locking bytecode of this UTXO. The sign bridge needs it as the
   *  WizardConnect source output, and change returns to the first
   *  spent UTXO's locking bytecode — the address the funds came
   *  from, which the wallet owns by construction. */
  lockingBytecode: Uint8Array;
  /** Absent = plain BCH UTXO. Present = carries CashTokens and must
   *  NEVER be spent by the plain-BCH builder (its tokens would burn). */
  token?: UtxoTokenContents;
}

export interface TransferTxTemplate {
  transaction: TransactionBCH;
  encoded: Uint8Array;
  feeSats: bigint;
  /** BCH change output value; 0n when the leftover was folded into
   *  the fee instead of creating a dust output. */
  changeSats: bigint;
  estimatedSignedSizeBytes: number;
  /** UTXOs spent, in transaction input order — the sign bridge
   *  turns these into WizardConnect sourceOutputs. */
  spentUtxos: SpendableUtxo[];
  changeLockingBytecode: Uint8Array;
}

export interface TokenTransferTemplate extends TransferTxTemplate {
  /** Fungible amount returned to the sender as token change; 0n on
   *  a full-balance send and on every NFT send. */
  tokenChangeAmount: bigint;
}

function validateFeeRate(feeRateSatsPerByte: number | undefined): number {
  const feeRate = feeRateSatsPerByte ?? 1;
  if (!Number.isFinite(feeRate) || feeRate <= 0) {
    throw new RangeError(`feeRateSatsPerByte must be positive, got ${feeRate}`);
  }
  return feeRate;
}

function validateUtxo(utxo: SpendableUtxo, position: number): void {
  const where = `utxos[${position}]`;
  if (utxo.txid.length !== 32) {
    throw new RangeError(`${where}: txid must be 32 bytes, got ${utxo.txid.length}`);
  }
  if (!Number.isInteger(utxo.index) || utxo.index < 0 || utxo.index > 0xffffffff) {
    // Past uint32 the encoder silently wraps the index modulo 2^32
    // and the transaction spends a different outpoint (R30).
    throw new RangeError(`${where}: index must be a uint32 (0..4294967295), got ${utxo.index}`);
  }
  if (utxo.valueSats < 0n) {
    throw new RangeError(`${where}: valueSats must not be negative, got ${utxo.valueSats}`);
  }
  if (utxo.valueSats > MAX_MONEY_SATS) {
    throw new RangeError(
      `${where}: valueSats ${utxo.valueSats} exceeds the 21M BCH supply cap (${MAX_MONEY_SATS})`,
    );
  }
  if (utxo.lockingBytecode.length === 0) {
    throw new RangeError(`${where}: lockingBytecode must not be empty`);
  }
  if (utxo.token !== undefined) {
    if (utxo.token.category.length !== 32) {
      throw new RangeError(
        `${where}: token category must be 32 bytes, got ${utxo.token.category.length}`,
      );
    }
    if (utxo.token.amount < 0n) {
      throw new RangeError(`${where}: token amount must not be negative`);
    }
    if (utxo.token.amount > MAX_TOKEN_AMOUNT) {
      throw new RangeError(
        `${where}: token amount exceeds the CashTokens int64 maximum (${MAX_TOKEN_AMOUNT})`,
      );
    }
    const nft = utxo.token.nft;
    if (nft !== undefined && nft.commitment.length > MAX_NFT_COMMITMENT_BYTES) {
      throw new RangeError(
        `${where}: NFT commitment is ${nft.commitment.length} bytes, over the ` +
          `${MAX_NFT_COMMITMENT_BYTES}-byte CashTokens cap`,
      );
    }
  }
}

/** A UTXO set that names one outpoint twice is corrupt — a
 *  duplicating indexer or a caller bug — and building on it either
 *  emits a transaction that spends the same outpoint twice
 *  (consensus-invalid) or double-counts a balance: the same token
 *  UTXO listed twice funded a 200-token send against a real
 *  balance of 100 before this guard existed (R30). Refuse the set. */
function assertUniqueOutpoints(utxos: SpendableUtxo[]): void {
  const seen = new Set<string>();
  for (const utxo of utxos) {
    const key = `${binToHex(utxo.txid)}/${utxo.index}`;
    if (seen.has(key)) {
      throw new RangeError(`transfer-tx: duplicate outpoint ${key} in the UTXO set`);
    }
    seen.add(key);
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Decode a recipient CashAddress to its locking bytecode. libauth
 * returns an error STRING (never throws) on a bad checksum or a
 * malformed address; that becomes a thrown Error here — an invalid
 * recipient must stop the build, not produce a template.
 */
function recipientLockingBytecode(
  toCashAddress: string,
  requireTokenSupport: boolean,
): Uint8Array {
  const decoded = cashAddressToLockingBytecode(toCashAddress);
  if (typeof decoded === "string") {
    throw new Error(`transfer-tx: invalid recipient address (${decoded})`);
  }
  if (decoded.prefix !== "bitcoincash") {
    throw new Error(
      `transfer-tx: recipient address is for ${decoded.prefix}, not BCH mainnet`,
    );
  }
  // Tokens sent to an address that does not advertise token support
  // land in a wallet that may not index them — effectively stranded.
  // Plain BCH has no such trap, so only token sends require it.
  if (requireTokenSupport && !decoded.tokenSupport) {
    throw new Error(
      "transfer-tx: recipient address does not advertise CashToken support",
    );
  }
  return decoded.bytecode;
}

function toInput(utxo: SpendableUtxo): TransactionBCH["inputs"][number] {
  return {
    outpointTransactionHash: utxo.txid,
    outpointIndex: utxo.index,
    sequenceNumber: SEQUENCE_FINAL,
    unlockingBytecode: new Uint8Array(),
  };
}

function priceFeeSats(
  inputs: SpendableUtxo[],
  outputs: TransactionBCH["outputs"],
  feeRate: number,
): { feeSats: bigint; estimatedSignedSizeBytes: number } {
  const unsignedSize = encodeTransactionBCH({
    version: 2,
    inputs: inputs.map(toInput),
    outputs,
    locktime: 0,
  }).length;
  const estimatedSignedSizeBytes =
    unsignedSize + inputs.length * P2PKH_SIGNED_UNLOCK_BYTES;
  return {
    feeSats: BigInt(Math.ceil(feeRate * estimatedSignedSizeBytes)),
    estimatedSignedSizeBytes,
  };
}

function finishTemplate(
  inputs: SpendableUtxo[],
  outputs: TransactionBCH["outputs"],
  feeSats: bigint,
  changeSats: bigint,
  estimatedSignedSizeBytes: number,
): TransferTxTemplate {
  const first = inputs[0];
  if (first === undefined) {
    throw new Error("transfer-tx: cannot finish a template with no inputs");
  }
  const transaction: TransactionBCH = {
    version: 2,
    inputs: inputs.map(toInput),
    outputs,
    locktime: 0,
  };
  return {
    transaction,
    encoded: encodeTransactionBCH(transaction),
    feeSats,
    changeSats,
    estimatedSignedSizeBytes,
    spentUtxos: [...inputs],
    changeLockingBytecode: first.lockingBytecode,
  };
}

/** Largest first: fewest inputs, smallest fee. Stable for ties. */
function largestFirst(a: SpendableUtxo, b: SpendableUtxo): number {
  return b.valueSats > a.valueSats ? 1 : b.valueSats < a.valueSats ? -1 : 0;
}

export interface BchTransferRequest {
  utxos: SpendableUtxo[];
  toCashAddress: string;
  amountSats: bigint;
  /** Satoshis per byte. Default 1 — BCH's long-standing relay fee. */
  feeRateSatsPerByte?: number;
}

/**
 * Plain BCH send. Coin selection spends ONLY non-token UTXOs: a
 * token UTXO spent here would burn its tokens, since no output of
 * this transaction carries them. Change below dust is folded into
 * the fee rather than creating an output that costs more to spend
 * than it is worth.
 */
export function buildBchTransfer(request: BchTransferRequest): TransferTxTemplate {
  const feeRate = validateFeeRate(request.feeRateSatsPerByte);
  if (request.amountSats < DUST_SATS) {
    throw new RangeError(
      `amountSats ${request.amountSats} is below dust (${DUST_SATS}): ` +
        "a payment output that small is nonstandard and will not relay",
    );
  }
  if (request.amountSats > MAX_MONEY_SATS) {
    throw new RangeError(
      `amountSats ${request.amountSats} exceeds the 21M BCH supply cap (${MAX_MONEY_SATS})`,
    );
  }
  request.utxos.forEach(validateUtxo);
  assertUniqueOutpoints(request.utxos);
  const recipient = recipientLockingBytecode(request.toCashAddress, false);
  const candidates = request.utxos
    .filter((utxo) => utxo.token === undefined)
    .sort(largestFirst);

  const paymentOutput: TransactionBCH["outputs"][number] = {
    lockingBytecode: recipient,
    valueSatoshis: request.amountSats,
  };
  const selected: SpendableUtxo[] = [];
  let selectedSats = 0n;
  for (const candidate of candidates) {
    selected.push(candidate);
    selectedSats += candidate.valueSats;
    const changeLocking = selected[0].lockingBytecode;
    const withChange = priceFeeSats(
      selected,
      [
        paymentOutput,
        { lockingBytecode: changeLocking, valueSatoshis: DUST_SATS },
      ],
      feeRate,
    );
    if (selectedSats >= request.amountSats + withChange.feeSats) {
      const changeSats = selectedSats - request.amountSats - withChange.feeSats;
      if (changeSats >= DUST_SATS) {
        return finishTemplate(
          selected,
          [
            paymentOutput,
            { lockingBytecode: changeLocking, valueSatoshis: changeSats },
          ],
          withChange.feeSats,
          changeSats,
          withChange.estimatedSignedSizeBytes,
        );
      }
    }
    const withoutChange = priceFeeSats(selected, [paymentOutput], feeRate);
    if (selectedSats >= request.amountSats + withoutChange.feeSats) {
      // The leftover over the payment is dust-or-less: fold it into
      // the fee (feeSats = everything not paid out) and skip change.
      return finishTemplate(
        selected,
        [paymentOutput],
        selectedSats - request.amountSats,
        0n,
        withoutChange.estimatedSignedSizeBytes,
      );
    }
  }
  throw new RangeError(
    `transfer-tx: plain UTXOs hold ${selectedSats} sats, cannot fund a ` +
      `${request.amountSats}-sat payment plus its fee`,
  );
}

export interface TokenTransferRequest {
  utxos: SpendableUtxo[];
  /** 32-byte category, display (big-endian) order — see header. */
  category: Uint8Array;
  toCashAddress: string;
  /** Fungible amount to send. Must be 0n for an NFT send. */
  fungibleAmount: bigint;
  /** Commitment of the one NFT to send. Setting this selects the
   *  NFT send; leaving it undefined selects the fungible send. */
  nftCommitment?: Uint8Array;
  /** Satoshis per byte. Default 1 — BCH's long-standing relay fee. */
  feeRateSatsPerByte?: number;
}

/**
 * CashToken send — fungible XOR NFT:
 *  - Fungible: selects UTXOs of EXACTLY `category` (largest token
 *    amount first) until `fungibleAmount` is covered; the remainder
 *    returns as a token change output. UTXOs carrying an NFT are
 *    never raided for a fungible send — spending one would drag its
 *    NFT along, and one change output cannot hold two NFTs.
 *  - NFT (nftCommitment set, fungibleAmount 0n): spends the single
 *    UTXO carrying that exact commitment; whatever fungible amount
 *    rides in that UTXO goes with it (CashTokens move a UTXO's full
 *    contents), and the commitment reaches the recipient output
 *    byte-exact. No token change: nothing of the category remains.
 *
 * Token outputs carry exactly dust sats; plain UTXOs (plus the sats
 * riding in the token UTXOs themselves) fund that dust and the fee.
 * A token UTXO of any other category is never spent.
 */
export function buildTokenTransfer(request: TokenTransferRequest): TokenTransferTemplate {
  const feeRate = validateFeeRate(request.feeRateSatsPerByte);
  if (request.category.length !== 32) {
    throw new RangeError(
      `category must be 32 bytes, got ${request.category.length}`,
    );
  }
  const category = Uint8Array.from(request.category);
  const nftMode = request.nftCommitment !== undefined;
  if (nftMode && request.fungibleAmount !== 0n) {
    throw new RangeError(
      "transfer-tx: an NFT send takes fungibleAmount 0n — the fungible " +
        "amount riding in the NFT's UTXO moves with it; a combined " +
        "fungible + NFT send is ambiguous and refused",
    );
  }
  if (!nftMode && request.fungibleAmount <= 0n) {
    throw new RangeError(
      `fungibleAmount must be positive for a fungible send, got ${request.fungibleAmount}`,
    );
  }
  if (request.fungibleAmount > MAX_TOKEN_AMOUNT) {
    throw new RangeError(
      `fungibleAmount exceeds the CashTokens int64 maximum (${MAX_TOKEN_AMOUNT})`,
    );
  }
  request.utxos.forEach(validateUtxo);
  assertUniqueOutpoints(request.utxos);
  const recipient = recipientLockingBytecode(request.toCashAddress, true);

  const ofCategory = (utxo: SpendableUtxo): boolean =>
    utxo.token !== undefined && bytesEqual(utxo.token.category, category);

  let tokenInputs: SpendableUtxo[];
  let recipientToken: NonNullable<TransactionBCH["outputs"][number]["token"]>;
  let tokenChangeAmount = 0n;
  if (nftMode) {
    const commitment = request.nftCommitment as Uint8Array;
    // First match wins: two UTXOs can carry indistinguishable NFTs
    // (same category, same commitment — e.g. empty commitments), and
    // any one of them is a valid instance of the requested NFT.
    const target = request.utxos.find(
      (utxo) =>
        ofCategory(utxo) &&
        utxo.token?.nft !== undefined &&
        bytesEqual(utxo.token.nft.commitment, commitment),
    );
    if (target === undefined || target.token?.nft === undefined) {
      throw new Error(
        "transfer-tx: no UTXO carries an NFT of this category with the " +
          "requested commitment",
      );
    }
    tokenInputs = [target];
    recipientToken = {
      amount: target.token.amount,
      category,
      nft: {
        capability: target.token.nft.capability,
        commitment: Uint8Array.from(target.token.nft.commitment),
      },
    };
  } else {
    const candidates = request.utxos
      .filter((utxo) => ofCategory(utxo) && utxo.token?.nft === undefined)
      .sort((a, b) => {
        const amountA = a.token?.amount ?? 0n;
        const amountB = b.token?.amount ?? 0n;
        return amountB > amountA ? 1 : amountB < amountA ? -1 : 0;
      });
    tokenInputs = [];
    let selectedAmount = 0n;
    for (const candidate of candidates) {
      if (selectedAmount >= request.fungibleAmount) break;
      tokenInputs.push(candidate);
      selectedAmount += candidate.token?.amount ?? 0n;
    }
    if (selectedAmount < request.fungibleAmount) {
      throw new RangeError(
        `transfer-tx: fungible balance of this category is ${selectedAmount}, ` +
          `cannot send ${request.fungibleAmount} (NFT-carrying UTXOs are not ` +
          "counted — they are never raided for a fungible send)",
      );
    }
    tokenChangeAmount = selectedAmount - request.fungibleAmount;
    recipientToken = { amount: request.fungibleAmount, category };
  }

  const recipientOutput: TransactionBCH["outputs"][number] = {
    lockingBytecode: recipient,
    valueSatoshis: DUST_SATS,
    token: recipientToken,
  };
  // Change locks to the first token input's address: token change
  // must land on a token-aware address of the sender's, and the BCH
  // change is spendable from the same place.
  const changeLocking = (tokenInputs[0] as SpendableUtxo).lockingBytecode;
  const tokenChangeOutput: TransactionBCH["outputs"][number] = {
    lockingBytecode: changeLocking,
    valueSatoshis: DUST_SATS,
    token: { amount: tokenChangeAmount, category },
  };
  const tokenOutputs: TransactionBCH["outputs"] =
    tokenChangeAmount > 0n ? [recipientOutput, tokenChangeOutput] : [recipientOutput];
  const tokenDustSats = DUST_SATS * BigInt(tokenOutputs.length);
  const tokenInputSats = tokenInputs.reduce((sum, utxo) => sum + utxo.valueSats, 0n);

  const plainCandidates = request.utxos
    .filter((utxo) => utxo.token === undefined)
    .sort(largestFirst);
  const plainSelected: SpendableUtxo[] = [];
  let plainSats = 0n;
  for (let nextPlain = 0; ; nextPlain++) {
    const inputs = [...tokenInputs, ...plainSelected];
    const totalInSats = tokenInputSats + plainSats;
    const withChange = priceFeeSats(
      inputs,
      [...tokenOutputs, { lockingBytecode: changeLocking, valueSatoshis: DUST_SATS }],
      feeRate,
    );
    if (totalInSats >= tokenDustSats + withChange.feeSats) {
      const changeSats = totalInSats - tokenDustSats - withChange.feeSats;
      if (changeSats >= DUST_SATS) {
        const base = finishTemplate(
          inputs,
          [...tokenOutputs, { lockingBytecode: changeLocking, valueSatoshis: changeSats }],
          withChange.feeSats,
          changeSats,
          withChange.estimatedSignedSizeBytes,
        );
        return { ...base, tokenChangeAmount };
      }
    }
    const withoutChange = priceFeeSats(inputs, tokenOutputs, feeRate);
    if (totalInSats >= tokenDustSats + withoutChange.feeSats) {
      const base = finishTemplate(
        inputs,
        tokenOutputs,
        totalInSats - tokenDustSats,
        0n,
        withoutChange.estimatedSignedSizeBytes,
      );
      return { ...base, tokenChangeAmount };
    }
    const candidate = plainCandidates[nextPlain];
    if (candidate === undefined) {
      throw new RangeError(
        `transfer-tx: ${totalInSats} sats available cannot fund ${tokenDustSats} ` +
          "sats of token-output dust plus the fee — add plain BCH UTXOs",
      );
    }
    plainSelected.push(candidate);
    plainSats += candidate.valueSats;
  }
}
