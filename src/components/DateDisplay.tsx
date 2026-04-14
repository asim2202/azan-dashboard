"use client";

import { getHijriDate } from "@/lib/hijri";

interface DateDisplayProps {
  time: Date;
  timezone: string;
}

export default function DateDisplay({ time, timezone }: DateDisplayProps) {
  const gregorian = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  const hijri = getHijriDate(time, timezone);

  return (
    <div className="text-center select-none">
      <div className="flex items-center justify-center gap-3 text-base sm:text-lg text-white/70">
        <span>{gregorian}</span>
        <span className="text-white/30">|</span>
        <span className="font-arabic">{hijri.formatted}</span>
      </div>
    </div>
  );
}
