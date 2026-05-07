import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow,
  Cloudy, Moon, Sun, Wind,
} from "lucide-react";

export function WeatherIcon({ id, isDay = true, className = "h-6 w-6", strokeWidth = 1.4 }: {
  id: number; isDay?: boolean; className?: string; strokeWidth?: number;
}) {
  if (id >= 200 && id < 300) return <CloudLightning className={className} strokeWidth={strokeWidth} />;
  if (id >= 300 && id < 500) return <CloudDrizzle className={className} strokeWidth={strokeWidth} />;
  if (id >= 500 && id < 600) return <CloudRain className={className} strokeWidth={strokeWidth} />;
  if (id >= 600 && id < 700) return <CloudSnow className={className} strokeWidth={strokeWidth} />;
  if (id === 701 || id === 741) return <CloudFog className={className} strokeWidth={strokeWidth} />;
  if (id >= 700 && id < 800) return <Wind className={className} strokeWidth={strokeWidth} />;
  if (id === 800) return isDay ? <Sun className={className} strokeWidth={strokeWidth} /> : <Moon className={className} strokeWidth={strokeWidth} />;
  if (id === 801 || id === 802) return <Cloud className={className} strokeWidth={strokeWidth} />;
  return <Cloudy className={className} strokeWidth={strokeWidth} />;
}
