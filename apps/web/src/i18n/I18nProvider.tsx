"use client";

import { createContext, useContext } from "react";
import { type Dict, type Locale, getDict, localePath } from "./index";

const LocaleContext = createContext<Locale>("ja");

/** レイアウトで今の言語を渡す。文言そのものは各画面で getDict から読む（関数を含むので props で渡せない） */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** 今の言語・文言・言語つきのパスを作る関数 */
export function useI18n(): { locale: Locale; t: Dict; href: (path: string) => string } {
  const locale = useContext(LocaleContext);
  return { locale, t: getDict(locale), href: (path) => localePath(locale, path) };
}
