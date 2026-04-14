"use client";

import { Component, type ReactNode } from "react";
import type { WidgetSize } from "@/types/config";
import { getColSpan } from "@/lib/widget-registry";

interface WidgetWrapperProps {
  widgetId: string;
  size: WidgetSize;
  children: ReactNode;
}

// Error boundary to prevent one widget from crashing the whole dashboard
class WidgetErrorBoundary extends Component<
  { children: ReactNode; widgetId: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; widgetId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Widget error
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WidgetWrapper({ widgetId, size, children }: WidgetWrapperProps) {
  const colSpan = getColSpan(widgetId, size);

  const padding = size === "S" ? "p-3" : size === "M" ? "p-4" : "p-5";

  return (
    <div
      className={`rounded-xl ${padding} overflow-hidden`}
      style={{
        gridColumn: `span ${colSpan}`,
        background: "var(--card-bg)",
        minHeight: size === "S" ? "100px" : size === "M" ? "140px" : "180px",
      }}
    >
      <WidgetErrorBoundary widgetId={widgetId}>
        {children}
      </WidgetErrorBoundary>
    </div>
  );
}
