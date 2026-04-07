import { useState, useMemo } from "react";

export interface FilterOption {
  key: string;
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface UseSearchOptions<T> {
  data: T[];
  searchFields: (keyof T | string)[];
  filters?: FilterConfig[];
}

interface UseSearchReturn<T> {
  query: string;
  setQuery: (q: string) => void;
  activeFilters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  filtered: T[];
  total: number;
  hasActiveFilters: boolean;
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function useSearch<T extends object>({
  data,
  searchFields,
  filters = [],
}: UseSearchOptions<T>): UseSearchReturn<T> {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const setFilter = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setQuery("");
    setActiveFilters({});
  };

  const filtered = useMemo(() => {
    let result = [...data];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = typeof field === "string"
            ? getNestedValue(item, field as string)
            : item[field as keyof T];
          if (Array.isArray(value)) {
            return value.some(v => String(v).toLowerCase().includes(q));
          }
          return String(value ?? "").toLowerCase().includes(q);
        })
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value || value === "all") return;
      result = result.filter(item => {
        const itemValue = getNestedValue(item, key);
        return String(itemValue ?? "") === value;
      });
    });

    return result;
  }, [data, query, activeFilters, searchFields]);

  const hasActiveFilters = query.trim() !== "" || Object.values(activeFilters).some(v => v && v !== "all");

  return {
    query,
    setQuery,
    activeFilters,
    setFilter,
    clearFilters,
    filtered,
    total: data.length,
    hasActiveFilters,
  };
}
