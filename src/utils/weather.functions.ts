import { createServerFn } from "@tanstack/react-start";

const OWM = "https://api.openweathermap.org";

export type WeatherData = {
  city: { name: string; country: string; lat: number; lon: number; tz: number };
  current: {
    temp: number;
    feels: number;
    humidity: number;
    pressure: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    clouds: number;
    uvi: number;
    sunrise: number;
    sunset: number;
    dt: number;
    weather: { main: string; description: string; id: number; icon: string };
  };
  hourly: Array<{ dt: number; temp: number; pop: number; wind: number }>;
  daily: Array<{
    dt: number;
    min: number;
    max: number;
    weather: { main: string; description: string; id: number; icon: string };
    pop: number;
  }>;
  aqi: { aqi: number; pm2_5: number; pm10: number; o3: number; no2: number; so2: number; co: number };
  error?: string;
};

async function getKey() {
  const k = process.env.OPENWEATHER_API_KEY;
  if (!k) throw new Error("OPENWEATHER_API_KEY missing");
  return k;
}

export const reverseGeocode = createServerFn({ method: "GET" })
  .inputValidator((d: { lat: number; lon: number }) => d)
  .handler(async ({ data }) => {
    const key = await getKey();
    const r = await fetch(
      `${OWM}/geo/1.0/reverse?lat=${data.lat}&lon=${data.lon}&limit=1&appid=${key}`,
    );
    if (!r.ok) return { city: null as null | { name: string; country: string; lat: number; lon: number } };
    const j = (await r.json()) as Array<{ name: string; country: string; lat: number; lon: number }>;
    const first = j[0];
    return { city: first ? { name: first.name, country: first.country, lat: data.lat, lon: data.lon } : null };
  });

export const searchCities = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data }) => {
    const key = await getKey();
    const r = await fetch(
      `${OWM}/geo/1.0/direct?q=${encodeURIComponent(data.q)}&limit=5&appid=${key}`,
    );
    if (!r.ok) return { results: [] as Array<{ name: string; country: string; state?: string; lat: number; lon: number }> };
    const j = (await r.json()) as Array<{ name: string; country: string; state?: string; lat: number; lon: number }>;
    return { results: j };
  });

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((d: { lat: number; lon: number; name?: string; country?: string }) => d)
  .handler(async ({ data }): Promise<WeatherData> => {
    const key = await getKey();
    const { lat, lon } = data;

    try {
      const [curRes, fcRes, aqiRes] = await Promise.all([
        fetch(`${OWM}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`),
        fetch(`${OWM}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`),
        fetch(`${OWM}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`),
      ]);

      if (!curRes.ok) {
        const txt = await curRes.text();
        throw new Error(`OpenWeather ${curRes.status}: ${txt.slice(0, 200)}`);
      }

      const cur = await curRes.json();
      const fc = await fcRes.json();
      const aqi = await aqiRes.json();

      // Build hourly from 3h forecast (next 8 entries = 24h)
      const hourly = (fc.list || []).slice(0, 8).map((h: any) => ({
        dt: h.dt,
        temp: h.main.temp,
        pop: h.pop ?? 0,
        wind: h.wind.speed,
      }));

      // Aggregate forecast list into 7 days by date
      const dayMap = new Map<string, any[]>();
      (fc.list || []).forEach((entry: any) => {
        const d = new Date(entry.dt * 1000).toISOString().slice(0, 10);
        if (!dayMap.has(d)) dayMap.set(d, []);
        dayMap.get(d)!.push(entry);
      });

      const daily = Array.from(dayMap.entries())
        .slice(0, 7)
        .map(([_, entries]) => {
          const temps = entries.map((e) => e.main.temp);
          const pops = entries.map((e) => e.pop ?? 0);
          // pick midday entry for icon
          const mid =
            entries.find((e) => new Date(e.dt * 1000).getUTCHours() >= 12) ?? entries[0];
          return {
            dt: entries[0].dt,
            min: Math.min(...temps),
            max: Math.max(...temps),
            weather: mid.weather[0],
            pop: Math.max(...pops),
          };
        });

      const aqiItem = aqi.list?.[0];

      return {
        city: {
          name: data.name ?? cur.name,
          country: data.country ?? cur.sys.country,
          lat,
          lon,
          tz: cur.timezone,
        },
        current: {
          temp: cur.main.temp,
          feels: cur.main.feels_like,
          humidity: cur.main.humidity,
          pressure: cur.main.pressure,
          visibility: cur.visibility ?? 10000,
          wind_speed: cur.wind.speed,
          wind_deg: cur.wind.deg ?? 0,
          clouds: cur.clouds?.all ?? 0,
          uvi: 0,
          sunrise: cur.sys.sunrise,
          sunset: cur.sys.sunset,
          dt: cur.dt,
          weather: cur.weather[0],
        },
        hourly,
        daily,
        aqi: {
          aqi: aqiItem?.main?.aqi ?? 1,
          pm2_5: aqiItem?.components?.pm2_5 ?? 0,
          pm10: aqiItem?.components?.pm10 ?? 0,
          o3: aqiItem?.components?.o3 ?? 0,
          no2: aqiItem?.components?.no2 ?? 0,
          so2: aqiItem?.components?.so2 ?? 0,
          co: aqiItem?.components?.co ?? 0,
        },
      };
    } catch (e) {
      console.error("getWeather failed:", e);
      throw e;
    }
  });
