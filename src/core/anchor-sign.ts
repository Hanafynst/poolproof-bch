/**
 * WizardConnect sign-request bridge for the anchor transaction —
 * practice (spike-local only, NOT the submission repo).
 *
 * The flow this enables: PoolProof builds the unsigned anchor tx
 * (anchor-tx.ts), hands it to the connected wallet through
 * WizardConnect's signTransaction, and VERIFIES the signed result
 * before anything is broadcast. The wallet owns the key and picks
 * the UTXO; this module owns the payload shape and the paranoia.
 *
 * Payload grounded in the installed @wizardconnect packages
 * (read 2026-11-13, not guessed): DappConnectionManager
 * .signTransaction({ transaction, inputPaths }) auto-fills the
 * protocol envelope; `transaction` is a WcSignTransactionRequest
 * ({ transaction: hex, sourceOutputs, broadcast?, userPrompt? })
 * and the response carries { signedTransaction, error? }.
 * inputPaths entries are [childIndex, pathName, addressIndex];
 * the receive path is child 0 — the same index WalletConnect.tsx
 * derives the displayed address from.
 *
 * broadcast stays FALSE in every payload this module builds: a
 * signed blob is never trusted blindly. verifySignedAnchor checks
 * the OP_RETURN output still carries OUR report hash and the input
 * is actually unlocked before the caller may broadcast.
 */
import {
  decodeTransactionBCH,
  instantiateSha256,
  type TransactionBCH,
} from "@bitauth/libauth";
import { buildAnchorScript } from "./anchor.js";
import type { AnchorTxTemplate } from "./anchor-tx.js";

const sha256Promise = instantiateSha256();

/** The funding UTXO the wallet will spend, as the dapp knows it. */
export interface AnchorFundingUtxo {
  /** Outpoint txid in display order (libauth's model order, R60) —
   *  the same order AnchorTxRequest takes. */
  txid: Uint8Array;
  index: number;
  valueSats: bigint;
}

/** Structural shape of the WcSignTransactionRequest payload. */
export interface AnchorSignPayload {
  transaction: {
    transaction: string;
    sourceOutputs: Array<{
      outpointTransactionHash: Uint8Array;
      outpointIndex: number;
      sequenceNumber: number;
      unlockingBytecode: Uint8Array;
      lockingBytecode: Uint8Array;
      valueSatoshis: bigint;
    }>;
    broadcast: boolean;
    userPrompt: string;
  };
  inputPaths: Array<[number, string, number]>;
}

/** The slice of DappConnectionManager this bridge needs — the real
 *  manager satisfies it structurally. */
export interface AnchorSignManager {
  signTransaction(request: AnchorSignPayload): Promise<{
    signedTransaction: string;
    error?: string;
  }>;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Build the sign payload for an anchor template. The template's
 * single input spends the funding UTXO and its change output locks
 * to the same key, so the change locking bytecode IS the source
 * output's locking bytecode.
 */
export function buildAnchorSignPayload(
  template: AnchorTxTemplate,
  utxo: AnchorFundingUtxo,
  userPrompt = "Anchor this PoolProof report hash on Bitcoin Cash mainnet?",
): AnchorSignPayload {
  const input = template.transaction.inputs[0];
  const change = template.transaction.outputs[1];
  if (input === undefined || change === undefined) {
    throw new Error("anchor-sign: template is not the 1-in / 2-out anchor shape");
  }
  return {
    transaction: {
      transaction: toHex(template.encoded),
      sourceOutputs: [
        {
          outpointTransactionHash: utxo.txid,
          outpointIndex: utxo.index,
          sequenceNumber: input.sequenceNumber,
          unlockingBytecode: new Uint8Array(),
          lockingBytecode: change.lockingBytecode,
          valueSatoshis: utxo.valueSats,
        },
      ],
      broadcast: false,
      userPrompt,
    },
    inputPaths: [[0, "receive", 0]],
  };
}

export interface VerifiedAnchor {
  signedTxHex: string;
  /** Display-order txid (the form explorers show). */
  txidHex: string;
}

async function transactionId(encoded: Uint8Array): Promise<string> {
  const sha256 = await sha256Promise;
  const digest = sha256.hash(sha256.hash(encoded));
  return toHex(Uint8Array.from(digest).reverse());
}

/**
 * Verify a wallet-signed anchor transaction: exact anchor shape,
 * output 0 is OUR OP_RETURN report hash at 0 sats, the input is
 * actually unlocked (a P2PKH unlock is ~106–108 bytes), and no
 * extra outputs appeared. Throws on any deviation.
 */
export async function verifySignedAnchor(
  signedTxHex: string,
  reportHash: Uint8Array,
): Promise<VerifiedAnchor> {
  if (!/^(?:[0-9a-f]{2})+$/.test(signedTxHex)) {
    throw new Error("anchor-sign: signed transaction is not hex");
  }
  const encoded = Uint8Array.from(
    signedTxHex.match(/../g)!.map((pair) => parseInt(pair, 16)),
  );
  const decoded = decodeTransactionBCH(encoded);
  if (typeof decoded === "string") {
    throw new Error(`anchor-sign: signed transaction does not decode (${decoded})`);
  }
  const tx: TransactionBCH = decoded;
  if (tx.inputs.length !== 1 || tx.outputs.length !== 2) {
    throw new Error("anchor-sign: signed transaction changed the anchor shape");
  }
  const anchorOutput = tx.outputs[0];
  const expectedScript = buildAnchorScript(reportHash);
  if (
    anchorOutput.valueSatoshis !== 0n ||
    toHex(anchorOutput.lockingBytecode) !== toHex(expectedScript)
  ) {
    throw new Error("anchor-sign: signed transaction does not carry our report hash");
  }
  const unlockLength = tx.inputs[0].unlockingBytecode.length;
  if (unlockLength < 100 || unlockLength > 110) {
    throw new Error("anchor-sign: input is not unlocked with a P2PKH signature");
  }
  return { signedTxHex, txidHex: await transactionId(encoded) };
}

/**
 * Ask the wallet to sign the anchor payload and verify what comes
 * back. A wallet-reported error, or a signed blob that fails
 * verification, throws — the caller broadcasts only the returned
 * verified hex.
 */
export async function requestAnchorSignature(
  manager: AnchorSignManager,
  payload: AnchorSignPayload,
  reportHash: Uint8Array,
): Promise<VerifiedAnchor> {
  const response = await manager.signTransaction(payload);
  if (response.error !== undefined && response.error !== "") {
    throw new Error(`anchor-sign: wallet refused to sign (${response.error})`);
  }
  return verifySignedAnchor(response.signedTransaction, reportHash);
}
