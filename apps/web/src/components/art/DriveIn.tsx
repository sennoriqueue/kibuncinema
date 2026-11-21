/**
 * ページの一番下の「野外シネマ」。
 * 星空の下の大きなスクリーンと、右奥の映写小屋から伸びる光、並んで観ている観客のシルエット。
 */

// 観客の頭の位置。毎回同じ並びになるよう、固定のシードで作る
function audience() {
  let seed = 3;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const people: { x: number; y: number; r: number }[] = [];
  const rows = [
    { y: 238, r: 11, step: 44, start: 60 },
    { y: 254, r: 13, step: 52, start: 80 },
  ];
  for (const row of rows) {
    let x = row.start + rand() * 30;
    while (x < 1400) {
      people.push({ x, y: row.y + (rand() - 0.5) * 6, r: row.r + (rand() - 0.5) * 3 });
      x += row.step + (rand() - 0.4) * 18;
    }
  }
  return people;
}

const PEOPLE = audience();
const GOLD = "#d9b36c";

export function DriveIn() {
  return (
    <svg className="drivein" viewBox="0 0 1440 280" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <radialGradient id="drivein-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f7f4ec" stopOpacity=".18" />
          <stop offset="1" stopColor="#f7f4ec" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="drivein-beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#f7f4ec" stopOpacity=".10" />
          <stop offset="1" stopColor="#f7f4ec" stopOpacity=".02" />
        </linearGradient>
      </defs>
      <g transform="translate(0,50)">
        <ellipse cx="720" cy="76" rx="330" ry="95" fill="url(#drivein-glow)" />
        <polygon points="1196,124 944,30 944,128" fill="url(#drivein-beam)" />
        <g fill="#0b1020">
          <path d="M0 170 L30 80 L60 170Z" />
          <path d="M40 170 L75 50 L110 170Z" />
          <path d="M1330 170 L1365 60 L1400 170Z" />
          <path d="M1380 170 L1410 90 L1440 170Z" />
          <path d="M0 168 Q360 140 720 152 T1440 150 V230 H0Z" />
          <rect x="540" y="120" width="10" height="40" />
          <rect x="890" y="120" width="10" height="40" />
          <rect x="1180" y="112" width="42" height="40" rx="3" />
        </g>
        <rect x="496" y="26" width="448" height="100" rx="2" fill="#f7f4ec" fillOpacity=".14" stroke={GOLD} strokeOpacity=".35" />
        <rect x="1192" y="120" width="6" height="6" fill={GOLD} opacity=".8" />
      </g>
      <g fill="#020309">
        {PEOPLE.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.r} />
            <rect x={p.x - p.r * 1.9} y={p.y + p.r * 0.7} width={p.r * 3.8} height={40} rx={p.r * 1.3} />
          </g>
        ))}
      </g>
    </svg>
  );
}
