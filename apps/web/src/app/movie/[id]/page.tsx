import { type MovieDetail, TMDB_IMAGE_BASE } from "@kibuncinema/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoviePageClient } from "./MoviePageClient";
import { serverApi } from "@/lib/server-api";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  return /^[0-9]+$/.test(id) ? Number(id) : null;
}

// X などで共有されたときのカード表示（タイトル・説明・ポスター）
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: "キブンシネマ" };
  const movie = await serverApi<MovieDetail>(`/movies/${id}`);
  if (!movie) return { title: "キブンシネマ" };

  const title = `${movie.title}（${movie.year}）| キブンシネマ`;
  const description = movie.overview.slice(0, 110) || "今の気分に合う映画をえらぶ、キブンシネマ。";
  const image = movie.backdropPath
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdropPath}`
    : movie.posterPath
      ? `${TMDB_IMAGE_BASE}/w500${movie.posterPath}`
      : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : undefined, type: "video.movie" },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function MoviePage({ params }: Params) {
  const id = parseId((await params).id);
  if (!id) notFound();

  return (
    <>
      <MoviePageClient movieId={id} />
      <p className="detail-page-cta">
        <Link href="/" className="btn">
          自分の気分で映画をさがす
        </Link>
      </p>
    </>
  );
}
