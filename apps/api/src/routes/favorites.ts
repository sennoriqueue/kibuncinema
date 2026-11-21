import { zValidator } from "@hono/zod-validator";
import { createDb, favorite } from "@kibuncinema/db";
import type { FavoriteItem } from "@kibuncinema/shared";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../env";
import { currentUser, requireUser } from "../lib/session";

const favoriteInput = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  posterPath: z.string().max(200).nullable(),
});

/** /api/favorites  お気に入りの一覧・追加・削除（ログイン必須） */
export const favoritesRoute = new Hono<AppEnv>()
  .use("*", requireUser)
  .get("/", async (c) => {
    const user = currentUser(c);
    const rows = await createDb(c.env.DB)
      .select()
      .from(favorite)
      .where(eq(favorite.userId, user.id))
      .orderBy(desc(favorite.createdAt))
      .all();
    const items: FavoriteItem[] = rows.map((r) => ({
      tmdbId: r.tmdbId,
      title: r.title,
      posterPath: r.posterPath,
      createdAt: r.createdAt.toISOString(),
    }));
    return c.json({ items });
  })
  .post(
    "/",
    zValidator("json", favoriteInput, (result, c) => {
      if (!result.success) return c.json({ error: "入力が正しくありません" }, 400);
    }),
    async (c) => {
      const user = currentUser(c);
      const input = c.req.valid("json");
      await createDb(c.env.DB)
        .insert(favorite)
        .values({ userId: user.id, ...input })
        .onConflictDoNothing()
        .run();
      return c.json({ ok: true }, 201);
    },
  )
  .delete("/:tmdbId{[0-9]+}", async (c) => {
    const user = currentUser(c);
    const tmdbId = Number(c.req.param("tmdbId"));
    await createDb(c.env.DB)
      .delete(favorite)
      .where(and(eq(favorite.userId, user.id), eq(favorite.tmdbId, tmdbId)))
      .run();
    return c.json({ ok: true });
  });
