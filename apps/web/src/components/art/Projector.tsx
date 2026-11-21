/** 映写機の線画と、そこから質問カードに向かって広がる光。トップページの上に置く */
export function Projector() {
  return (
    <div className="proj-wrap" aria-hidden>
      <svg className="proj-art" viewBox="0 0 100 112" aria-hidden fill="none" stroke="#d9b36c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="30" cy="22" r="18"/>
        <circle cx="30" cy="22" r="3.5"/>
        <circle cx="30" cy="11" r="3"/>
        <circle cx="20.5" cy="27.5" r="3"/>
        <circle cx="39.5" cy="27.5" r="3"/>
        <circle cx="70" cy="22" r="18"/>
        <circle cx="70" cy="22" r="3.5"/>
        <circle cx="70" cy="11" r="3"/>
        <circle cx="60.5" cy="27.5" r="3"/>
        <circle cx="79.5" cy="27.5" r="3"/>
        <path d="M30 40 L36 46 M70 40 L64 46"/>
        <rect x="16" y="46" width="68" height="34" rx="6"/>
        <path d="M24 56 H48 M24 63 H42"/>
        <circle cx="70" cy="60" r="5"/>
        <rect x="40" y="80" width="20" height="14" rx="2"/>
        <ellipse cx="50" cy="98" rx="13" ry="4"/>
      </svg>
      <div className="proj-beam" />
    </div>
  );
}
