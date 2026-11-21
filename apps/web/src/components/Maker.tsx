/** 全ページの下に出す「このサイトをつくった人」 */
export function Maker() {
  return (
    <section className="maker" aria-labelledby="maker-name">
      <div className="wrap">
        <div className="maker-card">
          <img className="maker-icon" src="/maker.jpg" alt="" width={72} height={72} />
          <div>
            <p className="maker-label">このサイトをつくった人</p>
            <h2 className="maker-name" id="maker-name">
              千利休
            </h2>
            <p className="maker-bio">
              都内で金融系インフラエンジニアをやっている29歳です。問い合わせ、改善要望はXのDMでお願いします。
            </p>
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
