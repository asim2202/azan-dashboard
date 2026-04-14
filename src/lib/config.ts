import fs from "fs";
import path from "path";
import type { AppConfig } from "@/types/config";

const CONFIG_PATH = path.join(process.cwd(), "config", "default.json");

const DEFAULT_CONFIG: AppConfig = {
  location: {
    latitude: 25.2048,
    longitude: 55.2708,
    city: "Dubai",
    timezone: "Asia/Dubai",
  },
  calculationMethod: "Dubai",
  madhab: "Shafi",
  iqamaOffsets: {
    fajr: 20,
    dhuhr: 25,
    asr: 15,
    maghrib: 5,
    isha: 15,
  },
  audio: {
    enabled: true,
    defaultAzan: "/audio/azan-makkah.mp3",
    fajrAzan: "/audio/azan-fajr.mp3",
    iqamaSound: "",
    volume: 0.8,
  },
  display: {
    timeFormat: "12h",
    showSeconds: true,
    theme: "auto",
  },
  camera: {
    enabled: false,
    url: "",
    type: "image",
    refreshInterval: 0,
  },
  layout: {
    widgets: [
      { id: "clock", size: "L", enabled: true },
      { id: "next-prayer", size: "M", enabled: true },
      { id: "prayer-times", size: "L", enabled: true },
      { id: "prayer-progress", size: "M", enabled: true },
      { id: "weather", size: "S", enabled: true },
      { id: "hijri-date", size: "S", enabled: true },
      { id: "camera", size: "M", enabled: false },
      { id: "quran-verse", size: "M", enabled: false },
      { id: "analog-clock", size: "M", enabled: false },
      { id: "iqama-countdown", size: "S", enabled: false },
    ],
  },
  dataSources: {
    iacadEnabled: true,
    weatherEnabled: true,
  },
};

// Server-side cache
let serverCache: AppConfig | null = null;

function readConfigFromDisk(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      // Deep merge with defaults to fill any missing fields
      return deepMerge(DEFAULT_CONFIG, parsed) as AppConfig;
    }
  } catch (err) {
    console.error("[Config] Failed to read config file:", err);
  }
  return { ...DEFAULT_CONFIG };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(defaults: any, overrides: any): any {
  if (
    typeof defaults !== "object" || defaults === null ||
    typeof overrides !== "object" || overrides === null ||
    Array.isArray(defaults) || Array.isArray(overrides)
  ) {
    return overrides;
  }
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (
      overrides[key] && typeof overrides[key] === "object" && !Array.isArray(overrides[key]) &&
      defaults[key] && typeof defaults[key] === "object"
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

export function getConfig(): AppConfig {
  if (serverCache) return serverCache;

  const config = readConfigFromDisk();

  // Override from environment variables (highest priority)
  if (process.env.LATITUDE) config.location.latitude = parseFloat(process.env.LATITUDE);
  if (process.env.LONGITUDE) config.location.longitude = parseFloat(process.env.LONGITUDE);
  if (process.env.TIMEZONE) config.location.timezone = process.env.TIMEZONE;
  if (process.env.CITY) config.location.city = process.env.CITY;
  if (process.env.CALCULATION_METHOD) config.calculationMethod = process.env.CALCULATION_METHOD;
  if (process.env.MADHAB) config.madhab = process.env.MADHAB;

  serverCache = config;
  return config;
}

export function saveConfig(config: AppConfig): void {
  // Write to disk
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");

  // Clear cache so next getConfig() reads fresh
  serverCache = null;
}

export function clearConfigCache(): void {
  serverCache = null;
}

export function getDefaultConfig(): AppConfig {
  return { ...DEFAULT_CONFIG };
}
