import type { FlagCode } from "../core/poolproof-core";
import type { UiStrings } from "../i18n-types";

const strings: UiStrings = {
  presentation: "Presentation",
  source: "GitHub",
  ember: "EMBER2026 tips: the address appears here once a wallet is connected.",
  preExistingDisclosure:
    "Pre-existing work: the verdict semantics were first prototyped in an " +
    "earlier personal project, a dead-pool detector that was never " +
    "released. The BCH implementation, the UI, and this repository " +
    "are new, built for BCH BLAZE inside the 14 to 22 Nov 2026 window.",
  copyAddress: "Copy address",
  openWalletApp: "Open wallet app",
  copyConnectionLink: "Copy connection link",
  pairingScanHint: "Wallet on another device: scan this code with it.",
  pairingPasteHint:
    "Wallet on this phone: copy the link, then paste it in the " +
    "wallet's connect or scan page.",
  pairingShotHint: "No second device? Take a screenshot of this code and upload it in the wallet's scanner.",
  pairingReturnHint: "Come back to this page right away after scanning or pasting. The wallet's answer goes stale within seconds, and it can only land while this page is in front.",
  dialogClose: "Close",
  noWalletHeading: "No wallet app answered",
  noWalletBody:
    "Copy the connection link and paste it inside the wallet, or " +
    "scan the code from another device. If you have no wallet yet, " +
    "install one below. Cashonize runs in the browser and needs no " +
    "install.",
  noWalletStaleHint: "If your wallet shows PoolProof as connected but this page does not, it is holding a stale connection. Remove the old PoolProof entries in the wallet, then pair again. In Paytaca, that list is under Apps, then Wizard Connect.",
  walletBalanceLoading: "Loading balance...",
  walletBalanceUnavailable:
    "Balance unavailable. The UTXO indexer could not be reached.",
  sendInProgress: "Waiting for the wallet to sign...",
  sendTampered:
    "The signed transaction did not match the send you confirmed. " +
    "It was not broadcast.",
  sendBroadcastFailed:
    "The broadcast failed. The signed transaction can be broadcast " +
    "again. It does not need to be signed again.",
  sendMalformed:
    "The wallet returned a response that could not be verified. " +
    "Nothing was broadcast.",
  historyUnavailable:
    "Saved history could not be read. This list starts empty.",
  historySaveFailed:
    "History could not be saved in this browser. Entries stay visible until you reload.",
  receivePlainLabel: "Plain address",
  headline: "Is this CashToken pool actually alive?",
  lede:
    "PoolProof checks a CashToken pool before you trust its numbers. " +
    "It reads the pool's reserves on Cauldron and simulates a sell. " +
    "The verdict comes from the reserves and the simulated sell, not " +
    "from the liquidity figure on display.",
  language: "Language",
  languageLoadFailed:
    "That language could not be loaded. The previous language is still shown.",
  skipToMain: "Skip to main content",
  snapshotsLabel: "Demo snapshots",
  reportLabel: "Due diligence report",
  caveat:
    "This report is a check at one point in time. Reserves and mint " +
    "authority can change after it. Run the check again before you " +
    "act on it.",
  summaryByVerdict: {
    ALIVE: "Alive: reserves are real and the simulated sell exits near the spot price.",
    RISKY: "Risky: the simulated sell keeps only part of the spot value.",
    DEAD: "Dead: reserves are dust. A position cannot exit for meaningful value.",
    NO_MARKET: "No market: this token has no active Cauldron pool.",
    LYING_DISPLAY: "Lying display: the displayed liquidity is far above the real reserves.",
  },
  pools: "Active Cauldron pools",
  bchReserve: "BCH reserve (all pools)",
  tokenReserve: "{symbol} reserve (all pools)",
  referenceSell: "Reference sell",
  referenceSellCap: "(max 10% of pool reserve)",
  simulatedExit: "Simulated exit",
  exitOfSpot: "{out} BCH of {spot} BCH spot value",
  exitNotSimulated: "not simulated: the reserves alone decide this verdict",
  exitRouteFailed: "route could not be simulated",
  exitRatio: "Exit ratio",
  exitModel: "Exit model",
  exitModelRouterQuote: "Live quote from the Cauldron Router",
  exitModelRoutedCpmm: "Routed CPMM simulation (our own)",
  exitModelAggregateCpmm: "Single-curve CPMM simulation (our own)",
  routedCrossCheck: "Routed simulation (cross-check)",
  gaugeReal: "Real exit",
  gaugeDisplayed: "At spot price (as displayed)",
  gaugeReserve: "BCH reserve",
  gaugeDustLine: "Dust threshold",
  gaugeTickDead: "Dead line",
  gaugeTickAlive: "Alive line",
  gaugeReserveNote:
    "The reserve against the dust threshold. Below that line, a pool is dead.",
  poolShareTitle: "Reserve by pool",
  poolShareMore: "and {count} more pools",
  poolShareRow: "Pool {n}",
  stepPools: "Reading pools",
  stepSimulate: "Simulating the exit",
  stepIdentity: "Resolving identity",
  stepQuote: "Router cross-check",
  stepSkipped: "Skipped",
  stepIdentityMissing: "No listing found",
  stepQuoteUnavailable: "No quote returned",
  identity: "Identity (BCMR)",
  identityVerified: "hash verified, resolved {source}",
  identityNone: "no verified registry entry",
  decimals: "Decimals",
  anchorTitle: "Proof anchor",
  anchorBody:
    "The hash of this report, ready to be carried in a Bitcoin Cash " +
    "mainnet transaction as an OP_RETURN output. Anyone can check " +
    "the report against the hash in that transaction.",
  anchorAction: "Anchor this report",
  anchorNeedsWallet:
    "Connect a wallet to anchor this report on BCH mainnet. " +
    "The report stays on this page while you connect.",
  anchorNoFunds:
    "Anchoring needs one plain BCH UTXO of at least {sats} sats " +
    "in this wallet, to cover the fee and leave change above " +
    "dust. None is available yet.",
  anchorDone: "Anchored on BCH mainnet.",
  anchorTampered:
    "The signed transaction did not match this report's anchor. " +
    "It was not broadcast.",
  hashing: "hashing...",
  anchorLoadFailed: "The proof anchor could not be loaded.",
  reportHash: "Report SHA-256",
  opReturnScript: "OP_RETURN script",
  viewsLabel: "View",
  copyCategory: "Copy category ID",
  copyHash: "Copy report hash",
  downloadJson: "Download report (JSON)",
  copyLink: "Copy share link",
  copied: "Copied",
  copyFailed: "Copy failed. Copy the value by hand.",
  downloaded: "Downloaded",
  downloadFailed: "Download failed",
  retry: "Retry",
  connectWallet: "Connect wallet",
  walletConnecting: "Waiting for wallet...",
  walletConnected: "Connected · {name}",
  walletLoading: "Loading wallet...",
  walletLoadFailed: "Wallet failed to load. Reload the page to retry.",
  disconnectWallet: "Disconnect",
  walletAddressMissing: "Connected, but the wallet has not shared an address.",
  viewReport: "Report view",
  viewScanner: "Scanner view",
  groupIdentity: "Identity",
  groupSupply: "Supply & authority",
  groupExit: "Exit simulation",
  groupConcentration: "Concentration",
  statusPass: "PASS",
  statusWarn: "WARN",
  statusFail: "FAIL",
  statusUnknown: "UNKNOWN",
  totalSupply: "Total supply",
  supplyStandInNote:
    "Total supply is a stand-in value (10x the pool token reserve) " +
    "until the second source lands. The reference sell is sized " +
    "from the reserve cap.",
  authorityUnknown:
    "Mint authority has not been checked yet. Supply figures are " +
    "shown. Authority is not claimed.",
  concentrationUnknown:
    "Holder concentration is not sourced yet. It is shown as " +
    "unknown, never as a pass.",
  walletBalance: "Balance",
  walletDisconnectedHint:
    "Connect a wallet to see your balance, holdings and history.",
  actionSend: "Send",
  actionReceive: "Receive",
  actionHistory: "History",
  actionAudit: "Audit",
  sendTitle: "Choose an asset",
  sendAmount: "Amount",
  sendMax: "MAX",
  sendKeypadBackspace: "Backspace",
  sendRecipient: "Recipient",
  sendRecipientPlaceholder: "Paste a Bitcoin Cash address",
  sendAddressToken: "Token-supporting address",
  sendAddressPlain: "Plain address, BCH only",
  sendNetwork: "Network: Bitcoin Cash mainnet",
  confirmTitle: "Confirm send",
  confirmAsset: "Asset",
  confirmRecipient: "Recipient",
  confirmAmount: "Amount",
  confirmFee: "Network fee",
  confirmBalanceAfter: "Balance after",
  feeEstimateNote:
    "The fee is an estimate. The final fee is set when the wallet signs.",
  deliveryEstimate:
    "Broadcast is immediate. First confirmation in about 10 minutes (estimate).",
  sendConfirm: "Confirm and send",
  sendCancel: "Cancel",
  gateWrongNetwork: "This address is not on Bitcoin Cash mainnet.",
  gateInvalidAddress:
    "That is not a valid Bitcoin Cash address. Check it and try again.",
  gateTokenToPlainAddress:
    "That address cannot hold tokens. Tokens sent there would be " +
    "stranded. Use a token-supporting address.",
  gateAmountMissing: "Enter an amount.",
  gateAmountInvalid:
    "That amount cannot be read. Check the number and try again.",
  gateAmountZero: "Enter an amount above zero.",
  gateAmountBelowDust:
    "The minimum send is {dustSats} sats. Smaller outputs are dust.",
  gateInsufficientBalance:
    "The balance is not enough for this amount plus the fee.",
  gateInsufficientFeeBalance:
    "The BCH balance is not enough to cover the network fee.",
  receiptTitle: "Receipt",
  receiptStatusBroadcast: "Broadcast",
  receiptStatusConfirmed: "Confirmed",
  receiptStatusConfirmedCount: "Confirmed ({count})",
  receiptExplorer: "View on explorer",
  copyTxid: "Copy transaction ID",
  copyRecipient: "Copy recipient",
  copyAmount: "Copy amount",
  historyTitle: "History",
  historyEmpty: "Nothing has been sent from this wallet yet.",
  historyShowAll: "Show all {count} entries",
  historySent: "Sent",
  historyAnchored: "Anchored",
  receiveAddressLabel: "Your address",
  receiveTokenNote:
    "Token-supporting address. Safe for BCH, tokens and NFTs.",
  receivePlainNote:
    "Plain address, BCH only. Do not send tokens to this address.",
  receiveQrCaption: "Address QR code",
  holdingsTotal: "Total balance",
  holdingsTokens: "Tokens",
  holdingsNfts: "NFTs",
  holdingsCategory: "Category ID",
  holdingsCommitment: "Commitment",
  holdingsEmpty: "No BCH, tokens or NFTs in this wallet yet.",
  portfolioTitle: "Portfolio",
  portfolioOther: "Other",
  portfolioUnpricedNote: "Shares and the total cover priced assets only. Unpriced assets are listed without a value.",
  portfolioPricesUnavailable: "Token prices could not be loaded. Amounts are shown without values.",
  portfolioRateNote: "Values use Cauldron pool spot prices. BCH is valued at the reference rate of $221.85 (Selene market page, 13 Nov 2026).",
  assetShowAll: "Show all {count} assets",
  concGini: "Gini coefficient",
  concTierWellDistributed: "Well-distributed",
  concTierGood: "Good",
  concTierFair: "Fair",
  concTierPoor: "Poor",
  concTierWhaleControlled: "Whale-controlled",
  concTopHolder: "Top holder",
  concTop10: "Top 10 holders",
  concTopHolderSupply: "Top holder (share of supply)",
  concHhi: "HHI",
  concBasisListed: "Based on the {count} largest listed holders",
  concBasisFull: "Based on all {count} holders",
  concUnavailable: "Not available",
  liveCategoryLabel: "Category ID",
  liveCategoryPlaceholder: "Paste a 64-character category ID",
  liveCategoryHint:
    "A category ID identifies a CashToken. Copy it from the token's " +
    "page on TokenStork or a block explorer. The demo snapshots below " +
    "need no ID; one of them is PUSD.",
  liveAuditAction: "Audit live",
  liveCategoryInvalid:
    "That is not a valid category ID. A category ID is exactly 64 " +
    "hexadecimal characters.",
  liveFetching: "Fetching live pool data...",
  liveFetchFailed:
    "The live read failed. No verdict was produced. Check the " +
    "connection and try again.",
  liveResultLabel: "Live result, fetched {time}",
  liveProvenance:
    "Live read from the Cauldron indexer (indexer.riften.net) at " +
    "{time}. Name, symbol and decimals are not sourced yet. " +
    "Amounts are raw base units.",
  liveProvenanceIdentity:
    "Live read from the Cauldron indexer (indexer.riften.net) at " +
    "{time}. Name, symbol and decimals come from TokenStork's " +
    "record for this category.",
  liveUnnamed: "Unnamed token",
  notFoundTitle: "Category not found",
  notFoundBody:
    "No CashToken with this category ID was found on BCH mainnet. " +
    "PoolProof checked the Cauldron Indexer and TokenStork, and " +
    "neither source has a record of this category.",
  notFoundHint:
    "Category IDs carry no checksum, so a single wrong character " +
    "points at a different token, or at none at all. Check the ID " +
    "and try again.",
  notFoundAction: "Check another category",
  signPromptAnchor:
    "Anchor this PoolProof report hash on Bitcoin Cash mainnet?",
  signPromptSend: "Sign this send in your wallet to broadcast it.",
  signRejected:
    "The wallet rejected the signature request. Nothing was sent.",
  toastSent: "Sent {amount} {asset}",
  toastConfirmed: "{amount} {asset} confirmed",
  toastAnchorConfirmed: "Report anchor confirmed",
  toastReceived: "Received {amount} BCH",
  toastDismiss: "Dismiss notification",
  aboutTitle: "About PoolProof",
  aboutWhat:
    "PoolProof checks whether a CashToken pool can actually pay " +
    "you out. It reads the pool's real reserves and simulates a " +
    "sell against them, so the verdict rests on what the exit " +
    "returns, not on the liquidity figure on display.",
  aboutHowTitle: "How a verdict is reached",
  aboutHow:
    "The audit pins the token's identity and supply to the exact " +
    "category ID first, so a look-alike token cannot stand in for " +
    "it. Cauldron reserves are read live, and a reference sell " +
    "(the smaller of 1% of supply or 10% of the pool reserve) is " +
    "simulated through each of the token's pools in turn. If the " +
    "venue's own Router returns a quote no larger than the " +
    "reserves those pools hold, that quote cross-checks the " +
    "simulation. The verdict follows the exit ratio, the share " +
    "of spot value the sell keeps: below 0.010 the exit is dead, " +
    "at 0.800 or above it holds. If more than one figure exists, " +
    "the Router quote decides first, then the routed simulation, " +
    "then the single-curve simulation.",
  aboutVerdictsTitle: "The five verdicts",
  aboutAnchor:
    "A report can be sealed on chain. PoolProof hashes the " +
    "report file exactly as you download it, and the wallet you " +
    "connect carries that hash onto Bitcoin Cash mainnet in an " +
    "OP_RETURN output. Anyone who holds the file can hash it " +
    "and compare the result with the hash in the transaction, " +
    "so a changed report cannot pass as the original.",
  aboutSourcesTitle: "Where the data comes from",
  aboutSources:
    "Pool data comes from the Cauldron indexer run by Riften. " +
    "Token identity comes from BCMR metadata, checked against " +
    "TokenStork. Wallet balances come from public Electrum " +
    "servers. Every figure in a report is read when the audit " +
    "runs, not carried over from an earlier visit.",
  aboutLimitsTitle: "The limits",
  aboutLimits:
    "A report is a check at one point in time. Reserves and " +
    "mint authority can change after it. Run the check again " +
    "before you act on it. A simulated exit is worked out from " +
    "the reserves at that moment. It is an estimate, not a " +
    "guaranteed execution price. PoolProof never holds keys, " +
    "funds, or accounts. Signing always happens in your own " +
    "wallet, and nothing moves without it.",
  aboutBuilt: "PoolProof is a solo build for BCH BLAZE 2026.",
  navCheck: "Check",
  navWallet: "Wallet",
  navAbout: "About",
};

export const flags: Record<FlagCode, string> = {
  TOKEN_UNREADABLE: "token identity and supply reads failed",
  NO_POOL: "no Cauldron pool against BCH: no market to sell into",
  DUST_RESERVE: "quote reserve is {reserveSats} sats (dust threshold {dustSats})",
  DISPLAYED_LIQUIDITY_LIES:
    "displayed liquidity ${displayedUsd}, but real reserves imply " +
    "about ${realUsd} (under 1% of the claim)",
  EXIT_WORTHLESS:
    "sell simulation returns {ratio} of spot value: the exit is worthless",
  EXIT_LEAKS_VALUE:
    "sell simulation keeps only {ratio} of spot value (fees and/or price impact)",
  ROUTE_UNSIMULATED: "reserves exist, but the sell route could not be simulated",
  ROUTE_QUOTE_IMPLAUSIBLE:
    "the venue's router quote of {quoteSats} sats is impossible for pools " +
    "holding {reserveSats} sats in total, so the verdict uses the simulated exit",
};

export default strings;
