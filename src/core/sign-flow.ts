/**
 * Sign-flow orchestration — practice (spike-local only, NOT the
 * submission repo). The one path every wallet action takes once
 * the user has confirmed: build → sign request → VERIFY →
 * broadcast → receipt. R27 proved the anchor's sign bridge and
 * its verifier, R28 the transfer builders — but nothing ran them
 * end to end, and transfers had no signed-result verifier at all.
 * This module is the orchestration that was missing.
 *
 * Order is the security property: the wallet is asked to sign a
 * payload that NEVER requests broadcast (broadcast: false), the
 * returned blob is verified against the built template before
 * anything else happens, and only a verified blob reaches the
 * broadcast callback — the flow's single side effect, injected by
 * the caller (in production an indexer/Electrum submit; in tests
 * a recording fake). The R31 receipt is minted last of all: a
 * receipt says "broadcast", so it must not exist before the
 * broadcast has actually been accepted.
 *
 * Failures are typed, never silent — see SignFlowErrorCode. A
 * wallet refusal, a tampered signed blob, an undecodable blob,
 * and a failed broadcast are four different situations with four
 * different correct caller reactions, so they are four codes.
 */
import {
  binToHex,
  decodeTransactionBCH,
  encodeTransactionOutput,
  instantiateSha256,
  type TransactionBCH,
} from "@bitauth/libauth";
import {
  buildAnchorSignPayload,
  verifySignedAnchor,
  type AnchorFundingUtxo,
  type AnchorSignPayload,
} from "./anchor-sign.js";
import type { AnchorTxTemplate } from "./anchor-tx.js";
import { buildReceipt, type Receipt, type ReceiptInput } from "./send-flow.js";
import type {
  TokenTransferTemplate,
  TransferTxTemplate,
  UtxoTokenContents,
} from "./transfer-tx.js";

const sha256Promise = instantiateSha256();

export type SignFlowErrorCode =
  | "WALLET_REFUSED"
  | "TAMPERED"
  | "MALFORMED"
  | "BROADCAST_FAILED";

/**
 * A flow failure with its machine-readable code. `check` names the
 * verification check that failed — TAMPERED only; undefined for
 * the other codes. Callers branch on `code` (and `check`), never
 * on message text.
 */
export class SignFlowError extends Error {
  readonly code: SignFlowErrorCode;
  readonly check?: string;

  constructor(code: SignFlowErrorCode, message: string, check?: string) {
    super(message);
    this.name = "SignFlowError";
    this.code = code;
    if (check !== undefined) this.check = check;
  }
}

/**
 * One source output of a transfer sign payload. Mirrors
 * AnchorSignPayload's entry plus the token contents when the
 * spent UTXO carries CashTokens: the protocol's WcSourceOutput is
 * libauth's Input & Output, and a token input's signing
 * serialization covers its token prefix — a payload that omitted
 * it would describe a different UTXO than the one being spent.
 */
export interface TransferSourceOutput {
  outpointTransactionHash: Uint8Array;
  outpointIndex: number;
  sequenceNumber: number;
  unlockingBytecode: Uint8Array;
  lockingBytecode: Uint8Array;
  valueSatoshis: bigint;
  token?: UtxoTokenContents;
}

/** The transfer twin of AnchorSignPayload — same envelope, same
 *  broadcast: false rule, one source output per spent UTXO. */
export interface TransferSignPayload {
  transaction: {
    transaction: string;
    sourceOutputs: TransferSourceOutput[];
    broadcast: boolean;
    userPrompt: string;
  };
  inputPaths: Array<[number, string, number]>;
}

export type SignFlowPayload = AnchorSignPayload | TransferSignPayload;

/** The slice of the wallet manager the flows need — the same
 *  structural slice anchor-sign.ts defined; the real
 *  DappConnectionManager satisfies it. */
export interface SignFlowManager {
  signTransaction(request: SignFlowPayload): Promise<{
    signedTransaction: string;
    error?: string;
  }>;
}

/**
 * The flow's only side effect, injected: put this verified signed
 * transaction on the network. Resolving means the network side
 * accepted it; throwing means it did not (see BROADCAST_FAILED
 * for the caller's obligations then).
 */
export type BroadcastTx = (signedTxHex: string) => Promise<void>;

