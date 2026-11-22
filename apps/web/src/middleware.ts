import { type NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE } from "./i18n/cookie";

/**
 * URL を言語ごとのページに振り分ける。
 * - 日本語は前に何も付けない（/movie/1）。中では /ja/movie/1 のページを表示する
 * - 英語は /en/…、韓国語は /ko/…
 * - /ja/… で来たら、前置きなしの URL に移す
 * - トップ（/）に初めて来た人は、選んだ言語（Cookie）か、ブラウザの言語設定で振り分ける
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/ja" || pathname.startsWith("/ja/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (/^\/(en|ko)(\/|$)/.test(pathname)) return NextResponse.next();

  if (pathname === "/") {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    const preferred = chosen ?? preferredLocale(request.headers.get("accept-language"));
    if (preferred === "en" || preferred === "ko") {
      const url = request.nextUrl.clone();
      url.pathname = `/${preferred}`;
      return NextResponse.redirect(url, 307);
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = `/ja${pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Accept-Language からいちばん優先されている言語を選ぶ。
 * 日本語・韓国語以外の言語の人には英語を出す。ヘッダーがなければ日本語
 */
function preferredLocale(header: string | null): "ja" | "en" | "ko" {
  if (!header) return "ja";
  const langs = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.toLowerCase().split("-")[0] ?? "", q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((l) => l.lang && !Number.isNaN(l.q))
    .sort((a, b) => b.q - a.q);
  const first = langs[0]?.lang;
  if (first === "ja") return "ja";
  if (first === "ko") return "ko";
  return first ? "en" : "ja";
}

export const config = {
  // API・Next.js の内部ファイル・拡張子のあるファイル（画像など）は振り分けない
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
