// getCloudflareContext().env の型。wrangler.jsonc のバインディングと合わせる
interface CloudflareEnv {
  API: { fetch(request: Request): Promise<Response> };
}
