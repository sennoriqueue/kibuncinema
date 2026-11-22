import { DEFAULT_LOCALE, isLocale } from "@kibuncinema/shared";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { rateLimit } from "../lib/rate-limit";
import { movieDetail } from "../lib/tmdb";

/**
 * GET /api/movies/:id?locale=ja|en|ko
 * 映画の詳細と、その言語の国（日本・アメリカ・韓国）で観られる配信サービス
 */
export const moviesRoute = new Hono<AppEnv>().get("/:id{[0-9]+}", rateLimit("MOVIE_LIMITER"), async (c) => {
  const query = c.req.query("locale");
  const locale = isLocale(query) ? query : DEFAULT_LOCALE;
  const detail = await movieDetail(c.env, Number(c.req.param("id")), locale);
  c.header("cache-control", "public, max-age=3600");
  return c.json(detail);
});
