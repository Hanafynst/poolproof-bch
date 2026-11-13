import { languageOption, type Lang } from "./i18n";

/** Satoshis to a plain BCH decimal string, trailing zeros trimmed. */
export function formatBch(sats: bigint): string {
  const whole = sats / 100_000_000n;
  const fraction = (sats % 100_000_000n).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
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