export interface SignFlowResult {
  receipt: Receipt;
  /** Transaction id in display order (the order explorers print). */
  txid: string;
  /** The exact verified signed blob that was broadcast. */
  signedHex: string;
}

/** Receipt fields every flow needs except the txid — the flow
 *  learns the txid only from the verified signed transaction, so
 *  a caller-supplied txid could only ever disagree with it. */
export type SignFlowReceiptFields = Omit<ReceiptInput, "txid">;

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function transactionIdHex(encoded: Uint8Array): Promise<string> {
  const sha256 = await sha256Promise;
  const digest = sha256.hash(sha256.hash(encoded));
  return binToHex(Uint8Array.from(digest).reverse());
}

/**
 * Ask the wallet to sign and return the raw signed hex. A
 * manager-reported error — or the request itself throwing, e.g.
 * the relay dropping mid-flight — is WALLET_REFUSED: from the
 * flow's side nothing was verifiably signed, and "the user said
 * no / the wallet never answered" is the only honest reading. An
 * empty success body is MALFORMED instead: the wallet claims it
 * signed but handed back nothing checkable.
 */
async function askWalletToSign(
  manager: SignFlowManager,
  payload: SignFlowPayload,
): Promise<string> {
  let response: { signedTransaction: string; error?: string };
  try {
    response = await manager.signTransaction(payload);
  } catch (error) {
    throw new SignFlowError(
      "WALLET_REFUSED",
      `sign-flow: the sign request itself failed (${describe(error)}) — ` +
        "nothing was signed and nothing was broadcast",
    );
  }
  if (response.error !== undefined && response.error !== "") {
    throw new SignFlowError(
      "WALLET_REFUSED",
      `sign-flow: wallet refused to sign (${response.error})`,
    );
  }
  if (
    typeof response.signedTransaction !== "string" ||
    response.signedTransaction === ""
  ) {
    throw new SignFlowError(
      "MALFORMED",
      "sign-flow: wallet reported success but returned no signed transaction",
    );
  }
  return response.signedTransaction;
}

/**
 * Broadcast a verified blob, then — and only then — mint the
 * receipt. A broadcast failure is BROADCAST_FAILED and carries
 * the caller's instructions in its message: the signed blob is
 * valid and final, so re-signing is both pointless and dangerous
 * (if the failure happened after the network accepted the blob,
 * a second spend of the same inputs is a double-spend attempt).
 */
async function broadcastThenReceipt(
  broadcast: BroadcastTx,
  signedHex: string,
  txid: string,
  receiptFields: SignFlowReceiptFields,
): Promise<SignFlowResult> {
  try {
    await broadcast(signedHex);
  } catch (error) {
    throw new SignFlowError(
      "BROADCAST_FAILED",
      `sign-flow: broadcast failed (${describe(error)}). Transaction ${txid} ` +
        "is signed and verified but was NOT confirmed accepted by the " +
        "network, and no receipt was issued. The caller should check " +
        "whether the txid reached the network, then re-broadcast the " +
        "same signed hex if it did not — never rebuild or re-sign.",
    );
  }
  return {
    receipt: buildReceipt({ ...receiptFields, txid }),
    txid,
    signedHex,
  };
}

/**
 * Build the sign payload for a transfer template: source outputs
 * are the template's spentUtxos in input order (the material the
 * wallet needs to construct each input's signing serialization),
 * and inputPaths follow the anchor bridge's convention — every
 * spent UTXO sits on the receive path this app derives its
 * address from (child 0); the wallet resolves the actual keys.
 */
export function buildTransferSignPayload(
  template: TransferTxTemplate,
  userPrompt = "Sign this Bitcoin Cash transfer?",
): TransferSignPayload {
  return {
    transaction: {
      transaction: binToHex(template.encoded),
      sourceOutputs: template.spentUtxos.map((utxo, position) => {
        const input = template.transaction.inputs[position];
        const sourceOutput: TransferSourceOutput = {
          outpointTransactionHash: utxo.txid,
          outpointIndex: utxo.index,
          sequenceNumber: input?.sequenceNumber ?? 0xffffffff,
          unlockingBytecode: new Uint8Array(),
          lockingBytecode: utxo.lockingBytecode,
          valueSatoshis: utxo.valueSats,
        };
        if (utxo.token !== undefined) sourceOutput.token = utxo.token;
        return sourceOutput;
      }),
      broadcast: false,
      userPrompt,
    },
    inputPaths: template.spentUtxos.map(
      () => [0, "receive", 0] as [number, string, number],
    ),
  };
}

