import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./env";
import { authEnabled, createAuth } from "./lib/auth";
import { sessionMiddleware } from "./lib/session";
import { favoritesRoute } from "./routes/favorites";
import { historyRoute } from "./routes/history";
import { imagesRoute, meRoute } from "./routes/me";
import { moviesRoute } from "./routes/movies";
import { recommendRoute } from "./routes/recommend";

const app = new Hono<AppEnv>().basePath("/api");

// Better Auth（ログイン・ログアウト・Google のコールバックなど）
// ログイン機能を止めているとき（シークレット未設定）は 404 を返す
app.on(["GET", "POST"], "/auth/*", (c) => {
  if (!authEnabled(c.env)) return c.json({ error: "ログイン機能は停止中です" }, 404);
  return createAuth(c.env).handler(c.req.raw);
});

const routes = app
  .use("*", sessionMiddleware)
  .get("/health", (c) => c.json({ ok: true }))
  .route("/recommend", recommendRoute)
  .route("/movies", moviesRoute)
  .route("/favorites", favoritesRoute)
  .route("/history", historyRoute)
  .route("/me", meRoute)
  .route("/images", imagesRoute);

app.notFound((c) => c.json({ error: "見つかりません" }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "サーバーでエラーが起きました" }, 500);
});

export type AppType = typeof routes;
export default app;
