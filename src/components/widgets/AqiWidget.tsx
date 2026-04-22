"use client";

import type { WidgetProps } from "@/types/widget";
import AqiWidgetH from "./AqiWidgetH";
import AqiWidgetV from "./AqiWidgetV";

export default function AqiWidget(props: WidgetProps) {
  return props.size === "H" ? <AqiWidgetH {...props} /> : <AqiWidgetV {...props} />;
}
