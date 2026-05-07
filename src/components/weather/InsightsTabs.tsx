import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { WeatherData } from "@/utils/weather.functions";
import { getAstronomy, type AstronomyData } from "@/utils/astronomy.functions";
import { aqiLabel } from "@/lib/weather-utils";
import { CountUp } from "./CountUp";
import { motion, AnimatePresence } from "framer-motion";

import { SolarArc } from "./astronomy/SolarArc";
import { GoldenHour } from "./astronomy/GoldenHour";
import { MoonDeepDive } from "./astronomy/MoonDeepDive";
import { PlanetGrid } from "./astronomy/PlanetGrid";
import { TwilightTimeline } from "./astronomy/TwilightTimeline";
import { WindRose } from "./WindRose";
import { UVTimeline } from "./UVTimeline";
import { ForecastTab } from "./tabs/ForecastTab";
import { AlertsTab } from "./tabs/AlertsTab";
import { CompareTab } from "./tabs/CompareTab";

import { lazy, Suspense } from "react";
const RadarTab = lazy(() =>
  import("./tabs/RadarTab").then((m) => ({ default: m.RadarTab })),
);

const TABS = ["Forecast", "Alerts", "Air", "Atmosphere", "Astronomy", "Radar", "Compare"] as const;
type Tab = (typeof TABS)[number];

