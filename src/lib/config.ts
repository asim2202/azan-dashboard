import type { AppConfig } from "@/types/config";

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
    volume: 0.8,
  },
  display: {
    timeFormat: "12h",
    showSeconds: true,
  },
  dataSources: {
    iacadEnabled: true,
    weatherEnabled: true,
  },
};

export function getConfig(): AppConfig {
  const config = { ...DEFAULT_CONFIG };

  // Override from environment variables
  if (process.env.LATITUDE) config.location.latitude = parseFloat(process.env.LATITUDE);
  if (process.env.LONGITUDE) config.location.longitude = parseFloat(process.env.LONGITUDE);
  if (process.env.TIMEZONE) config.location.timezone = process.env.TIMEZONE;
  if (process.env.CITY) config.location.city = process.env.CITY;
  if (process.env.CALCULATION_METHOD) config.calculationMethod = process.env.CALCULATION_METHOD;
  if (process.env.MADHAB) config.madhab = process.env.MADHAB;

  return config;
}

// Client-side config (no env vars, fetched from API)
let cachedConfig: AppConfig | null = null;

export async function getClientConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      cachedConfig = await res.json();
      return cachedConfig!;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_CONFIG;
}

export function getDefaultConfig(): AppConfig {
  return DEFAULT_CONFIG;
}
