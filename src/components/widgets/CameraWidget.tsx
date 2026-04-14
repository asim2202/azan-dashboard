"use client";

import type { WidgetProps } from "@/types/widget";
import CameraFeed from "@/components/CameraFeed";

export default function CameraWidget({ config }: WidgetProps) {
  if (!config.camera?.enabled || !config.camera?.url) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>Camera not configured</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[150px]">
      <CameraFeed config={config.camera} />
    </div>
  );
}
