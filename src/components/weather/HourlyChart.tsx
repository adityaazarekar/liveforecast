import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Zap, CloudFog, Moon } from "lucide-react";
import type { WeatherData } from "@/utils/weather.functions";
import { fmtTime, isDayNow } from "@/lib/weather-utils";

function HourlyIcon({ id, isDay, size = 14 }: { id: number; isDay: boolean; size?: number }) {
  const common = { size, strokeWidth: 1.6, color: "var(--cond)" as const };
  if (id >= 200 && id < 300) return <Zap {...common} />;
  if (id >= 300 && id < 400) return <CloudDrizzle {...common} />;
  if (id >= 500 && id < 600) return <CloudRain {...common} />;
  if (id >= 600 && id < 700) return <CloudSnow {...common} />;
  if (id >= 700 && id < 800) return <CloudFog {...common} />;
  if (id === 800) return isDay ? <Sun {...common} /> : <Moon {...common} />;
  return <Cloud {...common} />;
}

export function HourlyChart({ data }: { data: WeatherData }) {
  const isDay = isDayNow(data.current.sunrise, data.current.sunset, data.current.dt);
  const rows = data.hourly.map((h) => ({
    label: fmtTime(h.dt, data.city.tz),
    temp: Math.round(h.temp),
    pop: Math.round(h.pop * 100),
  }));

  const summary = data.hourly.slice(0, 5);

  return (
    <div className="glass-soft px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.5 }}>
          Hourly Temperature
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--cond)" }}>
          Next 24 hrs
        </span>
      </div>

      {/* Hourly summary strip */}
      <div className="mb-3 flex items-stretch justify-between rounded-lg" style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
        {summary.map((h, i) => (
          <div
            key={h.dt}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
            style={{
              borderRight: i < summary.length - 1 ? "0.5px solid rgba(255,255,255,0.07)" : undefined,
              borderBottom: i === 0 ? "1.5px solid var(--cond)" : "1.5px solid transparent",
            }}
          >
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, opacity: i === 0 ? 0.75 : 0.45 }}>
              {fmtTime(h.dt, data.city.tz)}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 25, color: i === 0 ? "#fff" : "rgba(255,255,255,0.85)" }}>
              {Math.round(h.temp)}°
            </span>
            <HourlyIcon id={data.daily[0]?.weather.id ?? data.current.weather.id} isDay={isDay} size={14} />
          </div>
        ))}
      </div>

      <div className="h-[110px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="tempArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cond)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--cond)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 17, fill: "rgba(255,255,255,0.5)", fontFamily: "DM Sans" }}
              interval={1}
            />
            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip
              cursor={{ stroke: "var(--cond)", strokeWidth: 1, opacity: 0.5 }}
              contentStyle={{
                background: "rgba(13,13,15,0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                fontSize: 17,
                backdropFilter: "blur(20px)",
              }}
              formatter={(v: number, n) => n === "temp" ? [`${v}°`, "Temp"] : [`${v}%`, "Rain"]}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="var(--cond)"
              strokeWidth={1.6}
              fill="url(#tempArea)"
              dot={{ r: 2.5, fill: "var(--cond)", strokeWidth: 0 }}
              activeDot={{ r: 4, fill: "var(--cond)", strokeWidth: 0 }}
              isAnimationActive
              animationDuration={1600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
