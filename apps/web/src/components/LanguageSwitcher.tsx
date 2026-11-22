"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALE_COOKIE, LOCALE_LABELS, LOCALES, type Locale, localePath, stripLocale } from "@/i18n";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * 言語の切り替え。PC では「JA / EN / KO」を並べ、スマホでは「JA ▾」のボタンからメニューで選ぶ。
 * 選んだ言語は Cookie に覚えておき、次にトップへ来たときもその言語で開く
 */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    if (next === locale) return;
    // 今のページの、選んだ言語版へ移る（/movie/1 → /en/movie/1）
    router.push(localePath(next, stripLocale(pathname ?? "/")));
  }

  return (
    <div className="lang-switch" ref={menu}>
      <nav className="lang" aria-label={t.nav.language}>
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            className={l === locale ? "on" : undefined}
            aria-current={l === locale ? "true" : undefined}
            aria-label={LOCALE_LABELS[l].name}
            onClick={() => choose(l)}
          >
            {LOCALE_LABELS[l].short}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="lang-compact"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.nav.language}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {LOCALE_LABELS[locale].short} ▾
      </button>
      {open && (
        <div className="lang-menu" role="menu">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              lang={l}
              className={l === locale ? "on" : undefined}
              onClick={() => choose(l)}
            >
              {LOCALE_LABELS[l].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
