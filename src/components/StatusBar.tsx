"use client";

import Link from "next/link";

interface StatusBarProps {
  source: "iacad" | "calculated" | null;
  lastUpdated: string | null;
  audioReady: boolean;
  audioEnabled: boolean;
}

export default function StatusBar({
  source,
  lastUpdated,
  audioReady,
  audioEnabled,
}: StatusBarProps) {
  const sourceLabel = source === "iacad" ? "IACAD" : source === "calculated" ? "Calculated" : "Loading...";

  const updatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "--:--";

  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs text-white/30 select-none">
      <div className="flex items-center gap-4">
        <span>Source: {sourceLabel}</span>
        <span>Updated: {updatedStr}</span>
      </div>
      <div className="flex items-center gap-3">
        {audioEnabled ? (
          audioReady ? (
            <span className="text-green-400/60" title="Audio ready">&#x1F50A; Ready</span>
          ) : (
            <span className="text-amber-400/60" title="Tap to enable audio">&#x1F507; Tap to enable</span>
          )
        ) : (
          <span title="Audio disabled">&#x1F507; Off</span>
        )}
        <Link
          href="/settings"
          className="text-white/30 hover:text-white/60 transition-colors"
          title="Settings"
        >
          &#x2699;&#xFE0F;
        </Link>
      </div>
    </div>
  );
}
