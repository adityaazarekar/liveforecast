import { useMemo, useState } from "react";
import type { WeatherData } from "@/utils/weather.functions";

/**
 * ROW B — 24-cell hourly heatmap. Each cell = 1 hour, color mapped from temp.
 * Pulsing border on current hour. Hover tooltip.
 */
export function HourlyHeatmap({ data }: { data: WeatherData }) {
  const tz = data.city.tz;
  const nowH = new Date((Date.now() / 1000 + tz) * 1000).getUTCHours();

  // Build 24 hourly buckets (we only have ~24h worth from 3h forecast = 8 entries).
  // Interpolate between forecast points to get a per-hour temp.
  const cells = useMemo(() => buildHourlyCells(data, 24), [data]);

  const min = Math.min(...cells.map((c) => c.temp));
  const max = Math.max(...cells.map((c) => c.temp));

  const [hover, setHover] = useState<number | null>(null);

  return (
    <div
      className="glass-card flex flex-col gap-3 px-5 py-5"
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
          Temperature Heatmap · Today
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "var(--slate-blue)" }}>
            {Math.round(min)}°
          </span>
          <div
            style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              background: "linear-gradient(to right, var(--sky), var(--gold-cream), var(--amber-warn), var(--coral))",
            }}
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "var(--slate-blue)" }}>
            {Math.round(max)}°
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-24 gap-[3px]" style={{ gridTemplateColumns: "repeat(24, minmax(0,1fr))" }}>
        {cells.map((c, i) => {
          const isNow = c.hour === nowH;
          const t = (c.temp - min) / Math.max(1, max - min);
          const color = tempToColor(t);
          return (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="relative cursor-pointer"
              style={{
                height: 36,
                borderRadius: 4,
                background: color,
                border: isNow ? "1.5px solid rgba(255,255,255,0.95)" : "0.5px solid rgba(255,255,255,0.06)",
                boxShadow: isNow ? "0 0 12px rgba(255,255,255,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.06)",
                transform: hover === i ? "scale(1.12)" : "scale(1)",
                transition: "transform 180ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 180ms ease",
                animation: isNow ? "marker-pulse 2.4s ease-in-out infinite" : undefined,
              }}
            />
          );
        })}

        {hover !== null && cells[hover] && (
          <div
            className="pointer-events-none absolute z-20 rounded-md px-2.5 py-1.5"
            style={{
              left: `${((hover + 0.5) / 24) * 100}%`,
              top: -54,
              transform: "translateX(-50%)",
              background: "rgba(13,13,15,0.95)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: "var(--gold-cream)", fontWeight: 400 }}>
              {Math.round(cells[hover].temp)}°
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--slate-blue)", letterSpacing: "0.1em" }}>
              {fmtHour(cells[hover].hour)} · {Math.round((cells[hover].pop ?? 0) * 100)}% rain
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--muted-grid)", letterSpacing: "0.1em" }}>
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

function tempToColor(t: number): string {
  // 0 = sky blue, 0.5 = gold-cream, 0.75 = amber, 1 = coral
  if (t < 0.5) {
    const k = t / 0.5;
    return mix("#4fc3f7", "#e8d5b0", k);
  } else if (t < 0.8) {
    const k = (t - 0.5) / 0.3;
    return mix("#e8d5b0", "#ffb347", k);
  } else {
    const k = (t - 0.8) / 0.2;
    return mix("#ffb347", "#ff6b6b", k);
  }
}
function mix(a: string, b: string, t: number): string {
  const pa = hex(a), pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function hex(h: string): [number, number, number] {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function fmtHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function buildHourlyCells(data: WeatherData, count: number) {
  // hourly[] entries are spaced 3h apart. Linearly interpolate 24 hourly points.
  const tz = data.city.tz;
  const src = data.hourly.slice(0, 8); // ~24h
  if (src.length === 0) return [];

  const cells: Array<{ hour: number; temp: number; pop: number; dt: number }> = [];
  for (let i = 0; i < count; i++) {
    // map cell i -> position in src (0..src.length-1)
    const f = (i / (count - 1)) * (src.length - 1);
    const lo = Math.floor(f);
    const hi = Math.min(src.length - 1, lo + 1);
    const t = f - lo;
    const temp = src[lo].temp + (src[hi].temp - src[lo].temp) * t;
    const pop = src[lo].pop + (src[hi].pop - src[lo].pop) * t;
    const dt = src[lo].dt + (src[hi].dt - src[lo].dt) * t;
    const hour = new Date((dt + tz) * 1000).getUTCHours();
    cells.push({ hour, temp, pop, dt });
  }
  return cells;
}
