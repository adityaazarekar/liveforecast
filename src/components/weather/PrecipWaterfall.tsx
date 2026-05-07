import { useMemo, useState } from "react";
import type { WeatherData } from "@/utils/weather.functions";

/**
 * ROW C — Precipitation waterfall. Bars = precip probability (left axis),
 * line = cumulative accumulation (right axis, mm). 12-hour window.
 */
export function PrecipWaterfall({ data }: { data: WeatherData }) {
  // Use first 4 forecast entries (12h) but interpolate to 12 hourly bars
  const hours = useMemo(() => buildHourly(data, 12), [data]);
  const [hover, setHover] = useState<number | null>(null);

  const maxPop = Math.max(0.05, ...hours.map((h) => h.pop));
  // crude accumulation estimate: pop * 0.8mm per hour at peak
  let acc = 0;
  const accumulated = hours.map((h) => {
    acc += h.pop * 0.8;
    return acc;
  });
  const maxAcc = Math.max(0.5, accumulated[accumulated.length - 1]);

  const W = 480;
  const H = 110;
  const pad = { top: 14, right: 8, bottom: 18, left: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const barW = innerW / hours.length - 4;

  // Line path
  const linePts = accumulated.map((a, i) => {
    const x = pad.left + (i + 0.5) * (innerW / hours.length);
    const y = pad.top + innerH - (a / maxAcc) * innerH;
    return [x, y] as const;
  });
  const linePath = (() => {
    if (linePts.length < 2) return "";
    let d = `M ${linePts[0][0]} ${linePts[0][1]}`;
    for (let i = 0; i < linePts.length - 1; i++) {
      const [x0, y0] = linePts[i];
      const [x1, y1] = linePts[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  })();

  return (
    <div
      className="glass-card flex flex-col gap-2 px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
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
          Precipitation · 12h
        </div>
        <div className="flex items-center gap-3">
          <Legend dot="var(--sky)" label="Probability" />
          <Legend dot="var(--gold-cream)" label="Accum (mm)" />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 130 }}>
        {/* Bars */}
        {hours.map((h, i) => {
          const x = pad.left + i * (innerW / hours.length) + 2;
          const heightVal = (h.pop / maxPop) * innerH;
          const y = pad.top + innerH - heightVal;
          const isHover = hover === i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={heightVal}
                fill={isHover ? "rgba(79,195,247,0.55)" : "rgba(79,195,247,0.3)"}
                stroke="var(--sky)"
                strokeWidth={isHover ? 1 : 0.4}
                rx={2}
                style={{ transition: "fill 180ms ease, stroke-width 180ms ease" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        {/* Accumulation line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--gold-cream)"
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(232,213,176,0.5))" }}
        />
        {linePts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hover === i ? 3.5 : 2}
            fill="var(--gold-cream)"
            style={{ transition: "r 150ms ease" }}
          />
        ))}

        {/* X labels */}
        {hours.map((h, i) =>
          i % 2 === 0 ? (
            <text
              key={`l${i}`}
              x={pad.left + (i + 0.5) * (innerW / hours.length)}
              y={H - 4}
              textAnchor="middle"
              fill="var(--muted-grid)"
              fontSize="9"
              fontFamily="Inter"
              letterSpacing="0.05em"
            >
              {fmtH(h.dt, data.city.tz)}
            </text>
          ) : null,
        )}
      </svg>

      {hover !== null && hours[hover] && (
        <div
          className="flex items-center gap-3 self-end rounded-md px-2.5 py-1"
          style={{
            background: "rgba(13,13,15,0.95)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            fontFamily: "'DM Mono', monospace",
            fontSize: 15,
          }}
        >
          <span style={{ color: "var(--sky)" }}>{Math.round(hours[hover].pop * 100)}%</span>
          <span style={{ color: "var(--slate-blue)" }}>·</span>
          <span style={{ color: "var(--gold-cream)" }}>{accumulated[hover].toFixed(1)} mm</span>
          <span style={{ color: "var(--slate-blue)" }}>· {fmtH(hours[hover].dt, data.city.tz)}</span>
        </div>
      )}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ width: 8, height: 8, borderRadius: 2, background: dot, boxShadow: `0 0 6px ${dot}` }} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, letterSpacing: "0.1em", color: "var(--slate-blue)" }}>
        {label}
      </span>
    </div>
  );
}

function fmtH(unix: number, tz: number): string {
  const d = new Date((unix + tz) * 1000);
  const h = d.getUTCHours();
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

function buildHourly(data: WeatherData, count: number) {
  const src = data.hourly.slice(0, 5); // ~12h
  if (src.length === 0) return [];
  const out: Array<{ pop: number; dt: number }> = [];
  for (let i = 0; i < count; i++) {
    const f = (i / (count - 1)) * (src.length - 1);
    const lo = Math.floor(f);
    const hi = Math.min(src.length - 1, lo + 1);
    const t = f - lo;
    const pop = src[lo].pop + (src[hi].pop - src[lo].pop) * t;
    const dt = src[lo].dt + (src[hi].dt - src[lo].dt) * t;
    out.push({ pop, dt });
  }
  return out;
}
