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

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
