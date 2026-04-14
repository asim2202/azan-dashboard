export interface LocationConfig {
  latitude: number;
  longitude: number;
  city: string;
  timezone: string;
}

export interface IqamaOffsets {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface AudioConfig {
  enabled: boolean;
  defaultAzan: string;
  fajrAzan: string;
  iqamaSound: string;
  volume: number;
}

export interface DisplayConfig {
  timeFormat: "12h" | "24h";
  showSeconds: boolean;
  theme: "auto" | "dark" | "light";
}

export interface CameraConfig {
  enabled: boolean;
  url: string;
  type: "image" | "iframe";
  refreshInterval: number; // 0 = live stream, >0 = refresh every N seconds
}

export interface AppConfig {
  location: LocationConfig;
  calculationMethod: string;
  madhab: string;
  iqamaOffsets: IqamaOffsets;
  audio: AudioConfig;
  display: DisplayConfig;
  camera: CameraConfig;
  dataSources: {
    iacadEnabled: boolean;
    weatherEnabled: boolean;
  };
}
