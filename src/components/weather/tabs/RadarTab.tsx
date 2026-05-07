import type { WeatherData } from "@/utils/weather.functions";
import { WindRose } from "../WindRose";
import { PrecipForecast24h } from "../radar/PrecipForecast24h";
import { PressureTrend } from "../radar/PressureTrend";
import { HumidityDewPoint } from "../radar/HumidityDewPoint";

export function RadarTab({ data }: { data: WeatherData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <WindRose data={data} />
      <HumidityDewPoint data={data} />
      <PrecipForecast24h data={data} />
      <PressureTrend data={data} />
    </div>
  );
}
