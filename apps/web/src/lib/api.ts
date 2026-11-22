import type {
  Answers,
  ApiError,
  FavoriteInput,
  FavoriteItem,
  HistoryItem,
  Locale,
  MovieDetail,
  RecommendResponse,
} from "@kibuncinema/shared";

/**
 * API のエラー。message はサーバーからの日本語の説明。
 * 画面には、status から各言語の文言を選んで出す（errorMessage を使う）
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Init = Omit<RequestInit, "headers"> & { headers?: Record<string, string> };

async function request<T>(path: string, init?: Init): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { accept: "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(body?.error ?? `エラーが起きました（${res.status}）`, res.status);
  }
  return (await res.json()) as T;
}

const json = (body: unknown): Init => ({
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
});

export const api = {
  /** exclude：最近詳細を開いた映画のID（提案から外してもらう） */
  recommend: (answers: Answers, exclude: number[], locale: Locale) =>
    request<RecommendResponse>("/recommend", { method: "POST", ...json({ ...answers, exclude, locale }) }),

  movie: (id: number, locale: Locale) => request<MovieDetail>(`/movies/${id}?locale=${locale}`),

  favorites: () => request<{ items: FavoriteItem[] }>("/favorites"),
  addFavorite: (input: FavoriteInput) =>
    request<{ ok: true }>("/favorites", { method: "POST", ...json(input) }),
  removeFavorite: (tmdbId: number) =>
    request<{ ok: true }>(`/favorites/${tmdbId}`, { method: "DELETE" }),

  history: () => request<{ items: HistoryItem[] }>("/history"),

  uploadAvatar: (file: File) =>
    request<{ image: string }>("/me/avatar", {
      method: "PUT",
      body: file,
      headers: { "content-type": file.type },
    }),
};

/** エラーを、今の言語の文言にする */
export function errorMessage(
  error: unknown,
  messages: { tooMany: string; notFound: string; generic: string },
): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) return messages.tooMany;
    if (error.status === 404) return messages.notFound;
  }
  return messages.generic;
}
