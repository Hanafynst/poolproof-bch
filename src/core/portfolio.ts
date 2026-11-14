/**
 * Portfolio composition — the connected wallet's total card, as
 * a pure model. Holdings in (the wallet-utxos index, resolved
 * identities, aggregate Cauldron reserves per category, and the
 * caller's BCH/USD rate), composition out: priced rows
 * with values and shares, the unpriced list, and the NFT count.
 *
 * Pricing discipline (the reconciliation rules, applied):
 *  - Every holding is counted exactly once. A token's sats ride
 *    in its UTXOs' value, which the holdings index already counts
 *    in the BCH total; the token row values the TOKEN amount on
 *    top of that, never the UTXO sats a second time. (The BCH
 *    row is therefore the wallet's full satoshi balance, and the
 *    total is a value composition, not a second balance.)
 *  - A token is priced from its category's AGGREGATE Cauldron
 *    reserves — the same aggregation the audit path reads:
 *    spot sats per base unit = reserveQuoteSats / reserveTokenRaw,
 *    applied as amountBase * reserveQuoteSats / reserveTokenRaw
 *    in exact bigint math, floored per row (the sub-satoshi
 *    remainder is unpayable). The priced total is the exact sum
 *    of the priced rows, so the model always reconciles.
 *  - A price exists only when the aggregate quote reserve clears
 *    PORTFOLIO_MIN_POOL_SATS (the verdict core's 0.001 BCH dust
 *    line, QUOTE_DUST_SATS in poolproof-core) and the token
 *    reserve is non-zero. A thinner pool, an empty one, a missing
 *    price entry: the holding is UNPRICED — listed with its
 *    amount and no value, never silently zero, never borrowed
 *    from another asset's price.
 *  - Shares are of the PRICED total only, and the UI says so
 *    whenever the unpriced list is non-empty. NFTs are a count:
 *    no floor source exists in this app, so no value is invented.
 *  - The USD figures all hang off the one BCH/USD rate the
 *    caller passes (since R83 a live quote read by
 *    core/fx-rate.ts from a named public source; the caller
 *    passes null when every source failed). With no rate,
 *    USD values are null and shares still compute from sats.
 *
 * The fold: a priced token under BOTH 1% of the priced total
 * AND $1 folds into a single Other row whose value is the exact
 * sum of its members. Both legs are strict (a share of exactly
 * 1% keeps its row), the $ leg needs a rate (no rate, no fold),
 * and BCH never folds — it is the wallet's anchor asset.
 */

/** The ALIVE verdict ring's green (style.css --alive), restated
 *  here because the donut segments are painted from the model.
 *  The user's order: BCH wears that green. */
export const BCH_PORTFOLIO_COLOR = "#34d399";

/** The Other fold's neutral grey — deliberately outside the
 *  palette so an aggregate never reads as one more token. */
export const OTHER_PORTFOLIO_COLOR = "#8a8a93";

/**
 * The per-token palette: nine muted, mutually distinguishable
 * hues for dark grounds. The verdict hues stay out of it (the
 * ALIVE green is BCH's alone; amber/red/purple keep their
 * verdict meanings) and so does the scarlet accent — segments
 * are small functional details, not identity.
 */
export const PORTFOLIO_PALETTE: readonly string[] = [
  "#5ea8f7",
  "#f59a52",
  "#9d8cff",
  "#ef7fb0",
  "#e8c95a",
  "#4cc3e6",
  "#c9a06a",
  "#7d94b8",
  "#d873c9",
];

/** A pool shallower than this cannot quote a price honestly:
 *  the verdict core's 0.001 BCH dust line (QUOTE_DUST_SATS). */
export const PORTFOLIO_MIN_POOL_SATS = 100_000n;

/** One category's aggregate Cauldron reserves — the spot price
 *  in exact form (sats per base unit is the pair's ratio). */
export interface PortfolioPrice {
  reserveQuoteSats: bigint;
  reserveTokenRaw: bigint;
}

export interface PortfolioFungibleInput {
  /** Category id, display-order hex. Unique per input. */
  category: string;
  /** Display label, resolved by the caller (identity or a
   *  shortened category). The core never invents a name. */
  label: string;
  amountBase: bigint;
  decimals: number;
}

export interface PortfolioRow {
  kind: "bch" | "token" | "other";
  /** The token's category; null for BCH and for the fold. */
  category: string | null;
  label: string;
  /** Base units held; null for the fold (its members differ). */
  amountBase: bigint | null;
  decimals: number;
  valueSats: bigint;
  /** Null only when no rate was supplied. */
  usdValue: number | null;
  /** Share of the priced total; null when that total is zero. */
  share: number | null;
  color: string;
  /** The fold's members; empty for ordinary rows. */
  groupedCategories: string[];
}

export interface UnpricedHolding {
  category: string;
  label: string;
  amountBase: bigint;
  decimals: number;
}

export interface PortfolioModel {
  /** BCH first, then priced tokens by value descending (ties by
   *  category), then the Other fold when it exists. */
  rows: PortfolioRow[];
  /** Holdings with no honest price, by category. */
  unpriced: UnpricedHolding[];
  /** The priced total in sats: the exact sum of the rows. */
  totalValueSats: bigint;
  /** Null only when no rate was supplied. */
  totalUsd: number | null;
  nftCount: number;
}

