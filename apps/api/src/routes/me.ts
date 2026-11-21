import { createDb, user as userTable } from "@kibuncinema/db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { currentUser, requireUser } from "../lib/session";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** /api/me  自分の情報とアイコン画像 */
export const meRoute = new Hono<AppEnv>()
  .get("/", (c) => c.json({ user: c.get("user") }))
  /** PUT /api/me/avatar  本文に画像そのものを送る（Content-Type: image/png など） */
  .put("/avatar", requireUser, async (c) => {
    const user = currentUser(c);
    const type = c.req.header("content-type")?.split(";")[0]?.trim() ?? "";
    if (!IMAGE_TYPES.includes(type)) {
      return c.json({ error: "PNG・JPEG・WebP の画像を送ってください" }, 415);
    }
    const body = await c.req.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_AVATAR_BYTES) {
      return c.json({ error: "画像は2MBまでです" }, 413);
    }

    const key = `avatars/${user.id}`;
    await c.env.BUCKET.put(key, body, { httpMetadata: { contentType: type } });

    const image = `/api/images/${key}?v=${Date.now()}`;
    await createDb(c.env.DB)
      .update(userTable)
      .set({ image, updatedAt: new Date() })
      .where(eq(userTable.id, user.id))
      .run();
    return c.json({ image });
  });

/** GET /api/images/avatars/:id  R2 の画像を返す */
export const imagesRoute = new Hono<AppEnv>().get("/avatars/:id", async (c) => {
  const object = await c.env.BUCKET.get(`avatars/${c.req.param("id")}`);
  if (!object) return c.notFound();
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(object.body, { headers });
});
