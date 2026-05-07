import { Sunrise, Sunset, Wind } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { fmtTime, isDayNow } from "@/lib/weather-utils";
import type { WeatherData } from "@/utils/weather.functions";
import { UVCard } from "./UVCard";
import { UVTimeline } from "./UVTimeline";
import { Next24Strip } from "./Next24Strip";

function compass(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function windDescriptor(speed: number): string {
  if (speed < 1.5) return "Calm";
  if (speed < 3.3) return "Light breeze";
  if (speed < 7.9) return "Moderate breeze";
  if (speed < 13.8) return "Strong breeze";
  if (speed < 20.7) return "Strong wind";
  return "Gale";
}

export function RightPanel({ data }: { data: WeatherData }) {
  const { current, hourly } = data;
  const isDay = isDayNow(current.sunrise, current.sunset, current.dt);

  const sunProg = Math.max(0, Math.min(1, (current.dt - current.sunrise) / (current.sunset - current.sunrise)));
  const arcAngle = sunProg * 180;
  const cx = 110;
  const cy = 90;
  const r = 80;
  const sunX = cx - Math.cos((arcAngle * Math.PI) / 180) * r;
  const sunY = cy - Math.sin((arcAngle * Math.PI) / 180) * r;

  const windData = hourly.map((h) => ({ v: h.wind, dt: h.dt }));
  const windDir = compass(current.wind_deg);
  const windDesc = windDescriptor(current.wind_speed);

  return (
    <div className="flex h-full flex-col gap-5 stagger">
      {/* Wind chart with compass */}
      <div className="glass-soft glass-hover p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5" color="var(--cond)" strokeWidth={1.6} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5 }}>
              Wind Status
            </span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 25, color: "#fff" }}>
            {current.wind_speed.toFixed(1)} <span style={{ fontSize: 15, opacity: 0.5 }}>m/s</span>
          </span>
        </div>
        <div className="mt-2 h-[80px] -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={windData}>
              <defs>
                <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cond)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--cond)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: "var(--cond)", strokeWidth: 1, opacity: 0.5 }}
                contentStyle={{
                  background: "rgba(13,13,15,0.92)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  fontSize: 17,
                  backdropFilter: "blur(20px)",
                }}
                labelStyle={{ display: "none" }}
                formatter={(v: number) => [`${v.toFixed(2)} m/s`, "Wind"]}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--cond)"
                strokeWidth={1.4}
                fill="url(#windGrad)"
                dot={false}
                isAnimationActive
                animationDuration={1800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compass rose */}
        <div className="mt-3 flex items-center gap-3">
          <svg width={44} height={44} viewBox="0 0 44 44">
            <circle cx={22} cy={22} r={20} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <circle cx={22} cy={22} r={20} fill="none" stroke="var(--cond)" strokeWidth={0.5} opacity={0.4} />
            <text x={22} y={8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="DM Sans">N</text>
            <text x={22} y={42} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={8} fontFamily="DM Sans">S</text>
            <text x={4} y={24} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={8} fontFamily="DM Sans">W</text>
            <text x={40} y={24} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={8} fontFamily="DM Sans">E</text>
            <g style={{ transformOrigin: "22px 22px", transform: `rotate(${current.wind_deg}deg)`, transition: "transform 1s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
              <line x1={22} y1={22} x2={22} y2={9} stroke="var(--cond)" strokeWidth={1.6} strokeLinecap="round" />
              <circle cx={22} cy={9} r={2} fill="var(--cond)" />
            </g>
            <circle cx={22} cy={22} r={1.8} fill="rgba(255,255,255,0.6)" />
          </svg>
          <div className="flex flex-col">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: "#fff", letterSpacing: "0.05em" }}>{windDir}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, opacity: 0.5 }}>{windDesc}</span>
          </div>
        </div>
      </div>

      {/* Sunrise / Sunset arc */}
      <div className="glass-soft glass-hover p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" style={{ opacity: 0.7 }}>
            <Sunrise className="h-3.5 w-3.5" color="var(--cond)" strokeWidth={1.4} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.7 }}>Sunrise</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ opacity: 0.7 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.22em", textTransform: "uppercase" }}>Sunset</span>
            <Sunset className="h-3.5 w-3.5" color="var(--cond)" strokeWidth={1.4} />
          </div>
        </div>

        <svg viewBox="0 0 220 110" className="mx-auto mt-1 w-full">
          <defs>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--cond)" stopOpacity={0.5} />
              <stop offset="50%" stopColor="var(--cond)" />
              <stop offset="100%" stopColor="var(--cond)" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="2 4" />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth={1.5}
            strokeDasharray={`${(arcAngle / 180) * 251} 251`}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 8px var(--cond-soft))", transition: "stroke-dasharray 1s ease" }}
          />
          <circle cx={sunX} cy={sunY} r={5} fill="var(--cond)" style={{ filter: "drop-shadow(0 0 12px var(--cond))", transition: "cx 1s var(--ease-luxury), cy 1s var(--ease-luxury)" }} />
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
        </svg>

        <div className="-mt-1 flex justify-between" style={{ fontFamily: "'DM Mono', monospace", fontSize: 25, color: "#fff" }}>
          <span>{fmtTime(current.sunrise, data.city.tz)}</span>
          <span>{fmtTime(current.sunset, data.city.tz)}</span>
        </div>
      </div>

      {/* Cloud cover */}
      <div className="glass-soft glass-hover p-4">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5 }}>Cloud Cover</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 25, color: "#fff" }}>
            {current.clouds}<span style={{ fontSize: 15, opacity: 0.5 }}>%</span>
          </span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full"
            style={{ width: `${current.clouds}%`, background: "var(--cond)", boxShadow: "0 0 12px var(--cond-soft)", transition: "width 1.5s ease-out" }}
          />
        </div>
      </div>

      <UVCard clouds={current.clouds} conditionId={current.weather.id} isDay={isDay} />
      <UVTimeline data={data} />
      <Next24Strip data={data} isDay={isDay} />
    </div>
  );
}
