"use client";

import Link from "next/link";
import { useState } from "react";
import { MovieDialog } from "@/components/MovieDialog";
import { Poster } from "@/components/Poster";
import { type SavedMovie, clearRecent, removeFavorite, useMyList } from "@/lib/local-store";

const dateFormat = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric" });

/** 「今日」「昨日」、それより前は「11月18日」 */
function viewedLabel(time: number) {
  const day = (t: number) => new Date(t).toDateString();
  if (day(time) === day(Date.now())) return "今日";
  if (day(time) === day(Date.now() - 24 * 60 * 60 * 1000)) return "昨日";
  return dateFormat.format(time);
}

/** マイリスト：このブラウザに保存したお気に入りと、最近詳細を開いた映画 */
export default function MyListPage() {
  const { favorites, recent } = useMyList();
  const [open, setOpen] = useState<SavedMovie | null>(null);

  return (
    <div className="mylist">
      <div className="mylist-head">
        <h1 className="q">マイリスト</h1>
        <p className="mylist-note">このブラウザだけに保存されています</p>
      </div>

      <section className="booth">
        <div className="mylist-sec">
          <h2 className="h2">お気に入り</h2>
          {favorites.length > 0 && <span className="note">{favorites.length}本</span>}
        </div>
        {favorites.length === 0 ? (
          <p className="note">
            まだありません。<Link href="/">映画をさがす</Link>と、結果や詳細の「♡ お気に入り」で追加できます。
          </p>
        ) : (
          <ul className="mylist-grid">
            {favorites.map((m) => (
              <li key={m.id}>
                <MiniPoster movie={m} onOpen={() => setOpen(m)} />
                <button type="button" className="link-btn mylist-small" onClick={() => removeFavorite(m.id)}>
                  外す
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="booth">
        <div className="mylist-sec">
          <h2 className="h2">最近見た映画</h2>
          {recent.length > 0 && (
            <button type="button" className="link-btn mylist-small" onClick={clearRecent}>
              履歴を消す
            </button>
          )}
        </div>
        <p className="note">詳細を開いた映画です。30日たつと自動で消えます。</p>
        {recent.length > 0 && (
          <ul className="mylist-grid small">
            {recent.map((m) => (
              <li key={m.id}>
                <MiniPoster movie={m} onOpen={() => setOpen(m)} />
                <time dateTime={new Date(m.viewedAt).toISOString()}>{viewedLabel(m.viewedAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      {open && (
        <MovieDialog
          movieId={open.id}
          preview={{ title: open.title, posterPath: open.posterPath, year: open.year, genreIds: open.genreIds }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function MiniPoster({ movie, onOpen }: { movie: SavedMovie; onOpen: () => void }) {
  return (
    <button type="button" className="mylist-item" onClick={onOpen}>
      <span className="poster">
        <Poster title={movie.title} year={movie.year} genreIds={movie.genreIds} path={movie.posterPath} size="w185" />
      </span>
      <span>{movie.title}</span>
    </button>
  );
}
