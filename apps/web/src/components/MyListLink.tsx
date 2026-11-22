"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

/** ヘッダー右上のマイリストへのリンク（ログイン機能を止めているあいだ、ログインボタンの代わりに置く） */
export function MyListLink() {
  const { t, href } = useI18n();
  return (
    <Link href={href("/mypage")} className="ghost mylist-link" aria-label={t.nav.myList}>
      ♡<span className="mylist-text">&nbsp;{t.nav.myList}</span>
    </Link>
  );
}
