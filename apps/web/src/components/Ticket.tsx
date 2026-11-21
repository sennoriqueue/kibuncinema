"use client";

import { GENRES, type Movie } from "@kibuncinema/shared";
import { toggleFavorite, useIsFavorite } from "@/lib/local-store";
import { Poster } from "./Poster";

type Props = {
  movie: Movie;
  /** ポスターかタイトルを押したとき（詳細を開く） */
  onOpen: () => void;
};

export function Ticket({ movie, onOpen }: Props) {
  const favorite = useIsFavorite(movie.id);
  const genres = movie.genreIds
    .slice(0, 2)
    .map((g) => GENRES[g])
    .filter(Boolean)
    .join("・");

  return (
    <article className="tk">
      <button type="button" className="poster poster-btn" onClick={onOpen} aria-label={`${movie.title}の詳細を見る`}>
        <Poster title={movie.title} year={movie.year} genreIds={movie.genreIds} path={movie.posterPath} />
      </button>
      <div className="stub">
        <h2>
          <button type="button" className="title-btn" onClick={onOpen}>
            {movie.title}
          </button>
        </h2>
        <div className="meta">
          <span className="star">★ {movie.rating.toFixed(1)}</span>
          <span>{movie.year || "年不明"}</span>
          {genres && <span>{genres}</span>}
        </div>
        <p className="ov">{movie.overview || "あらすじは登録されていません。"}</p>
        <div className="stub-foot">
          <button type="button" className="more-btn" onClick={onOpen}>
            詳細・配信を見る →
          </button>
          <button
            type="button"
            className={`fav${favorite ? " on" : ""}`}
            aria-pressed={favorite}
            onClick={() => toggleFavorite(movie)}
          >
            {favorite ? "♥ お気に入り" : "♡ お気に入り"}
          </button>
        </div>
      </div>
    </article>
  );
}
