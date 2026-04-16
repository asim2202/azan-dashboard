"use client";

import Link from "next/link";

interface StatusBarProps {
  source: "iacad" | "calculated" | null;
  lastUpdated: string | null;
  audioReady: boolean;
  audioEnabled: boolean;
  orientation?: "auto" | "landscape" | "portrait";
  onOrientationChange?: () => void;
  onTestAzan?: () => void;
}

const ORIENT_ICONS: Record<string, string> = {
  auto: "\u{1F504}",      // 🔄
  landscape: "\u{1F5B5}", // 🖵
  portrait: "\u{1F4F1}",  // 📱
};

export default function StatusBar({
  source,
  lastUpdated,
  audioReady,
  audioEnabled,
  orientation = "auto",
  onOrientationChange,
  onTestAzan,
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
    <div className="flex items-center justify-between px-4 py-2 text-sm select-none" style={{ color: "var(--text-muted)" }}>
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
        {onTestAzan && audioReady && (
          <button
            onClick={onTestAzan}
            className="hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-faint)" }}
            title="Test Azan"
          >
            &#x1F3B5;
          </button>
        )}
        {onOrientationChange && (
          <button
            onClick={onOrientationChange}
            className="hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-faint)" }}
            title={`Layout: ${orientation}`}
          >
            {ORIENT_ICONS[orientation] || ORIENT_ICONS.auto}
          </button>
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