export function InsightsTabs({ data }: { data: WeatherData }) {
  const [tab, setTab] = useState<Tab>("Forecast");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // Load astronomy when needed
  const fetchAstro = useServerFn(getAstronomy);
  const [astro, setAstro] = useState<AstronomyData | null>(null);
  useEffect(() => {
    let active = true;
    setAstro(null);
    fetchAstro({ data: { lat: data.city.lat, lon: data.city.lon } })
      .then((r) => { if (active) setAstro(r); })
      .catch(() => {});
    return () => { active = false; };
  }, [data.city.lat, data.city.lon, fetchAstro]);

  useEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <div className="glass p-4 sm:p-6">
      <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-display text-xl sm:text-2xl" style={{ color: "var(--gold-cream)" }}>
          Insights <span className="text-italic" style={{ color: "var(--slate-blue)" }}>·</span>{" "}
          <span className="text-italic" style={{ color: "rgba(255,255,255,0.75)" }}>{tab.toLowerCase()}</span>
        </h2>
        {/* Scrollable tab bar — no wrapping, pills slide left/right on mobile */}
        <div className="relative">
          <div
            className="flex gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 overflow-x-auto"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {TABS.map((t) => (
              <button
                key={t}
                ref={(el) => { tabRefs.current[t] = el; }}
                onClick={() => setTab(t)}
                className={`relative z-10 px-3 py-1.5 text-[11px] sm:text-[13px] uppercase tracking-[0.15em] font-medium transition-colors duration-200 whitespace-nowrap shrink-0 rounded-full ${
                  tab === t ? "text-[#0d0d0f]" : "text-white/60 hover:text-white/85"
                }`}
              >
                {t}
              </button>
            ))}
            <span
              className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: indicator.left,
                width: indicator.width,
                background: "var(--gold-cream)",
                boxShadow: "0 0 14px rgba(232,213,176,0.4)",
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "Forecast" && <ForecastTab data={data} />}
          {tab === "Alerts" && <AlertsTab data={data} />}
          {tab === "Air" && <AirQuality data={data} />}
          {tab === "Atmosphere" && <AtmosphereTab data={data} astro={astro} />}
          {tab === "Astronomy" && <AstronomyTab data={data} astro={astro} />}
          {tab === "Radar" && (
            <Suspense fallback={<div className="grid place-items-center py-12 text-white/40 text-sm">Loading radar…</div>}>
              <RadarTab data={data} />
            </Suspense>
          )}
          {tab === "Compare" && <CompareTab baseData={data} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Air Quality (kept) ---------------- */

function AirQuality({ data }: { data: WeatherData }) {
  const aqi = data.aqi;
  const info = aqiLabel(aqi.aqi);
  const pct = aqi.aqi / 5;
  const arcLen = 220 * pct;
  const gaugeColor = aqiColorHex(aqi.aqi);

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <div className="flex flex-col items-center gap-3">
        <p className="text-italic text-center text-base" style={{ color: "rgba(255,255,255,0.85)" }}>
          How clean is the air right now?
        </p>
        <div className="relative h-[200px] w-[200px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-[135deg]">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)"
              strokeWidth="8" strokeDasharray="220 360" strokeLinecap="round" />
            <circle cx="60" cy="60" r="48" fill="none" stroke={gaugeColor}
              strokeWidth="8" strokeDasharray={`${arcLen} 360`} strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${gaugeColor})`,
                transition: "stroke-dasharray 1.4s var(--ease-luxury)",
              }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="num text-5xl" style={{ color: "var(--gold-cream)" }}>
              <CountUp value={aqi.aqi} duration={1200} />
            </div>
            <div className="label-mini mt-1" style={{ color: "var(--slate-blue)" }}>AQI Index</div>
            <div className="mt-1 text-[17px] font-medium" style={{ color: gaugeColor }}>{info.label}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Pollutant label="PM2.5" value={aqi.pm2_5} unit="µg/m³" />
        <Pollutant label="PM10" value={aqi.pm10} unit="µg/m³" />
        <Pollutant label="O₃" value={aqi.o3} unit="µg/m³" />
        <Pollutant label="NO₂" value={aqi.no2} unit="µg/m³" />
        <Pollutant label="SO₂" value={aqi.so2} unit="µg/m³" />
        <Pollutant label="CO" value={aqi.co / 100} unit="mg/m³" decimals={2} />
      </div>
    </div>
  );
}

function Pollutant({ label, value, unit, decimals = 1 }: { label: string; value: number; unit: string; decimals?: number }) {
  return (
    <div className="glass-soft glass-hover stat-card px-4 py-3">
      <div className="label-mini" style={{ color: "var(--slate-blue)" }}>{label}</div>
      <div className="mt-1 num text-xl" style={{ color: "var(--gold-cream)" }}>
        <CountUp value={value} decimals={decimals} duration={900} />
      </div>
      <div className="text-[14px] font-light" style={{ color: "var(--slate-blue)", opacity: 0.7 }}>{unit}</div>
    </div>
  );
}

/* ---------------- Atmosphere — now with Wind Rose + UV Timeline ---------------- */

function AtmosphereTab({ data, astro }: { data: WeatherData; astro: AstronomyData | null }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <WindRose data={data} />
        <UVTimeline data={data} astro={astro} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Humidity" value={data.current.humidity} suffix="%" />
        <MetricCard label="Pressure" value={data.current.pressure} suffix=" hPa" />
        <MetricCard label="Visibility" value={data.current.visibility / 1000} decimals={1} suffix=" km" />
        <MetricCard label="Cloud cover" value={data.current.clouds} suffix="%" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, suffix = "", decimals = 0 }: { label: string; value: number; suffix?: string; decimals?: number }) {
  return (
    <div className="glass-soft glass-hover p-4">
      <div className="label-mini" style={{ color: "var(--slate-blue)" }}>{label}</div>
      <div className="num text-2xl mt-1" style={{ color: "var(--gold-cream)" }}>
        <CountUp value={value} decimals={decimals} suffix={suffix} duration={1000} />
      </div>
    </div>
  );
}

/* ---------------- Astronomy — full deep-dive ---------------- */

function AstronomyTab({ data, astro }: { data: WeatherData; astro: AstronomyData | null }) {
  if (!astro) {
    return (
      <div className="grid place-items-center py-12 text-white/40 text-sm">
        Loading celestial data…
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <SolarArc astro={astro} tz={data.city.tz} now={data.current.dt} />
      <GoldenHour astro={astro} tz={data.city.tz} now={data.current.dt} />
      <TwilightTimeline astro={astro} tz={data.city.tz} now={data.current.dt} />
      <MoonDeepDive astro={astro} tz={data.city.tz} />
      <PlanetGrid astro={astro} />
    </div>
  );
}

function aqiColorHex(aqi: number): string {
  switch (aqi) {
    case 1: return "#4ade80";
    case 2: return "#a3e635";
    case 3: return "#facc15";
    case 4: return "#fb923c";
    case 5: return "#f87171";
    default: return "#9ca3af";
  }
}
