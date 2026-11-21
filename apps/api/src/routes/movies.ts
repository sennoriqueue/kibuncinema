import { Hono } from "hono";
import type { AppEnv } from "../env";
import { movieDetail } from "../lib/tmdb";

/** GET /api/movies/:id  映画の詳細と、日本で観られる配信サービス */
export const moviesRoute = new Hono<AppEnv>().get("/:id{[0-9]+}", async (c) => {
  const detail = await movieDetail(c.env, Number(c.req.param("id")));
  c.header("cache-control", "public, max-age=3600");
  return c.json(detail);
});
