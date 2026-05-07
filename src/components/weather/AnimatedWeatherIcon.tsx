// Hand-crafted animated SVG weather icons.
// kind derived from OWM condition id; size & glow color configurable.

type Kind = "sun" | "moon" | "cloud" | "rain" | "drizzle" | "snow" | "storm" | "mist";

export function kindFor(id: number, isDay = true): Kind {
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 500) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800) return isDay ? "sun" : "moon";
  return "cloud";
}

export function condColor(kind: Kind): string {
  switch (kind) {
    case "sun": return "#f59e0b";
    case "moon": return "#cbd5e1";
    case "rain":
    case "drizzle": return "#60a5fa";
    case "snow": return "#bae6fd";
    case "storm": return "#a78bfa";
    case "mist": return "#94a3b8";
    default: return "#cbd5e1";
  }
}

export function AnimatedWeatherIcon({
  id,
  isDay = true,
  size = 96,
  className = "",
}: {
  id: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}) {
  const kind = kindFor(id, isDay);
  const color = condColor(kind);
  const glow = `drop-shadow(0 0 ${size * 0.18}px ${color}aa)`;

  const wrapperStyle = { width: size, height: size, filter: glow } as React.CSSProperties;

  return (
    <div className={`relative inline-block ${className}`} style={wrapperStyle} aria-hidden>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {kind === "sun" && <SunSvg color={color} />}
        {kind === "moon" && <MoonSvg color={color} />}
        {kind === "cloud" && <CloudSvg color={color} />}
        {kind === "drizzle" && <RainSvg color={color} drops={2} />}
        {kind === "rain" && <RainSvg color={color} drops={3} />}
        {kind === "snow" && <SnowSvg color={color} />}
        {kind === "storm" && <StormSvg color={color} />}
        {kind === "mist" && <MistSvg color={color} />}
      </svg>
    </div>
  );
}

function SunSvg({ color }: { color: string }) {
  return (
    <g>
      <g style={{ transformOrigin: "50px 50px", animation: "spin-slow 18s linear infinite" }}>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const x1 = 50 + Math.cos(a) * 28;
          const y1 = 50 + Math.sin(a) * 28;
          const x2 = 50 + Math.cos(a) * 40;
          const y2 = 50 + Math.sin(a) * 40;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />;
        })}
      </g>
      <circle cx={50} cy={50} r={18} fill={color} opacity={0.18} style={{ transformOrigin: "50px 50px", animation: "breathe 3s ease-in-out infinite" }} />
      <circle cx={50} cy={50} r={13} fill={color} />
    </g>
  );
}

function MoonSvg({ color }: { color: string }) {
  return (
    <g>
      {[...Array(5)].map((_, i) => (
        <circle
          key={i}
          cx={20 + i * 16}
          cy={18 + (i % 2) * 10}
          r={1.4}
          fill="#fff"
          style={{ animation: `twinkle 2.${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, transformOrigin: `${20 + i * 16}px ${18 + (i % 2) * 10}px` }}
        />
      ))}
      <path d="M68 30 a28 28 0 1 0 0 40 a22 22 0 0 1 0 -40 z" fill={color} />
    </g>
  );
}

function CloudSvg({ color }: { color: string }) {
  return (
    <g style={{ transformOrigin: "50px 50px", animation: "cloud-drift 8s ease-in-out infinite" }}>
      <ellipse cx={36} cy={58} rx={18} ry={14} fill={color} opacity={0.85} />
      <ellipse cx={58} cy={52} rx={22} ry={18} fill={color} opacity={0.95} />
      <ellipse cx={70} cy={62} rx={14} ry={11} fill={color} opacity={0.75} />
      <rect x={22} y={62} width={58} height={10} rx={5} fill={color} opacity={0.85} />
    </g>
  );
}

function RainSvg({ color, drops }: { color: string; drops: number }) {
  return (
    <g>
      <g opacity={0.95} style={{ animation: "cloud-drift 7s ease-in-out infinite" }}>
        <ellipse cx={36} cy={42} rx={16} ry={12} fill="#cbd5e1" opacity={0.7} />
        <ellipse cx={58} cy={36} rx={20} ry={16} fill="#cbd5e1" opacity={0.85} />
        <ellipse cx={70} cy={46} rx={12} ry={10} fill="#cbd5e1" opacity={0.6} />
        <rect x={22} y={46} width={58} height={9} rx={4.5} fill="#cbd5e1" opacity={0.8} />
      </g>
      {[...Array(drops)].map((_, i) => (
        <line
          key={i}
          x1={32 + i * 14}
          y1={62}
          x2={30 + i * 14}
          y2={74}
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          style={{ animation: `rain-drop 0.9s linear infinite`, animationDelay: `${i * 0.2}s`, transformOrigin: `${32 + i * 14}px 64px` }}
        />
      ))}
    </g>
  );
}

function SnowSvg({ color }: { color: string }) {
  return (
    <g>
      <g opacity={0.95}>
        <ellipse cx={36} cy={40} rx={16} ry={12} fill="#e2e8f0" opacity={0.7} />
        <ellipse cx={58} cy={34} rx={20} ry={16} fill="#e2e8f0" opacity={0.85} />
        <ellipse cx={70} cy={44} rx={12} ry={10} fill="#e2e8f0" opacity={0.6} />
        <rect x={22} y={44} width={58} height={9} rx={4.5} fill="#e2e8f0" opacity={0.8} />
      </g>
      {[
        { x: 34, y: 70 }, { x: 50, y: 76 }, { x: 66, y: 70 },
      ].map((p, i) => (
        <g key={i} style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: `snow-spin ${5 + i}s linear infinite` }}>
          <line x1={p.x - 4} y1={p.y} x2={p.x + 4} y2={p.y} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={p.x} y1={p.y - 4} x2={p.x} y2={p.y + 4} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={p.x - 3} y1={p.y - 3} x2={p.x + 3} y2={p.y + 3} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
          <line x1={p.x - 3} y1={p.y + 3} x2={p.x + 3} y2={p.y - 3} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function StormSvg({ color }: { color: string }) {
  return (
    <g>
      <g style={{ animation: "cloud-drift 6s ease-in-out infinite" }}>
        <ellipse cx={36} cy={38} rx={16} ry={12} fill="#94a3b8" opacity={0.9} />
        <ellipse cx={58} cy={32} rx={22} ry={16} fill="#cbd5e1" opacity={0.95} />
        <ellipse cx={72} cy={42} rx={13} ry={10} fill="#94a3b8" opacity={0.85} />
        <rect x={22} y={42} width={60} height={9} rx={4.5} fill="#94a3b8" />
      </g>
      <path
        d="M52 52 L42 70 L50 70 L46 86 L62 64 L54 64 L60 52 Z"
        fill={color}
        style={{ animation: "bolt-flash 2.4s ease-in-out infinite" }}
      />
    </g>
  );
}

function MistSvg({ color }: { color: string }) {
  return (
    <g>
      {[28, 44, 60, 72].map((y, i) => (
        <rect
          key={i}
          x={14}
          y={y}
          width={72}
          height={4}
          rx={2}
          fill={color}
          opacity={0.55 - i * 0.08}
          style={{ animation: `cloud-drift ${5 + i}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, transformOrigin: "50px 50px" }}
        />
      ))}
    </g>
  );
}
