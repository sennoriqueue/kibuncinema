import type { AuthSession, AuthUser } from "./lib/auth";

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  WEB_ORIGIN: string;
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
