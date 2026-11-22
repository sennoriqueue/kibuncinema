import type { Dict } from "@/i18n";

/** 全ページの下に出す、この映画館（サイト）の支配人の紹介 */
export function Maker({ t }: { t: Dict }) {
  return (
    <section className="maker" aria-labelledby="maker-name">
      <div className="wrap">
        <div className="maker-card">
          <img className="maker-icon" src="/maker.jpg" alt="" width={72} height={72} />
          <div>
            <p className="maker-label">{t.maker.label}</p>
            <h2 className="maker-name" id="maker-name">
              {t.maker.name}
            </h2>
            <p className="maker-bio">{t.maker.bio}</p>
          </div>
          <div className="maker-links">
            <a className="x-btn" href="https://x.com/sennoriqueue" target="_blank" rel="noopener">
              <span aria-hidden className="x-logo">
                𝕏
              </span>
              @sennoriqueue
            </a>
            <a className="btn alt" href="https://github.com/sennoriqueue/kibuncinema" target="_blank" rel="noopener">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
