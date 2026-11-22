"use client";

import {
  GENRES,
  type Movie,
  type MovieDetail as Detail,
  type WatchProvider,
  TMDB_IMAGE_BASE,
} from "@kibuncinema/shared";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { recordView, toggleFavorite, useIsFavorite } from "@/lib/local-store";
import { xShareUrl } from "@/lib/share";
import { providerLabel, providerSearchUrl } from "@/lib/watch-links";
import { Poster } from "./Poster";

type Props = {
  movieId: number;
  /** 一覧から開いたときのデータ。詳細が届くまでの仮表示に使う */
  preview?: Pick<Movie, "title" | "posterPath"> & Partial<Movie>;
  /** Xに投稿する文章に入れる気分（「泣きたい」など） */
  moodLabel?: string;
  /** ダイアログとして開いたときの閉じるボタン */
  onClose?: () => void;
  /** ダイアログ内の見出しに付けるID（aria-labelledby 用） */
  titleId?: string;
};

export function MovieDetail({ movieId, preview, moodLabel, onClose, titleId }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setDetail(null);
    setError(null);
    api
      .movie(movieId)
      .then((d) => alive && setDetail(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "読み込めませんでした"));
    return () => {
      alive = false;
    };
  }, [movieId]);

  const title = detail?.title ?? preview?.title ?? "";
  const year = detail?.year ?? preview?.year ?? "";
  const rating = detail?.rating ?? preview?.rating;
  const posterPath = detail?.posterPath ?? preview?.posterPath ?? null;
  const genres =
    detail?.genres ?? preview?.genreIds?.map((g) => GENRES[g]).filter((g): g is string => Boolean(g)) ?? [];
  const favorite = useIsFavorite(movieId);

  // 詳細を開いた映画として、このブラウザに記録する（マイリストの「最近見た映画」）
  useEffect(() => {
    if (!title) return;
    recordView({ id: movieId, title, posterPath, year, genreIds: preview?.genreIds });
  }, [movieId, title, posterPath, year, preview?.genreIds]);
  const overview = detail?.overview || preview?.overview || "";

  function share() {
    const pageUrl = `${window.location.origin}/movie/${movieId}`;
    window.open(xShareUrl({ title, moodLabel, pageUrl }), "_blank", "noopener,noreferrer");
  }

  return (
    <article className="detail">
      <div
        className="detail-backdrop"
        style={
          detail?.backdropPath
            ? { backgroundImage: `url(${TMDB_IMAGE_BASE}/w1280${detail.backdropPath})` }
            : undefined
        }
      />
      {onClose && (
        <button type="button" className="detail-close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      )}

      <div className="detail-body">
        <div className="poster detail-poster">
          <Poster title={title} year={year} genreIds={preview?.genreIds} path={posterPath} />
        </div>

        <div className="detail-head">
          <h2 className="detail-title" id={titleId}>
            {title}
          </h2>
          {detail?.tagline && <p className="detail-tagline">{detail.tagline}</p>}
          <div className="detail-meta">
            {rating !== undefined && <span className="star">★ {rating.toFixed(1)}</span>}
            {year && <span>{year}</span>}
            {detail?.runtime && <span>{detail.runtime}分</span>}
            {genres.length > 0 && <span>{genres.slice(0, 3).join("・")}</span>}
          </div>
        </div>

        <div className="detail-main">
          <p className="detail-overview">{overview || "あらすじは登録されていません。"}</p>

          {detail && (detail.directors.length > 0 || detail.cast.length > 0) && (
            <dl className="detail-credits">
              {detail.directors.length > 0 && (
                <>
                  <dt>監督</dt>
                  <dd>{detail.directors.join("、")}</dd>
                </>
              )}
              {detail.cast.length > 0 && (
                <>
                  <dt>出演</dt>
                  <dd>{detail.cast.join("、")}</dd>
                </>
              )}
            </dl>
          )}

          <div className="detail-actions">
            <button type="button" className="x-btn" onClick={share}>
              <span aria-hidden className="x-logo">
                𝕏
              </span>
              で投稿する
            </button>
            <button
              type="button"
              className={`btn alt${favorite ? " is-on" : ""}`}
              aria-pressed={favorite}
              onClick={() => toggleFavorite({ id: movieId, title, posterPath, year, genreIds: preview?.genreIds })}
            >
              {favorite ? "♥ お気に入り" : "♡ お気に入り"}
            </button>
            {detail?.trailerKey && (
              <a
                className="btn alt"
                href={`https://www.youtube.com/watch?v=${detail.trailerKey}`}
                target="_blank"
                rel="noopener"
              >
                予告編を見る
              </a>
            )}
          </div>
        </div>

        <section className="detail-watch" aria-labelledby={`watch-${movieId}`}>
          <h3 className="detail-sec" id={`watch-${movieId}`}>
            どこで観られる？
          </h3>
          {error ? (
            <p className="note">{error}</p>
          ) : !detail ? (
            <div className="spin">
              <i />
              配信サービスを調べています…
            </div>
          ) : detail.providers.flatrate.length === 0 && detail.providers.rentOrBuy.length === 0 ? (
            <p className="note">日本で配信しているサービスは見つかりませんでした。</p>
          ) : (
            <>
              <ProviderGroup
                label="見放題"
                providers={detail.providers.flatrate}
                title={detail.title}
                fallback={detail.providers.link}
              />
              <ProviderGroup
                label="レンタル・購入"
                providers={detail.providers.rentOrBuy}
                title={detail.title}
                fallback={detail.providers.link}
              />
            </>
          )}
          <p className="detail-credit">
            配信情報：
            <a href="https://www.justwatch.com/jp" target="_blank" rel="noopener">
              JustWatch
            </a>{" "}
            提供
            {detail?.providers.link && (
              <>
                {" "}
                ／{" "}
                <a href={detail.providers.link} target="_blank" rel="noopener">
                  すべての配信サービスを見る（TMDB）
                </a>
              </>
            )}
          </p>
        </section>
      </div>
    </article>
  );
}

function ProviderGroup({
  label,
  providers,
  title,
  fallback,
}: {
  label: string;
  providers: WatchProvider[];
  title: string;
  fallback: string | null;
}) {
  // 「Amazon Prime Video」と「Amazon Prime Video with Ads」のように、
  // 表示名が同じになるものは1つにまとめる
  const unique = providers.filter(
    (p, i) => providers.findIndex((q) => providerLabel(q.name) === providerLabel(p.name)) === i,
  );
  if (unique.length === 0) return null;
  return (
    <div className="provider-group">
      <span className="provider-group-label">{label}</span>
      <div className="provider-list">
        {unique.map((p) => {
          const name = providerLabel(p.name);
          const search = providerSearchUrl(p.name, title);
          const href = search ?? fallback ?? undefined;
          return (
            <a key={p.id} className="provider" href={href} target="_blank" rel="noopener">
              {p.logoPath ? (
                <img src={`${TMDB_IMAGE_BASE}/w92${p.logoPath}`} alt="" width={32} height={32} />
              ) : (
                <i aria-hidden>{name.slice(0, 1)}</i>
              )}
              <span>
                {name}
                <small>{search ? `${name}で探す →` : "観られる場所を見る →"}</small>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
