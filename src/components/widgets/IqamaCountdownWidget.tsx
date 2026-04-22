"use client";

import type { WidgetProps } from "@/types/widget";
import IqamaCountdownWidgetH from "./IqamaCountdownWidgetH";
import IqamaCountdownWidgetV from "./IqamaCountdownWidgetV";

export default function IqamaCountdownWidget(props: WidgetProps) {
  return props.size === "H" ? <IqamaCountdownWidgetH {...props} /> : <IqamaCountdownWidgetV {...props} />;
}
