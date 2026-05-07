import type { AstronomyData } from "@/utils/astronomy.functions";
import { fmtTime } from "@/lib/weather-utils";

export function TwilightTimeline({ astro, tz, now }: { astro: AstronomyData; tz: number; now: number }) {
  const { sun } = astro;

  // Build a 24h timeline starting from civilDawn-1h
  const startOfDay = sun.civilDawn - 3600 * 2;
  const endOfDay = startOfDay + 86400;
  const span = endOfDay - startOfDay;

  const phases = [
    { name: "Night", start: startOfDay, end: sun.nightEnd, color: "#0a0e1a" },
    { name: "Astronomical", start: sun.nightEnd, end: sun.nauticalDawn, color: "#1a2440" },
    { name: "Nautical", start: sun.nauticalDawn, end: sun.civilDawn, color: "#2a3a6e" },
    { name: "Civil", start: sun.civilDawn, end: sun.sunrise, color: "#5b6dba" },
    { name: "Day", start: sun.sunrise, end: sun.sunset, color: "#ffb347" },
    { name: "Civil", start: sun.sunset, end: sun.civilDusk, color: "#5b6dba" },
    { name: "Nautical", start: sun.civilDusk, end: sun.nauticalDusk, color: "#2a3a6e" },
    { name: "Astronomical", start: sun.nauticalDusk, end: sun.nightStart, color: "#1a2440" },
    { name: "Night", start: sun.nightStart, end: endOfDay, color: "#0a0e1a" },
  ];

  const nowPct = ((now - startOfDay) / span) * 100;

  return (
    <div className="glass-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>Twilight Timeline</span>
        <span className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--gold-cream)" }}>
          24h cycle
        </span>
      </div>

      <div className="relative h-12 w-full overflow-hidden rounded-lg" style={{ background: "#0a0e1a" }}>
        {phases.map((p, i) => {
          const left = Math.max(0, ((p.start - startOfDay) / span) * 100);
          const width = Math.max(0, ((p.end - p.start) / span) * 100);
          if (width <= 0) return null;
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: p.color,
                opacity: 0.85,
              }}
              title={`${p.name}: ${fmtTime(p.start, tz)} → ${fmtTime(p.end, tz)}`}
            />
          );
        })}
        {/* NOW indicator */}
        {nowPct >= 0 && nowPct <= 100 && (
          <div
            className="absolute top-0 h-full w-0.5"
            style={{
              left: `${nowPct}%`,
              background: "var(--gold-cream)",
              boxShadow: "0 0 8px var(--gold-cream)",
              transition: "left 1.4s var(--ease-luxury)",
            }}
          >
            <div
              className="absolute -top-1 -left-1 h-2 w-2 rounded-full"
              style={{ background: "var(--gold-cream)", boxShadow: "0 0 12px var(--gold-cream)" }}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[14px]">
        <Item color="#5b6dba" label="Civil twilight" time={`${fmtTime(sun.civilDawn, tz)} / ${fmtTime(sun.civilDusk, tz)}`} />
        <Item color="#2a3a6e" label="Nautical" time={`${fmtTime(sun.nauticalDawn, tz)} / ${fmtTime(sun.nauticalDusk, tz)}`} />
        <Item color="#1a2440" label="Astronomical" time={`${fmtTime(sun.nightEnd, tz)} / ${fmtTime(sun.nightStart, tz)}`} />
        <Item color="#ffb347" label="Daylight" time={`${fmtTime(sun.sunrise, tz)} → ${fmtTime(sun.sunset, tz)}`} />
      </div>
    </div>
  );
}

function Item({ color, label, time }: { color: string; label: string; time: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: color }} />
      <div className="min-w-0">
        <div className="uppercase tracking-[0.15em]" style={{ color: "var(--slate-blue)" }}>{label}</div>
        <div className="num text-[14px]" style={{ color: "var(--gold-cream)" }}>{time}</div>
      </div>
    </div>
  );
}
