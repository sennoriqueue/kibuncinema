import { defineConfig } from "drizzle-kit";

// スキーマを変えたら `pnpm --filter @kibuncinema/db generate` で
// apps/api/migrations に SQL を生成し、wrangler の d1 migrations で適用する。
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "../../apps/api/migrations",
});
