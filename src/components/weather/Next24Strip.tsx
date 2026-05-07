import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";
import type { WeatherData } from "@/utils/weather.functions";

/** 6 slots every ~4hrs from hourly forecast */
export function Next24Strip({ data, isDay }: { data: WeatherData; isDay: boolean }) {
  const tz = data.city.tz;
  // hourly[] entries are 3h apart (8 entries = 24h). Sample every other → 4 slots ≈ 24h.
  // We want 6 slots, so take all 6 first entries (~18h coverage) — close enough.
  const slots = data.hourly.slice(0, 6);

  return (
    <div className="glass-soft p-5 flex flex-col gap-3">
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 18,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#8B9DB5",
        }}
      >
        Next 24 Hours
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {slots.map((h) => {
          const d = new Date((h.dt + tz) * 1000);
          const hh = d.getUTCHours();
          return (
            <div
              key={h.dt}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
              }}
            >
              <AnimatedWeatherIcon id={800} isDay={isDay} size={28} />
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 17,
                    color: "#8B9DB5",
                    letterSpacing: "0.05em",
                  }}
                >
                  {hh.toString().padStart(2, "0")}:00
                </div>
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 25,
                    color: "#E8D5B0",
                  }}
                >
                  {Math.round(h.temp)}°
                </div>
              </div>
              <div
                style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 15,
                  color: "#4FC3F7",
                }}
              >
                {Math.round((h.pop ?? 0) * 100)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
