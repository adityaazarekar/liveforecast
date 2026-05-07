import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWeather, searchCities, type WeatherData } from "@/utils/weather.functions";
import { AnimatedWeatherIcon } from "../AnimatedWeatherIcon";
import { isDayNow } from "@/lib/weather-utils";
import { Search, X, ArrowLeftRight, Loader2 } from "lucide-react";

const PRESETS = [
  { name: "London", country: "GB", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503 },
  { name: "New York", country: "US", lat: 40.7128, lon: -74.006 },
  { name: "Dubai", country: "AE", lat: 25.2048, lon: 55.2708 },
];

export function CompareTab({ baseData }: { baseData: WeatherData }) {
  const fetchWx = useServerFn(getWeather);
  const search = useServerFn(searchCities);
  const [other, setOther] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ name: string; country: string; lat: number; lon: number }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Default: load London if base isn't London, else Tokyo
    const fallback = baseData.city.name === "London" ? PRESETS[1] : PRESETS[0];
    loadCity(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await search({ data: { q } });
        setResults(r.results);
      } catch { /* */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, search]);

  const loadCity = async (c: { name: string; country: string; lat: number; lon: number }) => {
    setLoading(true);
    try {
      const r = await fetchWx({ data: c });
      setOther(r);
      setQ("");
      setResults([]);
    } catch { /* */ }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* City picker */}
      <div className="glass-soft p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="label-mini" style={{ color: "var(--slate-blue)" }}>Compare with:</span>
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--slate-blue)" }} strokeWidth={1.6} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a city..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-[var(--gold-cream)] transition-all"
              style={{ color: "var(--gold-cream)" }}
            />
            {(results.length > 0 || searching) && (
              <div className="glass-dropdown absolute top-full mt-2 left-0 right-0 z-30 max-h-64 overflow-auto">
                {searching && (
                  <div className="px-3 py-2 text-[15px] flex items-center gap-2" style={{ color: "var(--slate-blue)" }}>
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                  </div>
                )}
                {results.map((r, i) => (
                  <button
                    key={`${r.name}-${i}`}
                    onClick={() => loadCity(r)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    <span style={{ color: "var(--gold-cream)" }}>{r.name}</span>
                    <span className="ml-2 text-[14px]" style={{ color: "var(--slate-blue)" }}>{r.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => loadCity(p)}
                className="px-3 py-1 rounded-full text-[14px] uppercase tracking-[0.18em] border transition-all"
                style={{
                  borderColor: other?.city.name === p.name ? "var(--gold-cream)" : "rgba(255,255,255,0.1)",
                  color: other?.city.name === p.name ? "var(--gold-cream)" : "var(--slate-blue)",
                  background: other?.city.name === p.name ? "rgba(232,213,176,0.08)" : "transparent",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison */}
      {loading && !other && (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--gold-cream)" }} />
        </div>
      )}

      {other && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_60px_1fr] gap-4 items-stretch">
          <CityCard data={baseData} />
          <div className="hidden md:flex items-center justify-center">
            <div className="h-16 w-16 rounded-full grid place-items-center"
              style={{ background: "rgba(232,213,176,0.08)", border: "1px solid rgba(232,213,176,0.3)" }}>
              <ArrowLeftRight className="h-6 w-6" style={{ color: "var(--gold-cream)" }} strokeWidth={1.4} />
            </div>
          </div>
          <CityCard data={other} />

          {/* Diff table */}
          <div className="md:col-span-3 glass-soft p-5">
            <div className="label-mini mb-3" style={{ color: "var(--slate-blue)" }}>Side-by-Side</div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <div className="text-right" style={{ color: "var(--gold-cream)", fontFamily: "var(--font-display)" }}>{baseData.city.name}</div>
              <div className="text-center text-[14px] uppercase tracking-[0.2em]" style={{ color: "var(--slate-blue)" }}>Metric</div>
              <div style={{ color: "var(--gold-cream)", fontFamily: "var(--font-display)" }}>{other.city.name}</div>

              <CompareRow left={`${Math.round(baseData.current.temp)}°`} label="Temperature" right={`${Math.round(other.current.temp)}°`} winnerLeft={baseData.current.temp > other.current.temp} />
              <CompareRow left={`${Math.round(baseData.current.feels)}°`} label="Feels like" right={`${Math.round(other.current.feels)}°`} />
              <CompareRow left={`${baseData.current.humidity}%`} label="Humidity" right={`${other.current.humidity}%`} />
              <CompareRow left={`${baseData.current.wind_speed.toFixed(1)} m/s`} label="Wind" right={`${other.current.wind_speed.toFixed(1)} m/s`} />
              <CompareRow left={`${baseData.current.pressure} hPa`} label="Pressure" right={`${other.current.pressure} hPa`} />
              <CompareRow left={`${(baseData.current.visibility/1000).toFixed(1)} km`} label="Visibility" right={`${(other.current.visibility/1000).toFixed(1)} km`} />
              <CompareRow left={`${baseData.current.clouds}%`} label="Cloud cover" right={`${other.current.clouds}%`} />
              <CompareRow left={`AQI ${baseData.aqi.aqi}`} label="Air quality" right={`AQI ${other.aqi.aqi}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CityCard({ data }: { data: WeatherData }) {
  const isDay = isDayNow(data.current.sunrise, data.current.sunset, data.current.dt);
  return (
    <div className="glass-soft glass-hover p-5 flex flex-col items-center text-center">
      <div className="text-[14px] uppercase tracking-[0.22em]" style={{ color: "var(--slate-blue)" }}>
        {data.city.country}
      </div>
      <div className="text-2xl mt-1" style={{ color: "var(--gold-cream)", fontFamily: "var(--font-display)" }}>
        {data.city.name}
      </div>
      <div className="my-3">
        <AnimatedWeatherIcon id={data.current.weather.id} isDay={isDay} size={80} />
      </div>
      <div className="num text-5xl" style={{ color: "var(--gold-cream)" }}>
        {Math.round(data.current.temp)}°
      </div>
      <div className="text-[17px] capitalize mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
        {data.current.weather.description}
      </div>
    </div>
  );
}

function CompareRow({ left, label, right, winnerLeft }: { left: string; label: string; right: string; winnerLeft?: boolean }) {
  return (
    <>
      <div className="text-right num" style={{ color: winnerLeft === true ? "var(--gold-cream)" : "rgba(255,255,255,0.85)" }}>{left}</div>
      <div className="text-center text-[14px] uppercase tracking-[0.18em]" style={{ color: "var(--slate-blue)" }}>{label}</div>
      <div className="num" style={{ color: winnerLeft === false ? "var(--gold-cream)" : "rgba(255,255,255,0.85)" }}>{right}</div>
    </>
  );
}
