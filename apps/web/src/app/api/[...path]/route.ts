import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * /api/* を Hono の Worker にそのまま中継する。
 * 画面と API が同じドメインになるので、ログインの Cookie がそのまま使える。
 *
 * - 本番: Service Binding（env.API）で呼ぶ。外部ネットワークを通らない
 * - ローカル: .env.local の API_ORIGIN（wrangler dev）に fetch する
 */
async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // ログイン時の Google へのリダイレクトはブラウザに返す
    redirect: "manual",
  };
  if (hasBody) init.duplex = "half";

  // 開発中（next dev）だけ wrangler dev に fetch する。本番のビルドに .env の値が混ざっても使わない
  const apiOrigin = process.env.NODE_ENV === "development" ? process.env.API_ORIGIN : undefined;
  let response: Response;
  if (apiOrigin) {
    response = await fetch(new URL(url.pathname + url.search, apiOrigin), init);
  } else {
    const { env } = await getCloudflareContext({ async: true });
    response = await env.API.fetch(new Request(url, init));
  }

  // fetch が本文を展開済みのことがあるので、圧縮関連のヘッダーは外す
  const outHeaders = new Headers(response.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("content-length");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

export const dynamic = "force-dynamic";
