import React, { useState } from "react";
import { format, subDays, startOfMonth, startOfDay, endOfDay, isSameDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, ChevronDown, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  PRESETS,
  type PresetKey,
  type DashboardDateRange,
} from "@/lib/dashboardDateRangeUtils";

export type { PresetKey, DashboardDateRange };

interface DashboardDateRangePickerProps {
  value: DashboardDateRange;
  onChange: (range: DashboardDateRange) => void;
  className?: string;
  showPresetsDropdown?: boolean;
}

export function DashboardDateRangePicker({
  value,
  onChange,
  className,
}: DashboardDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });

  const handlePresetSelect = (preset: (typeof PRESETS)[number]) => {
    const range = preset.getRange();
    setTempRange(range);
    onChange({
      from: range.from,
      to: range.to,
      label: preset.label,
      presetKey: preset.key,
    });
    setOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from && range?.to) {
      onChange({
        from: startOfDay(range.from),
        to: endOfDay(range.to),
        label: `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`,
        presetKey: "custom",
      });
    } else if (range?.from && !range.to) {
      // Single day selected so far
      onChange({
        from: startOfDay(range.from),
        to: endOfDay(range.from),
        label: format(range.from, "MMM d, yyyy"),
        presetKey: "custom",
      });
    }
  };

  const handleResetToDefault = () => {
    const defaultRange = getDefaultDateRange();
    setTempRange({ from: defaultRange.from, to: defaultRange.to });
    onChange(defaultRange);
    setOpen(false);
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 px-3 gap-2 text-xs font-semibold rounded-xl bg-white/90 border-border/70 shadow-xs hover:border-primary/50 transition-all",
              open && "border-primary ring-2 ring-primary/10"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground font-medium">
              {value.presetKey !== "custom" ? (
                <>
                  <span className="font-bold">{value.label}</span>
                  <span className="text-muted-foreground ml-1.5 hidden sm:inline text-[11px]">
                    ({format(value.from, "MMM d")} – {format(value.to, "MMM d, yyyy")})
                  </span>
                </>
              ) : (
                <span>
                  {format(value.from, "MMM d")} – {format(value.to, "MMM d, yyyy")}
                </span>
              )}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-0.5" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-xl border-border/70 z-50 bg-white"
          align="end"
          sideOffset={8}
        >
          <div className="flex flex-col md:flex-row">
            {/* Presets Sidebar */}
            <div className="w-full md:w-44 p-3 bg-slate-50/80 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-2">
                  Quick Ranges (তারিখ সীমা)
                </p>
                <div className="space-y-1">
                  {PRESETS.map((preset) => {
                    const isSelected = value.presetKey === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "hover:bg-slate-200/70 text-slate-700"
                        )}
                      >
                        <div className="flex flex-col">
                          <span>{preset.label}</span>
                          <span className={cn("text-[10px] leading-tight", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {preset.bengaliLabel}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-slate-200/60 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to 14-Day Default</span>
                </button>
              </div>
            </div>

            {/* Calendar View */}
            <div className="p-3">
              <div className="px-2 py-1 mb-2 border-b border-border/30 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Custom Calendar Selection
                </span>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                  Select start &amp; end dates
                </Badge>
              </div>

              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value.from}
                selected={tempRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                disabled={(date) => date > new Date()}
                className="rounded-md"
              />

              <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground px-2">
                <div>
                  Active:{" "}
                  <strong className="text-foreground">
                    {format(value.from, "MMM d, yyyy")}
                  </strong>{" "}
                  –{" "}
                  <strong className="text-foreground">
                    {format(value.to, "MMM d, yyyy")}
                  </strong>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs px-3 font-semibold rounded-lg"
                  onClick={() => setOpen(false)}
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
