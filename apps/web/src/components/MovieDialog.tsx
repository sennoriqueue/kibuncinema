"use client";

import { type ComponentProps, useEffect, useRef } from "react";
import { MovieDetail } from "./MovieDetail";

type Props = Omit<ComponentProps<typeof MovieDetail>, "onClose" | "titleId"> & {
  onClose: () => void;
};

/** 映画の詳細を、今の画面の上に重ねて開く */
export function MovieDialog({ onClose, ...detail }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 開いている間は後ろの画面をスクロールさせない
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const titleId = `movie-title-${detail.movieId}`;

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <MovieDetail {...detail} titleId={titleId} onClose={onClose} />
      </div>
    </div>
  );
}
