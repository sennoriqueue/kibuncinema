# キブンシネマ

いくつかの質問に答えると、今の気分に合う映画を提案するウェブサービスです。

| 役割 | 使うもの |
|---|---|
| フロントエンド | Next.js（App Router）を OpenNext で Cloudflare Workers に配置 |
| バックエンド | Hono（Cloudflare Workers） |
| データベース | Cloudflare D1（Drizzle ORM） |
| ファイル | Cloudflare R2（ユーザーのアイコン画像） |
| 認証 | Better Auth（Google ログイン） |
| 映画データ | TMDB API |

## 構成

```
apps/
  web/        Next.js。/api/* はすべて API の Worker に中継する
  api/        Hono。認証・推薦・お気に入り・履歴・アイコン
    migrations/   D1 のマイグレーション（SQL）
packages/
  shared/     質問の定義、入力チェック、API の型（web と api の両方で使う）
  db/         Drizzle のスキーマ
```

ブラウザは Next.js の Worker だけにアクセスします。`/api/*` へのリクエストは
`apps/web/src/app/api/[...path]/route.ts` が API の Worker に中継します
（本番は Service Binding、ローカルは `API_ORIGIN` への fetch）。
画面と API が同じドメインになるので、ログインの Cookie をそのまま使えます。
TMDB のトークンは API の Worker のシークレットにだけ置き、ブラウザには出しません。

### API

| メソッド | パス | 内容 | ログイン |
|---|---|---|---|
| GET/POST | `/api/auth/*` | Better Auth（ログイン、ログアウト、コールバック） | - |
| POST | `/api/recommend` | 質問の答えから映画を探す。ログイン中なら履歴に残す | 任意 |
| GET | `/api/favorites` | お気に入りの一覧 | 必須 |
| POST | `/api/favorites` | お気に入りに追加 | 必須 |
| DELETE | `/api/favorites/:tmdbId` | お気に入りから外す | 必須 |
| GET | `/api/history` | 最近の提案（20件） | 必須 |
| GET | `/api/me` | 自分の情報 | 任意 |
| PUT | `/api/me/avatar` | アイコン画像を R2 に保存（本文に画像、2MB まで） | 必須 |
| GET | `/api/images/avatars/:id` | アイコン画像を返す | - |

質問の答えを TMDB の検索条件に変える対応表は `apps/api/src/lib/tmdb-params.ts` にあります。
選択肢を増やすときは `packages/shared/src/questions.ts` と一緒に変更してください。

## はじめかた（ローカル）

必要なもの：Node.js 20 以上、pnpm、Cloudflare のアカウント、TMDB のアカウント、Google Cloud のプロジェクト。

```sh
pnpm install
```

### 1. Cloudflare のリソースを作る

```sh
cd apps/api
pnpm wrangler login
pnpm wrangler d1 create kibuncinema          # 表示された database_id を wrangler.jsonc に書く
pnpm wrangler r2 bucket create kibuncinema-assets
```

### 2. シークレットを用意する

```sh
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env.local
```

`apps/api/.dev.vars` に次の値を入れます。

- `TMDB_TOKEN`：TMDB の設定画面 → API にある「API 読み取りアクセストークン」
- `BETTER_AUTH_SECRET`：`openssl rand -base64 32` などで作ったランダムな文字列
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`：Google Cloud Console →「API とサービス」→「認証情報」で
  OAuth クライアント ID（ウェブアプリケーション）を作成。
  承認済みのリダイレクト URI に `http://localhost:3000/api/auth/callback/google` を追加する

### 3. データベースを作って起動する

```sh
pnpm db:migrate:local
pnpm dev            # API: http://localhost:8787 / 画面: http://localhost:3000
```

http://localhost:3000 を開きます。

## 本番へのデプロイ

1. `apps/api/wrangler.jsonc` の `WEB_ORIGIN` を画面の本番 URL（例：`https://kibuncinema-web.<アカウント>.workers.dev`）に変える
2. シークレットを登録する
   ```sh
   cd apps/api
   pnpm wrangler secret put TMDB_TOKEN
   pnpm wrangler secret put BETTER_AUTH_SECRET
   pnpm wrangler secret put GOOGLE_CLIENT_ID
   pnpm wrangler secret put GOOGLE_CLIENT_SECRET
   ```
3. Google の OAuth クライアントに、本番のリダイレクト URI（`<画面のURL>/api/auth/callback/google`）を追加する
4. `pnpm db:migrate:remote`
5. `pnpm run deploy`（API → 画面の順にデプロイ。画面は Service Binding で API を呼ぶため）

## スキーマを変えるとき

1. `packages/db/src/schema.ts` を編集
2. `pnpm --filter @kibuncinema/db generate` で `apps/api/migrations` に SQL を生成
3. `pnpm db:migrate:local`（本番は `db:migrate:remote`）

## メモ

- Cloudflare のドキュメントでは、新しい Next.js アプリには OpenNext ではなく vinext が推奨されるようになっています。
  このリポジトリは OpenNext で組んでいます。移行する場合は `apps/web` の `next.config.ts`・`open-next.config.ts`・`wrangler.jsonc` が対象です
- TMDB の利用規約に従い、画面の下に TMDB のクレジットを表示しています

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
