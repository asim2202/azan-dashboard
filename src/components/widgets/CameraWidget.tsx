"use client";

import type { WidgetProps } from "@/types/widget";
import CameraWidgetH from "./CameraWidgetH";
import CameraWidgetV from "./CameraWidgetV";

export default function CameraWidget(props: WidgetProps) {
  return props.size === "H" ? <CameraWidgetH {...props} /> : <CameraWidgetV {...props} />;
}
