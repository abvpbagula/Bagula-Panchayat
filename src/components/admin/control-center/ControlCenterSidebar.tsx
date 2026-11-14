import React from "react";
import {
  CONTROL_CENTER_SECTIONS,
  type ControlCenterSectionId,
  type ControlCenterSectionDef,
} from "./types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ControlCenterSidebarProps {
  activeSection: ControlCenterSectionId;
  onSelectSection: (id: ControlCenterSectionId) => void;
  searchQuery?: string;
}

export const ControlCenterSidebar: React.FC<ControlCenterSidebarProps> = ({
  activeSection,
  onSelectSection,
  searchQuery = "",
}) => {
  // Filter sections by search query
  const filteredSections = React.useMemo(() => {
    const q = (searchQuery ?? "").trim().toLowerCase();
    if (!q) return CONTROL_CENTER_SECTIONS;
    return CONTROL_CENTER_SECTIONS.filter(
      (sec) =>
        (sec.label ?? "").toLowerCase().includes(q) ||
        (sec.bengaliLabel ?? "").includes(q) ||
        (sec.description ?? "").toLowerCase().includes(q) ||
        (sec.category ?? "").toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group sections by category
  const categories = React.useMemo(() => {
    const groups: { [key: string]: ControlCenterSectionDef[] } = {};
    for (const sec of filteredSections) {
      if (!groups[sec.category]) groups[sec.category] = [];
      groups[sec.category].push(sec);
    }
    return groups;
  }, [filteredSections]);

  return (
    <aside className="w-full md:w-72 lg:w-80 shrink-0 border-r bg-card/60 flex flex-col h-full select-none">
      <div className="p-3.5 border-b bg-muted/30">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center justify-between">
          <span>Administrative Modules</span>
          <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {filteredSections.length} / {CONTROL_CENTER_SECTIONS.length}
          </span>
        </p>
      </div>

      <ScrollArea className="flex-1 py-2 px-2.5">
        {Object.keys(categories).length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No governance section matches "{searchQuery}".
          </div>
        ) : (
          Object.entries(categories).map(([categoryName, items]) => (
            <div key={categoryName} className="mb-4 last:mb-2">
              <h3 className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                {categoryName}
              </h3>
              <div className="space-y-0.5 mt-1">
                {items.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => onSelectSection(sec.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-md flex items-center justify-between text-xs transition-colors group",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium shadow-xs"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-primary"
                          )}
                        />
                        <div className="truncate">
                          <div className="truncate leading-tight">{sec.label}</div>
                          <div
                            className={cn(
                              "text-[10px] font-bengali truncate mt-0.5 opacity-80",
                              isActive ? "text-primary-foreground/90" : "text-muted-foreground"
                            )}
                          >
                            {sec.bengaliLabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {sec.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "outline"}
                            className="text-[9px] px-1 py-0 h-4 font-mono font-normal"
                          >
                            {sec.badge}
                          </Badge>
                        )}
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform",
                            isActive ? "text-primary-foreground" : "text-muted-foreground/50 opacity-0 group-hover:opacity-100"
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </aside>
  );
};
