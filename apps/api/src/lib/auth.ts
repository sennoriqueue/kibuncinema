import { createDb, schema } from "@kibuncinema/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Bindings } from "../env";

/**
 * Workers では D1 のバインディングがリクエスト中しか使えないため、
 * リクエストごとに Better Auth のインスタンスを作る。
 *
 * 画面（Next.js）が /api/* をこの Worker に中継するので、
 * ブラウザから見ると認証も同じドメインになる。baseURL は画面側の URL。
 */
/** ログイン機能に必要なシークレットがそろっているか。そろっていなければログインは止まった状態で動く */
export function authEnabled(env: Bindings): boolean {
  return Boolean(env.BETTER_AUTH_SECRET && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function createAuth(env: Bindings) {
  return betterAuth({
    baseURL: env.WEB_ORIGIN,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN],
    database: drizzleAdapter(createDb(env.DB), {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },
    session: {
      // 毎回 D1 を読まないよう、短時間だけ Cookie にセッションを持たせる
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
  });
}

type Auth = ReturnType<typeof createAuth>;
export type AuthUser = Auth["$Infer"]["Session"]["user"];
export type AuthSession = Auth["$Infer"]["Session"]["session"];
