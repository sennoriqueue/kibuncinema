import { createDb, tmdbCache } from "@kibuncinema/db";
import type {
  Answers,
  Movie,
  MovieDetail,
  RecommendResponse,
  WatchProvider,
} from "@kibuncinema/shared";
import { eq, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Bindings } from "../env";
import { buildDiscoverParams } from "./tmdb-params";

const TMDB_API = "https://api.themoviedb.org/3";
/** おすすめの検索結果のキャッシュ時間 */
const DISCOVER_CACHE_SECONDS = 6 * 60 * 60;
/** 映画の詳細のキャッシュ時間（内容はめったに変わらない） */
const DETAIL_CACHE_SECONDS = 24 * 60 * 60;
/** TMDB に問い合わせたときに、期限切れのキャッシュを掃除する割合 */
const CLEANUP_RATE = 0.02;

/**
 * Worker のメモリ上の小さなキャッシュ。同じ Worker が続けて受けたリクエストなら D1 も読まずに返す。
 * Worker は入れ替わるので消えてもよい。古いものから捨てる
 */
const MEMORY_MAX = 200;
const memory = new Map<string, { body: string; expiresAt: number }>();

function memoryGet(key: string, now: number): string | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= now) {
    memory.delete(key);
    return null;
  }
  return hit.body;
}

function memorySet(key: string, body: string, expiresAt: number) {
  if (memory.size >= MEMORY_MAX) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, { body, expiresAt });
}
/** ランダムに選ぶページの上限（人気順なので、深すぎるとマイナーな作品ばかりになる） */
const MAX_PAGE = 10;

/**
 * TMDB の GET を呼ぶ。同じパス・条件の結果は D1 に数時間キャッシュする。
 * 見つからないとき（404）は 404 を返す。
 */
async function tmdbGet<T>(
  env: Bindings,
  path: string,
  params: Record<string, string>,
  cacheSeconds: number,
): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
  const key = `${path}?${qs}`;
  const now = Math.floor(Date.now() / 1000);

  const inMemory = memoryGet(key, now);
  if (inMemory) return JSON.parse(inMemory) as T;

  const db = createDb(env.DB);
  const cached = await db.select().from(tmdbCache).where(eq(tmdbCache.key, key)).get();
  if (cached && cached.expiresAt > now) {
    memorySet(key, cached.body, cached.expiresAt);
    return JSON.parse(cached.body) as T;
  }

  const res = await fetch(`${TMDB_API}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, accept: "application/json" },
  });
  if (res.status === 404) throw new HTTPException(404, { message: "映画が見つかりません" });
  if (!res.ok) {
    console.error("TMDB error", path, res.status, await res.text().catch(() => ""));
    throw new HTTPException(502, { message: "映画データを取得できませんでした" });
  }
  const body = await res.text();
  const expiresAt = now + cacheSeconds;

  await db
    .insert(tmdbCache)
    .values({ key, body, expiresAt })
    .onConflictDoUpdate({ target: tmdbCache.key, set: { body, expiresAt } });
  memorySet(key, body, expiresAt);

  // ときどき期限切れのキャッシュを消して、D1 の容量（無料枠 500MB）が少しずつ埋まるのを防ぐ
  if (Math.random() < CLEANUP_RATE) {
    await db.delete(tmdbCache).where(lt(tmdbCache.expiresAt, now)).run();
  }

  return JSON.parse(body) as T;
}

/* ---------- おすすめ（/discover/movie） ---------- */

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

const discover = (env: Bindings, params: Record<string, string>) =>
  tmdbGet<DiscoverResponse>(env, "/discover/movie", params, DISCOVER_CACHE_SECONDS);

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

/* ---------- 詳細（/movie/{id}） ---------- */

type TmdbProvider = { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number };

type TmdbMovieDetail = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
  tagline?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  credits?: {
    cast: { name: string; order: number }[];
    crew: { name: string; job: string }[];
  };
  videos?: {
    results: { key: string; site: string; type: string; iso_639_1: string; official: boolean }[];
  };
  "watch/providers"?: {
    results: Record<
      string,
      { link?: string; flatrate?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[] }
    >;
  };
};

function toProviders(list: TmdbProvider[]): WatchProvider[] {
  return list
    .slice()
    .sort((a, b) => a.display_priority - b.display_priority)
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));
}

/** 予告編を1本選ぶ。日本語の公式予告編 → 日本語 → 英語の公式予告編 → なんでも、の順 */
function pickTrailer(videos: NonNullable<TmdbMovieDetail["videos"]>["results"]): string | null {
  const yt = videos.filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  const score = (v: (typeof yt)[number]) =>
    (v.iso_639_1 === "ja" ? 4 : 0) + (v.type === "Trailer" ? 2 : 0) + (v.official ? 1 : 0);
  const best = yt.sort((a, b) => score(b) - score(a))[0];
  return best?.key ?? null;
}

export async function movieDetail(env: Bindings, id: number): Promise<MovieDetail> {
  const d = await tmdbGet<TmdbMovieDetail>(env, `/movie/${id}`, {
    language: "ja-JP",
    append_to_response: "credits,videos,watch/providers",
    include_video_language: "ja,en",
  }, DETAIL_CACHE_SECONDS);

  const jp = d["watch/providers"]?.results?.JP;
  const flatrate = toProviders(jp?.flatrate ?? []);
  const seen = new Set(flatrate.map((p) => p.id));
  const rentOrBuy = toProviders([...(jp?.rent ?? []), ...(jp?.buy ?? [])]).filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return {
    id: d.id,
    title: d.title,
    originalTitle: d.original_title,
    year: (d.release_date ?? "").slice(0, 4),
    runtime: d.runtime || null,
    rating: Math.round(d.vote_average * 10) / 10,
    genres: d.genres.map((g) => g.name),
    tagline: d.tagline ?? "",
    overview: d.overview ?? "",
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    directors: (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name),
    cast: (d.credits?.cast ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map((c) => c.name),
    trailerKey: pickTrailer(d.videos?.results ?? []),
    providers: { link: jp?.link ?? null, flatrate, rentOrBuy },
  };
}
