/**
 * Confirmation status — practice (spike-local only, NOT the
 * submission repo). The live half of the History view that R37's
 * store could not carry: a receipt is minted with the status
 * "broadcast" (R31's buildReceipt freezes exactly that), and
 * whether its transaction has since been mined is a fact about
 * the chain that changes over time. This module derives that
 * fact from exactly two numbers (the block height the
 * transaction's merkle proof reports, and the current chain
 * tip) and fetches those numbers over an injected Electrum
 * call — the same injection wallet-utxos.ts uses, so browsers
 * speak WSS and tests speak fakes.
 *
 * Honesty rules, mirroring the store's:
 * - A status is only ever derived from a merkle proof the node
 *   actually returned. A failed call, a malformed answer, or a
 *   missing chain tip produces NO update for that transaction —
 *   the caller keeps the last recorded status. Nothing here
 *   guesses "confirmed".
 * - The derivation is pure and deterministic: no I/O, no clock
 *   reads. The fetch half is a thin shell over it.
 */
import type { ElectrumCall } from "./wallet-utxos.js";

export type ConfirmationState = "broadcast" | "confirmed";

/**
 * A transaction's confirmation status at one checked moment.
 * state "broadcast": not yet in a block — confirmations is 0
 * and blockHeight is null. state "confirmed": blockHeight is
 * the block the transaction sits in, and confirmations counts
 * that block plus every block mined on top of it.
 */
export interface ConfirmationStatus {
  state: ConfirmationState;
  confirmations: number;
  blockHeight: number | null;
}

/** The status every receipt starts with at mint time. Frozen:
 *  callers share it, nobody edits it. */
export const BROADCAST_STATUS: ConfirmationStatus = Object.freeze({
  state: "broadcast",
  confirmations: 0,
  blockHeight: null,
});

/**
 * Derive the status from a merkle proof's block height and the
 * chain tip.
 *
 * blockHeight null, 0, or negative means the node sees the
 * transaction outside any block: Electrum reports 0 for the
 * mempool and a negative height for a mempool transaction that
 * spends unconfirmed parents. All three are "broadcast".
 *
 * The height > tip edge: it happens when the tip was read a
 * moment before a reorg, or from a node a block behind the one
 * that answered the merkle call. The raw count (tip − height +
 * 1) would come out at zero or negative, but the merkle proof
 * itself is the stronger evidence — the transaction IS in that
 * block — so the count floors at 1 rather than reporting a
 * confirmed transaction as unconfirmed.
 */
export function deriveConfirmationStatus(
  blockHeight: number | null,
  chainTip: number,
): ConfirmationStatus {
  if (!Number.isInteger(chainTip) || chainTip < 0) {
    throw new RangeError(
      `history-status: chainTip must be a non-negative integer, got ${chainTip}`,
    );
  }
  if (blockHeight !== null && !Number.isInteger(blockHeight)) {
    throw new TypeError(
      `history-status: blockHeight must be null or an integer, got ${blockHeight}`,
    );
  }
  if (blockHeight === null || blockHeight <= 0) {
    return { state: "broadcast", confirmations: 0, blockHeight: null };
  }
  const confirmations = Math.max(1, chainTip - blockHeight + 1);
  return { state: "confirmed", confirmations, blockHeight };
}

/** The chain tip from a blockchain.headers.subscribe answer.
 *  Servers return the tip header object; a one-element array of
 *  it also appears in the wild. Anything else is not a tip this
 *  module will invent a height for — null, and the caller makes
 *  no updates at all (a confirmation count without a tip would
 *  be a fabricated number). */
function readTipHeight(result: unknown): number | null {
  let header: unknown = result;
  if (Array.isArray(header)) header = header[0];
  if (header === null || typeof header !== "object") return null;
  const height = (header as { height?: unknown }).height;
  return typeof height === "number" && Number.isInteger(height) && height >= 0
    ? height
    : null;
}

/** The block height from a blockchain.transaction.get_merkle
 *  answer: an integer (≤ 0 means mempool, per the derivation
 *  above), or null when the answer does not carry one — a
 *  malformed reply is no evidence either way. */
function readMerkleHeight(result: unknown): number | null {
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }
  const height = (result as { block_height?: unknown }).block_height;
  return typeof height === "number" && Number.isInteger(height)
    ? height
    : null;
}

/**
 * Fetch fresh statuses for a batch of transactions. Returns a
 * map with an entry ONLY for transactions whose merkle call
 * succeeded with a usable height; every other transaction is
 * absent, which the caller reads as "keep the last known
 * status". If the chain tip itself cannot be read, the map is
 * empty: without a tip there is no honest confirmation count
 * for anyone.
 *
 * The merkle calls run in parallel (the Electrum session
 * multiplexes them over one socket), so a dead server costs
 * the batch one timeout window, not one per transaction.
 */
export async function fetchConfirmationUpdates(
  call: ElectrumCall,
  txids: readonly string[],
): Promise<Map<string, ConfirmationStatus>> {
  const updates = new Map<string, ConfirmationStatus>();
  if (txids.length === 0) return updates;
  let chainTip: number | null;
  try {
    chainTip = readTipHeight(await call("blockchain.headers.subscribe", []));
  } catch {
    return updates;
  }
  if (chainTip === null) return updates;
  const tip = chainTip;
  await Promise.all(
    txids.map(async (txid) => {
      try {
        const height = readMerkleHeight(
          await call("blockchain.transaction.get_merkle", [txid]),
        );
        if (height === null) return;
        updates.set(txid, deriveConfirmationStatus(height, tip));
      } catch {
        // Unknown transaction, dead server, timeout: no update.
        // The stored status stands, exactly as if this check
        // had never run.
      }
    }),
  );
  return updates;
}
