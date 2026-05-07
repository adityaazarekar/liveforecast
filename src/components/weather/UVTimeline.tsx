import { useState } from "react";
import type { WeatherData } from "@/utils/weather.functions";
import type { AstronomyData } from "@/utils/astronomy.functions";

const SKIN_TYPES = [
  { id: 1, label: "Type I", desc: "Very fair · burns immediately", baseTime: 67 },
  { id: 2, label: "Type II", desc: "Fair · burns easily", baseTime: 100 },
  { id: 3, label: "Type III", desc: "Medium · burns moderately", baseTime: 200 },
  { id: 4, label: "Type IV", desc: "Olive · burns minimally", baseTime: 300 },
  { id: 5, label: "Type V", desc: "Brown · rarely burns", baseTime: 400 },
  { id: 6, label: "Type VI", desc: "Dark · very rarely burns", baseTime: 500 },
];

function uvAtHour(hour: number, sunrise: number, sunset: number, clouds: number, isStorm: boolean): number {
  const noon = (sunrise + sunset) / 2;
  const halfDay = (sunset - sunrise) / 2;
  const tFromNoon = Math.abs(hour - noon);
  if (tFromNoon >= halfDay) return 0;
  const angle = (tFromNoon / halfDay) * (Math.PI / 2);
  let uv = 11 * Math.cos(angle);
  uv -= clouds * 0.06;
  if (isStorm) uv *= 0.3;
  return Math.max(0, Math.min(11, uv));
}

export function UVTimeline({ data, astro }: { data: WeatherData; astro?: AstronomyData | null }) {
  const [skinType, setSkinType] = useState(3);
  const skin = SKIN_TYPES.find((s) => s.id === skinType)!;

  const sunrise = astro?.sun.sunrise ?? data.current.sunrise;
  const sunset = astro?.sun.sunset ?? data.current.sunset;
  const isStorm = data.current.weather.id < 700 && data.current.weather.id >= 200;

  // 24 hours starting from sunrise - 2h
  const startHour = sunrise - 7200;
  const hours = Array.from({ length: 24 }, (_, i) => {
    const t = startHour + i * 3600;
    const uv = uvAtHour(t, sunrise, sunset, data.current.clouds, isStorm);
    return { t, uv };
  });

  const nowHour = data.current.dt;
  const nowUv = uvAtHour(nowHour, sunrise, sunset, data.current.clouds, isStorm);
  const burnTimeMin = nowUv > 0 ? Math.round(skin.baseTime / nowUv) : 999;

  const peakUv = Math.max(...hours.map((h) => h.uv));
  const peakHour = hours.find((h) => h.uv === peakUv)!;

  const W = 600;
  const H = 100;
  const xFor = (i: number) => (i / 23) * W;
  const yFor = (uv: number) => H - (uv / 11) * H;

  const path = hours
    .map((h, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(h.uv)}`)
    .join(" ");
  const fill = `${path} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div className="glass-soft p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>UV Exposure Timeline</span>
        <div className="flex items-center gap-2">
          <span className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>Skin</span>
          <div className="flex gap-1">
            {SKIN_TYPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSkinType(s.id)}
                className="h-6 w-6 rounded-full text-[14px] font-medium transition-all duration-300"
                style={{
                  background: skinType === s.id ? "var(--gold-cream)" : "rgba(255,255,255,0.06)",
                  color: skinType === s.id ? "#0d0d0f" : "var(--slate-blue)",
                  boxShadow: skinType === s.id ? "0 0 10px rgba(232,213,176,0.4)" : "none",
                  transform: skinType === s.id ? "scale(1.1)" : "scale(1)",
                }}
                title={`${s.label} — ${s.desc}`}
              >
                {s.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
        <defs>
          <linearGradient id="uvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#f87171" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#fb923c" stopOpacity="0.3" />
            <stop offset="85%" stopColor="#facc15" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="uvStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="40%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>
        {/* Threshold lines */}
        {[3, 6, 8, 11].map((thr) => (
          <line key={thr} x1="0" y1={yFor(thr)} x2={W} y2={yFor(thr)}
            stroke="rgba(139,157,181,0.12)" strokeWidth="0.5" strokeDasharray="2 4" />
        ))}
        <path d={fill} fill="url(#uvFill)" />
        <path d={path} fill="none" stroke="url(#uvStroke)" strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 4px rgba(251,146,60,0.5))" }} />

        {/* Now marker */}
        {(() => {
          const idx = hours.findIndex((h, i) => i < hours.length - 1 && nowHour < hours[i + 1].t);
          if (idx < 0) return null;
          const x = xFor(idx);
          const y = yFor(nowUv);
          return (
            <g>
              <line x1={x} y1="0" x2={x} y2={H} stroke="var(--gold-cream)" strokeWidth="1" strokeDasharray="2 3" />
              <circle cx={x} cy={y} r="4" fill="var(--gold-cream)" style={{ filter: "drop-shadow(0 0 6px var(--gold-cream))" }} />
            </g>
          );
        })()}

        {/* X labels */}
        {[0, 6, 12, 18, 23].map((i) => {
          const d = new Date((hours[i].t + data.city.tz) * 1000);
          const h = d.getUTCHours();
          return (
            <text key={i} x={xFor(i)} y={H + 16} fontSize="9" fontFamily="DM Mono"
              fill="var(--slate-blue)" textAnchor="middle">
              {h.toString().padStart(2, "0")}
            </text>
          );
        })}
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="num text-base" style={{ color: nowUv > 6 ? "var(--coral)" : "var(--gold-cream)" }}>
            {nowUv.toFixed(1)}
          </div>
          <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>Now</div>
        </div>
        <div>
          <div className="num text-base" style={{ color: "var(--gold-cream)" }}>
            {peakUv.toFixed(1)}
          </div>
          <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>
            Peak {(() => {
              const d = new Date((peakHour.t + data.city.tz) * 1000);
              return `${d.getUTCHours()}:00`;
            })()}
          </div>
        </div>
        <div>
          <div className="num text-base" style={{ color: burnTimeMin < 30 ? "var(--coral)" : "var(--mint)" }}>
            {burnTimeMin > 240 ? "240+" : burnTimeMin}m
          </div>
          <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>
            Burn · {skin.label}
          </div>
        </div>
      </div>
    </div>
  );
}
