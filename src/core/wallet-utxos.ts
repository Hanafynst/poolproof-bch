/**
 * Wallet UTXO source — practice (spike-local only, NOT the submission
 * repo). Closes the R28 gap: transfer-tx.ts consumes SpendableUtxo[]
 * but nothing produced them from a real address. This module does:
 * address -> Electrum listunspent -> normalized SpendableUtxo[],
 * plus indexWalletHoldings(), the grouping behind the Send asset
 * picker and the holdings list.
 *
 * SOURCE VERDICT (hunted live 2026-11-13; every claim below was
 * read off an actual response, none guessed):
 * No public REST API serves CashToken UTXOs by address. Probes:
 * Watchtower (watchtower.cash/api/utxos/{bch,ct}/<addr> -> 404; its
 * public root lists token-metadata endpoints only), FullStack.cash
 * bch-api (the v5 path now serves the SPA shell), Blockchair
 * (IP-blacklisted without an API key), bchexplorer.cash Blockbook
 * (behind a proof-of-work bot wall), explorer.bitcoinunlimited.info
 * /api/v2 (404), api.haskoin.com/bch (404 on every route tried),
 * TokenStork (no address endpoint), Chaingraph demo GraphQL
 * (Cloudflare 520, origin down). The Riften indexer is Cauldron-only.
 *
 * What works, proven the same day: the Electrum protocol against a
 * public Fulcrum — electrum.imaginary.cash:50002 (TLS), Fulcrum
 * 2.1.4 at the real mainnet tip. blockchain.scripthash.listunspent
 * returned a real address's 5 UTXOs with a coherent get_balance;
 * blockchain.transaction.get returned raw txs whose CashToken
 * outputs libauth decoded byte-exact (a Cauldron pool tx: 56 PUSD
 * outputs incl. 1,494 PUSD at the exact outpoint the Riften indexer
 * reported, 6,712,184 sats). In the browser the same ElectrumCall
 * is a WSS JSON-RPC client (Fulcrum serves WSS on :50004); this
 * module is transport-blind on purpose.
 *
 * TOKEN CONTENTS, two paths: if a listunspent entry carries the
 * server's token_data, it is used as-is (fast path). Otherwise the
 * entry's creating transaction is fetched once (deduped by txid)
 * and the exact output decoded — the only complete read on a
 * server that omits token_data, at the cost of one extra call per
 * unique creating tx. Skipping that check would silently classify
 * token UTXOs as plain BCH, and the plain-BCH builder would burn
 * their tokens: completeness wins.
 *
 * R60 CORRECTION (read off live responses, 2026-11-14): the fast
 * path was unreachable and the slow path blind on this server,
 * because Fulcrum's listunspent takes a token filter as its
 * second parameter — "exclude_tokens" (the DEFAULT), 
 * "include_tokens", "tokens_only" — and the default does not
 * attach token_data, it omits token UTXOs from the result
 * entirely. An address holding 11 real NFTs returned [] without
 * the filter and 11 entries with it. Every listunspent this app
 * makes (this fetch, the receive watch in App.tsx) passes
 * "include_tokens". The same round's capture also fixed the
 * token_data shape this header once described from docs: the
 * category key on the wire is "category", not "category_id"
 * (both are now accepted). The real response is saved as
 * fixtures/wallet-utxos-fulcrum-listunspent-nft-real.json.
 *
 * Traps recorded:
 *  - Scripthash byte order: sha256(locking bytecode) with the
 *    digest REVERSED, hex — Electrum's convention, opposite of the
 *    digest's natural order. The fixture test pins it against a
 *    scripthash the server itself answered for.
 *  - Cauldron indexer "owner_p2pkh_addr" is the pool OWNER, not
 *    the address holding the pool UTXO (the UTXO sits at the
 *    covenant script) — an early "decisive" control failed on
 *    exactly this misreading.
 *  - TokenStork holder addresses (PUSD + 0LANDO top holders) all
 *    read EMPTY on Fulcrum (zero balance, no history) despite
 *    valid checksums. Unresolved — TokenStork's snapshot basis
 *    differs from live chain state somehow — so no TokenStork
 *    address is used as a live test address anywhere here.
 *  - token_data.category_id is taken as display-order hex (the
 *    order token ids are printed), matching transfer-tx's
 *    category convention; the tx-decode path cross-validates the
 *    convention end-to-end (libauth Output.token.category is
 *    display-order bytes).
 *  - Outpoint txids are ALSO display order in libauth's
 *    transaction model (R60): a real mint transaction decoded with
 *    libauth returns its first input's outpoint hash as the
 *    funding transaction's printed txid, and encode(decode(tx))
 *    is byte-identical on the captured pool transaction. Nothing
 *    in this module reverses a txid; the section-20 template
 *    regression (fixture UTXOs -> built template -> decoded
 *    inputs must be the fixture's own outpoints) pins it.
 */
