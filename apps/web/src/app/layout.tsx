import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { Astronaut } from "@/components/art/Astronaut";
import { DriveIn } from "@/components/art/DriveIn";
import { HomeLink } from "@/components/HomeLink";
import { Maker } from "@/components/Maker";
import { MyListLink } from "@/components/MyListLink";
import "./globals.css";

// 見出しは映画のタイトルクレジットのような明朝体、本文は読みやすいゴシック体
const display = Shippori_Mincho_B1({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  preload: false,
});
const body = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  preload: false,
});

const SITE_URL = "https://kibuncinema-web.sennoriqueue.workers.dev";
const DESCRIPTION = "4つの質問に答えると、今の気分に合う映画を3本えらびます。";

export const metadata: Metadata = {
  // 共有カードの画像などを、本番の URL からの絶対パスにする
  metadataBase: new URL(SITE_URL),
  title: "キブンシネマ",
  description: DESCRIPTION,
  // X などで共有されたときのカード。映画のページは、そのページで映画の画像に差し替える
  openGraph: {
    title: "キブンシネマ",
    description: DESCRIPTION,
    siteName: "キブンシネマ",
    type: "website",
    locale: "ja_JP",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "キブンシネマ　4つの質問で、今夜の一本。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "キブンシネマ",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="sky" aria-hidden />
        {/* 映写機の光。ページの上からスクリーンを照らす */}
        <div className="projector" aria-hidden />
        <header className="site-header">
          <div className="wrap header-inner">
            <HomeLink className="logo">
              <span className="logo-mark" aria-hidden />
              キブンシネマ
            </HomeLink>
            {/* ログイン機能は止めている。戻すときは <AuthButton /> に差し替える */}
            <MyListLink />
          </div>
        </header>
        <Astronaut />
        <main className="wrap main">{children}</main>
        <Maker />
        <DriveIn />
        <footer className="footer">
          <div className="wrap">
            <small className="copyright">© 2026 キブンシネマ / 千利休</small>
            <span className="tmdb-credit">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
              映画データ提供：
              <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">
                The Movie Database（TMDB）
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
