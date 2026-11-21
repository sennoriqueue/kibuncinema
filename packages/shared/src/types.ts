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

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
