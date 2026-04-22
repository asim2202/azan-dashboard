"use client";

import type { WidgetProps } from "@/types/widget";
import { getHijriDate } from "@/lib/hijri";

export default function HijriDateWidgetV({ currentTime, timezone }: WidgetProps) {
  const hijri = getHijriDate(currentTime, timezone);
  return (
    <div className="h-full flex flex-col items-center justify-center select-none">
      <p className="text-4xl font-light" style={{ color: "var(--text-primary)" }}>{hijri.day}</p>
      <p className="text-xl" style={{ color: "var(--accent-text)" }}>{hijri.monthName}</p>
      <p className="text-lg" style={{ color: "var(--text-muted)" }}>{hijri.monthNameArabic}</p>
      <p className="text-base mt-1" style={{ color: "var(--text-faint)" }}>{hijri.year} AH</p>
    </div>
  );
}
