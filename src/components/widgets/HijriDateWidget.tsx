"use client";

import type { WidgetProps } from "@/types/widget";
import HijriDateWidgetH from "./HijriDateWidgetH";
import HijriDateWidgetV from "./HijriDateWidgetV";

export default function HijriDateWidget(props: WidgetProps) {
  return props.size === "H" ? <HijriDateWidgetH {...props} /> : <HijriDateWidgetV {...props} />;
}
