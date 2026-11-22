import { type Answers, DEFAULT_LOCALE, GENRE, type Locale, TMDB_LOCALE } from "@kibuncinema/shared";

/**
 * 気分 → 含めるジャンル（どれか1つ）と、除外するジャンル。
 * 除外は「その気分のときに出てきたらがっかりするもの」（笑いたいのにホラー、など）
 */
const MOOD_GENRES: Record<Answers["mood"], { include: number[]; exclude?: number[] }> = {
  cry: { include: [GENRE.drama, GENRE.romance], exclude: [GENRE.horror] },
  thrill: { include: [GENRE.action, GENRE.adventure], exclude: [GENRE.documentary] },
  laugh: { include: [GENRE.comedy], exclude: [GENRE.horror, GENRE.war] },
  heal: {
    include: [GENRE.animation, GENRE.family],
    exclude: [GENRE.horror, GENRE.thriller, GENRE.war, GENRE.crime],
  },
  tense: { include: [GENRE.thriller, GENRE.horror] },
  think: { include: [GENRE.sf, GENRE.mystery] },
};

/**
 * 誰と観るか → 上に出したいジャンルと、下に回したいジャンル。
 * 検索条件で絞るとヒットが少なくなりすぎるので、検索結果を並べ替えるときに使う
 */
const WHO_PREFERENCES: Record<Answers["who"], { boost: number[]; avoid: number[] }> = {
  solo: { boost: [], avoid: [] },
  couple: { boost: [GENRE.romance, GENRE.comedy, GENRE.music, GENRE.drama], avoid: [GENRE.horror, GENRE.war] },
  friends: { boost: [GENRE.comedy, GENRE.action, GENRE.adventure, GENRE.horror], avoid: [GENRE.documentary, GENRE.war] },
  family: { boost: [GENRE.animation, GENRE.family, GENRE.adventure, GENRE.fantasy], avoid: [GENRE.romance, GENRE.crime] },
};

/**
 * 並べ替え用の点数。誰と観るかに合うジャンルが多いほど高い。
 * 評価の高さも少し足し、毎回同じ順にならないようにランダムな揺らぎも入れる
 */
export function scoreMovie(
  movie: { genreIds: number[]; rating: number },
  answers: Answers,
  random: () => number = Math.random,
): number {
  const pref = WHO_PREFERENCES[answers.who];
  const boost = movie.genreIds.filter((g) => pref.boost.includes(g)).length;
  const avoid = movie.genreIds.filter((g) => pref.avoid.includes(g)).length;
  return boost * 2 - avoid * 3 + movie.rating * 0.3 + random() * 2;
}

/**
 * 質問の答えを TMDB /discover/movie の検索条件に変換する。
 * relax = true のときは、時間と年代の条件を外す（結果が少なすぎたとき用）。
 */
export function buildDiscoverParams(
  answers: Answers,
  {
    relax = false,
    now = new Date(),
    locale = DEFAULT_LOCALE,
  }: { relax?: boolean; now?: Date; locale?: Locale } = {},
): Record<string, string> {
  const mood = MOOD_GENRES[answers.mood];
  const tmdb = TMDB_LOCALE[locale];
  const exclude = new Set(mood.exclude ?? []);

  const params: Record<string, string> = {
    language: tmdb.language,
    region: tmdb.region,
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
    params.certification_country = tmdb.region;
    params.certification = tmdb.familyCertifications;
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
