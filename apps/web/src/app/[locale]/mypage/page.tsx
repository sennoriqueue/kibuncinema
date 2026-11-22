"use client";

import Link from "next/link";
import { useState } from "react";
import { MovieDialog } from "@/components/MovieDialog";
import type { Dict, Locale } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { Poster } from "@/components/Poster";
import { type SavedMovie, clearRecent, removeFavorite, useMyList } from "@/lib/local-store";

/** 「今日」「昨日」、それより前は「11月18日」「Nov 18」など、今の言語の日付 */
function viewedLabel(time: number, locale: Locale, t: Dict) {
  const day = (d: number) => new Date(d).toDateString();
  if (day(time) === day(Date.now())) return t.myList.today;
  if (day(time) === day(Date.now() - 24 * 60 * 60 * 1000)) return t.myList.yesterday;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(time);
}

/** マイリスト：このブラウザに保存したお気に入りと、最近詳細を開いた映画 */
export default function MyListPage() {
  const { locale, t, href } = useI18n();
  const { favorites, recent } = useMyList();
  const [open, setOpen] = useState<SavedMovie | null>(null);

  return (
    <div className="mylist">
      <div className="mylist-head">
        <h1 className="q">{t.myList.title}</h1>
        <p className="mylist-note">{t.myList.note}</p>
      </div>

      <section className="booth">
        <div className="mylist-sec">
          <h2 className="h2">{t.myList.favorites}</h2>
          {favorites.length > 0 && <span className="note">{t.myList.count(favorites.length)}</span>}
        </div>
        {favorites.length === 0 ? (
          <p className="note">
            {t.myList.emptyBefore}
            <Link href={href("/")}>{t.myList.emptyLink}</Link>
            {t.myList.emptyAfter}
          </p>
        ) : (
          <ul className="mylist-grid">
            {favorites.map((m) => (
              <li key={m.id}>
                <MiniPoster movie={m} onOpen={() => setOpen(m)} />
                <button type="button" className="link-btn mylist-small" onClick={() => removeFavorite(m.id)}>
                  {t.myList.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="booth">
        <div className="mylist-sec">
          <h2 className="h2">{t.myList.recent}</h2>
          {recent.length > 0 && (
            <button type="button" className="link-btn mylist-small" onClick={clearRecent}>
              {t.myList.clear}
            </button>
          )}
        </div>
        <p className="note">{t.myList.recentNote}</p>
        {recent.length > 0 && (
          <ul className="mylist-grid small">
            {recent.map((m) => (
              <li key={m.id}>
                <MiniPoster movie={m} onOpen={() => setOpen(m)} />
                <time dateTime={new Date(m.viewedAt).toISOString()}>{viewedLabel(m.viewedAt, locale, t)}</time>
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