import {
  binToHex,
  cashAddressToLockingBytecode,
  decodeTransaction,
  hexToBin,
  instantiateSha256,
} from "@bitauth/libauth";
import {
  MAX_TOKEN_AMOUNT,
  type NftCapability,
  type SpendableUtxo,
  type UtxoTokenContents,
} from "./transfer-tx.js";

const sha256Ready = instantiateSha256();

/** One Electrum JSON-RPC call. Injected: browsers speak WSS, the
 *  live script tunnels TLS — the module never dials by itself. */
export type ElectrumCall = (
  method: string,
  params: unknown[],
) => Promise<unknown>;

/** Decode + validate a mainnet CashAddress, returning its locking
 *  bytecode. libauth returns an error STRING (never throws) on a
 *  bad checksum; that becomes a thrown Error here. */
export function addressLockingBytecode(address: string): Uint8Array {
  const decoded = cashAddressToLockingBytecode(address);
  if (typeof decoded === "string") {
    throw new Error(`wallet-utxos: invalid address (${decoded})`);
  }
  if (decoded.prefix !== "bitcoincash") {
    throw new Error(
      `wallet-utxos: address is for ${decoded.prefix}, not BCH mainnet`,
    );
  }
  return decoded.bytecode;
}

/** Electrum scripthash of an address: sha256 of its locking
 *  bytecode, digest bytes reversed, hex. Throws on a bad address. */
export async function scripthashForAddress(
  address: string,
): Promise<string> {
  return scripthashForLockingBytecode(addressLockingBytecode(address));
}

export async function scripthashForLockingBytecode(
  lockingBytecode: Uint8Array,
): Promise<string> {
  const sha256 = await sha256Ready;
  const digest = sha256.hash(lockingBytecode);
  return binToHex(Uint8Array.from(digest).reverse());
}

/** A listunspent entry, normalized. txid is DISPLAY-order hex (the
 *  order explorers print); conversion to libauth's internal order
 *  happens in spendableUtxoFromElectrum. */
export interface ElectrumUtxo {
  txid: string;
  index: number;
  valueSats: bigint;
  /** Block height; 0 = unconfirmed. */
  height: number;
  /** Present only when the server attached token_data. */
  token?: UtxoTokenContents;
}

const HEX_64 = /^[0-9a-f]{64}$/;
const HEX_EVEN = /^([0-9a-f]{2})*$/;
const NFT_CAPABILITIES: readonly NftCapability[] = [
  "none",
  "mutable",
  "minting",
];

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new TypeError(`wallet-utxos: ${what} is not an object`);
  }
  return value as Record<string, unknown>;
}

function nonNegativeInt(value: unknown, what: string): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new TypeError(
      `wallet-utxos: ${what} must be a non-negative integer, got ${JSON.stringify(value)}`,
    );
  }
  return value;
}

/** Token amounts cross JSON as strings on careful servers and as
 *  numbers on careless ones. A number above the safe-integer range
 *  has already lost precision in transit — reject it rather than
 *  build a balance on a rounded figure. */
function tokenAmount(value: unknown, what: string): bigint {
  if (typeof value === "string") {
    if (!/^[0-9]+$/.test(value)) {
      throw new TypeError(
        `wallet-utxos: ${what} is not a non-negative integer string: "${value}"`,
      );
    }
    const amount = BigInt(value);
    // The wire format is int64: a larger figure cannot exist
    // on-chain, and letting it through would only crash the
    // transfer builders inside libauth's encoder (R30). The
    // number path below is bounded by the safe-integer check,
    // which is tighter than int64, so it needs no second cap.
    if (amount > MAX_TOKEN_AMOUNT) {
      throw new TypeError(
        `wallet-utxos: ${what} exceeds the CashTokens int64 maximum (${MAX_TOKEN_AMOUNT})`,
      );
    }
    return amount;
  }
  return BigInt(nonNegativeInt(value, what));
}

