"use client";

import { type FavoriteItem, type HistoryItem, QUESTIONS, type QuestionId, labelOf } from "@kibuncinema/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Poster } from "@/components/Poster";
import { api } from "@/lib/api";
import { signIn, useSession } from "@/lib/auth-client";

const dateFormat = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" });

export default function MyPage() {
  const { data: session, isPending } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[] | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // セッションは数分キャッシュされるので、変えたアイコンはここで先に反映する
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([api.favorites(), api.history()])
      .then(([f, h]) => {
        setFavorites(f.items);
        setHistory(h.items);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "読み込めませんでした"));
  }, [session]);

  async function remove(tmdbId: number) {
    const before = favorites;
    setFavorites((list) => list?.filter((f) => f.tmdbId !== tmdbId) ?? null);
    try {
      await api.removeFavorite(tmdbId);
    } catch {
      setFavorites(before);
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { image } = await api.uploadAvatar(file);
      setAvatar(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードできませんでした");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (isPending) return <div className="spin"><i />読み込み中…</div>;

  if (!session) {
    return (
      <section className="booth">
        <h1 className="q">マイページ</h1>
        <p>お気に入りと提案の履歴を見るには、ログインしてください。</p>
        <button
          type="button"
          className="btn"
          onClick={() => signIn.social({ provider: "google", callbackURL: "/mypage" })}
        >
          Googleでログイン
        </button>
      </section>
    );
  }

  const { user } = session;
  const image = avatar ?? user.image;

  return (
    <div className="mypage">
      <section className="booth profile">
        <div className="avatar-lg">
          {image ? <img src={image} alt="" /> : <span>{user.name.slice(0, 1)}</span>}
        </div>
        <div>
          <h1 className="q">{user.name}さんのマイページ</h1>
          <label className="btn alt file">
            {uploading ? "アップロード中…" : "アイコンを変える"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatar} disabled={uploading} />
          </label>
        </div>
      </section>

      {error && <p className="note">{error}</p>}

      <section className="booth">
        <h2 className="h2">お気に入り</h2>
        {favorites === null ? (
          <div className="spin"><i />読み込み中…</div>
        ) : favorites.length === 0 ? (
          <p className="note">
            まだありません。<Link href="/">映画をさがす</Link>と、結果からお気に入りに追加できます。
          </p>
        ) : (
          <ul className="fav-grid">
            {favorites.map((f) => (
              <li key={f.tmdbId}>
                <a href={`https://www.themoviedb.org/movie/${f.tmdbId}?language=ja-JP`} target="_blank" rel="noopener">
                  <div className="poster">
                    <Poster title={f.title} path={f.posterPath} size="w185" />
                  </div>
                  <span>{f.title}</span>
                </a>
                <button type="button" className="link-btn" onClick={() => remove(f.tmdbId)}>
                  外す
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="booth">
        <h2 className="h2">最近の提案</h2>
        {history === null ? (
          <div className="spin"><i />読み込み中…</div>
        ) : history.length === 0 ? (
          <p className="note">まだありません。</p>
        ) : (
          <ol className="history">
            {history.map((h) => (
              <li key={h.id}>
                <div className="history-head">
                  <time dateTime={h.createdAt}>{dateFormat.format(new Date(h.createdAt))}</time>
                  <ul className="chips">
                    {QUESTIONS.map((q) => (
                      <li key={q.id}>{labelOf(q.id as QuestionId, h.answers[q.id as QuestionId])}</li>
                    ))}
                  </ul>
                </div>
                <p>{h.movies.map((m) => m.title).join("／")}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
