/**
 * Report-anchor practice (spike-local only): hash a PoolProof report and
 * build the OP_RETURN locking script that would carry the hash in a real
 * BCH mainnet transaction. Offline only — no keys, no funds, no broadcast.
 * The WizardConnect signing path itself is the Day-1 spike (needs the
 * user's phone wallet); this file proves the payload construction.
 */
import { instantiateSha256 } from "@bitauth/libauth";

// libauth v3 trap: instantiation is async (it returns Promise<Sha256>,
// the v2-style synchronous call does not exist). Start it once at module
// load and await the shared promise per call.
const sha256Ready = instantiateSha256();

/** OP_RETURN (0x6a). A 32-byte hash fits a single direct push (0x20 =
 *  32 bytes follow), so no OP_PUSHDATA indirection is needed. */
const OP_RETURN = 0x6a;

export async function hashReport(reportText: string): Promise<Uint8Array> {
  const sha256 = await sha256Ready;
  return sha256.hash(new TextEncoder().encode(reportText));
}

export function buildAnchorScript(reportHash: Uint8Array): Uint8Array {
  if (reportHash.length !== 32) {
    throw new Error(`report hash must be 32 bytes, got ${reportHash.length}`);
  }
  const script = new Uint8Array(2 + reportHash.length);
  script[0] = OP_RETURN;
  script[1] = reportHash.length;
  script.set(reportHash, 2);
  return script;
}

export async function anchorScriptForReport(
  reportText: string,
): Promise<{ hash: Uint8Array; script: Uint8Array }> {
  const hash = await hashReport(reportText);
  return { hash, script: buildAnchorScript(hash) };
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
