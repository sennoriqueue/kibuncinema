import { createDb, tmdbCache } from "@kibuncinema/db";
import type { Answers, Movie, RecommendResponse } from "@kibuncinema/shared";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Bindings } from "../env";
import { buildDiscoverParams } from "./tmdb-params";

const TMDB_API = "https://api.themoviedb.org/3";
const CACHE_SECONDS = 6 * 60 * 60;
/** ランダムに選ぶページの上限（人気順なので、深すぎるとマイナーな作品ばかりになる） */
const MAX_PAGE = 10;

type DiscoverResult = {
  id: number;
  title: string;
  release_date?: string;
  vote_average: number;
  genre_ids?: number[];
  overview?: string;
  poster_path: string | null;
};

type DiscoverResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: DiscoverResult[];
};

/** TMDB を呼ぶ。同じ条件の結果は D1 に数時間キャッシュする */
async function discover(env: Bindings, params: Record<string, string>): Promise<DiscoverResponse> {
  const qs = new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
  const key = `discover?${qs}`;
  const db = createDb(env.DB);
  const now = Math.floor(Date.now() / 1000);

  const cached = await db.select().from(tmdbCache).where(eq(tmdbCache.key, key)).get();
  if (cached && cached.expiresAt > now) return JSON.parse(cached.body) as DiscoverResponse;

  const res = await fetch(`${TMDB_API}/discover/movie?${qs}`, {
    headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, accept: "application/json" },
  });
  if (!res.ok) {
    console.error("TMDB error", res.status, await res.text().catch(() => ""));
    throw new HTTPException(502, { message: "映画データを取得できませんでした" });
  }
  const body = await res.text();

  await db
    .insert(tmdbCache)
    .values({ key, body, expiresAt: now + CACHE_SECONDS })
    .onConflictDoUpdate({ target: tmdbCache.key, set: { body, expiresAt: now + CACHE_SECONDS } });

  return JSON.parse(body) as DiscoverResponse;
}

function toMovie(r: DiscoverResult): Movie {
  return {
    id: r.id,
    title: r.title,
    year: (r.release_date ?? "").slice(0, 4),
    rating: Math.round(r.vote_average * 10) / 10,
    genreIds: r.genre_ids ?? [],
    overview: r.overview ?? "",
    posterPath: r.poster_path,
  };
}

function shuffle<T>(items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** 答えに合う映画を探して、シャッフルして返す */
export async function recommend(env: Bindings, answers: Answers): Promise<RecommendResponse> {
  let relaxed = false;
  let params = buildDiscoverParams(answers);
  let first = await discover(env, params);

  if (first.total_results < 3) {
    relaxed = true;
    params = buildDiscoverParams(answers, { relax: true });
    first = await discover(env, params);
  }

  const pages = Math.max(1, Math.min(first.total_pages, MAX_PAGE));
  const page = 1 + Math.floor(Math.random() * pages);
  const data = page === 1 ? first : await discover(env, { ...params, page: String(page) });

  const movies = shuffle(data.results.filter((r) => r.title).map(toMovie));
  return { movies, relaxed };
}
