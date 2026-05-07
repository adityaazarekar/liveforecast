import type { AstronomyData } from "@/utils/astronomy.functions";
import { fmtTime } from "@/lib/weather-utils";

export function SolarArc({ astro, tz, now }: { astro: AstronomyData; tz: number; now: number }) {
  const { sun } = astro;
  const dur = sun.sunset - sun.sunrise;
  const prog = Math.max(0, Math.min(1, (now - sun.sunrise) / dur));
  const angle = prog * 180; // 0 = sunrise (left), 180 = sunset (right)

  const cx = 250;
  const cy = 160;
  const r = 200;
  // Path from (cx-r, cy) to (cx+r, cy) over the top
  const sunX = cx - Math.cos((angle * Math.PI) / 180) * r;
  const sunY = cy - Math.sin((angle * Math.PI) / 180) * r;

  // Twilight markers
  const markers = [
    { name: "Civil Dawn", t: sun.civilDawn, color: "#5b6dba" },
    { name: "Sunrise", t: sun.sunrise, color: "var(--gold-cream)" },
    { name: "Golden AM", t: sun.goldenHourMorningEnd, color: "#ffb347" },
    { name: "Solar Noon", t: sun.solarNoon, color: "#fef3c7" },
    { name: "Golden PM", t: sun.goldenHourEveningStart, color: "#ff9a47" },
    { name: "Sunset", t: sun.sunset, color: "var(--coral)" },
    { name: "Civil Dusk", t: sun.civilDusk, color: "#5b6dba" },
  ];

  return (
    <div className="glass-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>Solar Arc</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 17, color: "var(--gold-cream)" }}>
          {(sun.altitudeNow).toFixed(1)}° alt · {(sun.azimuthNow).toFixed(0)}° az
        </span>
      </div>

      <svg viewBox="0 0 500 200" className="w-full h-[180px]">
        <defs>
          <linearGradient id="solarBg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a2440" />
            <stop offset="20%" stopColor="#5b6dba" />
            <stop offset="40%" stopColor="#ffb347" />
            <stop offset="60%" stopColor="#ffb347" />
            <stop offset="80%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#1a2440" />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor="#ffe4a3" stopOpacity="1" />
            <stop offset="60%" stopColor="#ffb347" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff8c1a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Horizon */}
        <line x1="20" y1="160" x2="480" y2="160" stroke="rgba(139,157,181,0.25)" strokeWidth="1" strokeDasharray="2 4" />

        {/* Arc gradient track */}
        <path
          d={`M 50 160 A 200 200 0 0 1 450 160`}
          fill="none"
          stroke="url(#solarBg)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Progress arc */}
        <path
          d={`M 50 160 A 200 200 0 0 1 450 160`}
          fill="none"
          stroke="var(--gold-cream)"
          strokeWidth="2"
          strokeDasharray={`${(prog * 628)} 628`}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(232,213,176,0.6))", transition: "stroke-dasharray 1.4s var(--ease-luxury)" }}
        />

        {/* Twilight tick marks */}
        {markers.map((m) => {
          const t = (m.t - sun.sunrise) / dur;
          const a = Math.max(-0.15, Math.min(1.15, t)) * 180;
          const x = cx - Math.cos((a * Math.PI) / 180) * r;
          const y = cy - Math.sin((a * Math.PI) / 180) * r;
          return (
            <g key={m.name}>
              <circle cx={x} cy={y} r="2.5" fill={m.color} opacity="0.85" />
            </g>
          );
        })}

        {/* Sun glow & sun */}
        {prog >= 0 && prog <= 1 && (
          <>
            <circle cx={sunX} cy={sunY} r="22" fill="url(#sunGlow)" />
            <circle cx={sunX} cy={sunY} r="8" fill="#fef3c7" style={{ filter: "drop-shadow(0 0 12px #ffb347)" }} />
          </>
        )}

        {/* Labels */}
        <text x="50" y="180" fill="var(--slate-blue)" fontSize="9" fontFamily="DM Mono" textAnchor="middle">
          {fmtTime(sun.sunrise, tz)}
        </text>
        <text x="250" y="180" fill="var(--gold-cream)" fontSize="9" fontFamily="DM Mono" textAnchor="middle">
          NOON {fmtTime(sun.solarNoon, tz)}
        </text>
        <text x="450" y="180" fill="var(--slate-blue)" fontSize="9" fontFamily="DM Mono" textAnchor="middle">
          {fmtTime(sun.sunset, tz)}
        </text>
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="num text-base" style={{ color: "var(--gold-cream)" }}>
            {Math.floor(astro.sun.dayLengthSec / 3600)}h {Math.floor((astro.sun.dayLengthSec % 3600) / 60)}m
          </div>
          <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>Daylight</div>
        </div>
        <div>
          <div className="num text-base" style={{ color: "var(--gold-cream)" }}>{Math.round(prog * 100)}%</div>
          <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>Through Day</div>
        </div>
        <div>
          <div className="num text-base" style={{ color: "var(--gold-cream)" }}>{sun.altitudeNow.toFixed(0)}°</div>
          <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>Sun Altitude</div>
        </div>
      </div>
    </div>
  );
}
