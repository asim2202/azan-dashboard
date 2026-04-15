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
    <div className="flex items-center justify-between px-4 py-2 text-xs select-none" style={{ color: "var(--text-faint)" }}>
      <div className="flex items-center gap-4">
        <span>Source: {sourceLabel}</span>
        <span>Updated: {updatedStr}</span>
      </div>
      <div className="flex items-center gap-3">
        {audioEnabled ? (
          audioReady ? (
            <span style={{ color: "var(--status-green)" }} title="Audio ready">&#x1F50A;</span>
          ) : (
            <span style={{ color: "var(--status-amber)" }} title="Tap to enable audio">&#x1F507;</span>
          )
        ) : (
          <span title="Audio disabled">&#x1F507;</span>
        )}
        <Link
          href="/settings"
          className="hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-faint)" }}
          title="Settings"
        >
          &#x2699;&#xFE0F;
        </Link>
      </div>
    </div>
  );
}