export interface PortfolioInput {
  /** The wallet's full satoshi balance (token UTXOs' sats
   *  included, as the holdings index counts them). */
  bchSats: bigint;
  fungibles: PortfolioFungibleInput[];
  nftCount: number;
  /** Aggregate reserves per category, or null where the read
   *  found no usable pool. A missing entry is also unpriced. */
  prices: ReadonlyMap<string, PortfolioPrice | null>;
  /** The caller's BCH/USD rate (a live quote), or null when
   *  no source answered. */
  bchUsd: number | null;
}

const SATS_PER_BCH = 100_000_000;

function usdFor(valueSats: bigint, bchUsd: number | null): number | null {
  return bchUsd === null ? null : (Number(valueSats) / SATS_PER_BCH) * bchUsd;
}

/** A category's first palette slot, from its first four bytes:
 *  deterministic across visits, devices and input order. */
function paletteStart(category: string): number {
  const head = Number.parseInt(category.slice(0, 8), 16);
  return head % PORTFOLIO_PALETTE.length;
}

export function buildPortfolio(input: PortfolioInput): PortfolioModel {
  const { bchUsd } = input;

  interface PricedToken {
    fungible: PortfolioFungibleInput;
    valueSats: bigint;
  }
  const priced: PricedToken[] = [];
  const unpriced: UnpricedHolding[] = [];
  for (const fungible of input.fungibles) {
    const price = input.prices.get(fungible.category) ?? null;
    if (
      price === null ||
      price.reserveTokenRaw <= 0n ||
      price.reserveQuoteSats < PORTFOLIO_MIN_POOL_SATS
    ) {
      unpriced.push({
        category: fungible.category,
        label: fungible.label,
        amountBase: fungible.amountBase,
        decimals: fungible.decimals,
      });
      continue;
    }
    priced.push({
      fungible,
      valueSats:
        (fungible.amountBase * price.reserveQuoteSats) /
        price.reserveTokenRaw,
    });
  }
  const byCategory = (a: string, b: string): number =>
    a < b ? -1 : a > b ? 1 : 0;
  unpriced.sort((x, y) => byCategory(x.category, y.category));
  // Display order: value descending, category ascending on ties,
  // so the order — and with it the colour claims — never depends
  // on the caller's input order.
  priced.sort((x, y) => {
    if (x.valueSats !== y.valueSats) return x.valueSats > y.valueSats ? -1 : 1;
    return byCategory(x.fungible.category, y.fungible.category);
  });

  let totalValueSats = input.bchSats;
  for (const token of priced) totalValueSats += token.valueSats;
  const shareOf = (valueSats: bigint): number | null =>
    totalValueSats > 0n ? Number(valueSats) / Number(totalValueSats) : null;

  const rows: PortfolioRow[] = [
    {
      kind: "bch",
      category: null,
      label: "BCH",
      amountBase: input.bchSats,
      decimals: 8,
      valueSats: input.bchSats,
      usdValue: usdFor(input.bchSats, bchUsd),
      share: shareOf(input.bchSats),
      color: BCH_PORTFOLIO_COLOR,
      groupedCategories: [],
    },
  ];

  // Colours are claimed in display order: each token asks for
  // its hashed slot and walks forward to the next free one, so
  // the biggest holders always hold distinct colours.
  const claimed = new Set<string>();
  const claimColor = (category: string): string => {
    const start = paletteStart(category);
    for (let step = 0; step < PORTFOLIO_PALETTE.length; step++) {
      const color = PORTFOLIO_PALETTE[(start + step) % PORTFOLIO_PALETTE.length];
      if (!claimed.has(color)) {
        claimed.add(color);
        return color;
      }
    }
    // More priced tokens than palette slots: the hashed slot is
    // reused — far down the list, a repeat is the honest limit
    // of a nine-colour palette.
    return PORTFOLIO_PALETTE[start];
  };

  const folded: PricedToken[] = [];
  for (const token of priced) {
    const share = shareOf(token.valueSats);
    const usdValue = usdFor(token.valueSats, bchUsd);
    if (
      share !== null &&
      share < 0.01 &&
      usdValue !== null &&
      usdValue < 1
    ) {
      folded.push(token);
      continue;
    }
    rows.push({
      kind: "token",
      category: token.fungible.category,
      label: token.fungible.label,
      amountBase: token.fungible.amountBase,
      decimals: token.fungible.decimals,
      valueSats: token.valueSats,
      usdValue,
      share,
      color: claimColor(token.fungible.category),
      groupedCategories: [],
    });
  }
  if (folded.length > 0) {
    let foldedSats = 0n;
    for (const token of folded) foldedSats += token.valueSats;
    rows.push({
      kind: "other",
      category: null,
      label: "Other",
      amountBase: null,
      decimals: 0,
      valueSats: foldedSats,
      usdValue: usdFor(foldedSats, bchUsd),
      share: shareOf(foldedSats),
      color: OTHER_PORTFOLIO_COLOR,
      groupedCategories: folded.map((token) => token.fungible.category),
    });
  }

  return {
    rows,
    unpriced,
    totalValueSats,
    totalUsd: usdFor(totalValueSats, bchUsd),
    nftCount: input.nftCount,
  };
}
