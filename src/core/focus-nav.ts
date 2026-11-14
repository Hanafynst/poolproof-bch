/**
 * Focus navigation decisions for the wallet surfaces, kept pure
 * so the suite can pin them: the components own the DOM (refs,
 * querySelectorAll), this module owns the answers.
 *
 * Two decisions live here. The send panel's confirmation sheet
 * is an inline phase swap, not an overlay: the button that opens
 * it unmounts when the sheet appears, and the sheet's confirm
 * button unmounts (and is disabled while signing) when it
 * closes, so on every swap the browser drops focus to the
 * document body and a keyboard user restarts tabbing from the
 * top of the page. phaseFocusTarget rules where focus lands
 * instead: a heading, the one element that exists on both sides
 * of the swap and names where the user now is.
 *
 * The pairing dialog is a true modal: it declares aria-modal,
 * so Tab must cycle inside it. trapTabIndex is the boundary
 * math of that cycle: the index to move focus to, or -1 when
 * the keypress is the browser's own business (inside the set,
 * an empty set, or focus not in the set at all).
 */

export type SendPhase = "form" | "confirm" | "signing";

export type PhaseFocusTarget = "confirm-heading" | "panel-heading";

/**
 * Where focus goes when the send panel's phase changes.
 * Entering the sheet (from the form, or back from a failed
 * signing) lands on the sheet's own heading; leaving it for the
 * form (cancel, or a send that landed) lands on the panel
 * title, above the fresh form. Entering signing moves nothing:
 * the wallet's prompt owns that moment. A non-change is not a
 * transition and moves nothing.
 */
export function phaseFocusTarget(
  previous: SendPhase,
  next: SendPhase,
): PhaseFocusTarget | null {
  if (previous === next) return null;
  if (next === "confirm") return "confirm-heading";
  if (next === "form") return "panel-heading";
  return null;
}

/**
 * The Tab-trap boundary: given how many focusable controls the
 * dialog holds and which one has focus (-1 when focus is not
 * among them), the index Tab should be redirected to, or -1 to
 * let the browser move focus itself. Only the two wrap points
 * are redirected; a single control traps onto itself.
 */
export function trapTabIndex(
  count: number,
  activeIndex: number,
  shiftKey: boolean,
): number {
  if (count <= 0) return -1;
  if (shiftKey && activeIndex === 0) return count - 1;
  if (!shiftKey && activeIndex === count - 1) return 0;
  return -1;
}
