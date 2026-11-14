import { startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";

export type PresetKey = "today" | "7d" | "14d" | "30d" | "this_month" | "90d" | "custom";

export interface DashboardDateRange {
  from: Date;
  to: Date;
  label: string;
  presetKey: PresetKey;
}

export const PRESETS: { key: PresetKey; label: string; bengaliLabel: string; getRange: () => { from: Date; to: Date } }[] = [
  {
    key: "today",
    label: "Today",
    bengaliLabel: "আজ",
    getRange: () => {
      const now = new Date();
      return { from: startOfDay(now), to: endOfDay(now) };
    },
  },
  {
    key: "7d",
    label: "Last 7 Days",
    bengaliLabel: "গত ৭ দিন",
    getRange: () => {
      const now = new Date();
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    },
  },
  {
    key: "14d",
    label: "Last 14 Days",
    bengaliLabel: "গত ১৪ দিন",
    getRange: () => {
      const now = new Date();
      return { from: startOfDay(subDays(now, 13)), to: endOfDay(now) };
    },
  },
  {
    key: "this_month",
    label: "This Month",
    bengaliLabel: "চলতি মাস",
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: endOfDay(now) };
    },
  },
  {
    key: "30d",
    label: "Last 30 Days",
    bengaliLabel: "গত ৩০ দিন",
    getRange: () => {
      const now = new Date();
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    },
  },
  {
    key: "90d",
    label: "Last 90 Days",
    bengaliLabel: "গত ৯০ দিন",
    getRange: () => {
      const now = new Date();
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    },
  },
];

export function getDefaultDateRange(): DashboardDateRange {
  const now = new Date();
  return {
    from: startOfDay(subDays(now, 13)),
    to: endOfDay(now),
    label: "Last 14 Days",
    presetKey: "14d",
  };
}
