import type { AstronomyData } from "@/utils/astronomy.functions";

const PLANET_COLORS: Record<string, string> = {
  Mercury: "#b8b3a8",
  Venus: "#f5d5a3",
  Mars: "#ff7755",
  Jupiter: "#e8b87a",
  Saturn: "#dfc78a",
};

export function PlanetGrid({ astro }: { astro: AstronomyData }) {
  return (
    <div className="glass-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>Planet Visibility</span>
        <span className="text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--gold-cream)" }}>
          Live · Astronomia
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {astro.planets.map((p) => {
          const color = PLANET_COLORS[p.name] ?? "#fff";
          return (
            <div
              key={p.name}
              className="relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: p.visible ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                border: p.visible
                  ? `1px solid ${color}40`
                  : "1px solid rgba(255,255,255,0.04)",
                boxShadow: p.visible ? `0 0 18px ${color}25` : "none",
                opacity: p.visible ? 1 : 0.55,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: color,
                      boxShadow: p.visible ? `0 0 8px ${color}` : "none",
                    }}
                  />
                  <span className="text-[15px] tracking-[0.15em] uppercase" style={{ color: p.visible ? "var(--gold-cream)" : "var(--slate-blue)" }}>
                    {p.name}
                  </span>
                </div>
                <span className="num text-[14px]" style={{ color: "var(--slate-blue)" }}>
                  m{p.magnitude.toFixed(1)}
                </span>
              </div>

              <div className="space-y-1">
                <Row label="Alt" value={`${p.altitude > 0 ? "+" : ""}${p.altitude.toFixed(1)}°`} />
                <Row label="Az" value={`${p.azimuth.toFixed(0)}°`} />
                <Row label="In" value={p.constellation} />
              </div>

              <div
                className="mt-2 text-[14px] uppercase tracking-[0.18em] py-0.5 px-2 rounded-full inline-block"
                style={{
                  background: p.visible ? `${color}25` : "rgba(255,255,255,0.04)",
                  color: p.visible ? color : "var(--slate-blue)",
                }}
              >
                {p.bestViewing}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-[14px]">
      <span style={{ color: "var(--slate-blue)" }}>{label}</span>
      <span className="num" style={{ color: "rgba(255,255,255,0.85)" }}>{value}</span>
    </div>
  );
}
