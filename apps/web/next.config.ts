import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ワークスペースの TypeScript パッケージをそのまま読み込む
  transpilePackages: ["@kibuncinema/shared"],
};

export default nextConfig;

// `next dev` でも wrangler.jsonc のバインディングを使えるようにする
initOpenNextCloudflareForDev();
