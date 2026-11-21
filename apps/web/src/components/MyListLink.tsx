import Link from "next/link";

/** ヘッダー右上のマイリストへのリンク（ログイン機能を止めているあいだ、ログインボタンの代わりに置く） */
export function MyListLink() {
  return (
    <Link href="/mypage" className="ghost">
      ♡ マイリスト
    </Link>
  );
}
