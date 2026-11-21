import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { createAuth } from "./auth";

/** ログインしていれば c.var.user に入れる。していなくても先へ進む */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const result = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);
  await next();
});

/** ログイン必須のルートに付ける */
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("user")) return c.json({ error: "ログインが必要です" }, 401);
  await next();
});

/** requireUser の後で使う。user が必ずある前提で取り出す */
export function currentUser(c: { var: AppEnv["Variables"] }) {
  const user = c.var.user;
  if (!user) throw new Error("requireUser が付いていないルートで currentUser を呼んでいます");
  return user;
}
