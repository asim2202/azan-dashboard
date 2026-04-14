"use client";

import { Component, type ReactNode } from "react";

class WidgetErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
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
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Widget error</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WidgetWrapper({ children }: { children: ReactNode }) {
  return (
    <WidgetErrorBoundary>
      {children}
    </WidgetErrorBoundary>
  );
}
