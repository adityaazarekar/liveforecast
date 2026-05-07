import { Sun } from "lucide-react";
import { useMemo } from "react";
import type { WeatherData } from "@/utils/weather.functions";

function comfortInfo(temp: number, humidity: number): { label: string; color: string; bg: string } {
  if (temp < 5) return { label: "Cold", color: "#93c5fd", bg: "rgba(147,197,253,0.12)" };
  if (temp > 35) return { label: "Scorching", color: "#fca5a5", bg: "rgba(252,165,165,0.14)" };
  if (humidity > 75) return { label: "Humid", color: "#fcd34d", bg: "rgba(252,211,77,0.12)" };
  if (humidity < 25) return { label: "Dry", color: "#fdba74", bg: "rgba(253,186,116,0.12)" };
  if (temp >= 20 && temp <= 28 && humidity < 60)
    return { label: "Comfortable", color: "#86efac", bg: "rgba(134,239,172,0.12)" };
  if (temp >= 15 && temp <= 30) return { label: "Pleasant", color: "#bef264", bg: "rgba(190,242,100,0.12)" };
  return { label: "Mild", color: "#e5e7eb", bg: "rgba(229,231,235,0.10)" };
}

function ThermoIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

export function WeatherSnapshot({ data }: { data: WeatherData }) {
  const { current, hourly } = data;
  const comfort = useMemo(() => comfortInfo(current.temp, current.humidity), [current.temp, current.humidity]);

  // Sparkline: next 7 hours
  const sparkPath = useMemo(() => {
    const pts = hourly.slice(0, 7).map((h) => h.temp);
    if (pts.length < 2) return { d: "", first: [0, 18] as const, last: [80, 18] as const };
    const w = 80, h = 36;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = Math.max(1, max - min);
    const pad = 4;
    const innerH = h - pad * 2;
    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = pad + innerH - ((v - min) / range) * innerH;
      return [x, y] as const;
    });
    let d = `M ${coords[0][0]} ${coords[0][1]}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const [x0, y0] = coords[i];
      const [x1, y1] = coords[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return { d, first: coords[0], last: coords[coords.length - 1] };
  }, [hourly]);

  // Best window: lowest UV*wind product (proxy = wind * (clouds inverse))
  const best = useMemo(() => {
    const hours = hourly.slice(0, 12);
    if (hours.length === 0) return null;
    let bestI = 0, bestScore = Infinity;
    hours.forEach((h, i) => {
      // Lower wind + cooler temp away from extremes
      const score = (h.wind ?? 0) * 1.0 + Math.abs((h.temp ?? 22) - 22) * 0.4 + (h.pop ?? 0) * 5;
      if (score < bestScore) { bestScore = score; bestI = i; }
    });
    const dt = (hours[bestI].dt + data.city.tz) * 1000;
    const hr = new Date(dt).getUTCHours();
    const label = hr === 0 ? "12 AM" : hr < 12 ? `${hr} AM` : hr === 12 ? "12 PM" : `${hr - 12} PM`;
    return label;
  }, [hourly, data.city.tz]);

  return (
    <div
      className="glass-card grid grid-cols-3 items-center gap-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "14px 16px",
        minHeight: 90,
      }}
    >
      {/* Col 1 — Feels Like */}
      <div className="flex flex-col gap-1.5">
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.45 }}>
          Feels Like
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 39, color: "#fff", lineHeight: 1 }}>
          {Math.round(current.feels)}°
        </span>
        <span
          className="inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5"
          style={{ background: comfort.bg, color: comfort.color }}
        >
          <ThermoIcon color={comfort.color} size={11} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500 }}>{comfort.label}</span>
        </span>
      </div>

      {/* divider */}
      <div className="relative flex flex-col items-center gap-1">
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ width: "0.5px", height: 56, background: "rgba(255,255,255,0.08)" }}
        />
        <svg width={80} height={36} viewBox="0 0 80 36" style={{ display: "block" }}>
          <path
            d={sparkPath.d}
            fill="none"
            stroke="var(--cond)"
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px var(--cond-soft))" }}
          />
          <circle cx={sparkPath.first[0]} cy={sparkPath.first[1]} r={2.5} fill="var(--cond)" />
          <circle cx={sparkPath.last[0]} cy={sparkPath.last[1]} r={2.5} fill="var(--cond)" />
        </svg>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.4 }}>
          Next 7 Hrs
        </span>
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{ width: "0.5px", height: 56, background: "rgba(255,255,255,0.08)" }}
        />
      </div>

      {/* Col 3 — Best Window */}
      <div className="flex flex-col gap-1 items-end text-right">
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.45 }}>
          Go Outside
        </span>
        <div className="flex items-center gap-1.5">
          <Sun className="h-3.5 w-3.5" color="var(--cond)" strokeWidth={1.6} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 31, color: "#fff", lineHeight: 1 }}>
            {best ?? "—"}
          </span>
        </div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, opacity: 0.4 }}>
          Lowest UV + wind
        </span>
      </div>
    </div>
  );
}
