"use client";

import { MovieDetail } from "@/components/MovieDetail";

/** /movie/:id を直接開いたとき（共有リンクから来たときなど）の詳細表示 */
export function MoviePageClient({ movieId }: { movieId: number }) {
  return (
    <div className="dialog dialog-page">
      <MovieDetail movieId={movieId} />
    </div>
  );
}
