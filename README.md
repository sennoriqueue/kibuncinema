# キブンシネマ

いくつかの質問に答えると、今の気分に合う映画を提案するウェブサービスです。

| 役割 | 使うもの |
|---|---|
| フロントエンド | Next.js（App Router）を OpenNext で Cloudflare Workers に配置 |
| バックエンド | Hono（Cloudflare Workers） |
| データベース | Cloudflare D1（Drizzle ORM） |
| ファイル | Cloudflare R2（ユーザーのアイコン画像） |
| 認証 | Better Auth（Google ログイン）※現在は停止中。お気に入りと履歴はブラウザに保存 |
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
| GET | `/api/movies/:id` | 映画の詳細と、日本で観られる配信サービス（JustWatch 提供） | - |
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

必要なもの：Node.js 22.12 以上（wrangler の条件）、pnpm、Cloudflare のアカウント、TMDB のアカウント、Google Cloud のプロジェクト。

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

`apps/api/.dev.vars` に次の値を入れます。今はログイン機能を止めているので、必要なのは `TMDB_TOKEN` だけです。

- `TMDB_TOKEN`：TMDB の設定画面 → API にある「API 読み取りアクセストークン」

ログイン機能を戻すときは、次の3つも入れます（3つそろったときだけログインが動きます）。

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

`main` にマージすると、GitHub Actions（`.github/workflows/deploy.yml`）が自動で本番にデプロイします。
画面側を Workers 用に変換する OpenNext は Windows での動作が保証されていないため、ビルドは GitHub の Linux 環境で行います。

### 最初に一度だけやること

1. **D1 の database_id を設定する**：`apps/api` で `pnpm wrangler d1 list` を実行し、
   `kibuncinema` の ID を `apps/api/wrangler.jsonc` の `database_id` に書いて `main` に入れる
2. **TMDB のトークンを本番に登録する**（`apps/api` で実行）
   ```sh
   pnpm wrangler secret put TMDB_TOKEN
   ```
   まだ一度もデプロイしていないときは「Worker を作るか」と聞かれるので、そのまま作る
3. **Cloudflare の API トークンを作る**：ダッシュボード → 右上のアイコン →「プロフィール」→「API トークン」→「トークンを作成」。
   「Cloudflare Workers を編集する」テンプレートを使い、権限に「アカウント → D1 → 編集」を追加する
4. **GitHub にシークレットを登録する**：リポジトリの Settings → Secrets and variables → Actions → New repository secret
   - `CLOUDFLARE_API_TOKEN`：3 で作ったトークン
   - `CLOUDFLARE_ACCOUNT_ID`：ダッシュボードの「Workers & Pages」の画面右側などに表示されるアカウントID
5. GitHub の Actions タブ →「Deploy」→「Run workflow」で手動実行するか、`main` にマージする

デプロイが終わると、画面は `https://kibuncinema-web.<アカウントのサブドメイン>.workers.dev` で公開されます。

## ログイン機能について

今は Google ログインを止めていて、ログインなしで使えます。

- お気に入りと「最近見た映画」は、そのブラウザの localStorage に保存します（`apps/web/src/lib/local-store.ts`）。
  最近見た映画は30日で自動で消えます。別の端末やブラウザとは共有されません
- ログイン関係のコード（Better Auth・お気に入りと履歴の API・R2 へのアイコン保存）は残してあります。
  API はシークレットがそろっていないとき、ログインしていない扱いで動きます
- 戻すときは、`apps/web/src/app/layout.tsx` の `<MyListLink />` を `<AuthButton />` に戻し、シークレットを登録します

## スキーマを変えるとき

1. `packages/db/src/schema.ts` を編集
2. `pnpm --filter @kibuncinema/db generate` で `apps/api/migrations` に SQL を生成
3. `pnpm db:migrate:local`（本番は `db:migrate:remote`）

## メモ

- Cloudflare のドキュメントでは、新しい Next.js アプリには OpenNext ではなく vinext が推奨されるようになっています。
  このリポジトリは OpenNext で組んでいます。移行する場合は `apps/web` の `next.config.ts`・`open-next.config.ts`・`wrangler.jsonc` が対象です
- TMDB の利用規約に従い、画面の下に TMDB のクレジットを表示しています
- 配信サービスのデータは JustWatch 提供のため、詳細画面にクレジットを表示しています（TMDB の条件）。
  TMDB は作品ページへの直リンクを返さないので、各サービスの検索結果に飛ばしています（`apps/web/src/lib/watch-links.ts`）

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
