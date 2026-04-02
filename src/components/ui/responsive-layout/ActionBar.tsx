import React, { useState, ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  // Ações sempre visíveis (ex: botão principal)
  primary:    ReactNode;
  // Filtros/ações secundárias — ocultas no mobile por padrão
  secondary?: ReactNode;
}

export function ActionBar({ primary, secondary }: ActionBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Linha principal */}
      <div className="flex items-center gap-2">
        {primary}
        {/* Botão de filtros — só aparece no mobile quando há secundários */}
        {secondary && (
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={cn(
              "sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-colors",
              filtersOpen
                ? "bg-primary/10 text-primary border-primary/30"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {filtersOpen
              ? <X className="w-3.5 h-3.5" />
              : <SlidersHorizontal className="w-3.5 h-3.5" />
            }
            Filtros
          </button>
        )}
        {/* Secundários sempre visíveis no desktop */}
        {secondary && (
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {secondary}
          </div>
        )}
      </div>

      {/* Secundários expandidos no mobile */}
      {secondary && filtersOpen && (
        <div className="flex sm:hidden items-center gap-2 flex-wrap p-3 rounded-lg bg-muted/30 border border-border/50">
          {secondary}
        </div>
      )}
    </div>
  );
}
