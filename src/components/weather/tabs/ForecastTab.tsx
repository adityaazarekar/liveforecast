import type { WeatherData } from "@/utils/weather.functions";
import { AnimatedWeatherIcon } from "../AnimatedWeatherIcon";
import { isDayNow, fmtTime } from "@/lib/weather-utils";
import { CloudRain, Wind, Droplets } from "lucide-react";

export function ForecastTab({ data }: { data: WeatherData }) {
  const isDay = isDayNow(data.current.sunrise, data.current.sunset, data.current.dt);
  const days = data.daily.slice(0, 7);

  // Hourly breakdown for next 24h (grouped 3h)
  const hourly = data.hourly.slice(0, 8);
  const maxTemp = Math.max(...hourly.map((h) => h.temp));
  const minTemp = Math.min(...hourly.map((h) => h.temp));
  const tempRange = maxTemp - minTemp || 1;

  return (
    <div className="space-y-5">
      {/* Hourly strip */}
      <div>
        <div className="label-mini mb-3" style={{ color: "var(--slate-blue)" }}>Next 24 Hours</div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {hourly.map((h, i) => {
            const tempPct = ((h.temp - minTemp) / tempRange) * 100;
            const date = new Date((h.dt + data.city.tz) * 1000);
            const hour = date.getUTCHours();
            return (
              <div
                key={h.dt}
                className="glass-soft glass-hover p-3 text-center transition-all"
                style={{ animation: `fade-up 0.5s ${i * 0.04}s var(--ease-luxury) both` }}
              >
                <div className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>
                  {i === 0 ? "Now" : `${hour.toString().padStart(2, "0")}:00`}
                </div>
                <div className="my-2 flex justify-center">
                  <AnimatedWeatherIcon id={data.current.weather.id} isDay={isDay && hour > 6 && hour < 19} size={28} />
                </div>
                <div className="num text-xl" style={{ color: "var(--gold-cream)" }}>
                  {Math.round(h.temp)}°
                </div>
                <div className="mt-2 h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${tempPct}%`,
                      background: "var(--gold-cream)",
                      boxShadow: "0 0 6px rgba(232,213,176,0.5)",
                      transition: "width 1s var(--ease-luxury)",
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[14px]" style={{ color: "var(--sky)" }}>
                  <Droplets className="h-2.5 w-2.5" strokeWidth={1.6} />
                  <span className="num">{Math.round(h.pop * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-day detailed */}
      <div>
        <div className="label-mini mb-3" style={{ color: "var(--slate-blue)" }}>7-Day Detail</div>
        <div className="space-y-2">
          {days.map((d, i) => {
            const date = new Date((d.dt + data.city.tz) * 1000);
            const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
            const popPct = Math.round(d.pop * 100);
            return (
              <div
                key={d.dt}
                className="glass-soft glass-hover flex items-center gap-2 sm:gap-3 px-3 py-3 transition-all"
                style={{
                  animation: `fade-up 0.5s ${i * 0.05}s var(--ease-luxury) both`,
                  borderLeft: i === 0 ? `2px solid var(--gold-cream)` : "2px solid transparent",
                  borderRadius: 12,
                }}
              >
                {/* Day name */}
                <div className="flex flex-col min-w-[42px] sm:min-w-[72px]">
                  <div className="text-sm sm:text-base" style={{ color: i === 0 ? "var(--gold-cream)" : "rgba(255,255,255,0.92)", fontFamily: "var(--font-display)" }}>
                    {dayName}
                  </div>
                  <div className="text-[11px] sm:text-[13px] uppercase tracking-[0.12em]" style={{ color: "var(--slate-blue)" }}>
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                  </div>
                </div>

                {/* Icon */}
                <AnimatedWeatherIcon id={d.weather.id} isDay={true} size={30} />

                {/* Rain */}
                <div className="flex items-center gap-1 text-[13px]" style={{ color: "var(--sky)", minWidth: 36 }}>
                  <CloudRain className="h-3 w-3 shrink-0" strokeWidth={1.6} />
                  <span className="num">{popPct}%</span>
                </div>

                {/* Condition — hidden on very small */}
                <span className="text-[12px] capitalize flex-1 min-w-0 hidden sm:block truncate" style={{ color: "var(--slate-blue)" }}>
                  {d.weather.description}
                </span>

                {/* Temp range */}
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <span className="num text-xs sm:text-sm" style={{ color: "var(--sky)" }}>{Math.round(d.min)}°</span>
                  <div className="w-12 sm:w-20 h-1 rounded-full overflow-hidden hidden xs:block" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ background: "linear-gradient(to right, var(--sky), var(--gold-cream), var(--coral))", opacity: 0.85 }} />
                  </div>
                  <span className="num text-sm sm:text-base" style={{ color: "var(--gold-cream)" }}>{Math.round(d.max)}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[14px] text-center uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>
        Sunrise {fmtTime(data.current.sunrise, data.city.tz)} · Sunset {fmtTime(data.current.sunset, data.city.tz)}
      </div>
    </div>
  );
}
