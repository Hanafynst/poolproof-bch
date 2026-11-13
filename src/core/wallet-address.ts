/**
 * Wallet address derivation.
 *
 * WizardConnect's DappConnectionManager hands the dapp raw pubkeys
 * (getPubkey(childIndex, index)); turning one into the CashAddress a
 * user recognises is the dapp's own job: hash160 = RIPEMD160(SHA256(
 * pubkey)), then CashAddress-encode as p2pkh. Proven offline against
 * the generator point: its hash160 is 751e76e8… (cross-checked with
 * an independent Python hashlib computation, and the same payload
 * our anchor-tx tests lock to), encoding to
 * bitcoincash:qp63uahgrxged4z5jswyt5dn5v3lzsem6cy4spdc2h, verified
 * by decoding that address back to the identical payload.
 */
import {
  CashAddressType,
  encodeCashAddress,
  instantiateRipemd160,
  instantiateSha256,
} from "@bitauth/libauth";

// libauth v3: WASM instantiation is async — start both once at
// module load, await per call (same pattern as anchor.ts).
const sha256Ready = instantiateSha256();
const ripemd160Ready = instantiateRipemd160();

async function pubkeyPayload(pubkey: Uint8Array): Promise<Uint8Array> {
  if (pubkey.length !== 33 && pubkey.length !== 65) {
    throw new RangeError(`pubkey must be 33 or 65 bytes, got ${pubkey.length}`);
  }
  const sha256 = await sha256Ready;
  const ripemd160 = await ripemd160Ready;
  return ripemd160.hash(sha256.hash(pubkey));
}

function encodePayload(payload: Uint8Array, type: CashAddressType): string {
  const result = encodeCashAddress({ payload, prefix: "bitcoincash", type });
  // With throwErrors defaulting to true, libauth returns a result
  // object whose address field carries the string.
  if (typeof result === "string") return result;
  if (typeof result.address === "string") return result.address;
  throw new Error(`unexpected encodeCashAddress result: ${JSON.stringify(result)}`);
}

export async function pubkeyToCashAddress(pubkey: Uint8Array): Promise<string> {
  return encodePayload(await pubkeyPayload(pubkey), CashAddressType.p2pkh);
}

/**
 * The token-aware form of the same address (the "z" address): same
 * payload, version byte advertising CashToken support. This is the
 * address the EMBER2026 banner line and the Receive panel show,
 * because tokens sent to it land in wallets that index them.
 */
export async function pubkeyToTokenAddress(pubkey: Uint8Array): Promise<string> {
  return encodePayload(
    await pubkeyPayload(pubkey),
    CashAddressType.p2pkhWithTokens,
  );
}
