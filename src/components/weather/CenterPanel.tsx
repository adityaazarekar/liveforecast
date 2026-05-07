import { CalendarDays } from "lucide-react";
import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";
import { CityHero } from "./CityHero";
import { TemperatureArcPanel } from "./TemperatureArcPanel";
import { HourlyHeatmap } from "./HourlyHeatmap";
import { PrecipWaterfall } from "./PrecipWaterfall";
import { WeeklyTable } from "./WeeklyTable";
import { headlineFor, fmtFullDate } from "@/lib/weather-utils";
import type { WeatherData } from "@/utils/weather.functions";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMoodLine } from "@/utils/cityInsight.functions";

export function CenterPanel({ data, isDay }: { data: WeatherData; isDay: boolean }) {
  const headline = headlineFor(data.current.weather.id, data.current.weather.description);
  const [hl1, hl2] = splitHeadline(headline);

  const days = data.daily.slice(0, 7);

  // Mood line
  const fetchMood = useServerFn(getMoodLine);
  const [mood, setMood] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setMood(null);
    fetchMood({ data: { city: data.city.name, condition: data.current.weather.description, temp: data.current.temp } })
      .then((r) => { if (active) setMood(r.mood); })
      .catch(() => {});
    return () => { active = false; };
  }, [data.city.name, data.current.weather.description, data.current.temp, fetchMood]);

  return (
    <div className="flex h-full flex-col gap-7 stagger">
      {/* HERO city + live time */}
      <CityHero name={data.city.name} country={data.city.country} tz={data.city.tz} />

      {/* Big condition + animated icon */}
      <div className="flex items-start justify-between gap-4 pl-1">
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 17, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
            Weather Forecast
          </div>
          <h2
            className="text-display text-white"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 95,
              fontWeight: 300,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            <span className="text-italic">{hl1}</span>
            {hl2 && (
              <>
                <br />
                <span className="text-white/85 text-italic">{hl2}</span>
              </>
            )}
          </h2>
          {mood && (
            <p
              key={mood}
              className="mt-3 text-italic max-w-xl animate-fade-in"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 22,
                fontWeight: 400,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                transition: "opacity 0.4s ease",
              }}
            >
              {mood}
            </p>
          )}
        </div>
        <div className="shrink-0 animate-float">
          <AnimatedWeatherIcon id={data.current.weather.id} isDay={isDay} size={160} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: "var(--slate-blue)" }}>
          <CalendarDays className="h-4 w-4" strokeWidth={1.4} />
          <span style={{ fontWeight: 300 }}>
            {fmtFullDate(data.current.dt, data.city.tz)} · Local time
          </span>
        </div>
        <p className="max-w-xl" style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, lineHeight: 1.8, color: "rgba(255,255,255,0.7)", fontWeight: 300 }}>
          <span className="num" style={{ color: "var(--gold-cream)" }}>{Math.round(data.current.temp)}°</span>
          {" "} with {data.current.weather.description}. High of{" "}
          <span className="num" style={{ color: "var(--gold-cream)" }}>{Math.round(days[0]?.max ?? 0)}°</span>, low of{" "}
          <span className="num" style={{ color: "var(--sky)" }}>{Math.round(days[0]?.min ?? 0)}°</span>.
          Wind from{" "}
          <span className="num" style={{ color: "var(--gold-cream)" }}>{compass(data.current.wind_deg)}</span> at{" "}
          <span className="num" style={{ color: "var(--gold-cream)" }}>{data.current.wind_speed.toFixed(1)} m/s</span>.
        </p>
      </div>

      {/* ─── 3 INSIGHT ROWS (Phase 1) ─── */}
      <div className="flex flex-col gap-4">
        <TemperatureArcPanel data={data} />
        <HourlyHeatmap data={data} />
        <PrecipWaterfall data={data} />
      </div>

      {/* 7-day forecast — full table */}
      <WeeklyTable data={data} isDay={isDay} />
    </div>
  );
}

function splitHeadline(s: string): [string, string?] {
  const words = s.split(" ");
  if (words.length <= 2) return [s];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function compass(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}
