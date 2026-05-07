import { createServerFn } from "@tanstack/react-start";
import SunCalc from "suncalc";
// @ts-expect-error - astronomia ships CJS without types
import * as astronomia from "astronomia";
// @ts-expect-error
import vsop87Bearth from "astronomia/data/vsop87Bearth";
// @ts-expect-error
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
// @ts-expect-error
import vsop87Bmars from "astronomia/data/vsop87Bmars";
// @ts-expect-error
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
// @ts-expect-error
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
// @ts-expect-error
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";

export type AstronomyData = {
  sun: {
    sunrise: number;
    sunset: number;
    solarNoon: number;
    nauticalDawn: number;
    nauticalDusk: number;
    civilDawn: number; // dawn
    civilDusk: number; // dusk
    nightStart: number; // night
    nightEnd: number; // nightEnd
    goldenHourMorningStart: number; // goldenHourEnd → wait, suncalc has goldenHourEnd & goldenHour
    goldenHourMorningEnd: number;
    goldenHourEveningStart: number;
    goldenHourEveningEnd: number;
    altitudeNow: number; // degrees
    azimuthNow: number; // degrees
    dayLengthSec: number;
    blueHourEveningStart: number;
    blueHourEveningEnd: number;
  };
  moon: {
    rise: number | null;
    set: number | null;
    illumination: number; // 0..1
    phase: number; // 0..1
    phaseName: string;
    altitude: number;
    azimuth: number;
    distance: number; // km
    parallacticAngle: number;
    nextFullMoon: number; // unix
    nextNewMoon: number;
    daysToFull: number;
  };
  planets: Array<{
    name: string;
    visible: boolean;
    altitude: number; // deg
    azimuth: number; // deg
    magnitude: number;
    constellation: string;
    bestViewing: string; // "Evening" | "Morning" | "Night" | "Not visible"
  }>;
};

function moonPhaseName(p: number): string {
  if (p < 0.03 || p > 0.97) return "New Moon";
  if (p < 0.22) return "Waxing Crescent";
  if (p < 0.28) return "First Quarter";
  if (p < 0.47) return "Waxing Gibbous";
  if (p < 0.53) return "Full Moon";
  if (p < 0.72) return "Waning Gibbous";
  if (p < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

function constellationFor(raHours: number): string {
  // Very rough RA → zodiac mapping
  const zodiac = [
    "Pisces","Aries","Taurus","Gemini","Cancer","Leo",
    "Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius",
  ];
  const idx = Math.floor(((raHours % 24) + 24) % 24 / 2) % 12;
  return zodiac[idx];
}

function planetPosition(name: string, jde: number, lat: number, lon: number) {
  let planet: any;
  let baseMag = 0;
  switch (name) {
    case "Mercury": planet = new astronomia.planetposition.Planet(vsop87Bmercury); baseMag = -0.42; break;
    case "Venus":   planet = new astronomia.planetposition.Planet(vsop87Bvenus);   baseMag = -4.6; break;
    case "Mars":    planet = new astronomia.planetposition.Planet(vsop87Bmars);    baseMag = -2.0; break;
    case "Jupiter": planet = new astronomia.planetposition.Planet(vsop87Bjupiter); baseMag = -2.9; break;
    case "Saturn":  planet = new astronomia.planetposition.Planet(vsop87Bsaturn);  baseMag = 0.4; break;
    default: throw new Error("unknown planet");
  }

  // Heliocentric ecliptic for planet & earth
  const earth = new astronomia.planetposition.Planet(vsop87Bearth);
  const pos = astronomia.elliptic.position(planet, earth, jde);
  // pos.ra (radians), pos.dec (radians)
  const raHours = (pos.ra * 12) / Math.PI;
  const decDeg = (pos.dec * 180) / Math.PI;

  // Convert RA/Dec to alt/az for observer
  const dateMs = (jde - 2440587.5) * 86400 * 1000;
  // Use sidereal time
  const lst = astronomia.sidereal.apparent(jde) * 15; // deg
  const ha = ((lst + lon) - raHours * 15) * Math.PI / 180; // hour angle radians
  const latRad = lat * Math.PI / 180;
  const decRad = pos.dec;

  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(ha);
  const altRad = Math.asin(sinAlt);
  const cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) / (Math.cos(altRad) * Math.cos(latRad));
  let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(ha) > 0) azRad = 2 * Math.PI - azRad;

  return {
    altitude: (altRad * 180) / Math.PI,
    azimuth: (azRad * 180) / Math.PI,
    raHours,
    decDeg,
    magnitude: baseMag,
    dateMs,
  };
}

