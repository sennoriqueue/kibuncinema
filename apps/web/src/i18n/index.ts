import { DEFAULT_LOCALE, type Locale } from "@kibuncinema/shared";
import en from "./en";
import ja, { type Dict } from "./ja";
import ko from "./ko";

export type { Dict };
export { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@kibuncinema/shared";

const DICTIONARIES: Record<Locale, Dict> = { ja, en, ko };

export function getDict(locale: Locale): Dict {
  return DICTIONARIES[locale];
}

/** 言語の切り替えに出す名前 */
export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  ja: { short: "JA", name: "日本語" },
  en: { short: "EN", name: "English" },
  ko: { short: "KO", name: "한국어" },
};

export { LOCALE_COOKIE } from "./cookie";

/**
 * 言語つきのパス。日本語は今までどおり前に何も付けず、ほかは /en・/ko を付ける。
 * localePath("en", "/movie/1") → "/en/movie/1"、localePath("ja", "/") → "/"
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** 言語の前置きを外したパス。"/en/movie/1" → "/movie/1" */
export function stripLocale(path: string): string {
  const m = path.match(/^\/(en|ko|ja)(?=\/|$)/);
  if (!m) return path || "/";
  return path.slice(m[0].length) || "/";
}
