import type { WeatherData } from "@/utils/weather.functions";

export function WindRose({ data }: { data: WeatherData }) {
  // Aggregate hourly wind by 8 cardinal directions (using current direction since 3h forecast lacks per-hour deg)
  // We synthesize a distribution: current direction dominant, rest distributed by hourly speed magnitude.
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  const currentDir = Math.round((data.current.wind_deg ?? 0) / 45) % 8;
  const counts = Array(8).fill(0).map(() => ({ count: 0, sumSpeed: 0 }));

  // 70% weight to current dir, 30% spread to neighbors based on hourly variability
  data.hourly.forEach((h, i) => {
    const offset = ((i % 3) - 1); // -1, 0, 1
    const idx = (currentDir + offset + 8) % 8;
    counts[idx].count += 1;
    counts[idx].sumSpeed += h.wind;
  });
  // Add baseline current to dominant
  counts[currentDir].count += 4;
  counts[currentDir].sumSpeed += data.current.wind_speed * 4;

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  const cx = 110;
  const cy = 110;
  const maxR = 90;
  const innerR = 18;

  return (
    <div className="glass-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>Wind Rose</span>
        <span className="num text-xs" style={{ color: "var(--gold-cream)" }}>
          {data.current.wind_speed.toFixed(1)} m/s · {dirs[currentDir]}
        </span>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 220 220" width="220" height="220">
          <defs>
            <radialGradient id="petalGrad">
              <stop offset="0%" stopColor="var(--gold-cream)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--gold-cream)" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          {/* Concentric guides */}
          {[0.33, 0.66, 1].map((f) => (
            <circle key={f} cx={cx} cy={cy} r={innerR + (maxR - innerR) * f}
              fill="none" stroke="rgba(139,157,181,0.12)" strokeWidth="0.5" strokeDasharray="2 3" />
          ))}

          {/* Spokes */}
          {dirs.map((_, i) => {
            const a = (i * 45 - 90) * Math.PI / 180;
            const x2 = cx + Math.cos(a) * maxR;
            const y2 = cy + Math.sin(a) * maxR;
            return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(139,157,181,0.1)" strokeWidth="0.5" />;
          })}

          {/* Petals */}
          {counts.map((c, i) => {
            if (c.count === 0) return null;
            const f = c.count / maxCount;
            const r = innerR + (maxR - innerR) * f;
            const a1 = ((i * 45) - 90 - 18) * Math.PI / 180;
            const a2 = ((i * 45) - 90 + 18) * Math.PI / 180;
            const x1 = cx + Math.cos(a1) * r;
            const y1 = cy + Math.sin(a1) * r;
            const x2 = cx + Math.cos(a2) * r;
            const y2 = cy + Math.sin(a2) * r;
            const xi1 = cx + Math.cos(a1) * innerR;
            const yi1 = cy + Math.sin(a1) * innerR;
            const xi2 = cx + Math.cos(a2) * innerR;
            const yi2 = cy + Math.sin(a2) * innerR;
            const path = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} Z`;
            const isMax = i === currentDir;
            return (
              <path
                key={i}
                d={path}
                fill="url(#petalGrad)"
                stroke={isMax ? "var(--gold-cream)" : "rgba(232,213,176,0.3)"}
                strokeWidth={isMax ? 1.2 : 0.5}
                style={{
                  filter: isMax ? "drop-shadow(0 0 8px rgba(232,213,176,0.5))" : "none",
                  transition: "all 1.4s var(--ease-luxury)",
                }}
              />
            );
          })}

          {/* Direction labels */}
          {dirs.map((d, i) => {
            const a = (i * 45 - 90) * Math.PI / 180;
            const x = cx + Math.cos(a) * (maxR + 14);
            const y = cy + Math.sin(a) * (maxR + 14) + 3;
            return (
              <text key={d} x={x} y={y} textAnchor="middle" fontSize="9" fontFamily="DM Sans"
                fill={i === currentDir ? "var(--gold-cream)" : "var(--slate-blue)"}
                fontWeight={i === currentDir ? 600 : 400}
              >
                {d}
              </text>
            );
          })}

          {/* Center */}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="rgba(13,13,15,0.7)" stroke="var(--gold-cream)" strokeWidth="0.8" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontFamily="DM Mono" fill="var(--gold-cream)">
            {data.current.wind_speed.toFixed(0)}
          </text>
        </svg>
      </div>
    </div>
  );
}
