/**
 * 対応している言語と、言語ごとの TMDB の設定。
 * 配信サービスは国ごとに違うので、言語で国を決める（日本語→日本、英語→アメリカ、韓国語→韓国）
 */
export const LOCALES = ["ja", "en", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export const TMDB_LOCALE: Record<
  Locale,
  {
    /** タイトルやあらすじの言語 */
    language: string;
    /** 配信サービス・公開日・年齢区分の国 */
    region: string;
    /** 「家族と」のときに許す年齢区分（certification_country の区分名） */
    familyCertifications: string;
  }
> = {
  ja: { language: "ja-JP", region: "JP", familyCertifications: "G|PG12" },
  en: { language: "en-US", region: "US", familyCertifications: "G|PG" },
  ko: { language: "ko-KR", region: "KR", familyCertifications: "All|12" },
};
