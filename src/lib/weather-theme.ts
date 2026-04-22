/**
 * Dynamic weather-based background gradients inspired by Apple Weather.
 * Returns a CSS gradient string based on weather code and hour of day.
 * All gradients are medium-to-dark to ensure white text remains readable.
 */

export type TimePhase = "night" | "dawn" | "day" | "dusk";

/**
 * Resolve the current phase of day from the actual sun events when we know them.
 * Dawn = from ~30 min before sunrise to ~20 min after.
 * Day  = from sunrise+20min to maghrib-20min.
 * Dusk = from maghrib-20min to maghrib+15min (short window around actual sunset).
 * Night = everything else.
 *
 * Falls back to crude hour-based ranges when sun times aren't available yet.
 */
export function getTimePhase(
  now: Date,
  sunrise?: Date | null,
  maghrib?: Date | null
): TimePhase {
  if (sunrise && maghrib) {
    const t = now.getTime();
    const sr = sunrise.getTime();
    const mg = maghrib.getTime();
    const dawnStart = sr - 30 * 60000;
    const dayStart = sr + 20 * 60000;
    const duskStart = mg - 20 * 60000;
    const nightStart = mg + 15 * 60000;
    if (t >= dawnStart && t < dayStart) return "dawn";
    if (t >= dayStart && t < duskStart) return "day";
    if (t >= duskStart && t < nightStart) return "dusk";
    return "night";
  }
  // Fallback: hour-only (used briefly before prayer data loads)
  const hour = now.getHours();
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

type WeatherCategory = "clear" | "partly-cloudy" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

function getWeatherCategory(code: number): WeatherCategory {
  if (code <= 1) return "clear";
  if (code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "fog";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code >= 61 && code <= 65 || code >= 80 && code <= 82) return "rain";
  if (code >= 71 && code <= 75) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

// Gradient definitions: [top, middle, bottom] colors
const GRADIENTS: Record<WeatherCategory, Record<TimePhase, [string, string, string]>> = {
  clear: {
    night: ["#0a1628", "#0f1f3d", "#162853"],
    dawn:  ["#2d1b4e", "#8b3a3a", "#d4975a"],
    day:   ["#1565c0", "#1e88c8", "#47a3db"],
    dusk:  ["#1a1040", "#7b2d50", "#d47a3a"],
  },
  "partly-cloudy": {
    night: ["#111b2e", "#182640", "#1e3050"],
    dawn:  ["#2a1e42", "#7a4040", "#b88050"],
    day:   ["#2e6a8e", "#4a8ab0", "#6aa0c0"],
    dusk:  ["#1a1238", "#603050", "#a86840"],
  },
  cloudy: {
    night: ["#141820", "#1c222e", "#252b38"],
    dawn:  ["#262028", "#4a3a3e", "#6a5a58"],
    day:   ["#3a4a5a", "#506878", "#688090"],
    dusk:  ["#1e1820", "#3e3040", "#5a4a50"],
  },
  fog: {
    night: ["#161a22", "#1e242e", "#282e38"],
    dawn:  ["#2a2428", "#4a4040", "#6a5858"],
    day:   ["#4a5560", "#5a6a78", "#728898"],
    dusk:  ["#201c22", "#3a3238", "#524a50"],
  },
  drizzle: {
    night: ["#101822", "#182430", "#1e2e3e"],
    dawn:  ["#221e30", "#3e3440", "#5a5060"],
    day:   ["#3a5068", "#4a6580", "#5a7a95"],
    dusk:  ["#181420", "#322838", "#4a4050"],
  },
  rain: {
    night: ["#0c1420", "#142030", "#1a2838"],
    dawn:  ["#1e1828", "#34303e", "#4a4858"],
    day:   ["#2e4050", "#3e5868", "#4a6878"],
    dusk:  ["#141018", "#282230", "#3e3848"],
  },
  snow: {
    night: ["#141822", "#1e2430", "#283040"],
    dawn:  ["#282430", "#484050", "#686068"],
    day:   ["#4a5a6a", "#607080", "#788a98"],
    dusk:  ["#201e28", "#3a3440", "#544e58"],
  },
  storm: {
    night: ["#080c14", "#0e141e", "#141a28"],
    dawn:  ["#1a1420", "#2e2430", "#3e3440"],
    day:   ["#202830", "#2e3840", "#3e4a55"],
    dusk:  ["#100c14", "#201820", "#302830"],
  },
};

export function getWeatherGradient(
  weatherCode: number | undefined,
  now: Date,
  sunrise?: Date | null,
  maghrib?: Date | null
): string {
  const category = weatherCode !== undefined ? getWeatherCategory(weatherCode) : "clear";
  const phase = getTimePhase(now, sunrise, maghrib);
  const [top, mid, bottom] = GRADIENTS[category][phase];
  return `linear-gradient(to bottom, ${top}, ${mid}, ${bottom})`;
}

/**
 * Returns whether the weather theme is always dark-text-friendly.
 * Since all our gradients are medium-to-dark, we always use "theme-dark".
 */
export function getWeatherThemeClass(): "theme-dark" {
  return "theme-dark";
}
