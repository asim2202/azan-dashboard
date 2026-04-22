"use client";

import type { WidgetProps } from "@/types/widget";
import AnalogClockWidgetH from "./AnalogClockWidgetH";
import AnalogClockWidgetV from "./AnalogClockWidgetV";

export default function AnalogClockWidget(props: WidgetProps) {
  return props.size === "H" ? <AnalogClockWidgetH {...props} /> : <AnalogClockWidgetV {...props} />;
}
