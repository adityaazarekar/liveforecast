import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function tzNameFromOffsetSeconds(offsetSec: number): string {
  // Best-effort IANA tz approximation by offset (only used for label fallback).
  const offsetH = offsetSec / 3600;
  const sign = offsetH >= 0 ? "+" : "-";
  const abs = Math.abs(offsetH);
  const hh = Math.floor(abs).toString().padStart(2, "0");
  const mm = Math.round((abs % 1) * 60).toString().padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

export function CityHero({
  name,
  country,
  tz,
  temp,
}: {
  name: string;
  country: string;
  tz: number; // seconds offset from UTC
  temp?: number;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute "now" in city local time using offset.
  const cityNow = new Date(now.getTime() + (tz * 1000) - (now.getTimezoneOffset() * -60000) + (now.getTimezoneOffset() * 60000));
  // Simpler: derive UTC ms then add offset
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + tz * 1000);

  const hh = String(local.getHours()).padStart(2, "0");
  const mm = String(local.getMinutes()).padStart(2, "0");
  const ss = String(local.getSeconds()).padStart(2, "0");

  const dayName = local.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = local.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const tzLabel = tzNameFromOffsetSeconds(tz);

  // Avoid TS unused warning for cityNow (kept for readability)
  void cityNow;

  return (
    <motion.div
      key={`${name}-${country}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-between items-start"
    >
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <MapPin className="h-6 w-6 lg:h-7 lg:w-7 text-[var(--cond)] mt-2 shrink-0" strokeWidth={1.5} />
          <h1
            className="text-hero text-white"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(3.5rem, 7.5vw, 88px)",
              fontWeight: 200,
              letterSpacing: "-3px",
              lineHeight: 0.95,
            }}
          >
            {name}
            <span
              className="text-white/45 ml-4 not-italic"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.75rem, 3.5vw, 44px)",
                fontWeight: 300,
                letterSpacing: "-1px",
              }}
            >
              {country}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 pl-10">
          <span
            className="num text-white/95"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "clamp(2rem, 3.5vw, 48px)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
            }}
          >
            {hh}:{mm}<span className="text-white/55">:{ss}</span>
          </span>
          <span className="text-white/55 font-light" style={{ fontSize: "15px", letterSpacing: "0.02em" }}>
            {dayName}, {monthDay} · {tzLabel}
          </span>
        </div>
      </div>
      
      {temp !== undefined && (
        <div
          className="text-hero text-white"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(3.5rem, 7.5vw, 88px)",
            fontWeight: 200,
            letterSpacing: "-3px",
            lineHeight: 0.95,
          }}
        >
          {Math.round(temp)}°
        </div>
      )}
    </motion.div>
  );
}
