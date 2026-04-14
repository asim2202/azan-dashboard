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

  // Split into time and period (AM/PM)
  const parts = timeStr.split(" ");
  const mainTime = parts[0];
  const period = parts[1] || "";

  return (
    <div className="text-center select-none">
      <div className="flex items-baseline justify-center gap-3">
        <span
          className="text-7xl sm:text-8xl md:text-9xl font-light tracking-tight text-white"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {mainTime}
        </span>
        {period && (
          <span className="text-2xl sm:text-3xl text-white/60 font-light">
            {period}
          </span>
        )}
      </div>
    </div>
  );
}
