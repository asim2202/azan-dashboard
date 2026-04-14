"use client";

interface ClockProps {
  time: Date;
  timezone: string;
  format: "12h" | "24h";
  showSeconds: boolean;
}

export default function Clock({ time, timezone, format, showSeconds }: ClockProps) {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: format === "12h",
  };
  if (showSeconds) {
    options.second = "2-digit";
  }

  const timeStr = time.toLocaleTimeString("en-US", options);
  const parts = timeStr.split(" ");
  const mainTime = parts[0];
  const period = parts[1] || "";

  return (
    <div className="text-center select-none">
      <div className="flex items-baseline justify-center gap-3">
        <span
          className="text-6xl portrait:text-7xl portrait:sm:text-8xl landscape:text-7xl sm:landscape:text-8xl md:landscape:text-9xl font-light tracking-tight"
          style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}
        >
          {mainTime}
        </span>
        {period && (
          <span className="text-2xl sm:text-3xl font-light" style={{ color: "var(--text-muted)" }}>
            {period}
          </span>
        )}
      </div>
    </div>
  );
}