export const getAstronomy = createServerFn({ method: "GET" })
  .inputValidator((d: { lat: number; lon: number; date?: number }) => d)
  .handler(async ({ data }): Promise<AstronomyData> => {
    const date = data.date ? new Date(data.date * 1000) : new Date();
    const { lat, lon } = data;

    const times = SunCalc.getTimes(date, lat, lon);
    const sunPos = SunCalc.getPosition(date, lat, lon);
    const moonPos = SunCalc.getMoonPosition(date, lat, lon);
    const moonIllum = SunCalc.getMoonIllumination(date);
    const moonTimes = SunCalc.getMoonTimes(date, lat, lon, true);

    // Find next full & new moon
    let nextFull = 0, nextNew = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(date.getTime() + i * 86400000);
      const ill = SunCalc.getMoonIllumination(d);
      if (!nextFull && ill.fraction > 0.985) nextFull = d.getTime() / 1000;
      if (!nextNew && ill.fraction < 0.015 && i > 1) nextNew = d.getTime() / 1000;
      if (nextFull && nextNew) break;
    }
    const daysToFull = nextFull ? Math.max(0, Math.round((nextFull * 1000 - date.getTime()) / 86400000)) : 0;

    const toUnix = (d: Date) => Math.floor(d.getTime() / 1000);

    // Planets via astronomia
    const jde = astronomia.julian.DateToJDE(date);
    const planetNames = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;
    const planets = planetNames.map((n) => {
      try {
        const p = planetPosition(n, jde, lat, lon);
        const visible = p.altitude > 0;
        let bestViewing: string;
        if (!visible) bestViewing = "Below horizon";
        else if (p.altitude < 10) bestViewing = "Near horizon";
        else {
          // Determine if it's morning, evening, or night based on sun altitude
          if (sunPos.altitude * 180 / Math.PI > 0) bestViewing = "Daylight (faint)";
          else if (sunPos.altitude * 180 / Math.PI > -12) bestViewing = "Twilight";
          else bestViewing = "Night sky";
        }
        return {
          name: n,
          visible,
          altitude: p.altitude,
          azimuth: p.azimuth,
          magnitude: p.magnitude,
          constellation: constellationFor(p.raHours),
          bestViewing,
        };
      } catch (e) {
        return {
          name: n, visible: false, altitude: 0, azimuth: 0,
          magnitude: 0, constellation: "—", bestViewing: "Unavailable",
        };
      }
    });

    return {
      sun: {
        sunrise: toUnix(times.sunrise),
        sunset: toUnix(times.sunset),
        solarNoon: toUnix(times.solarNoon),
        nauticalDawn: toUnix(times.nauticalDawn),
        nauticalDusk: toUnix(times.nauticalDusk),
        civilDawn: toUnix(times.dawn),
        civilDusk: toUnix(times.dusk),
        nightStart: toUnix(times.night),
        nightEnd: toUnix(times.nightEnd),
        goldenHourMorningStart: toUnix(times.goldenHourEnd), // suncalc: goldenHourEnd is morning end
        goldenHourMorningEnd: toUnix(times.sunriseEnd),
        goldenHourEveningStart: toUnix(times.goldenHour),
        goldenHourEveningEnd: toUnix(times.sunsetStart),
        altitudeNow: (sunPos.altitude * 180) / Math.PI,
        azimuthNow: (sunPos.azimuth * 180) / Math.PI + 180,
        dayLengthSec: toUnix(times.sunset) - toUnix(times.sunrise),
        blueHourEveningStart: toUnix(times.dusk),
        blueHourEveningEnd: toUnix(times.nauticalDusk),
      },
      moon: {
        rise: moonTimes.rise ? toUnix(moonTimes.rise) : null,
        set: moonTimes.set ? toUnix(moonTimes.set) : null,
        illumination: moonIllum.fraction,
        phase: moonIllum.phase,
        phaseName: moonPhaseName(moonIllum.phase),
        altitude: (moonPos.altitude * 180) / Math.PI,
        azimuth: (moonPos.azimuth * 180) / Math.PI + 180,
        distance: moonPos.distance,
        parallacticAngle: (moonPos.parallacticAngle * 180) / Math.PI,
        nextFullMoon: nextFull,
        nextNewMoon: nextNew,
        daysToFull,
      },
      planets,
    };
  });
