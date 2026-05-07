import type { WeatherData } from "@/utils/weather.functions";

/** Dual-axis: bar = pop %, line = cumulative mm (estimated from pop & condition) */
export function PrecipForecast24h({ data }: { data: WeatherData }) {
  const tz = data.city.tz;
  const items = data.hourly.slice(0, 8); // 24h in 3h steps

  // Estimate mm per slot: stronger rain id → more, scaled by pop
  const slotMm = items.map((h) => {
    const id = data.current.weather.id;
    const intensity =
      id >= 502 && id < 600 ? 4 :
      id >= 500 && id < 502 ? 1.6 :
      id >= 300 && id < 500 ? 0.6 :
      id >= 200 && id < 300 ? 5 :
      0.3;
    return (h.pop ?? 0) * intensity;
  });
  let acc = 0;
  const cum = slotMm.map((v) => (acc += v));
  const maxCum = Math.max(...cum, 1);

  const W = 600;
  const H = 220;
  const padX = 36;
  const padBottom = 36;
  const padTop = 16;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const barW = (innerW / items.length) * 0.62;
  const xFor = (i: number) => padX + (i / items.length) * innerW + (innerW / items.length - barW) / 2;

  const linePts = cum.map((v, i) => {
    const x = padX + ((i + 0.5) / items.length) * innerW;
    const y = padTop + innerH - (v / maxCum) * innerH;
    return [x, y] as const;
  });
  const linePath = linePts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");

  return (
    <div className="glass-soft" style={{ padding: 24, borderRadius: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#8B9DB5",
          }}
        >
          Hourly Precipitation · 24h
        </span>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: "#E8D5B0" }}>
          Σ {cum[cum.length - 1].toFixed(1)} mm
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 200 }}>
        <defs>
          <linearGradient id="precipBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {/* horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={padTop + innerH * (1 - f)}
            y2={padTop + innerH * (1 - f)}
            stroke="rgba(139,157,181,0.12)"
            strokeWidth="0.5"
            strokeDasharray="3 4"
          />
        ))}
        {/* % axis */}
        {[0, 25, 50, 75, 100].map((p) => (
          <text key={p} x={padX - 8} y={padTop + innerH * (1 - p / 100) + 4}
            fontSize="11" fontFamily="DM Mono" fill="#8B9DB5" textAnchor="end">
            {p}%
          </text>
        ))}
        {/* mm axis (right) */}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={W - padX + 8} y={padTop + innerH * (1 - f) + 4}
            fontSize="11" fontFamily="DM Mono" fill="#E8D5B0" textAnchor="start">
            {(maxCum * f).toFixed(1)}
          </text>
        ))}

        {/* bars (animated) */}
        {items.map((h, i) => {
          const pop = h.pop ?? 0;
          const fullH = pop * innerH;
          const x = xFor(i);
          const y = padTop + innerH - fullH;
          return (
            <rect
              key={h.dt}
              x={x}
              y={y}
              width={barW}
              height={fullH}
              rx={3}
              fill="url(#precipBar)"
              style={{
                transformOrigin: `${x + barW / 2}px ${padTop + innerH}px`,
                animation: `bar-grow 800ms ${i * 60}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            />
          );
        })}

        {/* cumulative line */}
        <path
          d={linePath}
          fill="none"
          stroke="#E8D5B0"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 6px rgba(232,213,176,0.45))",
            strokeDasharray: 1000,
            strokeDashoffset: 1000,
            animation: "draw-line 1.6s 200ms cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        />
        {linePts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#E8D5B0"
            style={{ filter: "drop-shadow(0 0 4px #E8D5B0)", opacity: 0,
              animation: `fade-in 400ms ${600 + i * 80}ms forwards` }} />
        ))}

        {/* x labels */}
        {items.map((h, i) => {
          const d = new Date((h.dt + tz) * 1000);
          const hh = d.getUTCHours();
          return (
            <text
              key={h.dt}
              x={xFor(i) + barW / 2}
              y={H - 12}
              fontSize="11"
              fontFamily="DM Mono"
              fill="#8B9DB5"
              textAnchor="middle"
            >
              {hh.toString().padStart(2, "0")}
            </text>
          );
        })}
      </svg>

      <style>{`
        @keyframes bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes draw-line { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
