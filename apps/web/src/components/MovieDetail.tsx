"use client";

import {
  type Movie,
  type MovieDetail as Detail,
  TMDB_IMAGE_BASE,
  TMDB_LOCALE,
  type WatchProvider,
} from "@kibuncinema/shared";
import { useEffect, useState } from "react";
import type { Dict } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";
import { api, errorMessage } from "@/lib/api";
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
  const { locale, t, href } = useI18n();
  const region = TMDB_LOCALE[locale].region;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setDetail(null);
    setError(null);
    api
      .movie(movieId, locale)
      .then((d) => alive && setDetail(d))
      .catch((e: unknown) => alive && setError(errorMessage(e, t.errors)));
    return () => {
      alive = false;
    };
  }, [movieId, locale, t.errors]);

  const title = detail?.title ?? preview?.title ?? "";
  const year = detail?.year ?? preview?.year ?? "";
  const rating = detail?.rating ?? preview?.rating;
  const posterPath = detail?.posterPath ?? preview?.posterPath ?? null;
  const genres =
    detail?.genres ?? preview?.genreIds?.map((g) => t.genres[g]).filter((g): g is string => Boolean(g)) ?? [];
  const favorite = useIsFavorite(movieId);

  // 詳細を開いた映画として、このブラウザに記録する（マイリストの「最近見た映画」）
  useEffect(() => {
    if (!title) return;
    recordView({ id: movieId, title, posterPath, year, genreIds: preview?.genreIds });
  }, [movieId, title, posterPath, year, preview?.genreIds]);
  const overview = detail?.overview || preview?.overview || "";

  function share() {
    const pageUrl = `${window.location.origin}${href(`/movie/${movieId}`)}`;
    window.open(xShareUrl({ t, title, moodLabel, pageUrl }), "_blank", "noopener,noreferrer");
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
        <button type="button" className="detail-close" onClick={onClose} aria-label={t.detail.close}>
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
            {detail?.runtime && <span>{t.detail.minutes(detail.runtime)}</span>}
            {genres.length > 0 && <span>{genres.slice(0, 3).join(t.detail.genreSeparator)}</span>}
          </div>
        </div>

        <div className="detail-main">
          <p className="detail-overview">{overview || t.ticket.noOverview}</p>

          {detail && (detail.directors.length > 0 || detail.cast.length > 0) && (
            <dl className="detail-credits">
              {detail.directors.length > 0 && (
                <>
                  <dt>{t.detail.director}</dt>
                  <dd>{detail.directors.join(t.detail.listSeparator)}</dd>
                </>
              )}
              {detail.cast.length > 0 && (
                <>
                  <dt>{t.detail.cast}</dt>
                  <dd>{detail.cast.join(t.detail.listSeparator)}</dd>
                </>
              )}
            </dl>
          )}

          <div className="detail-actions">
            <button type="button" className="x-btn" onClick={share}>
              <span aria-hidden className="x-logo">
                𝕏
              </span>
              {t.detail.share}
            </button>
            <button
              type="button"
              className={`btn alt${favorite ? " is-on" : ""}`}
              aria-pressed={favorite}
              onClick={() => toggleFavorite({ id: movieId, title, posterPath, year, genreIds: preview?.genreIds })}
            >
              {favorite ? "♥" : "♡"} {t.ticket.favorite}
            </button>
            {detail?.trailerKey && (
              <a
                className="btn alt"
                href={`https://www.youtube.com/watch?v=${detail.trailerKey}`}
                target="_blank"
                rel="noopener"
              >
                {t.detail.trailer}
              </a>
            )}
          </div>
        </div>

        <section className="detail-watch" aria-labelledby={`watch-${movieId}`}>
          <h3 className="detail-sec" id={`watch-${movieId}`}>
            {t.detail.whereToWatch}
          </h3>
          {error ? (
            <p className="note">{error}</p>
          ) : !detail ? (
            <div className="spin">
              <i />
              {t.detail.searchingProviders}
            </div>
          ) : detail.providers.flatrate.length === 0 && detail.providers.rentOrBuy.length === 0 ? (
            <p className="note">{t.detail.noProviders}</p>
          ) : (
            <>
              <ProviderGroup
                t={t}
                label={t.detail.flatrate}
                providers={detail.providers.flatrate}
                title={detail.title}
                region={region}
                fallback={detail.providers.link}
              />
              <ProviderGroup
                t={t}
                label={t.detail.rentOrBuy}
                providers={detail.providers.rentOrBuy}
                title={detail.title}
                region={region}
                fallback={detail.providers.link}
              />
            </>
          )}
          <p className="detail-credit">
            {t.detail.providerCredit}
            <a href={`https://www.justwatch.com/${region.toLowerCase()}`} target="_blank" rel="noopener">
              JustWatch
            </a>
            {t.detail.providerCreditSuffix}
            {detail?.providers.link && (
              <>
                {" "}
                /{" "}
                <a href={detail.providers.link} target="_blank" rel="noopener">
                  {t.detail.allProviders}
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
  t,
  label,
  providers,
  title,
  region,
  fallback,
}: {
  t: Dict;
  label: string;
  providers: WatchProvider[];
  title: string;
  region: string;
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
          const search = providerSearchUrl(p.name, title, region);
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
                <small>{search ? t.detail.searchOn(name) : t.detail.seeWhere}</small>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
