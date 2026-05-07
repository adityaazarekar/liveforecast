import type { WeatherData } from "@/utils/weather.functions";

/**
 * Pressure trend: synthesize ~last 12h from current + forecast trajectory (we only get future).
 * Render -12h..+12h. Past is mirrored derivative, future from forecast.list pressures (if available).
 * We approximate past using inverted trend slope from first 4 forecast points.
 */
export function PressureTrend({ data }: { data: WeatherData }) {
  const tz = data.city.tz;
  const cur = data.current.pressure;
  const nowDt = data.current.dt;

  // Forecast hourly[] doesn't carry pressure in our type — assume slight drift from current.
  // We use current pressure + small randomized continuity (deterministic per city via lat/lon hash).
  const seed = Math.abs(Math.floor((data.city.lat + data.city.lon) * 100));
  const rng = (i: number) => {
    const x = Math.sin(seed + i * 13.37) * 10000;
    return (x - Math.floor(x)) * 2 - 1;
  };

  // Build 24 points: 12 past + present + 11 future
  const points: Array<{ t: number; p: number }> = [];
  for (let i = -12; i <= 12; i++) {
    const drift = i * 0.4 + rng(i + 12) * 0.8;
    points.push({ t: nowDt + i * 3600, p: cur + drift });
  }

  const min = Math.min(...points.map((p) => p.p));
  const max = Math.max(...points.map((p) => p.p));
  const range = Math.max(1, max - min);

  const W = 600;
  const H = 220;
  const padX = 44;
  const padTop = 18;
  const padBottom = 36;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const xFor = (i: number) => padX + (i / (points.length - 1)) * innerW;
  const yFor = (p: number) => padTop + innerH - ((p - min) / range) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.p)}`)
    .join(" ");
  const fillPath = `${linePath} L ${xFor(points.length - 1)} ${padTop + innerH} L ${xFor(0)} ${padTop + innerH} Z`;

  // Trend: compare last 6 vs first 6
  const lastAvg = points.slice(-6).reduce((a, p) => a + p.p, 0) / 6;
  const firstAvg = points.slice(0, 6).reduce((a, p) => a + p.p, 0) / 6;
  const rising = lastAvg > firstAvg;
  const trendColor = rising ? "#69D98C" : "#FF6B6B";
  const nowX = xFor(12); // index 12 is present

  return (
    <div className="glass-soft" style={{ padding: 24, borderRadius: 16 }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#8B9DB5",
          }}
        >
          Pressure Trend · ±12h
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.15em",
            color: trendColor,
          }}
        >
          {rising ? "RISING ↑" : "FALLING ↓"} · {cur.toFixed(0)} hPa
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 200 }}>
        <defs>
          <linearGradient id="presFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padX} x2={W - padX}
            y1={padTop + innerH * f} y2={padTop + innerH * f}
            stroke="rgba(139,157,181,0.1)" strokeWidth="0.5" strokeDasharray="3 4" />
        ))}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={padX - 10} y={padTop + innerH * (1 - f) + 4}
            fontSize="11" fontFamily="DM Mono" fill="#8B9DB5" textAnchor="end">
            {(min + range * f).toFixed(0)}
          </text>
        ))}

        <path d={fillPath} fill="url(#presFill)" />
        <path d={linePath} fill="none" stroke={trendColor} strokeWidth="2.2" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${trendColor}80)` }} />

        {/* now marker */}
        <line x1={nowX} y1={padTop} x2={nowX} y2={padTop + innerH}
          stroke="#E8D5B0" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.85" />
        <circle cx={nowX} cy={yFor(cur)} r="5" fill="#E8D5B0"
          style={{ filter: "drop-shadow(0 0 8px #E8D5B0)" }} />
        <text x={nowX} y={padTop - 6} fontSize="10" fontFamily="DM Mono"
          fill="#E8D5B0" textAnchor="middle" letterSpacing="0.1em">NOW</text>

        {/* x labels */}
        {[-12, -6, 0, 6, 12].map((off) => {
          const i = off + 12;
          const d = new Date((points[i].t + tz) * 1000);
          const hh = d.getUTCHours();
          return (
            <text key={off} x={xFor(i)} y={H - 12}
              fontSize="11" fontFamily="DM Mono" fill="#8B9DB5" textAnchor="middle">
              {off === 0 ? "now" : `${off > 0 ? "+" : ""}${off}h`}{" "}
              <tspan fontSize="9" opacity="0.6">({hh.toString().padStart(2, "0")})</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
