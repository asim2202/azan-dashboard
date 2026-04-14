"use client";

import type { WidgetProps } from "@/types/widget";

export default function AnalogClockWidget({ size, currentTime, timezone }: WidgetProps) {
  // Get hours/minutes/seconds in the target timezone
  const timeStr = currentTime.toLocaleTimeString("en-GB", { timeZone: timezone, hour12: false });
  const [h, m, s] = timeStr.split(":").map(Number);

  const hourDeg = (h % 12) * 30 + m * 0.5;
  const minuteDeg = m * 6 + s * 0.1;
  const secondDeg = s * 6;

  const clockSize = size === "S" ? 100 : size === "M" ? 160 : 220;
  const cx = clockSize / 2;

  return (
    <div className="h-full flex items-center justify-center select-none">
      <svg width={clockSize} height={clockSize} viewBox={`0 0 ${clockSize} ${clockSize}`}>
        {/* Face */}
        <circle cx={cx} cy={cx} r={cx - 2} fill="none" stroke="var(--text-faint)" strokeWidth="2" />
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const r1 = cx - 8;
          const r2 = cx - 3;
          return (
            <line key={i}
              x1={cx + r1 * Math.cos(angle)} y1={cx + r1 * Math.sin(angle)}
              x2={cx + r2 * Math.cos(angle)} y2={cx + r2 * Math.sin(angle)}
              stroke="var(--text-muted)" strokeWidth={i % 3 === 0 ? 2.5 : 1} strokeLinecap="round"
            />
          );
        })}
        {/* Hour hand */}
        <line x1={cx} y1={cx} x2={cx} y2={cx - cx * 0.45}
          stroke="var(--text-primary)" strokeWidth={3} strokeLinecap="round"
          transform={`rotate(${hourDeg} ${cx} ${cx})`}
        />
        {/* Minute hand */}
        <line x1={cx} y1={cx} x2={cx} y2={cx - cx * 0.65}
          stroke="var(--text-primary)" strokeWidth={2} strokeLinecap="round"
          transform={`rotate(${minuteDeg} ${cx} ${cx})`}
        />
        {/* Second hand */}
        <line x1={cx} y1={cx + cx * 0.1} x2={cx} y2={cx - cx * 0.7}
          stroke="var(--accent)" strokeWidth={1} strokeLinecap="round"
          transform={`rotate(${secondDeg} ${cx} ${cx})`}
        />
        {/* Center dot */}
        <circle cx={cx} cy={cx} r={3} fill="var(--accent)" />
      </svg>
    </div>
  );
}
