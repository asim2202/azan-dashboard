"use client";

interface Props {
  mainTime: string;
  period: string;
  gregorian: string;
  hijri: string;
}

export default function ClockWidgetV({ mainTime, period, gregorian, hijri }: Props) {
  return (
    <div className="text-center select-none h-full flex flex-col justify-center">
      <div className="flex items-baseline justify-center gap-3">
        <span
          className="text-[9rem] font-light tracking-tight leading-none"
          style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}
        >
          {mainTime}
        </span>
        {period && (
          <span className="text-4xl font-light" style={{ color: "var(--text-muted)" }}>
            {period}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-medium" style={{ color: "var(--text-secondary)" }}>
        {gregorian}
      </p>
      <p className="text-2xl font-medium" style={{ color: "var(--text-secondary)" }}>
        {hijri}
      </p>
    </div>
  );
}
