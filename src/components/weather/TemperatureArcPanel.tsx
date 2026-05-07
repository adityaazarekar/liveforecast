import { useMemo, useState } from "react";
import type { WeatherData } from "@/utils/weather.functions";

/**
 * ROW A — Temperature Arc (radial gauge) + 24h feels-like sparkline
 * Left 60%: half-donut showing current temp position between today's high/low
 * Right 40%: SVG sparkline of upcoming feels-like over next ~24h
 */
export function TemperatureArcPanel({ data }: { data: WeatherData }) {
  const today = data.daily[0];
  const lo = Math.round(today?.min ?? data.current.temp - 4);
  const hi = Math.round(today?.max ?? data.current.temp + 4);
  const cur = Math.round(data.current.temp);
  const range = Math.max(1, hi - lo);
  const pct = Math.max(0, Math.min(1, (cur - lo) / range));
  // arc spans 180deg starting at 180 (left)
  const angle = 180 + pct * 180;

  // 24h feels-like (we have hourly with temp; approximate feels with same)
  const series = data.hourly.slice(0, 8).map((h, i) => ({ t: h.temp, i, dt: h.dt }));
  const sparkPath = useMemo(() => buildSpark(series.map((s) => s.t), 220, 70), [series]);

  return (
    <div
      className="glass-card grid grid-cols-[3fr_2fr] gap-4 px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Arc */}
      <div className="flex flex-col gap-2">
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--slate-blue)",
          }}
        >
          Today's Range
        </div>
        <div className="relative">
          <svg viewBox="0 0 220 130" className="w-full" style={{ maxHeight: 130 }}>
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--sky)" />
                <stop offset="50%" stopColor="var(--gold-cream)" />
                <stop offset="100%" stopColor="var(--coral)" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d="M 18 110 A 92 92 0 0 1 202 110"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            {/* Active arc */}
            <path
              d={describeArc(110, 110, 92, 180, angle)}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth={8}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(232,213,176,0.35))" }}
            />
            {/* Needle dot */}
            {(() => {
              const rad = (angle * Math.PI) / 180;
              const x = 110 + 92 * Math.cos(rad);
              const y = 110 + 92 * Math.sin(rad);
              return (
                <>
                  <circle cx={x} cy={y} r={7} fill="rgba(13,13,15,0.95)" />
                  <circle cx={x} cy={y} r={4} fill="var(--gold-cream)" />
                </>
              );
            })()}
            {/* Labels */}
            <text x={18} y={128} fill="var(--slate-blue)" fontSize="10" fontFamily="DM Mono" letterSpacing="0.1em">
              {lo}°
            </text>
            <text x={202} y={128} fill="var(--slate-blue)" fontSize="10" fontFamily="DM Mono" textAnchor="end" letterSpacing="0.1em">
              {hi}°
            </text>
            <text
              x={110}
              y={92}
              textAnchor="middle"
              fill="var(--gold-cream)"
              fontSize="32"
              fontFamily="Inter"
              fontWeight={200}
              letterSpacing="-0.02em"
            >
              {cur}°
            </text>
            <text
              x={110}
              y={108}
              textAnchor="middle"
              fill="var(--slate-blue)"
              fontSize="9"
              fontFamily="Inter"
              letterSpacing="0.18em"
              style={{ textTransform: "uppercase" } as any}
            >
              NOW
            </text>
          </svg>
        </div>
      </div>

      {/* Feels-like sparkline */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--slate-blue)",
            }}
          >
            Feels Like · 24h
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 22,
              color: "var(--gold-cream)",
              fontWeight: 300,
            }}
          >
            {Math.round(data.current.feels)}°
          </div>
        </div>
        <SparkInteractive points={series} pathD={sparkPath} />
      </div>
    </div>
  );
}

function SparkInteractive({
  points,
  pathD,
}: {
  points: Array<{ t: number; i: number; dt: number }>;
  pathD: { d: string; coords: Array<readonly [number, number]>; w: number; h: number };
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${pathD.w} ${pathD.h}`}
        className="w-full"
        style={{ maxHeight: 90 }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--sky)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={`${pathD.d} L ${pathD.w} ${pathD.h} L 0 ${pathD.h} Z`}
          fill="url(#sparkFill)"
        />
        {/* Line */}
        <path
          d={pathD.d}
          fill="none"
          stroke="var(--sky)"
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(79,195,247,0.5))" }}
        />
        {/* Hover hit areas + dots */}
        {pathD.coords.map(([x, y], i) => (
          <g key={i}>
            <rect
              x={x - 12}
              y={0}
              width={24}
              height={pathD.h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              style={{ cursor: "pointer" }}
            />
            <circle
              cx={x}
              cy={y}
              r={hover === i ? 4 : 2}
              fill={hover === i ? "var(--gold-cream)" : "var(--sky)"}
              style={{ transition: "r 150ms ease" }}
            />
          </g>
        ))}
      </svg>
      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute -top-1 rounded-md px-2 py-1"
          style={{
            left: `${(pathD.coords[hover][0] / pathD.w) * 100}%`,
            transform: "translate(-50%, -100%)",
            background: "rgba(13,13,15,0.92)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            fontFamily: "'DM Mono', monospace",
            fontSize: 15,
            color: "var(--gold-cream)",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {Math.round(points[hover].t)}° · {fmtH(points[hover].dt)}
        </div>
      )}
    </div>
  );
}

function fmtH(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

function buildSpark(values: number[], w: number, h: number) {
  const coords: Array<readonly [number, number]> = [];
  if (values.length < 2) return { d: "", coords, w, h };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const pad = 8;
  const innerH = h - pad * 2;
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = pad + innerH - ((v - min) / range) * innerH;
    coords.push([x, y] as const);
  });
  let d = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return { d, coords, w, h };
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
