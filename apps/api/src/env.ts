import type { AuthSession, AuthUser } from "./lib/auth";

/** Workers Rate Limiting のバインディング */
export type RateLimiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

export type Bindings = {
  DB: D1Database;
  /** アイコン画像の保存先。ログイン機能を止めているあいだは未設定 */
  BUCKET?: R2Bucket;
  WEB_ORIGIN: string;
  /** おすすめ（/api/recommend）の回数制限。1つの IP から1分に20回まで */
  RECOMMEND_LIMITER?: RateLimiter;
  /** 映画の詳細（/api/movies/:id）の回数制限。1つの IP から1分に60回まで */
  MOVIE_LIMITER?: RateLimiter;
  TMDB_TOKEN: string;
  // ログイン機能を使うときだけ必要（今は止めているので未設定でよい）
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
};
