"use client";

import { useSyncExternalStore } from "react";

/**
 * ログインなしで使う「マイリスト」。このブラウザの localStorage だけに保存する。
 * - お気に入り：自分で外すまで残る
 * - 最近見た映画：詳細を開いた映画。30日たつと自動で消える
 *
 * 別の端末・ブラウザとは共有されない。シークレットウィンドウやブラウザのデータ削除で消える。
 */

export type SavedMovie = {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string;
  genreIds?: number[];
};

export type FavoriteEntry = SavedMovie & { addedAt: number };
export type RecentEntry = SavedMovie & { viewedAt: number };

const FAVORITES_KEY = "kibuncinema:favorites:v1";
const RECENT_KEY = "kibuncinema:recent:v1";
const RECENT_DAYS = 30;
const RECENT_MAX = 60;
const CHANGE_EVENT = "kibuncinema:store";

/* ---------- 読み書き（localStorage が使えないときは空として扱う） ---------- */

function read<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // 容量不足やシークレットモードなど。保存できなくても画面は動かす
  }
  cache = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function pick(movie: SavedMovie): SavedMovie {
  const { id, title, posterPath, year, genreIds } = movie;
  return { id, title, posterPath, year, genreIds };
}

function freshRecent(): RecentEntry[] {
  const limit = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
  return read<RecentEntry>(RECENT_KEY).filter((r) => r.viewedAt >= limit);
}

/* ---------- 操作 ---------- */

export function toggleFavorite(movie: SavedMovie) {
  const list = read<FavoriteEntry>(FAVORITES_KEY);
  if (list.some((f) => f.id === movie.id)) {
    write(FAVORITES_KEY, list.filter((f) => f.id !== movie.id));
  } else {
    write(FAVORITES_KEY, [{ ...pick(movie), addedAt: Date.now() }, ...list]);
  }
}

export function removeFavorite(id: number) {
  write(FAVORITES_KEY, read<FavoriteEntry>(FAVORITES_KEY).filter((f) => f.id !== id));
}

/** 詳細を開いた映画を記録する。同じ映画は1つにまとめて先頭に移す */
export function recordView(movie: SavedMovie) {
  const rest = freshRecent().filter((r) => r.id !== movie.id);
  write(RECENT_KEY, [{ ...pick(movie), viewedAt: Date.now() }, ...rest].slice(0, RECENT_MAX));
}

export function clearRecent() {
  write(RECENT_KEY, []);
}

/* ---------- 画面から使うフック ---------- */

type Snapshot = { favorites: FavoriteEntry[]; recent: RecentEntry[] };

let cache: Snapshot | null = null;
const EMPTY: Snapshot = { favorites: [], recent: [] };

function getSnapshot(): Snapshot {
  if (!cache) cache = { favorites: read<FavoriteEntry>(FAVORITES_KEY), recent: freshRecent() };
  return cache;
}

function subscribe(onChange: () => void) {
  const handler = (e: Event) => {
    // 別のタブで変わったときも反映する
    if (e instanceof StorageEvent && e.key !== FAVORITES_KEY && e.key !== RECENT_KEY) return;
    cache = null;
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** お気に入りと最近見た映画。サーバーで描くときは空 */
export function useMyList(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useIsFavorite(id: number): boolean {
  return useMyList().favorites.some((f) => f.id === id);
}
