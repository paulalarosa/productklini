import React from "react";
import { cn } from "@/lib/utils";

// ─── Primitivo base ───────────────────────────────────────────────────────────
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// ─── Página genérica (título + cards) ────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho da página */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Card genérico ────────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ─── Tabela ───────────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b bg-muted/40 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 border-b last:border-0 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "w-1/4 flex-none")} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Kanban ───────────────────────────────────────────────────────────────────
export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 animate-in fade-in duration-500">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="min-w-[260px] space-y-3">
          {/* Coluna header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {/* Cards */}
          {Array.from({ length: col % 2 === 0 ? 3 : 2 }).map((_, card) => (
            <div key={card} className="border rounded-lg p-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard Index (métricas + atividade) ───────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Conteúdo principal em duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-2 w-2 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Persona / Empathy Map ────────────────────────────────────────────────────
export function PersonaSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };
