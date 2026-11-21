"use client";

import { useEffect, useState } from "react";
import { MovieDetail } from "@/components/MovieDetail";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

/** /movie/:id を直接開いたとき（共有リンクから来たときなど）の詳細表示 */
export function MoviePageClient({ movieId }: { movieId: number }) {
  const { data: session } = useSession();
  const loggedIn = Boolean(session);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    api
      .favorites()
      .then(({ items }) => setFavorite(items.some((f) => f.tmdbId === movieId)))
      .catch(() => {});
  }, [loggedIn, movieId]);

  async function toggle(movie: { id: number; title: string; posterPath: string | null }) {
    const next = !favorite;
    setFavorite(next);
    try {
      if (next) await api.addFavorite({ tmdbId: movie.id, title: movie.title, posterPath: movie.posterPath });
      else await api.removeFavorite(movie.id);
    } catch {
      setFavorite(!next);
    }
  }

  return (
    <div className="dialog dialog-page">
      <MovieDetail
        movieId={movieId}
        favorite={loggedIn ? favorite : undefined}
        onToggleFavorite={loggedIn ? toggle : undefined}
      />
    </div>
  );
}
