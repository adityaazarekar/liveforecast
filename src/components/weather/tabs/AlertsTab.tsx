import type { WeatherData } from "@/utils/weather.functions";
import { AlertTriangle, Wind, Thermometer, Droplets, Eye, Sun, CloudRain, Snowflake } from "lucide-react";

type Alert = {
  id: string;
  severity: "info" | "watch" | "warning" | "extreme";
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  metric: string;
};

function buildAlerts(data: WeatherData): Alert[] {
  const a: Alert[] = [];
  const c = data.current;

  // Wind
  if (c.wind_speed >= 20) {
    a.push({ id: "wind-ext", severity: "extreme", title: "Gale-force winds", detail: "Sustained winds above 20 m/s. Secure outdoor objects, avoid coastal areas.", icon: Wind, metric: `${c.wind_speed.toFixed(1)} m/s` });
  } else if (c.wind_speed >= 14) {
    a.push({ id: "wind-w", severity: "warning", title: "Strong wind warning", detail: "High winds expected. Driving may be hazardous for high-profile vehicles.", icon: Wind, metric: `${c.wind_speed.toFixed(1)} m/s` });
  } else if (c.wind_speed >= 10) {
    a.push({ id: "wind-i", severity: "watch", title: "Breezy conditions", detail: "Wind picking up — dress accordingly.", icon: Wind, metric: `${c.wind_speed.toFixed(1)} m/s` });
  }

  // Heat
  if (c.feels >= 40) {
    a.push({ id: "heat-ext", severity: "extreme", title: "Extreme heat advisory", detail: "Feels-like temperature above 40°C. Risk of heatstroke. Stay hydrated, avoid direct sun.", icon: Thermometer, metric: `${Math.round(c.feels)}°C felt` });
  } else if (c.feels >= 35) {
    a.push({ id: "heat-w", severity: "warning", title: "Heat warning", detail: "High heat & humidity. Limit outdoor activity midday.", icon: Thermometer, metric: `${Math.round(c.feels)}°C felt` });
  }

  // Cold
  if (c.feels <= -10) {
    a.push({ id: "cold-ext", severity: "extreme", title: "Extreme cold warning", detail: "Frostbite risk in under 10 minutes on exposed skin.", icon: Snowflake, metric: `${Math.round(c.feels)}°C felt` });
  } else if (c.feels <= 0) {
    a.push({ id: "cold-w", severity: "warning", title: "Freezing conditions", detail: "Ice risk on roads & sidewalks.", icon: Snowflake, metric: `${Math.round(c.feels)}°C felt` });
  }

  // AQI
  if (data.aqi.aqi >= 5) {
    a.push({ id: "aqi-ext", severity: "extreme", title: "Hazardous air quality", detail: `PM2.5 at ${data.aqi.pm2_5.toFixed(0)} µg/m³. Stay indoors, use N95 if going out.`, icon: Eye, metric: "AQI 5/5" });
  } else if (data.aqi.aqi >= 4) {
    a.push({ id: "aqi-w", severity: "warning", title: "Poor air quality", detail: "Sensitive groups should limit prolonged outdoor exertion.", icon: Eye, metric: "AQI 4/5" });
  }

  // Rain (any hourly POP > 70%)
  const peakPop = Math.max(...data.hourly.map((h) => h.pop));
  if (peakPop >= 0.85) {
    a.push({ id: "rain-w", severity: "warning", title: "Heavy precipitation likely", detail: `${Math.round(peakPop * 100)}% chance of rain in coming hours. Carry waterproofs.`, icon: CloudRain, metric: `${Math.round(peakPop * 100)}% POP` });
  } else if (peakPop >= 0.6) {
    a.push({ id: "rain-i", severity: "watch", title: "Showers expected", detail: "Periodic rain forecast. Plan for indoor backup.", icon: CloudRain, metric: `${Math.round(peakPop * 100)}% POP` });
  }

  // Storm
  if (c.weather.id >= 200 && c.weather.id < 300) {
    a.push({ id: "storm", severity: "extreme", title: "Thunderstorm active", detail: "Lightning & strong gusts. Stay indoors, unplug electronics.", icon: AlertTriangle, metric: c.weather.description });
  }

  // Visibility
  if (c.visibility < 1000) {
    a.push({ id: "fog", severity: "warning", title: "Reduced visibility", detail: `Visibility under ${(c.visibility / 1000).toFixed(1)} km — drive with low beams, increase distance.`, icon: Eye, metric: `${(c.visibility / 1000).toFixed(1)} km` });
  }

  // UV (estimated)
  const isDay = c.dt >= c.sunrise && c.dt < c.sunset;
  if (isDay && c.clouds < 30) {
    a.push({ id: "uv-i", severity: "watch", title: "High UV exposure", detail: "Clear skies & strong sun. Use SPF 30+, sunglasses recommended.", icon: Sun, metric: "UV ~7-9" });
  }

  // Default if all clear
  if (a.length === 0) {
    a.push({ id: "ok", severity: "info", title: "All clear", detail: "No active weather warnings for your area. Conditions are nominal.", icon: Droplets, metric: "Nominal" });
  }

  return a;
}

