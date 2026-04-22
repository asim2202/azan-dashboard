"use client";

import NewsTickerH from "./NewsTickerH";
import NewsTickerV from "./NewsTickerV";

export default function NewsTicker({ size = "H" }: { size?: "H" | "V" }) {
  return size === "H" ? <NewsTickerH /> : <NewsTickerV />;
}
