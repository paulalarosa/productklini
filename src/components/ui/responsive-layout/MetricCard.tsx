import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label:   string;
  value:   string | number;
  change?: string;
  trend?:  "up" | "down" | "neutral";
  icon?:   ReactNode;
}

export function MetricCard({ label, value, change, trend, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {change && (
        <p className={cn(
          "text-xs font-medium",
          trend === "up"      && "text-green-600 dark:text-green-400",
          trend === "down"    && "text-destructive",
          trend === "neutral" && "text-muted-foreground",
        )}>
          {change}
        </p>
      )}
    </div>
  );
}
