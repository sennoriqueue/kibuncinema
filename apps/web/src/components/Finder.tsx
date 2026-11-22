"use client";

import {
  type Answers,
  type Movie,
  type Question,
  type QuestionId,
  QUESTIONS,
  type RecommendResponse,
} from "@kibuncinema/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { api, errorMessage } from "@/lib/api";
import { useMyList } from "@/lib/local-store";
import { HOME_EVENT } from "./HomeLink";
import { MovieDialog } from "./MovieDialog";
import { Ticket } from "./Ticket";

const PER_PAGE = 3;

type OptionText = { label: string; description: string };

export function Finder() {
  const { locale, t, href } = useI18n();
  /** 質問の文言（今の言語） */
  const text = (id: QuestionId) => t.questions[id] as { question: string; options: Record<string, OptionText> };
  const optionLabel = (id: QuestionId, value: string) => text(id).options[value]?.label ?? value;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 最近詳細を開いた映画は、提案から外してもらう（ほかに候補が十分あるとき）
  const { recent } = useMyList();

  // 詳細を開いている映画。開いている間は URL を /movie/:id にする（共有・戻るボタン用）
  const [openMovie, setOpenMovie] = useState<Movie | null>(null);
  const pushedUrl = useRef(false);

  useEffect(() => {
    const onPop = () => {
      if (!/\/movie\/\d+/.test(window.location.pathname)) {
        pushedUrl.current = false;
        setOpenMovie(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 左上のロゴが押されたら、質問の最初に戻す
  useEffect(() => {
    const onHome = () => {
      pushedUrl.current = false;
      setOpenMovie(null);
      setStep(0);
      setAnswers({});
      setResult(null);
      setError(null);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener(HOME_EVENT, onHome);
    return () => window.removeEventListener(HOME_EVENT, onHome);
  }, []);

  function openDetail(movie: Movie) {
    setOpenMovie(movie);
    window.history.pushState(null, "", href(`/movie/${movie.id}`));
    pushedUrl.current = true;
  }

  const closeDetail = useCallback(() => {
    if (pushedUrl.current) {
      // 開いたときに URL を変えたので、ブラウザの「戻る」と同じ動きで閉じる
      window.history.back();
    } else {
      setOpenMovie(null);
    }
  }, []);

  async function find(all: Answers) {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.recommend(all, recent.map((r) => r.id).slice(0, 100), locale));
      setOffset(0);
    } catch (e) {
      setError(errorMessage(e, t.errors));
    } finally {
      setLoading(false);
    }
  }

  function choose(id: QuestionId, value: string) {
    const next = { ...answers, [id]: value } as Partial<Answers>;
    setAnswers(next);
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep === QUESTIONS.length) void find(next as Answers);
  }

  function back() {
    setResult(null);
    setError(null);
    setStep((s) => Math.max(0, Math.min(s, QUESTIONS.length) - 1));
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  /* ---------- 質問 ---------- */
  if (step < QUESTIONS.length) {
    const q = (QUESTIONS as readonly Question[])[step]!;
    const selected = answers[q.id as QuestionId];
    return (
      <section className="booth" aria-live="polite">
        <div className="prog">
          <span>
            {step + 1} / {QUESTIONS.length}
          </span>
          <div className="segs">
            {QUESTIONS.map((x, i) => (
              <i key={x.id} className={i <= step ? "on" : undefined} />
            ))}
          </div>
        </div>
        <h1 className="q">{text(q.id as QuestionId).question}</h1>
        <div className="opts">
          {q.options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`opt${selected === o.value ? " sel" : ""}`}
              onClick={() => choose(q.id as QuestionId, o.value)}
            >
              <b>{optionLabel(q.id as QuestionId, o.value)}</b>
              <span>{text(q.id as QuestionId).options[o.value]?.description}</span>
            </button>
          ))}
        </div>
        <div className="foot">
          {step > 0 ? (
            <button type="button" className="link-btn" onClick={back}>
              {t.finder.back}
            </button>
          ) : (
            <span />
          )}
        </div>
      </section>
    );
  }

  /* ---------- 結果 ---------- */
  const all = answers as Answers;
  const movies = result?.movies.slice(offset, offset + PER_PAGE) ?? [];
  const hasMore = result ? result.movies.length > offset + PER_PAGE : false;

  return (
    <section className="booth" aria-live="polite">
      <h1 className="q">{t.finder.resultTitle}</h1>
      <ul className="chips">
        {QUESTIONS.map((q) => (
          <li key={q.id}>{optionLabel(q.id as QuestionId, all[q.id as QuestionId])}</li>
        ))}
      </ul>

      {loading && (
        <div className="spin">
          <i />
          {t.finder.searching}
        </div>
      )}
      {error && (
        <div className="empty">
          <p>{error}</p>
          <button type="button" className="btn" onClick={() => find(all)}>
            {t.finder.retry}
          </button>
        </div>
      )}
      {result?.relaxed && (
        <p className="note">{t.finder.relaxed}</p>
      )}
      {!loading && !error && result && movies.length === 0 && (
        <div className="empty">{t.finder.empty}</div>
      )}
      {!loading && movies.length > 0 && (
        <div className="tickets">
          {movies.map((m) => (
            <Ticket
              key={m.id}
              movie={m}
              onOpen={() => openDetail(m)}
            />
          ))}
        </div>
      )}

      {openMovie && (
        <MovieDialog
          movieId={openMovie.id}
          preview={openMovie}
          moodLabel={all.mood ? optionLabel("mood", all.mood) : undefined}
          onClose={closeDetail}
        />
      )}

      <div className="foot">
        <button type="button" className="link-btn" onClick={back}>
          {t.finder.changeConditions}
        </button>
        <span className="row">
          {hasMore && (
            <button type="button" className="btn" onClick={() => setOffset((o) => o + PER_PAGE)}>
              {t.finder.next}
            </button>
          )}
          {!hasMore && result && result.movies.length > 0 && (
            <button type="button" className="btn" onClick={() => find(all)}>
              {t.finder.searchMore}
            </button>
          )}
          <button type="button" className="btn alt" onClick={restart}>
            {t.finder.restart}
          </button>
        </span>
      </div>
    </section>
  );
}
