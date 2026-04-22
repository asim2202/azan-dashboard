"use client";

import type { WidgetProps } from "@/types/widget";
import HadithWidgetH from "./HadithWidgetH";
import HadithWidgetV from "./HadithWidgetV";

export default function HadithWidget({ size }: WidgetProps) {
  return size === "H" ? <HadithWidgetH /> : <HadithWidgetV />;
}
