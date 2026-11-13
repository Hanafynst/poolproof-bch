import { languageOption, type Lang } from "./i18n";

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
 *  for the reader's locale. */
export function formatTokenAmount(raw: bigint, decimals: number, lang: Lang): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = (raw % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const locale = languageOption(lang).locale;
  const numberFormat = new Intl.NumberFormat(locale, {
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
