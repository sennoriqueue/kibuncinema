/** API が返す映画1本分のデータ */
export type Movie = {
  id: number;
  title: string;
  year: string;
  rating: number;
  genreIds: number[];
  overview: string;
  posterPath: string | null;
};

/* ---------- API のレスポンス（apps/api と apps/web で共有） ---------- */

export type RecommendResponse = {
  /** シャッフル済み。画面では先頭から3本ずつ見せる */
  movies: Movie[];
  /** ぴったりの作品が少なく、時間・年代の条件を外して探し直したとき true */
  relaxed: boolean;
};

export type FavoriteItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  createdAt: string;
};

export type FavoriteInput = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
};

export type HistoryItem = {
  id: string;
  answers: import("./questions").Answers;
  movies: { id: number; title: string; posterPath: string | null }[];
  createdAt: string;
};

export type ApiError = { error: string };

/** 配信サービス1つ分 */
export type WatchProvider = {
  id: number;
  name: string;
  logoPath: string | null;
};

/** 日本で観られる配信サービス（データは JustWatch 提供。表示時にクレジットが必要） */
export type WatchProviders = {
  /** TMDB の視聴ページ。各サービスの作品ページへのリンクがある */
  link: string | null;
  /** 見放題 */
  flatrate: WatchProvider[];
  /** レンタル・購入（重複は除く） */
  rentOrBuy: WatchProvider[];
};

/** GET /api/movies/:id */
export type MovieDetail = {
  id: number;
  title: string;
  originalTitle: string;
  year: string;
  runtime: number | null;
  rating: number;
  genres: string[];
  tagline: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  directors: string[];
  cast: string[];
  /** YouTube の動画ID */
  trailerKey: string | null;
  providers: WatchProviders;
};

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
