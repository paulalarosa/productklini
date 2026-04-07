import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { FilterConfig } from "@/hooks/useSearch";

interface SearchFilterProps {
  query: string;
  onQueryChange: (q: string) => void;
  filters?: FilterConfig[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  total?: number;
  filtered?: number;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  query,
  onQueryChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClear,
  hasActiveFilters = false,
  total,
  filtered,
  placeholder = "Buscar...",
  className = "",
}: SearchFilterProps) {
  const showCount = total !== undefined && filtered !== undefined && hasActiveFilters;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filters.map(filter => (
          <div key={filter.key} className="relative group">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-sm cursor-pointer hover:bg-accent transition-colors">
              <SlidersHorizontal className="w-3 h-3 text-muted-foreground shrink-0" />
              <select
                value={activeFilters[filter.key] || "all"}
                onChange={e => onFilterChange?.(filter.key, e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none cursor-pointer appearance-none pr-5 z-10"
                style={{ minWidth: 80 }}
              >
                <option value="all">{filter.label}</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-muted-foreground pointer-events-none absolute right-2" />
            </div>
          </div>
        ))}

        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}

        {showCount && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered} de {total}
          </span>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {query && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
              Busca: "{query}"
              <button onClick={() => onQueryChange("")} className="hover:text-primary/70 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === "all") return null;
            const filterConfig = filters.find(f => f.key === key);
            const optionLabel = filterConfig?.options.find(o => o.value === value)?.label || value;
            return (
              <span key={key} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-medium border border-border shadow-sm">
                {filterConfig?.label}: {optionLabel}
                <button onClick={() => onFilterChange?.(key, "all")} className="hover:text-foreground transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
