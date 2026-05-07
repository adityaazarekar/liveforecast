import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";
import type { WeatherData } from "@/utils/weather.functions";

export function HourlyStrip({ data, isDay }: { data: WeatherData; isDay: boolean }) {
  const tz = data.city.tz;
  const nowDt = data.current.dt;
  const items = data.hourly.slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 18,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8B9DB5",
        }}
      >
        Hourly Forecast
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.hr-strip::-webkit-scrollbar{display:none}`}</style>
        <div className="flex gap-2 hr-strip">
          {items.map((h) => {
            const d = new Date((h.dt + tz) * 1000);
            const hh = d.getUTCHours();
            const isNow = Math.abs(h.dt - nowDt) < 5400; // within 1.5h
            return (
              <div
                key={h.dt}
                className="shrink-0 flex flex-col items-center justify-between"
                style={{
                  width: 72,
                  height: 110,
                  borderRadius: 14,
                  padding: "10px 6px",
                  background: "rgba(255,255,255,0.04)",
                  border: isNow ? "1.5px solid #4FC3F7" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isNow ? "0 0 16px rgba(79,195,247,0.25)" : "none",
                  transition: "all 240ms var(--ease-luxury)",
                }}
              >
                <div
                  style={{
                    fontFamily: "DM Mono, monospace",
                    fontSize: 17,
                    color: isNow ? "#4FC3F7" : "#8B9DB5",
                    letterSpacing: "0.05em",
                  }}
                >
                  {hh.toString().padStart(2, "0")}:00
                </div>
                <AnimatedWeatherIcon id={h.temp ? 800 : 800} isDay={isDay} size={32} />
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