function tampered(check: string, detail: string): SignFlowError {
  return new SignFlowError(
    "TAMPERED",
    `sign-flow: signed transaction failed verification (${check}): ${detail}`,
    check,
  );
}

/** Parse a signed blob into its encoding. Anything that is not
 *  well-formed hex of a decodable BCH transaction is MALFORMED —
 *  it cannot even be compared against the template. */
function parseSignedHex(signedTxHex: string): {
  encoded: Uint8Array;
  decoded: TransactionBCH;
} {
  if (
    typeof signedTxHex !== "string" ||
    !/^(?:[0-9a-f]{2})+$/.test(signedTxHex)
  ) {
    throw new SignFlowError(
      "MALFORMED",
      "sign-flow: signed transaction is not even-length lowercase hex",
    );
  }
  const encoded = Uint8Array.from(
    signedTxHex.match(/../g)!.map((pair) => parseInt(pair, 16)),
  );
  const decoded = decodeTransactionBCH(encoded);
  if (typeof decoded === "string") {
    throw new SignFlowError(
      "MALFORMED",
      `sign-flow: signed transaction does not decode (${decoded})`,
    );
  }
  return { encoded, decoded };
}

/**
 * Verify a wallet-signed transfer against its built template —
 * the verifier R28 never had. The signed transaction must spend
 * exactly the template's spentUtxos, in order (same outpoints,
 * same sequences; only the unlocking bytecode may appear, and
 * each unlock must be a plausible P2PKH unlock, 100–110 bytes —
 * the anchor verifier's rule), and every output must be
 * byte-identical to the template's: value, locking bytecode, and
 * token prefix all ride in the encoded output, so a swapped
 * recipient, a skimmed change output, or an altered token amount
 * each fail the same comparison. Any deviation is TAMPERED with
 * the failed check named; a blob that cannot be parsed at all is
 * MALFORMED instead.
 */
export async function verifySignedTransfer(
  template: TransferTxTemplate,
  signedTxHex: string,
): Promise<{ txidHex: string }> {
  const { encoded, decoded } = parseSignedHex(signedTxHex);
  const expected = template.transaction;
  if (
    decoded.version !== expected.version ||
    decoded.locktime !== expected.locktime
  ) {
    throw tampered(
      "header",
      `version/locktime changed (got version ${decoded.version}, locktime ${decoded.locktime})`,
    );
  }
  if (decoded.inputs.length !== template.spentUtxos.length) {
    throw tampered(
      "input-count",
      `template spends ${template.spentUtxos.length} UTXOs, ` +
        `signed tx has ${decoded.inputs.length} inputs`,
    );
  }
  decoded.inputs.forEach((input, position) => {
    const spent = template.spentUtxos[
      position
    ] as TransferTxTemplate["spentUtxos"][number];
    const templateInput = expected.inputs[position];
    if (
      !bytesEqual(input.outpointTransactionHash, spent.txid) ||
      input.outpointIndex !== spent.index
    ) {
      throw tampered(
        "input-outpoint",
        `input ${position} does not spend the template's UTXO ${position}`,
      );
    }
    if (templateInput !== undefined && input.sequenceNumber !== templateInput.sequenceNumber) {
      throw tampered(
        "input-sequence",
        `input ${position} sequence changed ` +
          `(${templateInput.sequenceNumber} → ${input.sequenceNumber})`,
      );
    }
    const unlockBytes = input.unlockingBytecode.length;
    if (unlockBytes < 100 || unlockBytes > 110) {
      throw tampered(
        "input-unlock",
        `input ${position} unlock is ${unlockBytes} bytes, not a P2PKH unlock (100–110)`,
      );
    }
  });
  if (decoded.outputs.length !== expected.outputs.length) {
    throw tampered(
      "output-count",
      `template has ${expected.outputs.length} outputs, signed tx has ${decoded.outputs.length}`,
    );
  }
  decoded.outputs.forEach((output, position) => {
    const templateOutput = expected.outputs[position];
    if (templateOutput === undefined) return;
    if (
      binToHex(encodeTransactionOutput(output)) !==
      binToHex(encodeTransactionOutput(templateOutput))
    ) {
      throw tampered(
        "output-bytes",
        `output ${position} differs from the built template ` +
          "(value, locking bytecode, or token contents)",
      );
    }
  });
  return { txidHex: await transactionIdHex(encoded) };
}

