/**
 * The fold behind the wallet lists (R63). The Send asset picker
 * and the History list render wallet state, and wallet state has
 * no natural ceiling: the R62 stress round priced the unbounded
 * shape at 5,000 NFT UTXOs -> 5,002 picker rows, one DOM button
 * per NFT. This pure model is the bound: a list longer than the
 * window hands the component its first rows plus the count of
 * the rest, which the component folds behind a show-all control;
 * expanded, the same list passes through whole. The model is
 * the poolShareModel fold (gauge.ts) generalised from pools to
 * any row list: shown rows keep their input order, the hidden
 * count is exact, and a limit below 1 clamps to a single row
 * rather than folding everything away.
 */

/** The number of rows a wallet list draws before the remainder
 *  folds behind its show-all control. Fifty rows is a long
 *  scroll on a phone already; a realistic wallet's assets fit
 *  under it whole (the R62 stress wallet: 63 picker rows before
 *  this fold existed, 62 of them fungible categories). */
export const LIST_WINDOW_SIZE = 50;

export interface ListWindow<T> {
  /** The rows to draw, the input's first rows in order. */
  shown: T[];
  /** Rows folded behind the show-all control (0 = no control). */
  hiddenCount: number;
  /** Every row in the list, shown and folded together. */
  total: number;
}

export function listWindow<T>(
  items: readonly T[],
  expanded: boolean,
  limit: number = LIST_WINDOW_SIZE,
): ListWindow<T> {
  const cap = Math.max(1, Math.floor(limit));
  if (expanded || items.length <= cap) {
    return { shown: [...items], hiddenCount: 0, total: items.length };
  }
  return {
    shown: items.slice(0, cap),
    hiddenCount: items.length - cap,
    total: items.length,
  };
}
