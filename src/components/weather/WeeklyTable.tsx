import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";
import type { WeatherData } from "@/utils/weather.functions";

export function WeeklyTable({ data, isDay }: { data: WeatherData; isDay: boolean }) {
  const tz = data.city.tz;
  const days = data.daily.slice(0, 7);
  const avgWind =
    data.hourly.length > 0
      ? data.hourly.reduce((a, h) => a + h.wind, 0) / data.hourly.length
      : data.current.wind_speed;

  return (
    <div className="glass-soft" style={{ padding: "16px 12px", borderRadius: 16 }}>
      <div
        className="mb-3 px-2"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8B9DB5",
        }}
      >
        7-Day Outlook
      </div>
      <div className="flex flex-col gap-1">
        {days.map((d, i) => {
          const date = new Date((d.dt + tz) * 1000);
          const dayName = i === 0
            ? "Today"
            : date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
          const dayShort = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
          return (
            <div
              key={d.dt}
              className="flex items-center gap-2 px-2 py-2.5 rounded-lg"
              style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                borderLeft: i === 0 ? "2px solid #4FC3F7" : "2px solid transparent",
              }}
            >
              {/* Day name */}
              <div className="flex flex-col min-w-[52px]">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.92)" }}>
                  {dayName}
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8B9DB5" }}>
                  {dayShort}
                </span>
              </div>

              {/* Icon */}
              <AnimatedWeatherIcon id={d.weather.id} isDay={isDay} size={28} />

              {/* Temps */}
              <div className="flex items-baseline gap-1 min-w-[72px]">
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: "#E8D5B0", fontWeight: 400 }}>
                  {Math.round(d.max)}°
                </span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: "#8B9DB5" }}>
                  {Math.round(d.min)}°
                </span>
              </div>

              {/* Condition description — truncated */}
              <div className="flex-1 min-w-0 hidden sm:block">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8B9DB5" }}
                  className="block truncate">
                  {d.weather.description}
                </span>
              </div>

              {/* Rain chance */}
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: "#4FC3F7", minWidth: 36, textAlign: "right" }}>
                {Math.round((d.pop ?? 0) * 100)}%
              </div>

              {/* Wind — hidden on smallest screens */}
              <div className="hidden xs:block" style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: "#8B9DB5", minWidth: 44, textAlign: "right" }}>
                {avgWind.toFixed(1)}<span style={{ fontSize: 11, marginLeft: 2 }}>m/s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
