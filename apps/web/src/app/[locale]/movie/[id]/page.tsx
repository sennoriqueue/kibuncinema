import { type MovieDetail, TMDB_IMAGE_BASE } from "@kibuncinema/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, getDict, isLocale, localePath } from "@/i18n";
import { serverApi } from "@/lib/server-api";
import { MoviePageClient } from "./MoviePageClient";

type Params = { params: Promise<{ locale: string; id: string }> };

function parseId(id: string) {
  return /^[0-9]+$/.test(id) ? Number(id) : null;
}

// X などで共有されたときのカード表示（タイトル・説明・映画の画像）
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  const id = parseId(rawId);
  if (!id) return { title: t.siteName };
  const movie = await serverApi<MovieDetail>(`/movies/${id}?locale=${locale}`);
  if (!movie) return { title: t.siteName };

  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ""} | ${t.siteName}`;
  const description = movie.overview.slice(0, 110) || t.meta.description;
  const image = movie.backdropPath
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdropPath}`
    : movie.posterPath
      ? `${TMDB_IMAGE_BASE}/w500${movie.posterPath}`
      : undefined;
  const path = `/movie/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
    },
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      type: "video.movie",
      locale: t.meta.ogLocale,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function MoviePage({ params }: Params) {
  const { locale, id: rawId } = await params;
  const id = parseId(rawId);
  if (!isLocale(locale) || !id) notFound();
  const t = getDict(locale);

  return (
    <>
      <MoviePageClient movieId={id} />
      <p className="detail-page-cta">
        <Link href={localePath(locale, "/")} className="btn">
          {t.detail.findYourOwn}
        </Link>
      </p>
    </>
  );
}