function parseTokenData(value: unknown, what: string): UtxoTokenContents {
  const data = asRecord(value, what);
  // Fulcrum's token_data names this key "category" (R60, read off
  // a real captured response); "category_id" is accepted as a
  // fallback for servers using the other spelling.
  const categoryId = data.category ?? data.category_id;
  if (typeof categoryId !== "string" || !HEX_64.test(categoryId.toLowerCase())) {
    throw new TypeError(`wallet-utxos: ${what}.category is not 64 hex chars`);
  }
  const token: UtxoTokenContents = {
    category: hexToBin(categoryId.toLowerCase()),
    amount: tokenAmount(data.amount, `${what}.amount`),
  };
  if (data.nft !== undefined && data.nft !== null) {
    const nft = asRecord(data.nft, `${what}.nft`);
    const capability = nft.capability;
    if (
      typeof capability !== "string" ||
      !NFT_CAPABILITIES.includes(capability as NftCapability)
    ) {
      throw new TypeError(
        `wallet-utxos: ${what}.nft.capability is not a CashTokens capability: ${JSON.stringify(capability)}`,
      );
    }
    const commitment = nft.commitment;
    if (
      typeof commitment !== "string" ||
      !HEX_EVEN.test(commitment.toLowerCase()) ||
      commitment.length > 80
    ) {
      throw new TypeError(
        `wallet-utxos: ${what}.nft.commitment is not even-length hex of at most 40 bytes`,
      );
    }
    token.nft = {
      capability: capability as NftCapability,
      commitment: hexToBin(commitment.toLowerCase()),
    };
  }
  return token;
}

/** Parse a blockchain.scripthash.listunspent result. Malformed
 *  data fails loud: a UTXO set built by silently dropping entries
 *  could understate the wallet and misclassify the rest. */
export function parseListunspent(payload: unknown): ElectrumUtxo[] {
  if (!Array.isArray(payload)) {
    throw new TypeError("wallet-utxos: listunspent result is not an array");
  }
  const seenOutpoints = new Set<string>();
  return payload.map((raw, position) => {
    const what = `listunspent[${position}]`;
    const entry = asRecord(raw, what);
    const txHash = entry.tx_hash;
    if (typeof txHash !== "string" || !HEX_64.test(txHash.toLowerCase())) {
      throw new TypeError(`wallet-utxos: ${what}.tx_hash is not 64 hex chars`);
    }
    const utxo: ElectrumUtxo = {
      txid: txHash.toLowerCase(),
      index: nonNegativeInt(entry.tx_pos, `${what}.tx_pos`),
      valueSats: BigInt(nonNegativeInt(entry.value, `${what}.value`)),
      height:
        entry.height === undefined
          ? 0
          : nonNegativeInt(entry.height, `${what}.height`),
    };
    // A response naming one outpoint twice would double-count the
    // wallet in the holdings index and double-spend it in a build
    // (the builders refuse it too — this is the same corruption
    // caught at the source, R30).
    const outpoint = `${utxo.txid}:${utxo.index}`;
    if (seenOutpoints.has(outpoint)) {
      throw new TypeError(`wallet-utxos: ${what} duplicates outpoint ${outpoint}`);
    }
    seenOutpoints.add(outpoint);
    if (entry.token_data !== undefined && entry.token_data !== null) {
      utxo.token = parseTokenData(entry.token_data, `${what}.token_data`);
    }
    return utxo;
  });
}

/** The token contents of one output of a raw transaction, decoded
 *  with libauth — the authoritative read, independent of any
 *  server's token support. Returns undefined for a plain output. */
export function tokenContentsInTransaction(
  rawTxHex: string,
  vout: number,
): UtxoTokenContents | undefined {
  if (!HEX_EVEN.test(rawTxHex.toLowerCase()) || rawTxHex.length === 0) {
    throw new TypeError("wallet-utxos: raw transaction is not hex");
  }
  const decoded = decodeTransaction(hexToBin(rawTxHex.toLowerCase()));
  if (typeof decoded === "string") {
    throw new Error(`wallet-utxos: transaction does not decode (${decoded})`);
  }
  const output = decoded.outputs[vout];
  if (output === undefined) {
    throw new RangeError(
      `wallet-utxos: transaction has no output ${vout} (it has ${decoded.outputs.length})`,
    );
  }
  if (output.token === undefined) return undefined;
  const token: UtxoTokenContents = {
    category: Uint8Array.from(output.token.category),
    amount: output.token.amount,
  };
  if (output.token.nft !== undefined) {
    token.nft = {
      capability: output.token.nft.capability,
      commitment: Uint8Array.from(output.token.nft.commitment),
    };
  }
  return token;
}

/** Map one normalized entry to the SpendableUtxo transfer-tx
 *  consumes. The outpoint txid stays in DISPLAY order — the order
 *  libauth's transaction model itself uses (R60, decode-proven
 *  against a real mint transaction; see the header traps). An
 *  earlier version reversed it here on a documented-but-wrong
 *  "internal order" assumption, which made every template built
 *  from these UTXOs reference a nonexistent outpoint.
 *  tokenFromTx is the tx-decode fallback result for entries whose
 *  server attached no token_data. */
