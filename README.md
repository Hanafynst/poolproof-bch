# PoolProof BCH

PoolProof tells you whether a CashToken pool can actually pay you out. It reads real Cauldron reserves, simulates the full exit the way a real seller would have to route it, cross-checks the venue's own router, and anchors the report hash in a Bitcoin Cash mainnet transaction.

**Live demo:** https://hanafynst.github.io/poolproof-bch/

Built solo for **BCH BLAZE 2026** (DoraHacks), 14–22 November 2026.

## What it does

- Paste a CashToken category ID → a verdict (ALIVE / RISKY / DEAD / LYING DISPLAY / NO MARKET) backed by sourced evidence: pool reserves, a routed full-exit simulation, holder concentration (Gini, top-holder share, HHI), and a second-source cross-check.
- Every figure names its source and its model. A displayed price is never taken at face value; the exit number is what a routed sell would actually realise, net of per-pool fees.
- "Anchor this report" writes the report's SHA-256 hash into a BCH mainnet OP_RETURN transaction, signed through WizardConnect — anyone can re-hash the report and match it against the chain.
- Wallet home in the Binance Web3 Wallet layout language, event-brand colours: balance, Send / Receive / History / Audit, with confirmation sheets, address-type auto-detection, fee previews and receipts.
- Eight languages, English by default: English, Bahasa Indonesia, Mandarin (Simplified), Español, हिन्दी, العربية (RTL), Português, Français.

## Stack

Vite + React + TypeScript, fully static (GitHub Pages). Wallet connection via `@wizardconnect/*` (Nostr-relay pairing; Paytaca, Selene, Cashonize, OPTN). Transaction building with `@bitauth/libauth`. Data from the Riften Cauldron indexer and TokenStork — never a single source.

## Disclosure

New BCH codebase written for this hackathon. The dead-pool detector semantics and report format continue the author's earlier EVM/BSC research tool; that pre-existing work is declared here and in the demo banner, as the event rules require. Everything in this repository — implementation, UI, tests — was created inside the 14–22 November 2026 window.

## License

MIT
