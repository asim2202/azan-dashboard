"use client";

import type { WidgetProps } from "@/types/widget";
import QuranVerseWidgetH from "./QuranVerseWidgetH";
import QuranVerseWidgetV from "./QuranVerseWidgetV";

export default function QuranVerseWidget({ size }: WidgetProps) {
  return size === "H" ? <QuranVerseWidgetH /> : <QuranVerseWidgetV />;
}
