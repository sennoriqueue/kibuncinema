import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

/**
 * すべてのページに付けるセキュリティ用のヘッダー。
 * Content-Security-Policy（読み込める場所の制限）は、広告を入れるときに
 * 広告の配信元を許可する必要があるので、そのときに合わせて追加する
 */
const securityHeaders = [
  // ほかのサイトの中に埋め込まれるのを防ぐ（クリックを横取りする攻撃の対策）
  { key: "X-Frame-Options", value: "DENY" },
  // ファイルの種類をブラウザに推測させない
  { key: "X-Content-Type-Options", value: "nosniff" },
  // ほかのサイトに移るとき、URL の細かい部分（/movie/123 など）を渡さない
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 使わない機能（カメラ・マイク・位置情報など）を止めておく
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // 常に https で接続させる
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // ワークスペースの TypeScript パッケージをそのまま読み込む
  transpilePackages: ["@kibuncinema/shared"],
  // 使っているフレームワークを外に知らせない
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// `next dev` でも wrangler.jsonc のバインディングを使えるようにする
initOpenNextCloudflareForDev();
