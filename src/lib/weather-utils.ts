import bgStorm from "@/assets/bg-storm.jpg";
import bgSunny from "@/assets/bg-sunny.jpg";
import bgRain from "@/assets/bg-rain.jpg";
import bgCloudy from "@/assets/bg-cloudy.jpg";
import bgNight from "@/assets/bg-night.jpg";
import bgSnow from "@/assets/bg-snow.jpg";

export function bgFor(id: number, isDay: boolean): string {
  // OpenWeather condition IDs: https://openweathermap.org/weather-conditions
  if (id >= 200 && id < 300) return bgStorm; // thunder
  if (id >= 300 && id < 600) return bgRain; // drizzle/rain
  if (id >= 600 && id < 700) return bgSnow;
  if (id >= 700 && id < 800) return bgCloudy; // atmosphere
  if (id === 800) return isDay ? bgSunny : bgNight;
  if (id > 800) return bgCloudy;
  return bgCloudy;
}

export function headlineFor(id: number, desc: string): string {
  if (id >= 200 && id < 232) return "Storm with Heavy Rain";
  if (id === 232) return "Thunder & Drizzle";
  if (id >= 300 && id < 400) return "Soft Drizzle";
  if (id >= 500 && id < 502) return "Light Rain";
  if (id >= 502 && id < 600) return "Heavy Rainfall";
  if (id >= 600 && id < 700) return "Snowfall";
  if (id === 701 || id === 741) return "Misty Morning";
  if (id === 711) return "Smoky Air";
  if (id === 721) return "Hazy Skies";
  if (id === 731 || id === 751 || id === 761) return "Dust in the Air";
  if (id === 762) return "Volcanic Ash";
  if (id === 771) return "Squalls Ahead";
  if (id === 781) return "Tornado Warning";
  if (id === 800) return "Clear Skies";
  if (id === 801) return "Mostly Sunny";
  if (id === 802) return "Scattered Clouds";
  if (id === 803) return "Broken Clouds";
  if (id === 804) return "Overcast";
  return desc.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function aqiLabel(aqi: number): { label: string; color: string; level: number } {
  // WHO-aligned palette: 1=green 2=yellow 3=orange 4=red 5=purple
  switch (aqi) {
    case 1: return { label: "Good", color: "#22c55e", level: 1 };
    case 2: return { label: "Fair", color: "#eab308", level: 2 };
    case 3: return { label: "Moderate", color: "#f97316", level: 3 };
    case 4: return { label: "Poor", color: "#ef4444", level: 4 };
    case 5: return { label: "Very Poor", color: "#a855f7", level: 5 };
    default: return { label: "—", color: "#9ca3af", level: 0 };
  }
}

export function isDayNow(sunrise: number, sunset: number, dt: number): boolean {
  return dt >= sunrise && dt < sunset;
}

export function fmtTime(unix: number, tzOffset = 0): string {
  const d = new Date((unix + tzOffset) * 1000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")} ${ap}`;
}

export function fmtDay(unix: number, tzOffset = 0): string {
  const d = new Date((unix + tzOffset) * 1000);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function fmtFullDate(unix: number, tzOffset = 0): string {
  const d = new Date((unix + tzOffset) * 1000);
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}
