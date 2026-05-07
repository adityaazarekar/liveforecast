import { createFileRoute, useRouter, ClientOnly } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useTransition, useCallback } from "react";
import { getWeather, reverseGeocode, type WeatherData } from "@/utils/weather.functions";
import { getSkyTheme } from "@/lib/skyTheme";
import { CitySearch } from "@/components/weather/CitySearch";
import { LeftPanel } from "@/components/weather/LeftPanel";
import { CenterPanel } from "@/components/weather/CenterPanel";
import { RightPanel } from "@/components/weather/RightPanel";
import { HourlyChart } from "@/components/weather/HourlyChart";
import { ParticleLayer } from "@/components/weather/ParticleLayer";
import { InsightsTabs } from "@/components/weather/InsightsTabs";
import { lazy, Suspense } from "react";
const WorldMap = lazy(() => import("@/components/weather/WorldMap").then(m => ({ default: m.WorldMap })));
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_CITY = { lat: 18.5204, lon: 73.8567, name: "Pune", country: "IN" };

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const data = await getWeather({ data: DEFAULT_CITY });
      return { data, error: null as string | null };
    } catch (e: any) {
      return { data: null, error: e?.message ?? "Failed to load weather" };
    }
  },
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center text-white/70 p-8 text-center">
      <div>
        <p className="text-display text-3xl mb-2">Weather unavailable</p>
        <p className="text-sm font-light">{error.message}</p>
      </div>
    </div>
  ),
});