const SEVERITY_STYLES: Record<Alert["severity"], { bg: string; bd: string; text: string; chip: string; chipText: string; label: string }> = {
  info:    { bg: "rgba(105,217,140,0.06)", bd: "rgba(105,217,140,0.3)",  text: "#69d98c", chip: "#69d98c", chipText: "#0d0d0f", label: "Info" },
  watch:   { bg: "rgba(255,179,71,0.07)",  bd: "rgba(255,179,71,0.3)",   text: "#ffb347", chip: "#ffb347", chipText: "#0d0d0f", label: "Watch" },
  warning: { bg: "rgba(251,146,60,0.08)",  bd: "rgba(251,146,60,0.4)",   text: "#fb923c", chip: "#fb923c", chipText: "#0d0d0f", label: "Warning" },
  extreme: { bg: "rgba(255,107,107,0.1)",  bd: "rgba(255,107,107,0.5)",  text: "#ff6b6b", chip: "#ff6b6b", chipText: "#fff",    label: "Extreme" },
};

export function AlertsTab({ data }: { data: WeatherData }) {
  const alerts = buildAlerts(data);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="label-mini" style={{ color: "var(--slate-blue)" }}>
          Active Conditions · {data.city.name}
        </span>
        <span className="num text-xs" style={{ color: "var(--gold-cream)" }}>
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>

      {alerts.map((a, i) => {
        const Icon = a.icon;
        const s = SEVERITY_STYLES[a.severity];
        return (
          <div
            key={a.id}
            className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: s.bg,
              border: `1px solid ${s.bd}`,
              boxShadow: a.severity === "extreme" ? `0 0 24px ${s.bd}` : "none",
              animation: `fade-up 0.5s ${i * 0.06}s var(--ease-luxury) both`,
            }}
          >
            {a.severity === "extreme" && (
              <div className="absolute -top-px left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${s.text}, transparent)`, animation: "shimmer 2s linear infinite" }} />
            )}
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 h-10 w-10 rounded-full grid place-items-center"
                style={{ background: `${s.text}20`, border: `1px solid ${s.bd}` }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base" style={{ color: s.text, fontFamily: "var(--font-display)", fontWeight: 500 }}>
                    {a.title}
                  </span>
                  <span
                    className="text-[14px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                    style={{ background: s.chip, color: s.chipText, fontWeight: 600 }}
                  >
                    {s.label}
                  </span>
                  <span className="num text-[15px] ml-auto" style={{ color: "var(--slate-blue)" }}>
                    {a.metric}
                  </span>
                </div>
                <p className="text-[17px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                  {a.detail}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
