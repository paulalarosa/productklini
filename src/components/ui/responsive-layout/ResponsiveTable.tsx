import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key:        string;
  header:     string;
  // Se true, a coluna fica visível mesmo no mobile
  pinned?:    boolean;
  // Largura mínima da coluna em px (evita compressão excessiva)
  minWidth?:  number;
  render:     (row: T, index: number) => ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns:      Column<T>[];
  data:         T[];
  keyExtractor: (row: T, index: number) => string;
  // Colunas visíveis no mobile (por key) — padrão: apenas as pinned
  mobileColumns?: string[];
  emptyMessage?:  string;
  className?:     string;
  onRowClick?:    (row: T) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  mobileColumns,
  emptyMessage = "Nenhum item encontrado.",
  className,
  onRowClick,
}: ResponsiveTableProps<T>) {

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    // Wrapper com scroll horizontal no mobile, sem scroll no desktop
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm border-collapse" style={{ minWidth: "500px" }}>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap",
                  // Colunas não-pinned ficam ocultas abaixo de md
                  !col.pinned && !mobileColumns?.includes(col.key) && "hidden md:table-cell",
                  col.className,
                )}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={keyExtractor(row, i)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-border/50 last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-accent/40",
              )}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3",
                    !col.pinned && !mobileColumns?.includes(col.key) && "hidden md:table-cell",
                    col.className,
                  )}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
