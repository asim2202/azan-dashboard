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

export interface PreIqamaAlertOffsets {
  fajr: number;    // minutes before iqama, 0 = disabled
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
  preIqamaAlert: {
    enabled: boolean;
    sound: string;
    offsets: PreIqamaAlertOffsets;
  };
}

export interface DisplayConfig {
  timeFormat: "12h" | "24h";
  showSeconds: boolean;
  theme: "auto" | "dark" | "light";
}

export interface AnimationsConfig {
  enabled: boolean;          // master switch — disables everything below if false
  stars: boolean;            // twinkling stars at night
  weatherEffects: boolean;   // rain/snow overlay
  gradientDrift: boolean;    // slow background gradient movement
  cardEntrance: boolean;     // fade/slide-in on load
  cardShimmer: boolean;      // diagonal shimmer sweep on cards
  prayerGlow: boolean;       // pulsing glow on the next prayer row
  weatherIcons: boolean;     // spin/float/bounce/pulse on weather icons
}

export interface CameraConfig {
  enabled: boolean;
  url: string;
  type: "image" | "iframe";
  refreshInterval: number;
}

export type WidgetSize = "H" | "V";

export interface WidgetGridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}

export interface LayoutConfig {
  widgets: WidgetGridItem[];
}

export interface AppConfig {
  location: LocationConfig;
  calculationMethod: string;
  madhab: string;
  iqamaOffsets: IqamaOffsets;
  audio: AudioConfig;
  display: DisplayConfig;
  animations: AnimationsConfig;
  camera: CameraConfig;
  layout: LayoutConfig;
  dataSources: {
    iacadEnabled: boolean;
    weatherEnabled: boolean;
  };
}
