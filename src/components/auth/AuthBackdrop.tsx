// Fundo das telas de acesso: ilustração própria em SVG (galpão com docas, caminhão, pallets e rota de filiais).
// Sem imagens externas. A animação respeita prefers-reduced-motion (ver styles no index.css).
export function AuthBackdrop() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden bg-gradient-to-b from-[#050B1A] via-[#0A1A3A] to-[#0F2A5C]">
    <svg className="absolute inset-x-0 bottom-0 h-[55%] w-full opacity-40" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="330" width="1200" height="70" fill="#0A1A3A"/>
      <path d="M0 365 H1200" stroke="#3B82F6" strokeWidth="3" strokeDasharray="28 18" opacity=".6"/>
      <g fill="#1E3A6E"><rect x="60" y="150" width="260" height="180"/><rect x="330" y="120" width="340" height="210"/><rect x="680" y="170" width="200" height="160"/><rect x="890" y="200" width="260" height="130"/></g>
      <g fill="#2B4F8F">{[0, 1, 2, 3].map(i => <rect key={i} x={90 + i * 60} y="220" width="44" height="110"/>)}{[0, 1, 2].map(i => <rect key={`b${i}`} x={370 + i * 100} y="190" width="70" height="140"/>)}</g>
      <g fill="#3B82F6" opacity=".85">{[0, 1, 2, 3].map(i => <rect key={i} x={70 + i * 62} y="150" width="34" height="8"/>)}</g>
      <g className="truck-run"><rect x="620" y="250" width="150" height="70" rx="6" fill="#3B6BC4"/><rect x="770" y="280" width="60" height="40" rx="4" fill="#2B4F8F"/><circle cx="650" cy="324" r="12" fill="#050B1A"/><circle cx="800" cy="324" r="12" fill="#050B1A"/></g>
      <g fill="#1E3A6E"><rect x="960" y="295" width="46" height="34"/><rect x="1010" y="295" width="46" height="34"/><rect x="985" y="262" width="46" height="34"/></g>
    </svg>
    <svg className="absolute right-[6%] top-[12%] hidden h-[38%] w-[38%] opacity-50 lg:block" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 220 C 110 120, 200 260, 280 150 S 360 60, 370 80" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="8 10" className="route-line"/>
      <path d="M60 60 C 120 120, 170 40, 220 110" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 8" className="route-line"/>
      {[[40, 220], [140, 170], [230, 210], [280, 150], [370, 80]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#60A5FA"/>)}
      <g className="pin-pulse"><circle cx="370" cy="80" r="9" fill="#3B82F6"/></g>
    </svg>
    <style>{`
      .route-line{animation:route-dash 3s linear infinite}
      .truck-run{animation:truck-drive 9s ease-in-out infinite alternate}
      .pin-pulse{transform-origin:370px 80px;animation:pin-pulse 2s ease-out infinite}
      @keyframes route-dash{to{stroke-dashoffset:-72}}
      @keyframes truck-drive{from{transform:translateX(-30px)}to{transform:translateX(30px)}}
      @keyframes pin-pulse{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
      @media (prefers-reduced-motion: reduce){.route-line,.truck-run,.pin-pulse{animation:none}}
    `}</style>
  </div>;
}
