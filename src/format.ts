/**
 * The one numbering rule for the whole app (user order
 * 2026-11-14, after an Arabic screenshot mixed Arabic-Indic and
 * Latin digits on one screen): numbers are NEVER localised.
 * Every rendered figure uses Latin digits with en-US grouping
 * and decimal separators (0.907, 111,513, $110,866) in every UI
 * language; only words translate. All number formatting goes
 * through latinNumberFormat, so a future call site cannot
 * reintroduce localised digits by reaching for the UI locale.
 */
const NUMBER_FORMAT_LOCALE = "en-US-u-nu-latn";

export function latinNumberFormat(
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return new Intl.NumberFormat(NUMBER_FORMAT_LOCALE, options);
}

/**
 * Dates keep their translated words (month names follow the UI
 * language), but their digits obey the same never-localised
 * rule: the UI locale with the Latin numbering system forced.
 */
export function latinDateTimeFormat(
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, options);
}

/** Satoshis to a plain BCH decimal string, trailing zeros trimmed. */
export function formatBch(sats: bigint): string {
  const whole = sats / 100_000_000n;
  const fraction = (sats % 100_000_000n).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

/** Report display form for a BCH amount: at most four decimal
 *  places (rounded at the fourth), trailing zeros trimmed. The
 *  downloadable JSON keeps full precision; only the rendering
 *  rounds. */
export function formatBchShort(sats: bigint): string {
  // One display step is 10^4 sats (0.0001 BCH); round half up.
  const step = 10_000n;
  const negative = sats < 0n;
  const magnitude = negative ? -sats : sats;
  let scaled = magnitude / step;
  if (magnitude % step >= step / 2n) scaled += 1n;
  const whole = scaled / step;
  const fraction = (scaled % step)
    .toString()
    .padStart(4, "0")
    .replace(/0+$/, "");
  const body = fraction ? `${whole}.${fraction}` : `${whole}`;
  return negative ? `-${body}` : body;
}

/** Wallet Radar truncation for hashes, category IDs, addresses
 *  and scripts: first 12 characters, one ellipsis, last 8. The
 *  full value stays available via the copy button and title. */
export function shortenHash(text: string): string {
  return text.length > 21 ? `${text.slice(0, 12)}…${text.slice(-8)}` : text;
}

/** A base-unit amount rendered in the asset's own units, grouped
 *  the app-wide way: Latin digits, en-US grouping (see the
 *  numbering rule above), whatever the UI language. */
export function formatTokenAmount(raw: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = (raw % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const numberFormat = latinNumberFormat({
    useGrouping: true,
    maximumFractionDigits: 0,
  });
  const grouped = numberFormat.format(whole);
  const decimalSeparator =
    numberFormat.formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";
  return fraction ? `${grouped}${decimalSeparator}${fraction}` : grouped;
}

export function shortenMiddle(text: string, keep = 10): string {
  return text.length > keep * 2 + 1
    ? `${text.slice(0, keep)}…${text.slice(-keep)}`
    : text;
}
