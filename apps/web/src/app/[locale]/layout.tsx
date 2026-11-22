import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { notFound } from "next/navigation";
import { Astronaut } from "@/components/art/Astronaut";
import { DriveIn } from "@/components/art/DriveIn";
import { HomeLink } from "@/components/HomeLink";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Maker } from "@/components/Maker";
import { MyListLink } from "@/components/MyListLink";
import { LOCALES, type Locale, getDict, isLocale, localePath } from "@/i18n";
import { I18nProvider } from "@/i18n/I18nProvider";
import "../globals.css";

// 見出しは映画のタイトルクレジットのような明朝体、本文は読みやすいゴシック体。
// 日本語・英語は Shippori Mincho と Zen Kaku Gothic、韓国語はハングルのある Noto Serif KR と Noto Sans KR
const displayJa = Shippori_Mincho_B1({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  preload: false,
});
const bodyJa = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  preload: false,
});
const displayKo = Noto_Serif_KR({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  preload: false,
});
const bodyKo = Noto_Sans_KR({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  preload: false,
});

const SITE_URL = "https://kibuncinema-web.sennoriqueue.workers.dev";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Props["params"] }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    // 共有カードの画像などを、本番の URL からの絶対パスにする
    metadataBase: new URL(SITE_URL),
    title: t.siteName,
    description: t.meta.description,
    // 検索エンジンに、ほかの言語のページの場所を伝える
    alternates: {
      canonical: localePath(locale, "/"),
      languages: Object.fromEntries(LOCALES.map((l) => [l, localePath(l, "/")])),
    },
    // X などで共有されたときのカード。映画のページは、そのページで映画の画像に差し替える
    openGraph: {
      title: t.siteName,
      description: t.meta.description,
      siteName: t.siteName,
      type: "website",
      locale: t.meta.ogLocale,
      images: [{ url: t.meta.ogImage, width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.siteName,
      description: t.meta.description,
      images: [t.meta.ogImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#070a12",
  colorScheme: "dark",
};

export default async function RootLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDict(locale);
  const fonts = locale === "ko" ? `${displayKo.variable} ${bodyKo.variable}` : `${displayJa.variable} ${bodyJa.variable}`;

  return (
    <html lang={locale} className={fonts}>
      <body>
        <I18nProvider locale={locale}>
          <div className="sky" aria-hidden />
          {/* 映写機の光。ページの上からスクリーンを照らす */}
          <div className="projector" aria-hidden />
          <header className="site-header">
            <div className="wrap header-inner">
              <HomeLink className="logo">
                <span className="logo-mark" aria-hidden />
                {t.siteName}
              </HomeLink>
              <div className="header-right">
                <LanguageSwitcher />
                {/* ログイン機能は止めている。戻すときは <AuthButton /> に差し替える */}
                <MyListLink />
              </div>
            </div>
          </header>
          <Astronaut />
          <main className="wrap main">{children}</main>
          <Maker t={t} />
          <DriveIn />
          <footer className="footer">
            <div className="wrap">
              <small className="copyright">{t.footer.copyright}</small>
              <span className="tmdb-credit">
                This product uses the TMDB API but is not endorsed or certified by TMDB. {t.footer.dataBy}
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">
                  The Movie Database (TMDB)
                </a>
              </span>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
