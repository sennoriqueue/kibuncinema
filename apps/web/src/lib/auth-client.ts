"use client";

import { createAuthClient } from "better-auth/react";

// 指定しなければ、画面と同じドメインの /api/auth を使う
// （app/api/[...path]/route.ts が API の Worker に中継する）
export const authClient = createAuthClient();

export const { useSession, signIn, signOut } = authClient;
