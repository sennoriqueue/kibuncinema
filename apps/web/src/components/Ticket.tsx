import { GENRES, type Movie } from "@kibuncinema/shared";
import { Poster } from "./Poster";

type Props = {
  movie: Movie;
  /** undefined のときはお気に入りボタンを出さない（未ログイン） */
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

export function Ticket({ movie, favorite, onToggleFavorite }: Props) {
  const genres = movie.genreIds
    .slice(0, 2)
    .map((g) => GENRES[g])
    .filter(Boolean)
    .join("・");

  return (
    <article className="tk">
      <div className="poster">
        <Poster title={movie.title} year={movie.year} genreIds={movie.genreIds} path={movie.posterPath} />
      </div>
      <div className="stub">
        <h2>{movie.title}</h2>
        <div className="meta">
          <span className="star">★ {movie.rating.toFixed(1)}</span>
          <span>{movie.year || "年不明"}</span>
          {genres && <span>{genres}</span>}
        </div>
        <p className="ov">{movie.overview || "あらすじは登録されていません。"}</p>
        <div className="stub-foot">
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}?language=ja-JP`}
            target="_blank"
            rel="noopener"
          >
            TMDBで詳しく見る →
          </a>
          {onToggleFavorite && (
            <button
              type="button"
              className={`fav${favorite ? " on" : ""}`}
              aria-pressed={favorite}
              onClick={onToggleFavorite}
            >
              {favorite ? "♥ お気に入り" : "♡ お気に入り"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
