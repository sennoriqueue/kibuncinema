"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";

/** トップに戻ったことを知らせるイベント。Finder が受け取って質問の最初に戻す */
export const HOME_EVENT = "kibuncinema:home";

/**
 * トップ（今の言語のトップ）へのリンク。すでにトップにいるときは Next.js が何もしないので、
 * イベントを送って質問画面を最初に戻す。
 */
export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  const { href } = useI18n();
  return (
    <Link href={href("/")} className={className} onClick={() => window.dispatchEvent(new Event(HOME_EVENT))}>
      {children}
    </Link>
  );
}
