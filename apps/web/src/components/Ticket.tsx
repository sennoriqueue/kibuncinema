"use client";

import type { Movie } from "@kibuncinema/shared";
import { useI18n } from "@/i18n/I18nProvider";
import { toggleFavorite, useIsFavorite } from "@/lib/local-store";
import { Poster } from "./Poster";

type Props = {
  movie: Movie;
  /** ポスターかタイトルを押したとき（詳細を開く） */
  onOpen: () => void;
};

export function Ticket({ movie, onOpen }: Props) {
  const { t } = useI18n();
  const favorite = useIsFavorite(movie.id);
  const genres = movie.genreIds
    .slice(0, 2)
    .map((g) => t.genres[g])
    .filter(Boolean)
    .join(t.detail.genreSeparator);

  return (
    <article className="tk">
      <button type="button" className="poster poster-btn" onClick={onOpen} aria-label={t.ticket.openDetailAria(movie.title)}>
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
          <span>{movie.year || t.ticket.unknownYear}</span>
          {genres && <span>{genres}</span>}
        </div>
        <p className="ov">{movie.overview || t.ticket.noOverview}</p>
        <div className="stub-foot">
          <button type="button" className="more-btn" onClick={onOpen}>
            {t.ticket.openDetail}
          </button>
          <button
            type="button"
            className={`fav${favorite ? " on" : ""}`}
            aria-pressed={favorite}
            onClick={() => toggleFavorite(movie)}
          >
            {favorite ? "♥" : "♡"} {t.ticket.favorite}
          </button>
        </div>
      </div>
    </article>
  );
}
