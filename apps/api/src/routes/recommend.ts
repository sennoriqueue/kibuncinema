import { zValidator } from "@hono/zod-validator";
import { createDb, history } from "@kibuncinema/db";
import { recommendRequestSchema } from "@kibuncinema/shared";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { rateLimit } from "../lib/rate-limit";
import { recommend } from "../lib/tmdb";

/** POST /api/recommend  質問の答え → 映画のリスト */
export const recommendRoute = new Hono<AppEnv>().post(
  "/",
  rateLimit("RECOMMEND_LIMITER"),
  zValidator("json", recommendRequestSchema, (result, c) => {
    if (!result.success) return c.json({ error: "答えの形式が正しくありません" }, 400);
  }),
  async (c) => {
    const { exclude, locale, ...answers } = c.req.valid("json");
    const result = await recommend(c.env, answers, exclude, locale);

    // ログインしていれば、最初に見せる3本を履歴に残す
    const user = c.get("user");
    if (user && result.movies.length > 0) {
      const shown = result.movies
        .slice(0, 3)
        .map(({ id, title, posterPath }) => ({ id, title, posterPath }));
      const db = createDb(c.env.DB);
      c.executionCtx.waitUntil(
        db
          .insert(history)
          .values({ id: crypto.randomUUID(), userId: user.id, answers, movies: shown })
          .run()
          .then(() => undefined),
      );
    }

    return c.json(result);
  },
);
