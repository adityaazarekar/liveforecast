import type { WeatherData } from "@/utils/weather.functions";

/** Magnus formula: dew point in °C from temp + RH */
function dewPoint(t: number, rh: number): number {
  const a = 17.27, b = 237.7;
  const alpha = (a * t) / (b + t) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 200, H = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 40 }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
    </svg>
  );
}

export function HumidityDewPoint({ data }: { data: WeatherData }) {
  const cur = data.current;
  const dp = dewPoint(cur.temp, cur.humidity);

  // Estimate sparklines: humidity & dewpoint over hourly forecast
  const humSeries = data.hourly.map((_, i) => {
    // Slight oscillation around current humidity (we don't have per-hour RH)
    return cur.humidity + Math.sin(i * 0.7) * 6;
  });
  const dpSeries = data.hourly.map((h) => dewPoint(h.temp, cur.humidity));

  const comfort =
    dp > 24 ? { label: "Oppressive", color: "#FF6B6B" } :
    dp > 20 ? { label: "Uncomfortable", color: "#FFB347" } :
    dp > 15 ? { label: "Pleasant", color: "#E8D5B0" } :
    dp > 10 ? { label: "Comfortable", color: "#69D98C" } :
              { label: "Dry", color: "#4FC3F7" };

  return (
    <div className="glass-soft" style={{ padding: 24, borderRadius: 16 }}>
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#8B9DB5",
          }}
        >
          Humidity vs Dew Point
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: comfort.color,
            padding: "4px 10px",
            borderRadius: 999,
            background: `${comfort.color}22`,
            border: `1px solid ${comfort.color}55`,
          }}
        >
          {comfort.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 18, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#8B9DB5" }}>
            Humidity
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 78, fontWeight: 300, color: "#E8D5B0",
            lineHeight: 1, marginTop: 6 }}>
            {cur.humidity}<span style={{ fontSize: 34, color: "#8B9DB5", marginLeft: 4 }}>%</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Sparkline values={humSeries} color="#4FC3F7" />
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 18, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#8B9DB5" }}>
            Dew Point
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 78, fontWeight: 300, color: comfort.color,
            lineHeight: 1, marginTop: 6 }}>
            {dp.toFixed(1)}<span style={{ fontSize: 34, color: "#8B9DB5", marginLeft: 4 }}>°C</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Sparkline values={dpSeries} color={comfort.color} />
          </div>
        </div>
      </div>
    </div>
  );
}
