import { Droplets, Wind, Eye, Gauge } from "lucide-react";
import { CountUp } from "./CountUp";
import { CityLore } from "./CityLore";
import { CityNews } from "./CityNews";
import { WeatherSnapshot } from "./WeatherSnapshot";
import { HourlyStrip } from "./HourlyStrip";
import { aqiLabel } from "@/lib/weather-utils";
import type { WeatherData } from "@/utils/weather.functions";

export function LeftPanel({ data, isDay }: { data: WeatherData; isDay: boolean }) {
  const { current, aqi } = data;
  const aqiInfo = aqiLabel(aqi.aqi);

  return (
    <div className="flex h-full flex-col gap-6 stagger">
      {/* Weather snapshot card */}
      <WeatherSnapshot data={data} />

      {/* Hero temp */}
      <div className="space-y-1.5 animate-breathe">
        <div className="flex items-start gap-2">
          <CountUp
            value={Math.round(current.temp)}
            className="num text-white"
            style={{ fontSize: 134, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.04em" }}
          />
          <span className="num text-white/60 mt-2" style={{ fontSize: 50 }}>°</span>
          <div className="ml-2 mt-3 flex flex-col" style={{ fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8B9DB5" }}>
            <span>feels</span>
            <span className="num text-white/90 mt-0.5" style={{ fontSize: 45, fontWeight: 300, letterSpacing: "normal" }}>
              {Math.round(current.feels)}°
            </span>
          </div>
        </div>
        <div style={{ fontSize: 18, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8B9DB5" }}>
          {data.city.name} · {data.city.country}
        </div>
      </div>

      {/* Hourly strip — fills the gap */}
      <HourlyStrip data={data} isDay={isDay} />

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Droplets className="h-4 w-4" strokeWidth={1.5} />} label="Humidity" value={current.humidity} suffix="%" />
        <Stat icon={<Wind className="h-4 w-4" strokeWidth={1.5} />} label="Wind" value={current.wind_speed} suffix=" m/s" decimals={1} />
        <Stat icon={<Gauge className="h-4 w-4" strokeWidth={1.5} />} label="Pressure" value={current.pressure} suffix=" hPa" />
        <Stat icon={<Eye className="h-4 w-4" strokeWidth={1.5} />} label="Visibility" value={current.visibility / 1000} suffix=" km" decimals={1} />
      </div>

      {/* AQI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div style={{ fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase", color: "#8B9DB5" }}>Air Quality</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: aqiInfo.color, letterSpacing: "0.05em" }}>
            {aqiInfo.label}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-700"
              style={{
                background:
                  i <= aqiInfo.level ? aqiInfo.color : "oklch(1 0 0 / 0.08)",
                boxShadow: i <= aqiInfo.level ? `0 0 12px ${aqiInfo.color}` : "none",
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1" style={{ fontSize: 17, color: "#8B9DB5" }}>
          <Pollutant label="PM2.5" v={aqi.pm2_5} />
          <Pollutant label="PM10" v={aqi.pm10} />
          <Pollutant label="O₃" v={aqi.o3} />
          <Pollutant label="NO₂" v={aqi.no2} />
        </div>
      </div>

      {/* City Lore + landmark */}
      <div className="pt-1">
        <CityLore name={data.city.name} country={data.city.country} />
      </div>

      {/* City Pulse — news headlines */}
      <div className="pt-1">
        <CityNews name={data.city.name} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, suffix, decimals = 0 }: {
  icon: React.ReactNode; label: string; value: number; suffix: string; decimals?: number;
}) {
  return (
    <div
      className="glass-soft glass-hover stat-card"
      style={{ padding: 18, minHeight: 100, borderRadius: 14 }}
    >
      <div className="flex items-center gap-2 text-white/65">
        <span className="stat-icon inline-flex">{icon}</span>
        <span style={{ fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8B9DB5" }}>
          {label}
        </span>
      </div>
      <div className="mt-2 num text-white" style={{ fontSize: 45, fontWeight: 300, letterSpacing: "-0.02em" }}>
        <CountUp value={value} decimals={decimals} suffix={suffix} duration={900} />
      </div>
    </div>
  );
}

function Pollutant({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="num text-white/80" style={{ fontSize: 18 }}>{v.toFixed(1)}</span>
    </div>
  );
}
