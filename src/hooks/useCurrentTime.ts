"use client";

import { useState, useEffect } from "react";

// Fixed date for SSR to avoid hydration mismatch
const SSR_DATE = new Date(0);

export function useCurrentTime() {
  const [time, setTime] = useState(SSR_DATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return { time, mounted };
}
