import type { AstronomyData } from "@/utils/astronomy.functions";
import { fmtTime } from "@/lib/weather-utils";
import { CountUp } from "../CountUp";

export function MoonDeepDive({ astro, tz }: { astro: AstronomyData; tz: number }) {
  const { moon } = astro;
  const illum = Math.cos((moon.phase - 0.5) * Math.PI * 2);

  return (
    <div className="glass-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>Lunar Detail</span>
        <span className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--gold-cream)" }}>
          {moon.phaseName}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-center">
        {/* Moon visual */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-[160px] w-[160px]">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <radialGradient id="moonSurface" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#fefae0" />
                  <stop offset="60%" stopColor="#e0d5b7" />
                  <stop offset="100%" stopColor="#a8987a" />
                </radialGradient>
                <radialGradient id="moonGlow" cx="50%" cy="50%">
                  <stop offset="50%" stopColor="rgba(232,213,176,0.4)" />
                  <stop offset="100%" stopColor="rgba(232,213,176,0)" />
                </radialGradient>
                <clipPath id="moonClip2">
                  <circle cx="50" cy="50" r="40" />
                </clipPath>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#moonGlow)" />
              <circle cx="50" cy="50" r="40" fill="#1a1a22" />
              <g clipPath="url(#moonClip2)">
                <circle cx="50" cy="50" r="40" fill="url(#moonSurface)" />
                <ellipse
                  cx={50 + illum * 30}
                  cy="50"
                  rx={40}
                  ry={40}
                  fill="#1a1a22"
                  style={{ transition: "cx 1.2s var(--ease-luxury)" }}
                />
                {/* Crater texture */}
                <circle cx="38" cy="42" r="3" fill="#a8987a" opacity="0.4" />
                <circle cx="58" cy="55" r="2" fill="#a8987a" opacity="0.35" />
                <circle cx="45" cy="62" r="2.5" fill="#a8987a" opacity="0.3" />
                <circle cx="62" cy="38" r="1.8" fill="#a8987a" opacity="0.4" />
              </g>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(232,213,176,0.18)" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="text-center">
            <div className="num text-2xl" style={{ color: "var(--gold-cream)" }}>
              <CountUp value={moon.illumination * 100} decimals={1} suffix="%" duration={1200} />
            </div>
            <div className="text-[14px] uppercase tracking-[0.2em]" style={{ color: "var(--slate-blue)" }}>Illuminated</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Moonrise" value={moon.rise ? fmtTime(moon.rise, tz) : "—"} />
          <Stat label="Moonset" value={moon.set ? fmtTime(moon.set, tz) : "—"} />
          <Stat label="Altitude" value={`${moon.altitude.toFixed(1)}°`} />
          <Stat label="Azimuth" value={`${moon.azimuth.toFixed(0)}°`} />
          <Stat label="Distance" value={`${(moon.distance / 1000).toFixed(0)}k km`} />
          <Stat label="Days to Full" value={`${moon.daysToFull}`} accent />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="px-3 py-2 rounded-lg"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="text-[14px] uppercase tracking-[0.2em]" style={{ color: "var(--slate-blue)" }}>{label}</div>
      <div className="num text-base mt-0.5" style={{ color: accent ? "var(--gold-cream)" : "rgba(255,255,255,0.92)" }}>
        {value}
      </div>
    </div>
  );
}
