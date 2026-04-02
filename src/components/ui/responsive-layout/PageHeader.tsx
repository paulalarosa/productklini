import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title:        string;
  description?: string;
  actions?:     ReactNode;  // botões no lado direito
  className?:   string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(
      // Mobile: empilha título e ações verticalmente
      // Desktop: lado a lado
      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
