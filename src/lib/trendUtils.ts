export interface TrendInfo {
  pct: number;
  direction: "up" | "down" | "neutral";
  formattedText: string;
  prevValue: number;
  currentValue: number;
}

export function calculateTrend(current: number, previous: number): TrendInfo {
  if (previous === 0) {
    if (current === 0) {
      return { pct: 0, direction: "neutral", formattedText: "0%", prevValue: 0, currentValue: current };
    }
    return { pct: 100, direction: "up", formattedText: "+100%", prevValue: 0, currentValue: current };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 1000) / 10;
  if (pct > 0) {
    return { pct, direction: "up", formattedText: `+${pct}%`, prevValue: previous, currentValue: current };
  } else if (pct < 0) {
    return { pct: Math.abs(pct), direction: "down", formattedText: `${pct}%`, prevValue: previous, currentValue: current };
  }
  return { pct: 0, direction: "neutral", formattedText: "0%", prevValue: previous, currentValue: current };
}