export function spendableUtxoFromElectrum(
  entry: ElectrumUtxo,
  lockingBytecode: Uint8Array,
  tokenFromTx?: UtxoTokenContents,
): SpendableUtxo {
  const utxo: SpendableUtxo = {
    txid: hexToBin(entry.txid),
    index: entry.index,
    valueSats: entry.valueSats,
    lockingBytecode,
  };
  const token = entry.token ?? tokenFromTx;
  if (token !== undefined) utxo.token = token;
  return utxo;
}

/** Fetch and normalize every UTXO of a mainnet address. The
 *  request carries Fulcrum's "include_tokens" filter: without it
 *  the server's default response excludes token UTXOs entirely
 *  (R60 — an address holding 11 NFTs read as an empty wallet).
 *  Entries whose server attached no token_data are resolved by
 *  decoding their creating transaction (one call per unique
 *  txid) — see the header for why that cost is paid. Throws on a
 *  bad address, a transport error from `call`, or malformed
 *  server data. */
export async function fetchAddressUtxos(
  address: string,
  call: ElectrumCall,
): Promise<SpendableUtxo[]> {
  const lockingBytecode = addressLockingBytecode(address);
  const scripthash = await scripthashForLockingBytecode(lockingBytecode);
  const entries = parseListunspent(
    await call("blockchain.scripthash.listunspent", [
      scripthash,
      "include_tokens",
    ]),
  );
  const unresolved = entries.filter((entry) => entry.token === undefined);
  const rawTxByTxid = new Map<string, string>();
  for (const txid of new Set(unresolved.map((entry) => entry.txid))) {
    const raw = await call("blockchain.transaction.get", [txid]);
    if (typeof raw !== "string") {
      throw new TypeError(
        `wallet-utxos: transaction.get for ${txid} did not return raw hex`,
      );
    }
    rawTxByTxid.set(txid, raw);
  }
  return entries.map((entry) => {
    if (entry.token !== undefined) {
      return spendableUtxoFromElectrum(entry, lockingBytecode);
    }
    const raw = rawTxByTxid.get(entry.txid) as string;
    return spendableUtxoFromElectrum(
      entry,
      lockingBytecode,
      tokenContentsInTransaction(raw, entry.index),
    );
  });
}

export interface FungibleHolding {
  /** Category id, display-order hex. */
  category: string;
  /** Summed over EVERY UTXO of the category, NFT-carrying ones
   *  included — the amount riding in an NFT's UTXO is real balance
   *  that moves with the NFT (the transfer-tx rule). */
  totalAmount: bigint;
  utxoCount: number;
}

export interface NftHolding {
  category: string;
  /** Commitment hex — the individual NFT's identity bytes. */
  commitment: string;
  capability: NftCapability;
  utxoRef: { txid: string; index: number };
}

export interface WalletHoldings {
  /** Satoshis across ALL UTXOs, token-carrying included: their
   *  sats are BCH the wallet owns (and what funds token sends). */
  bchSats: bigint;
  /** Sorted by category hex — deterministic for rendering. */
  fungibles: FungibleHolding[];
  /** Sorted by category, then commitment. */
  nfts: NftHolding[];
}

/** Group a wallet's UTXOs into what the Send asset picker and the
 *  holdings list render. Pure and deterministic. */
export function indexWalletHoldings(
  utxos: SpendableUtxo[],
): WalletHoldings {
  let bchSats = 0n;
  const fungibleByCategory = new Map<string, FungibleHolding>();
  const nfts: NftHolding[] = [];
  for (const utxo of utxos) {
    bchSats += utxo.valueSats;
    if (utxo.token === undefined) continue;
    const category = binToHex(utxo.token.category);
    const holding = fungibleByCategory.get(category) ?? {
      category,
      totalAmount: 0n,
      utxoCount: 0,
    };
    holding.totalAmount += utxo.token.amount;
    holding.utxoCount += 1;
    fungibleByCategory.set(category, holding);
    if (utxo.token.nft !== undefined) {
      nfts.push({
        category,
        commitment: binToHex(utxo.token.nft.commitment),
        capability: utxo.token.nft.capability,
        utxoRef: {
          txid: binToHex(utxo.txid),
          index: utxo.index,
        },
      });
    }
  }
  const byString = (a: string, b: string): number =>
    a < b ? -1 : a > b ? 1 : 0;
  return {
    bchSats,
    fungibles: [...fungibleByCategory.values()].sort((a, b) =>
      byString(a.category, b.category),
    ),
    nfts: nfts.sort(
      (a, b) =>
        byString(a.category, b.category) ||
        byString(a.commitment, b.commitment),
    ),
  };
}
