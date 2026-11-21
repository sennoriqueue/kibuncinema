import type {
  Answers,
  ApiError,
  FavoriteInput,
  FavoriteItem,
  HistoryItem,
  MovieDetail,
  RecommendResponse,
} from "@kibuncinema/shared";

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
  recommend: (answers: Answers) =>
    request<RecommendResponse>("/recommend", { method: "POST", ...json(answers) }),

  movie: (id: number) => request<MovieDetail>(`/movies/${id}`),

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
