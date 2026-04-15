"use client";

import type { WidgetProps } from "@/types/widget";
import { getHijriDate } from "@/lib/hijri";

export default function HijriDateWidget({ size, currentTime, timezone }: WidgetProps) {
  const hijri = getHijriDate(currentTime, timezone);

  if (size === "H") {
    return (
      <div className="h-full flex flex-col items-center justify-center select-none">
        <p className="text-2xl font-light" style={{ color: "var(--text-primary)" }}>{hijri.day}</p>
        <p className="text-sm" style={{ color: "var(--accent-text)" }}>{hijri.monthName}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hijri.year} AH</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center select-none">
      <p className="text-3xl font-light" style={{ color: "var(--text-primary)" }}>{hijri.day}</p>
      <p className="text-lg" style={{ color: "var(--accent-text)" }}>{hijri.monthName}</p>
      <p className="text-base" style={{ color: "var(--text-muted)" }}>{hijri.monthNameArabic}</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>{hijri.year} AH</p>
    </div>
  );
}
