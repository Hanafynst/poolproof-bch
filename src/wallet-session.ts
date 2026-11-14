import type { SignFlowManager } from "./core/sign-flow";

/**
 * The wallet session shape, kept OUTSIDE WalletConnect.tsx on
 * purpose: App renders the disconnected shell before the wallet
 * library is ever needed, and a static value import from the lazy
 * WalletConnect module would drag the whole WizardConnect chunk
 * (~384 KB gz) into the entry's preload set. This module imports
 * nothing at runtime, so importing the session type or the
 * disconnected constant costs the entry nothing; the library
 * chunk loads only when the lazy component mounts.
 */
export interface WalletSession {
  connected: boolean;
  walletName: string | null;
  address: string | null;
  tokenAddress: string | null;
  manager: SignFlowManager | null;
  /** True when the wallet connected but the address poll gave
   *  up: the panels must say the address is missing instead of
   *  showing a balance "loading" state forever. */
  addressMissing: boolean;
}

export const DISCONNECTED_SESSION: WalletSession = {
  connected: false,
  walletName: null,
  address: null,
  tokenAddress: null,
  manager: null,
  addressMissing: false,
};