/**
 * The anchor verifier predates the error taxonomy and throws
 * plain Errors; map its messages onto the codes. "Not hex" /
 * "does not decode" are MALFORMED (unparseable); every other
 * rejection is a comparison the blob failed — TAMPERED, with the
 * check named after the anchor property that was violated.
 */
function classifyAnchorVerificationFailure(error: unknown): SignFlowError {
  const message = describe(error);
  if (message.includes("is not hex") || message.includes("does not decode")) {
    return new SignFlowError("MALFORMED", message);
  }
  const check = message.includes("changed the anchor shape")
    ? "anchor-shape"
    : message.includes("does not carry our report hash")
      ? "anchor-output"
      : message.includes("not unlocked")
        ? "input-unlock"
        : "anchor-verification";
  return new SignFlowError("TAMPERED", message, check);
}

export interface AnchorSignFlowRequest {
  template: AnchorTxTemplate;
  fundingUtxo: AnchorFundingUtxo;
  reportHash: Uint8Array;
  receiptFields: SignFlowReceiptFields;
  userPrompt?: string;
}

/**
 * Anchor flow: payload from the R27 bridge, signature verified by
 * the R27 verifier (reused, not reimplemented), broadcast only
 * after verification, receipt minted from the verified txid.
 */
export async function executeAnchorSignFlow(
  manager: SignFlowManager,
  broadcast: BroadcastTx,
  request: AnchorSignFlowRequest,
): Promise<SignFlowResult> {
  const payload = buildAnchorSignPayload(
    request.template,
    request.fundingUtxo,
    request.userPrompt,
  );
  const signedHex = await askWalletToSign(manager, payload);
  let verified: { signedTxHex: string; txidHex: string };
  try {
    verified = await verifySignedAnchor(signedHex, request.reportHash);
  } catch (error) {
    throw classifyAnchorVerificationFailure(error);
  }
  return broadcastThenReceipt(
    broadcast,
    verified.signedTxHex,
    verified.txidHex,
    request.receiptFields,
  );
}

export interface TransferSignFlowRequest {
  receiptFields: SignFlowReceiptFields;
  userPrompt?: string;
}

async function executeTransferSignFlow(
  manager: SignFlowManager,
  broadcast: BroadcastTx,
  template: TransferTxTemplate,
  request: TransferSignFlowRequest,
  defaultPrompt: string,
): Promise<SignFlowResult> {
  const payload = buildTransferSignPayload(
    template,
    request.userPrompt ?? defaultPrompt,
  );
  const signedHex = await askWalletToSign(manager, payload);
  const verified = await verifySignedTransfer(template, signedHex);
  return broadcastThenReceipt(
    broadcast,
    signedHex,
    verified.txidHex,
    request.receiptFields,
  );
}

/** Plain BCH send, end to end: sign → verify → broadcast → receipt. */
export async function executeBchSendFlow(
  manager: SignFlowManager,
  broadcast: BroadcastTx,
  template: TransferTxTemplate,
  request: TransferSignFlowRequest,
): Promise<SignFlowResult> {
  return executeTransferSignFlow(
    manager,
    broadcast,
    template,
    request,
    "Send BCH on Bitcoin Cash mainnet?",
  );
}

/** CashToken send (fungible or NFT), end to end — same path; the
 *  template's token outputs are part of what gets verified. */
export async function executeTokenSendFlow(
  manager: SignFlowManager,
  broadcast: BroadcastTx,
  template: TokenTransferTemplate,
  request: TransferSignFlowRequest,
): Promise<SignFlowResult> {
  return executeTransferSignFlow(
    manager,
    broadcast,
    template,
    request,
    "Send CashTokens on Bitcoin Cash mainnet?",
  );
}
