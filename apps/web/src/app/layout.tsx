import type { Metadata } from "next";
import { Dela_Gothic_One, Zen_Kaku_Gothic_New } from "next/font/google";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import "./globals.css";

const display = Dela_Gothic_One({
  weight: "400",
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

export const metadata: Metadata = {
  title: "キブンシネマ",
  description: "4つの質問に答えると、今の気分に合う映画を3本えらびます。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="marquee">
          <div className="bulbs" aria-hidden />
          <div className="wrap marquee-inner">
            <Link href="/" className="logo">
              キブンシネマ
            </Link>
            <AuthButton />
          </div>
          <div className="bulbs bottom" aria-hidden />
        </header>
        <main className="wrap main">{children}</main>
        <footer className="footer">
          <div className="wrap">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
            映画データ提供：
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">
              The Movie Database（TMDB）
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
