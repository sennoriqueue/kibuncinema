import { z } from "zod";
import { LOCALES } from "./locale";

export type QuestionOption = { value: string; label: string; description: string };
export type Question = { id: string; question: string; options: readonly QuestionOption[] };

/**
 * 質問の定義。画面（apps/web）と入力チェック（apps/api）の両方で使う。
 * 選択肢を増やすときは、apps/api/src/lib/tmdb-params.ts の対応表も更新すること。
 */
export const QUESTIONS = [
  {
    id: "mood",
    question: "今の気分は？",
    options: [
      { value: "cry", label: "泣きたい", description: "心を揺さぶるドラマや恋愛" },
      { value: "thrill", label: "スカッとしたい", description: "迫力のアクション・冒険" },
      { value: "laugh", label: "笑いたい", description: "気楽に観られるコメディ" },
      { value: "heal", label: "癒されたい", description: "やさしいアニメ・ファミリー" },
      { value: "tense", label: "ドキドキしたい", description: "スリラーやホラー" },
      { value: "think", label: "じっくり考えたい", description: "SFやミステリー" },
    ],
  },
  {
    id: "who",
    question: "誰と観る？",
    options: [
      { value: "solo", label: "一人で", description: "好きなものを好きなように" },
      { value: "couple", label: "恋人と", description: "ふたりで楽しめる作品" },
      { value: "friends", label: "友達と", description: "わいわい盛り上がりたい" },
      { value: "family", label: "家族と", description: "子どもも一緒に観られる作品" },
    ],
  },
  {
    id: "time",
    question: "使える時間は？",
    options: [
      { value: "short", label: "90分以内", description: "さくっと観たい" },
      { value: "mid", label: "2時間くらい", description: "ふつうの長さで" },
      { value: "long", label: "長くてもOK", description: "時間はたっぷりある" },
    ],
  },
  {
    id: "era",
    question: "新しめ？名作？",
    options: [
      { value: "new", label: "最近の作品", description: "ここ5年くらいの映画" },
      { value: "classic", label: "定番の名作", description: "評価の高い作品から" },
      { value: "any", label: "こだわらない", description: "おまかせで" },
    ],
  },
] as const;

export const answersSchema = z.object({
  mood: z.enum(["cry", "thrill", "laugh", "heal", "tense", "think"]),
  who: z.enum(["solo", "couple", "friends", "family"]),
  time: z.enum(["short", "mid", "long"]),
  era: z.enum(["new", "classic", "any"]),
});

export type Answers = z.infer<typeof answersSchema>;

/** POST /api/recommend の本文。exclude は最近詳細を開いた映画（提案から外す） */
export const recommendRequestSchema = answersSchema.extend({
  exclude: z.array(z.number().int().positive()).max(100).optional(),
  /** 画面の言語。TMDB の言語と、配信サービスの国が決まる */
  locale: z.enum(LOCALES).optional(),
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;
export type QuestionId = keyof Answers;

export function labelOf<K extends QuestionId>(id: K, value: Answers[K]): string {
  const list = QUESTIONS as readonly Question[];
  const q = list.find((q) => q.id === id);
  const opt = q?.options.find((o) => o.value === value);
  return opt?.label ?? String(value);
}
