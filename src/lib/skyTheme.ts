import SunCalc from "suncalc";

export type SkyMode =
  | "night"
  | "dawn"
  | "golden-morning"
  | "day-clear"
  | "day-cloud"
  | "rain"
  | "storm"
  | "snow"
  | "mist"
  | "golden-evening"
  | "dusk";

export type SkyTheme = {
  mode: SkyMode;
  isDay: boolean;
  gradient: string;        // CSS background value
  accent: string;          // hex
  particles:
    | "stars"
    | "rain"
    | "storm"
    | "snow"
    | "clouds"
    | "mist"
    | "dust"
    | "none";
  iconKind: "sun" | "moon" | "cloud" | "rain" | "storm" | "snow" | "mist";
};

/** Derive condition kind from OWM weather id 200-800+. */
function condKind(id: number): "storm" | "rain" | "snow" | "mist" | "clear" | "clouds" {
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800) return "clear";
  return "clouds";
}

/**
 * Compute the active sky theme for a city given live coords + weather id + timestamp.
 * - Uses suncalc to get sunrise/sunset/golden hour for the location.
 * - Combines time-of-day with weather to pick gradient + particles.
 *
 * `nowMs` defaults to Date.now(); pass to override (testing).
 */
export function getSkyTheme(
  lat: number,
  lon: number,
  conditionId: number,
  nowMs: number = Date.now(),
): SkyTheme {
  const date = new Date(nowMs);
  const t = SunCalc.getTimes(date, lat, lon);
  const sunrise = t.sunrise.getTime();
  const sunset = t.sunset.getTime();
  const ghMorningStart = t.goldenHourEnd.getTime() - 30 * 60 * 1000; // ~sunrise - some
  const ghMorningEnd = t.goldenHourEnd.getTime();
  const ghEveningStart = t.goldenHour.getTime();
  const ghEveningEnd = t.sunsetStart.getTime();
  const civilDawn = t.dawn.getTime();
  const civilDusk = t.dusk.getTime();

  const isDay = nowMs >= sunrise && nowMs < sunset;
  const isNight = nowMs < civilDawn || nowMs > civilDusk;
  const cond = condKind(conditionId);

  // At night, atmospheric/precipitation conditions keep the night sky look
  // and only add weather particles — so Pune (clouds) and Mumbai (mist) at 19:30
  // both get the same dark night gradient.
  if (isNight) {
    if (cond === "storm") {
      return {
        mode: "storm",
        isDay: false,
        gradient: "linear-gradient(180deg, #050709 0%, #080b10 50%, #0a0d14 100%)",
        accent: "#a78bfa",
        particles: "storm",
        iconKind: "storm",
      };
    }
    if (cond === "rain") {
      return {
        mode: "rain",
        isDay: false,
        gradient: "linear-gradient(180deg, #050813 0%, #0a0e1a 40%, #111827 100%)",
        accent: "#60a5fa",
        particles: "rain",
        iconKind: "rain",
      };
    }
    if (cond === "snow") {
      return {
        mode: "snow",
        isDay: false,
        gradient: "linear-gradient(180deg, #050813 0%, #0a0e1a 40%, #111827 100%)",
        accent: "#bae6fd",
        particles: "snow",
        iconKind: "snow",
      };
    }
    if (cond === "mist") {
      return {
        mode: "mist",
        isDay: false,
        gradient: "linear-gradient(180deg, #050813 0%, #0a0e1a 40%, #111827 100%)",
        accent: "#cbd5e1",
        particles: "mist",
        iconKind: "mist",
      };
    }
    // clouds or clear at night → fall through to the normal night/dawn/dusk logic below
  }

  // During daytime: severe weather overrides the time-of-day gradient.
  if (cond === "storm") {
    return {
      mode: "storm",
      isDay,
      gradient: "linear-gradient(180deg, #050709 0%, #080b10 50%, #0a0d14 100%)",
      accent: "#a78bfa",
      particles: "storm",
      iconKind: "storm",
    };
  }
  if (cond === "rain") {
    return {
      mode: "rain",
      isDay,
      gradient: "linear-gradient(180deg, #0d1117 0%, #151c28 55%, #1c2333 100%)",
      accent: "#60a5fa",
      particles: "rain",
      iconKind: "rain",
    };
  }
  if (cond === "snow") {
    return {
      mode: "snow",
      isDay,
      gradient: "linear-gradient(180deg, #1a2035 0%, #1e2540 55%, #252d45 100%)",
      accent: "#bae6fd",
      particles: "snow",
      iconKind: "snow",
    };
  }
  if (cond === "mist") {
    return {
      mode: "mist",
      isDay,
      gradient: "linear-gradient(180deg, #1a1814 0%, #221f18 50%, #2d2820 100%)",
      accent: "#cbd5e1",
      particles: "mist",
      iconKind: "mist",
    };
  }

  // Clear / cloudy paths now branch on time
  if (nowMs < civilDawn || nowMs > civilDusk) {
    // NIGHT
    return {
      mode: "night",
      isDay: false,
      gradient: "linear-gradient(180deg, #050813 0%, #0a0e1a 40%, #111827 100%)",
      accent: "#cbd5e1",
      particles: "stars",
      iconKind: "moon",
    };
  }
  if (nowMs >= civilDawn && nowMs < ghMorningStart) {
    // DAWN — warm cool transition
    return {
      mode: "dawn",
      isDay: false,
      gradient: "linear-gradient(180deg, #0d1322 0%, #2a1a30 45%, #6b3a45 100%)",
      accent: "#f59e0b",
      particles: "stars",
      iconKind: "sun",
    };
  }
  if (nowMs >= ghMorningStart && nowMs <= ghMorningEnd) {
    // MORNING GOLDEN HOUR
    return {
      mode: "golden-morning",
      isDay: true,
      gradient: "linear-gradient(180deg, #1a0a00 0%, #3d1f00 40%, #8b3a00 100%)",
      accent: "#ffb347",
      particles: "none",
      iconKind: "sun",
    };
  }
  if (nowMs >= ghEveningStart && nowMs <= ghEveningEnd) {
    // EVENING GOLDEN HOUR
    return {
      mode: "golden-evening",
      isDay: true,
      gradient: "linear-gradient(180deg, #2a0e00 0%, #5d2400 40%, #a04500 100%)",
      accent: "#ff9a47",
      particles: "none",
      iconKind: "sun",
    };
  }
  if (nowMs > ghEveningEnd && nowMs <= civilDusk) {
    // DUSK / blue hour
    return {
      mode: "dusk",
      isDay: false,
      gradient: "linear-gradient(180deg, #0a1024 0%, #1a2440 50%, #3a3a6e 100%)",
      accent: "#5b6dba",
      particles: "stars",
      iconKind: "moon",
    };
  }

  // DAY — clear vs cloudy
  if (cond === "clear") {
    return {
      mode: "day-clear",
      isDay: true,
      gradient: "linear-gradient(180deg, #1a6b9a 0%, #2d9fd8 55%, #87CEEB 100%)",
      accent: "#FFF4B8",
      particles: "clouds",
      iconKind: "sun",
    };
  }
  return {
    mode: "day-cloud",
    isDay: true,
    gradient: "linear-gradient(180deg, #5a6a7a 0%, #6b7888 55%, #7a8a9a 100%)",
    accent: "#94a3b8",
    particles: "clouds",
    iconKind: "cloud",
  };
}
