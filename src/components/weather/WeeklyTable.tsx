import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";
import type { WeatherData } from "@/utils/weather.functions";

export function WeeklyTable({ data, isDay }: { data: WeatherData; isDay: boolean }) {
  const tz = data.city.tz;
  const days = data.daily.slice(0, 7);
  // We don't track per-day wind. Use current wind as a placeholder for today, hourly avg otherwise.
  const avgWind =
    data.hourly.length > 0
      ? data.hourly.reduce((a, h) => a + h.wind, 0) / data.hourly.length
      : data.current.wind_speed;

  return (
    <div
      className="glass-soft"
      style={{ padding: 24, borderRadius: 16 }}
    >
      <div
        className="mb-3"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 17,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#8B9DB5",
        }}
      >
        7-Day Outlook
      </div>
      <div className="flex flex-col">
        {days.map((d, i) => {
          const date = new Date((d.dt + tz) * 1000);
          const dayName = i === 0
            ? "Today"
            : date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
          const dayShort = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
          return (
            <div
              key={d.dt}
              className="grid items-center gap-3"
              style={{
                gridTemplateColumns: "minmax(110px,1.4fr) 44px minmax(0,2fr) 60px 60px",
                padding: "12px 14px",
                background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                borderLeft: i === 0 ? "3px solid #4FC3F7" : "3px solid transparent",
                borderRadius: 10,
              }}
            >
              <div className="flex flex-col">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.92)" }}>
                  {dayName}
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#8B9DB5" }}>
                  {dayShort}
                </span>
              </div>
              <AnimatedWeatherIcon id={d.weather.id} isDay={isDay} size={32} />
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 28, color: "#E8D5B0" }}>
                  {Math.round(d.max)}°
                </span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 22, color: "#8B9DB5" }}>
                  {Math.round(d.min)}°
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#8B9DB5", marginLeft: 8 }}>
                  {d.weather.description}
                </span>
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: "#4FC3F7", textAlign: "right" }}>
                {Math.round((d.pop ?? 0) * 100)}%
              </div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 18, color: "#8B9DB5", textAlign: "right" }}>
                {avgWind.toFixed(1)}
                <span style={{ fontSize: 14, marginLeft: 2 }}>m/s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
