import { type LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  // "page" ocupa min-h-[50vh], "section" ocupa min-h-[200px], "inline" sem min-h
  size?: "page" | "section" | "inline";
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = "section",
}: EmptyStateProps) {
  const minH = {
    page:    "min-h-[50vh]",
    section: "min-h-[200px]",
    inline:  "",
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${minH}`}>
      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity mt-1"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
