"use client";

import { posterUrl } from "@kibuncinema/shared";
import { useState } from "react";

const GENRE_COLORS: Record<number, string> = {
  18: "#5b3a8c",
  10749: "#d9486b",
  28: "#d9541e",
  12: "#2f7d5b",
  35: "#e8a317",
  16: "#3b8fd9",
  10751: "#4caf7a",
  14: "#7b4fc9",
  53: "#2b2b3a",
  27: "#5a1020",
  878: "#14507a",
  9648: "#3d3d6b",
  80: "#4a3a2a",
  10402: "#c0398a",
};

type Props = {
  title: string;
  year?: string;
  genreIds?: number[];
  path: string | null;
  size?: "w185" | "w342";
};

/** TMDB のポスター。画像がないとき・読み込めないときは、ジャンルの色で代わりの絵を描く */
export function Poster({ title, year, genreIds = [], path, size = "w342" }: Props) {
  const [failed, setFailed] = useState(false);
  const src = posterUrl(path, size);

  if (src && !failed) {
    return <img src={src} alt={`${title}のポスター`} loading="lazy" onError={() => setFailed(true)} />;
  }

  const c1 = GENRE_COLORS[genreIds[0] ?? 0] ?? "#5b3a8c";
  const c2 = GENRE_COLORS[genreIds[1] ?? 0] ?? "#1a0d12";
  const chars = [...title].slice(0, 18);
  const lines: string[] = [];
  for (let i = 0; i < chars.length; i += 6) lines.push(chars.slice(i, i + 6).join(""));
  const gid = `g-${encodeURIComponent(title).replace(/%/g, "")}`;

  return (
    <svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label={title}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${gid})`} />
      <circle cx="150" cy="70" r="90" fill="#fff" opacity=".1" />
      <circle cx="150" cy="70" r="46" fill="#fff" opacity=".12" />
      <path d="M0 230 Q100 200 200 235 V300 H0Z" fill="#000" opacity=".25" />
      {lines.map((l, i) => (
        <text
          key={i}
          x="16"
          y={190 - (lines.length - 1 - i) * 28}
          fill="#fff"
          fontFamily="var(--font-display), sans-serif"
          fontSize="22"
        >
          {l}
        </text>
      ))}
      {year && (
        <text x="16" y="282" fill="#fff" opacity=".8" fontSize="13">
          {year}
        </text>
      )}
    </svg>
  );
}
