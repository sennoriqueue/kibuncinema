import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * サーバー側（ページのメタデータ作成など）から API の Worker を呼ぶ。
 * 本番は Service Binding、ローカルは API_ORIGIN（wrangler dev）。
 */
export async function serverApi<T>(path: string): Promise<T | null> {
  try {
    const req = new Request(`https://api.internal/api${path}`, { headers: { accept: "application/json" } });
    const apiOrigin = process.env.API_ORIGIN;
    let res: Response;
    if (apiOrigin) {
      res = await fetch(new URL(`/api${path}`, apiOrigin), { headers: req.headers });
    } else {
      const { env } = await getCloudflareContext({ async: true });
      res = await env.API.fetch(req);
    }
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error("serverApi", path, e);
    return null;
  }
}
