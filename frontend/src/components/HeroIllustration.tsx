// A minimal, professional, text-free hero illustration: a road with a live
// (animated) reporting pin, standing in for "a civic issue reported and
// being tracked" without literal UI mockup text. Pure inline SVG, no
// external asset, themed to the existing Tailwind palette.
export function HeroIllustration() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-bark/10 bg-birch">
      <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="Illustration of a road with a live civic issue report marker">
        <style>
          {`
            @keyframes rlk-dash { to { stroke-dashoffset: -40; } }
            .rlk-lane { stroke-dasharray: 14 12; animation: rlk-dash 1.6s linear infinite; }
            @keyframes rlk-rise { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
            .rlk-pin { animation: rlk-rise 0.6s ease-out; }
          `}
        </style>

        <rect width="400" height="300" fill="#F9F6F0" />

        {/* Sky/ground split */}
        <rect x="0" y="0" width="400" height="170" fill="#FFFFFF" />

        {/* Distant buildings, flat silhouette */}
        <g fill="#EDE6D8">
          <rect x="30" y="90" width="34" height="80" />
          <rect x="72" y="70" width="26" height="100" />
          <rect x="290" y="100" width="30" height="70" />
          <rect x="330" y="80" width="24" height="90" />
        </g>

        {/* Road, simple perspective */}
        <polygon points="150,300 250,300 235,170 165,170" fill="#3B3229" />
        {/* Road edge lines */}
        <line x1="150" y1="300" x2="165" y2="170" stroke="#5C5142" strokeWidth="2" />
        <line x1="250" y1="300" x2="235" y2="170" stroke="#5C5142" strokeWidth="2" />
        {/* Animated lane marking */}
        <line x1="200" y1="300" x2="200" y2="170" stroke="#FFBA08" strokeWidth="4" className="rlk-lane" strokeLinecap="round" />

        {/* Pavement */}
        <rect x="0" y="170" width="150" height="130" fill="#F3EEE3" />
        <rect x="250" y="170" width="150" height="130" fill="#F3EEE3" />

        {/* Streetlight */}
        <g>
          <rect x="72" y="150" width="4" height="80" fill="#8A7F6B" />
          <path d="M74 150 h26 a6 6 0 0 1 0 12 h-26 z" fill="#8A7F6B" />
          <circle cx="100" cy="156" r="6" fill="#FFBA08" opacity="0.9" />
        </g>

        {/* Drain grate, a quiet nod to the "Drainage" category */}
        <g transform="translate(300,250)" stroke="#B7AD98" strokeWidth="2">
          <rect x="-18" y="-8" width="36" height="16" rx="3" fill="#E4DCC9" />
          <line x1="-12" y1="-8" x2="-12" y2="8" />
          <line x1="-4" y1="-8" x2="-4" y2="8" />
          <line x1="4" y1="-8" x2="4" y2="8" />
          <line x1="12" y1="-8" x2="12" y2="8" />
        </g>

        {/* Live report marker with pulsing ring */}
        <g className="rlk-pin" transform="translate(197,150)">
          <circle cx="0" cy="0" r="14" fill="#E85D04" opacity="0.35" className="animate-ping" style={{ transformOrigin: '0px 0px' }} />
          <path
            d="M0,-26 C10,-26 18,-18 18,-8 C18,6 0,26 0,26 C0,26 -18,6 -18,-8 C-18,-18 -10,-26 0,-26 Z"
            fill="#E85D04"
          />
          <circle cx="0" cy="-8" r="6" fill="#FBF7F0" />
        </g>
      </svg>
    </div>
  )
}
