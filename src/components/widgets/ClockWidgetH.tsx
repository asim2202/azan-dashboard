"use client";

interface Props {
  mainTime: string;
  period: string;
  gregorian: string;
  hijri: string;
}

export default function ClockWidgetH({ mainTime, period, gregorian, hijri }: Props) {
  return (
    <div className="text-center select-none h-full flex flex-col justify-center">
      <div className="flex items-baseline justify-center gap-2">
        <span
          className="text-6xl sm:text-7xl md:text-8xl font-light tracking-tight"
          style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}
        >
          {mainTime}
        </span>
        {period && (
          <span className="text-xl sm:text-2xl font-light" style={{ color: "var(--text-muted)" }}>
            {period}
          </span>
        )}
      </div>
      <p className="mt-1 text-base font-medium" style={{ color: "var(--text-secondary)" }}>
        {gregorian}
      </p>
      <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
        {hijri}
      </p>
    </div>
  );
}
