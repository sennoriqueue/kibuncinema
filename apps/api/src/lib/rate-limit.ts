import { createMiddleware } from "hono/factory";
import type { AppEnv, Bindings } from "../env";

type LimiterName = "RECOMMEND_LIMITER" | "MOVIE_LIMITER";

/**
 * 1つの IP アドレスからのリクエスト数を制限する。超えたら 429 を返す。
 *
 * IP は Cloudflare が付ける cf-connecting-ip を使う（利用者は書き換えられない）。
 * 画面の Worker が元のリクエストのヘッダーをそのまま中継するので、API 側でも読める。
 * バインディングがない環境（古い設定・テスト）では制限しない。
 */
export function rateLimit(name: LimiterName) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const limiter = (c.env as Bindings)[name];
    if (limiter) {
      const ip = c.req.header("cf-connecting-ip") ?? "unknown";
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        c.header("retry-after", "60");
        return c.json({ error: "アクセスが集中しています。1分ほど待ってから、もう一度試してください" }, 429);
      }
    }
    await next();
  });
}
