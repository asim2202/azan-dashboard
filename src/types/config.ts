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
}

export interface AppConfig {
  location: LocationConfig;
  calculationMethod: string;
  madhab: string;
  iqamaOffsets: IqamaOffsets;
  audio: AudioConfig;
  display: DisplayConfig;
  dataSources: {
    iacadEnabled: boolean;
    weatherEnabled: boolean;
  };
}
