import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useServerFn } from "@tanstack/react-start";
import { getWeather } from "@/utils/weather.functions";
import { motion } from "framer-motion";

type Layer = "temp_new" | "precipitation_new" | "wind_new" | "clouds_new";

const LAYERS: { id: Layer; label: string }[] = [
  { id: "temp_new", label: "Temperature" },
  { id: "precipitation_new", label: "Precipitation" },
  { id: "wind_new", label: "Wind" },
  { id: "clouds_new", label: "Clouds" },
];

const CITIES = [
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },
];

const pulseIcon = () =>
  L.divIcon({
    className: "leaflet-pulse-icon",
    html: `<div class="pulse-marker"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    const t2 = setTimeout(() => map.invalidateSize(), 800);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [map]);
  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (latlng: { lat: number; lng: number }) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const fn = (e: L.LeafletMouseEvent) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on("click", fn);
    return () => { map.off("click", fn); };
  }, [map, onPick]);
  return null;
}

export function WorldMap({ apiKeyAvailable }: { apiKeyAvailable: boolean }) {
  // Inject leaflet CSS dynamically — guarantees it loads even if @import is stripped.
  useEffect(() => {
    if (document.querySelector('link[data-leaflet-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-leaflet-css", "true");
    document.head.appendChild(link);
  }, []);

  const [layer, setLayer] = useState<Layer>("temp_new");
  const fetchWx = useServerFn(getWeather);
  const [picked, setPicked] = useState<{
    lat: number; lng: number; name: string; temp: number; cond: string; humidity: number;
  } | null>(null);
  const popupRef = useRef<L.Popup | null>(null);

  const handlePick = async (latlng: { lat: number; lng: number }) => {
    try {
      const r = await fetchWx({ data: { lat: latlng.lat, lon: latlng.lng } });
      setPicked({
        lat: latlng.lat,
        lng: latlng.lng,
        name: `${r.city.name}, ${r.city.country}`,
        temp: r.current.temp,
        cond: r.current.weather.description,
        humidity: r.current.humidity,
      });
    } catch {
      // ignore
    }
  };

  const owmTileUrl = useMemo(
    () => `/api/owm-tile/${layer}/{z}/{x}/{y}`,
    [layer],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden rounded-2xl border border-white/10"
      style={{ height: "75vh", minHeight: 520 }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom
        zoomAnimation
        zoomAnimationThreshold={4}
        worldCopyJump
        style={{ height: "100%", width: "100%" }}
      >
        <MapInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />
        {apiKeyAvailable && (
          <TileLayer
            key={layer}
            attribution='&copy; OpenWeatherMap'
            url={owmTileUrl}
            opacity={0.85}
          />
        )}
        {CITIES.map((c) => (
          <Marker key={c.name} position={[c.lat, c.lon]} icon={pulseIcon()}>
            <Popup>
              <div className="text-white">
                <div className="text-italic text-base mb-1">{c.name}</div>
                <button
                  onClick={() => handlePick({ lat: c.lat, lng: c.lon })}
                  className="text-[15px] uppercase tracking-[0.25em] text-[var(--cond)] hover:underline"
                >
                  Load forecast
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        <ClickHandler onPick={handlePick} />
        {picked && (
          <Popup
            position={[picked.lat, picked.lng]}
            ref={(r: any) => { popupRef.current = r; }}
            eventHandlers={{ remove: () => setPicked(null) }}
          >
            <div className="text-white min-w-[180px]">
              <div className="text-italic text-base mb-1">{picked.name}</div>
              <div className="num text-2xl">{Math.round(picked.temp)}°</div>
              <div className="text-[15px] capitalize text-white/70">{picked.cond}</div>
              <div className="text-[14px] uppercase tracking-[0.25em] text-white/55 mt-1">
                Humidity {picked.humidity}%
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Layer toggle */}
      <div className="glass-dropdown absolute top-4 right-4 z-[400] flex flex-wrap gap-1 p-1.5">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLayer(l.id)}
            className={`rounded-full px-3 py-1.5 text-[14px] uppercase tracking-[0.18em] transition-all duration-300 ${
              layer === l.id
                ? "bg-[var(--cond)] text-black font-medium"
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {!apiKeyAvailable && (
        <div className="absolute bottom-4 left-4 z-[400] glass-dropdown px-3 py-2 text-[14px] uppercase tracking-[0.2em] text-white/65">
          Weather layers unavailable
        </div>
      )}
    </motion.div>
  );
}
