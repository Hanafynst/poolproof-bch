import type { FlagCode } from "./core/poolproof-core";
import type { UiStrings } from "./i18n-types";
import enStrings, { flags as enFlags } from "./i18n/en";

export type { UiStrings } from "./i18n-types";

export type Lang = "en" | "id" | "zh" | "es" | "hi" | "ar" | "pt" | "fr";

export const LANGUAGE_OPTIONS: Array<{
  code: Lang;
  label: string;
  locale: string;
  direction: "ltr" | "rtl";
}> = [
  { code: "en", label: "English", locale: "en-US", direction: "ltr" },
  { code: "id", label: "Bahasa Indonesia", locale: "id-ID", direction: "ltr" },
  { code: "zh", label: "中文（简体）", locale: "zh-CN", direction: "ltr" },
  { code: "es", label: "Español", locale: "es-ES", direction: "ltr" },
  { code: "hi", label: "हिन्दी", locale: "hi-IN", direction: "ltr" },
  { code: "ar", label: "العربية", locale: "ar-EG", direction: "rtl" },
  { code: "pt", label: "Português", locale: "pt-BR", direction: "ltr" },
  { code: "fr", label: "Français", locale: "fr-FR", direction: "ltr" },
];

export function languageOption(lang: Lang) {
  return LANGUAGE_OPTIONS.find((option) => option.code === lang) ?? LANGUAGE_OPTIONS[0];
}

export function isLang(value: string | null): value is Lang {
  return LANGUAGE_OPTIONS.some((option) => option.code === value);
}

/** One loaded language pack: UI strings + flag templates. */
export interface LanguagePack {
  strings: UiStrings;
  flags: Record<FlagCode, string>;
}

// English is the default and ships inside the main bundle; the
// other seven packs are separate chunks, fetched on first
// selection — the initial paint never carries a language
// nobody picked.
export const ENGLISH_PACK: LanguagePack = { strings: enStrings, flags: enFlags };

type PackModule = { default: UiStrings; flags: Record<FlagCode, string> };

const LOADERS: Record<Exclude<Lang, "en">, () => Promise<PackModule>> = {
  id: () => import("./i18n/id"),
  zh: () => import("./i18n/zh"),
  es: () => import("./i18n/es"),
  hi: () => import("./i18n/hi"),
  ar: () => import("./i18n/ar"),
  pt: () => import("./i18n/pt"),
  fr: () => import("./i18n/fr"),
};

const packCache = new Map<Lang, LanguagePack>();

export async function loadLanguagePack(lang: Lang): Promise<LanguagePack> {
  if (lang === "en") return ENGLISH_PACK;
  const cached = packCache.get(lang);
  if (cached !== undefined) return cached;
  const mod = await LOADERS[lang]();
  const pack: LanguagePack = { strings: mod.default, flags: mod.flags };
  packCache.set(lang, pack);
  return pack;
}
