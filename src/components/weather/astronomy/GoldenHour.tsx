import type { AstronomyData } from "@/utils/astronomy.functions";
import { fmtTime } from "@/lib/weather-utils";
import { Sunrise, Sunset, Camera } from "lucide-react";

export function GoldenHour({ astro, tz, now }: { astro: AstronomyData; tz: number; now: number }) {
  const { sun } = astro;
  const morningActive = now >= sun.goldenHourMorningStart && now <= sun.goldenHourMorningEnd;
  const eveningActive = now >= sun.goldenHourEveningStart && now <= sun.goldenHourEveningEnd;
  const blueActive = now >= sun.blueHourEveningStart && now <= sun.blueHourEveningEnd;

  const cards = [
    {
      title: "Morning Golden",
      icon: Sunrise,
      start: sun.goldenHourMorningStart,
      end: sun.goldenHourMorningEnd,
      color: "linear-gradient(135deg, #ffd97d 0%, #ff9a47 100%)",
      active: morningActive,
      tip: "Soft warm light · long shadows",
    },
    {
      title: "Evening Golden",
      icon: Sunset,
      start: sun.goldenHourEveningStart,
      end: sun.goldenHourEveningEnd,
      color: "linear-gradient(135deg, #ffb347 0%, #ff6b6b 100%)",
      active: eveningActive,
      tip: "Best portrait light · warm tones",
    },
    {
      title: "Blue Hour",
      icon: Camera,
      start: sun.blueHourEveningStart,
      end: sun.blueHourEveningEnd,
      color: "linear-gradient(135deg, #5b6dba 0%, #1a2440 100%)",
      active: blueActive,
      tip: "Cinematic dusk · skyline glow",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const dur = Math.max(1, c.end - c.start);
        const elapsed = Math.max(0, Math.min(dur, now - c.start));
        const prog = c.active ? (elapsed / dur) * 100 : 0;
        return (
          <div
            key={c.title}
            className="glass-soft glass-hover relative overflow-hidden p-4"
            style={c.active ? { boxShadow: "0 0 28px rgba(255,179,71,0.3)" } : {}}
          >
            <div className="absolute inset-0 opacity-[0.08]" style={{ background: c.color }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color: "var(--gold-cream)" }} strokeWidth={1.4} />
                  <span className="label-mini" style={{ color: "var(--slate-blue)" }}>{c.title}</span>
                </div>
                {c.active && (
                  <span className="text-[14px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--gold-cream)", color: "#0d0d0f" }}>
                    Now
                  </span>
                )}
              </div>
              <div className="num text-xl mb-1" style={{ color: "var(--gold-cream)" }}>
                {fmtTime(c.start, tz)}
                <span className="mx-1.5 text-xs" style={{ color: "var(--slate-blue)" }}>→</span>
                {fmtTime(c.end, tz)}
              </div>
              <div className="text-[15px] italic" style={{ color: "rgba(232,213,176,0.65)", fontFamily: "var(--font-display)" }}>
                {c.tip}
              </div>
              {c.active && (
                <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${prog}%`,
                      background: "var(--gold-cream)",
                      boxShadow: "0 0 8px rgba(232,213,176,0.7)",
                      transition: "width 1.2s var(--ease-luxury)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
