import { type Answers, GENRE } from "@kibuncinema/shared";

/** 気分 → 含めるジャンル（どれか1つ）と、除外するジャンル */
const MOOD_GENRES: Record<Answers["mood"], { include: number[]; exclude?: number[] }> = {
  cry: { include: [GENRE.drama, GENRE.romance] },
  thrill: { include: [GENRE.action, GENRE.adventure] },
  laugh: { include: [GENRE.comedy] },
  heal: { include: [GENRE.animation, GENRE.family], exclude: [GENRE.horror, GENRE.thriller] },
  tense: { include: [GENRE.thriller, GENRE.horror] },
  think: { include: [GENRE.sf, GENRE.mystery] },
};

/**
 * 質問の答えを TMDB /discover/movie の検索条件に変換する。
 * relax = true のときは、時間と年代の条件を外す（結果が少なすぎたとき用）。
 */
export function buildDiscoverParams(
  answers: Answers,
  { relax = false, now = new Date() }: { relax?: boolean; now?: Date } = {},
): Record<string, string> {
  const mood = MOOD_GENRES[answers.mood];
  const exclude = new Set(mood.exclude ?? []);

  const params: Record<string, string> = {
    language: "ja-JP",
    region: "JP",
    include_adult: "false",
    sort_by: "popularity.desc",
    "vote_count.gte": "200",
    "with_runtime.gte": "60",
    // "|" は「どれか1つ」、"," は「すべて」
    with_genres: mood.include.join("|"),
  };

  if (answers.who === "family") {
    exclude.add(GENRE.horror);
    exclude.add(GENRE.thriller);
    params.certification_country = "JP";
    params.certification = "G|PG12";
  }
  if (answers.who === "couple" && answers.mood !== "tense") {
    // ふたりで観るなら、ホラー寄りの作品は外す
    exclude.add(GENRE.horror);
  }

  if (!relax) {
    if (answers.time === "short") params["with_runtime.lte"] = "90";
    if (answers.time === "mid") params["with_runtime.lte"] = "130";

    if (answers.era === "new") {
      params["primary_release_date.gte"] = `${now.getFullYear() - 5}-01-01`;
    }
    if (answers.era === "classic") {
      params["vote_average.gte"] = "7.5";
      params["vote_count.gte"] = "1000";
    }
  }

  if (exclude.size > 0) params.without_genres = [...exclude].join(",");
  return params;
}