function Dashboard() {
  const { data: initial, error: initialErr } = Route.useLoaderData();
  const router = useRouter();
  const [data, setData] = useState<WeatherData | null>(initial);
  const [error, setError] = useState<string | null>(initialErr);
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [crossfade, setCrossfade] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "map">("dashboard");
  const bgRef = useRef<HTMLDivElement>(null);
  const lastCityRef = useRef(DEFAULT_CITY);
  const geoAttempted = useRef(false);
  const lastFetchRef = useRef<number>(Date.now());
  const aqiToastShown = useRef<string | null>(null);

  // tick every 60s so the day/night theme refreshes without a fetch
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchCity = useCallback(async (c: { lat: number; lon: number; name: string; country: string }, animate = true) => {
    if (animate) { setLoading(true); setCrossfade(true); }
    try {
      const next = await getWeather({ data: c });
      lastCityRef.current = c;
      lastFetchRef.current = Date.now();
      if (animate) {
        setTimeout(() => {
          startTransition(() => { setData(next); setError(null); });
          setTimeout(() => setCrossfade(false), 50);
        }, 200);
      } else {
        startTransition(() => { setData(next); setError(null); });
      }
    } catch (e: any) {
      toast.error("Unable to fetch weather data. Please try again.");
      if (animate) setCrossfade(false);
    }
    if (animate) setLoading(false);
  }, [startTransition]);

  // Geolocation on mount
  useEffect(() => {
    if (geoAttempted.current) return;
    geoAttempted.current = true;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const geo = await reverseGeocode({ data: { lat, lon } });
          if (geo.city) fetchCity(geo.city, true);
        } catch { /* fall back silently */ }
      },
      () => { /* denied — keep default */ },
      { timeout: 5000 },
    );
  }, [fetchCity]);

  // Auto-refresh every 10 minutes + stale toast
  useEffect(() => {
    const interval = setInterval(() => {
      const ageMin = (Date.now() - lastFetchRef.current) / 60000;
      if (ageMin >= 15) toast("Refreshing weather data…", { duration: 2200 });
      fetchCity(lastCityRef.current, false);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCity]);

  // High AQI toast (once per city)
  useEffect(() => {
    if (!data) return;
    const cityKey = `${data.city.name}-${data.city.country}`;
    if (data.aqi.aqi >= 4 && aqiToastShown.current !== cityKey) {
      aqiToastShown.current = cityKey;
      toast("Air quality is poor today", { duration: 4000 });
    }
  }, [data]);

  // Mouse parallax
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * -2;
      const ny = (e.clientY / window.innerHeight - 0.5) * -2;
      targetRef.current = { x: nx * 10, y: ny * 7 };
    };
    window.addEventListener("mousemove", onMove);
    let raf = 0;
    const tick = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.06;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.06;
      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  // ─── Live sky theme: time-of-day × weather ───
  const sky = useMemo(() => {
    if (!data) {
      return getSkyTheme(DEFAULT_CITY.lat, DEFAULT_CITY.lon, 800);
    }
    return getSkyTheme(data.city.lat, data.city.lon, data.current.weather.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.city.lat, data?.city.lon, data?.current.weather.id, tick]);

  const isDay = sky.isDay;
  const accent = sky.accent;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-condition",
      sky.mode === "rain" ? "rain" :
      sky.mode === "snow" ? "snow" :
      sky.mode === "storm" ? "storm" :
      sky.mode === "mist" ? "mist" :
      sky.mode === "day-cloud" ? "clouds" :
      "clear");
    root.style.setProperty("--cond", accent);
    const hex = accent.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty("--cond-soft", `rgba(${r},${g},${b},0.22)`);
  }, [accent, sky.mode]);

  const handleSelect = async (c: { lat: number; lon: number; name: string; country: string }) => {
    fetchCity(c, true);
  };

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center text-white/70 p-8 text-center">
        <div>
          <p className="text-display text-3xl mb-2">Weather unavailable</p>
          <p className="text-sm font-light">{error}</p>
          <button
            onClick={() => router.invalidate()}
            className="mt-4 glass-soft px-4 py-2 text-xs uppercase tracking-[0.25em] hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cinematic background — dynamic gradient driven by sky mode */}
      <div ref={bgRef} className="fixed inset-0 z-0 will-change-transform">
        <div
          key={sky.mode}
          className="absolute inset-0 animate-fade-in"
          style={{
            background: sky.gradient,
            animationDuration: "1500ms",
            transition: "background 1.4s var(--ease-luxury)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)" }}
      />

      <ParticleLayer mode={sky.particles} />

      {/* Crossfade veil */}
      <div
        className="fixed inset-0 z-30 pointer-events-none bg-[#0d0d0f]"
        style={{ opacity: crossfade ? 1 : 0, transition: "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      />

      {loading && (
        <div className="fixed inset-0 z-40 pointer-events-none animate-fade-in">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--cond)] to-transparent animate-shimmer bg-[length:200%_100%]" />
        </div>
      )}

      {/* Header */}
      <header className="relative z-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Top row on mobile: Logo + DateInfo (DateInfo hidden on very small screens) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full bg-[var(--cond)]"
                style={{ boxShadow: "0 0 14px var(--cond)", animation: "breathe 2s ease-in-out infinite" }}
              />
              <span
                className="text-white/95"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 500, letterSpacing: "0.25em" }}
              >
                FORECAST
              </span>
              <span
                className="rounded-full bg-[var(--cond)] text-black"
                style={{ padding: "2px 8px", fontFamily: "'DM Sans', sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em" }}
              >
                NOW
              </span>
            </div>
            
            <div className="flex md:hidden items-center gap-3 label-mini text-white/55">
              <span className="num text-white/85">{new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Bottom row on mobile, inline on PC: Tabs + Search */}
          <div className="flex flex-wrap items-center gap-3">
            <nav className="glass-soft flex items-center gap-1 p-1">
              {([
                { id: "dashboard", label: "Dashboard" },
                { id: "map", label: "World Map" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative rounded-full px-4 py-1.5 transition-all duration-300 ${
                    tab === t.id ? "text-black" : "text-white/55 hover:text-white/85"
                  }`}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full bg-[var(--cond)]"
                      style={{ boxShadow: "0 0 12px rgba(245,158,11,0.35)" }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </nav>

            {tab === "dashboard" && (
              <CitySearch
                current={`${data.city.name}, ${data.city.country}`}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>

        {/* Date Info on PC */}
        <div className="hidden md:flex items-center gap-3 label-mini text-white/55">
          <span style={{ textTransform: "uppercase", letterSpacing: "0.2em" }}>
            {sky.mode.replace("-", " ")}
          </span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="num text-white/85">{new Date().getFullYear()}</span>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-10 sm:px-6 lg:px-10">
        <AnimatePresence mode="wait">
          {tab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto grid max-w-[1640px] grid-cols-1 gap-4 lg:grid-cols-12"
            >
              {/* On mobile: Center first, then Left, then Right */}
              <section
                className="glass glass-hover order-1 lg:order-2 lg:col-span-6"
                style={{ animation: "fade-up 0.9s 350ms cubic-bezier(0.22,1,0.36,1) both", padding: 20 }}
              >
                <CenterPanel data={data} isDay={isDay} />
              </section>

              <section
                className="glass glass-hover order-2 lg:order-1 lg:col-span-3"
                style={{ animation: "fade-up 0.9s 200ms cubic-bezier(0.22,1,0.36,1) both", padding: 20 }}
              >
                <LeftPanel data={data} isDay={isDay} />
              </section>

              <section
                className="order-3 lg:col-span-3"
                style={{ animation: "fade-up 0.9s 500ms cubic-bezier(0.22,1,0.36,1) both" }}
              >
                <RightPanel data={data} />
              </section>

              <section
                className="order-4 lg:col-span-12"
                style={{ animation: "fade-up 0.9s 700ms cubic-bezier(0.22,1,0.36,1) both" }}
              >
                <HourlyChart data={data} />
              </section>

              <section
                className="order-5 lg:col-span-12"
                style={{ animation: "fade-up 0.9s 1000ms cubic-bezier(0.22,1,0.36,1) both" }}
              >
                <InsightsTabs data={data} />
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[1600px]"
            >
              <ClientOnly fallback={<div className="h-[80vh] grid place-items-center text-white/40 text-sm">Loading map…</div>}>
                <Suspense fallback={<div className="h-[80vh] grid place-items-center text-white/40 text-sm">Loading map…</div>}>
                  <WorldMap apiKeyAvailable={true} />
                </Suspense>
              </ClientOnly>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mx-auto mt-8 flex max-w-[1600px] items-center justify-between" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.4 }}>
          <span>Powered by OpenWeather</span>
          <span style={{ fontFamily: "'DM Mono', monospace", letterSpacing: 0 }}>{Math.round(data.current.temp)}° · {data.city.name}</span>
        </footer>
      </main>
    </div>
  );
}
