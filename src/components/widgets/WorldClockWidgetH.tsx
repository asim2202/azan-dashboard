"use client";

import { WORLD_CITIES, AnalogClock, getCityTime } from "./world-clock-shared";

export default function WorldClockWidgetH({ currentTime }: { currentTime: Date }) {
  return (
    <div className="h-full flex flex-col items-center select-none">
      <p className="text-base uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-muted)" }}>World Clock</p>
      <div className="flex-1 flex flex-col justify-evenly min-h-0 w-full">
        {WORLD_CITIES.map((city) => {
          const { h, m, s, digitalTime, ampm } = getCityTime(currentTime, city.timezone);
          return (
            <div key={city.name} className="flex items-center justify-center gap-4">
              <AnalogClock hours={h} minutes={m} seconds={s} size={110} />
              <div className="flex flex-col">
                <p className="text-lg font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{city.name}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold leading-tight" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{digitalTime}</span>
                  <span className="text-base font-medium" style={{ color: "var(--text-muted)" }}>{ampm}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
