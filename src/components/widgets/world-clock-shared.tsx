"use client";

export const WORLD_CITIES = [
  { name: "Toronto", timezone: "America/Toronto" },
  { name: "Kanpur", timezone: "Asia/Kolkata" },
  { name: "Houston", timezone: "America/Chicago" },
];

export function getPhaseColors(hour: number) {
  if (hour >= 7 && hour < 17) {
    return { bg: "rgba(135,206,235,0.15)", border: "rgba(135,206,235,0.4)", handColor: "var(--text-primary)", tickColor: "var(--text-muted)", secColor: "#e8a838" };
  } else if (hour >= 5 && hour < 7) {
    return { bg: "rgba(255,183,77,0.12)", border: "rgba(255,183,77,0.35)", handColor: "var(--text-primary)", tickColor: "var(--text-muted)", secColor: "#f4a62a" };
  } else if (hour >= 17 && hour < 19) {
    return { bg: "rgba(255,138,101,0.12)", border: "rgba(255,138,101,0.3)", handColor: "var(--text-primary)", tickColor: "var(--text-muted)", secColor: "#ef8a5a" };
  } else {
    return { bg: "rgba(30,50,90,0.25)", border: "rgba(80,120,200,0.3)", handColor: "var(--text-secondary)", tickColor: "var(--text-faint)", secColor: "#6b8ec9" };
  }
}

export function AnalogClock({ hours, minutes, seconds, size = 80 }: { hours: number; minutes: number; seconds: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const phase = getPhaseColors(hours);

  const secAngle = (seconds / 60) * 360;
  const minAngle = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hrAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

  function handCoords(angle: number, length: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
  }

  const hourEnd = handCoords(hrAngle, r * 0.5);
  const minEnd = handCoords(minAngle, r * 0.72);
  const secEnd = handCoords(secAngle, r * 0.8);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMain = i % 3 === 0;
    const innerR = r * (isMain ? 0.78 : 0.85);
    const outerR = r * 0.93;
    return { x1: cx + innerR * Math.cos(angle), y1: cy + innerR * Math.sin(angle), x2: cx + outerR * Math.cos(angle), y2: cy + outerR * Math.sin(angle), isMain };
  });

  const isDay = hours >= 6 && hours < 18;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill={phase.bg} stroke={phase.border} strokeWidth="1.5" />
      <text x={cx} y={cy - r * 0.55} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.1}>
        {isDay ? "☀" : "☽"}
      </text>
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={phase.tickColor} strokeWidth={t.isMain ? 1.8 : 0.8} strokeLinecap="round" />
      ))}
      <line x1={cx} y1={cy} x2={hourEnd.x} y2={hourEnd.y}
        stroke={phase.handColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minEnd.x} y2={minEnd.y}
        stroke={phase.handColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={secEnd.x} y2={secEnd.y}
        stroke={phase.secColor} strokeWidth="0.8" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2" fill={phase.handColor} />
    </svg>
  );
}

export function getCityTime(currentTime: Date, timezone: string) {
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone, hour: "numeric", minute: "numeric", second: "numeric", hour12: false };
  const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(currentTime);
  const h = parseInt(parts.find(p => p.type === "hour")?.value || "0");
  const m = parseInt(parts.find(p => p.type === "minute")?.value || "0");
  const s = parseInt(parts.find(p => p.type === "second")?.value || "0");
  const timeStr = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: timezone, hour12: true });
  const timeParts = timeStr.split(" ");
  return { h, m, s, digitalTime: timeParts[0], ampm: timeParts[1] || "" };
}
