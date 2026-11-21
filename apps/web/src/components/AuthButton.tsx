"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "@/lib/auth-client";

export function AuthButton() {
  const { data, isPending } = useSession();

  if (isPending) return <span className="auth-placeholder" aria-hidden />;

  if (!data) {
    return (
      <button
        type="button"
        className="ghost"
        onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
      >
        Googleでログイン
      </button>
    );
  }

  return (
    <div className="auth">
      <Link href="/mypage" className="ghost">
        {data.user.image ? <img src={data.user.image} alt="" className="avatar" /> : null}
        マイページ
      </Link>
      <button type="button" className="link-btn" onClick={() => signOut()}>
        ログアウト
      </button>
    </div>
  );
}
