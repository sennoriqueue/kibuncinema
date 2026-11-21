import { createDb, history } from "@kibuncinema/db";
import type { HistoryItem } from "@kibuncinema/shared";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { currentUser, requireUser } from "../lib/session";

/** GET /api/history  最近の提案（ログイン必須） */
export const historyRoute = new Hono<AppEnv>().use("*", requireUser).get("/", async (c) => {
  const user = currentUser(c);
  const rows = await createDb(c.env.DB)
    .select()
    .from(history)
    .where(eq(history.userId, user.id))
    .orderBy(desc(history.createdAt))
    .limit(20)
    .all();
  const items = rows.map((r) => ({
    id: r.id,
    answers: r.answers,
    movies: r.movies,
    createdAt: r.createdAt.toISOString(),
  })) as HistoryItem[];
  return c.json({ items });
});
