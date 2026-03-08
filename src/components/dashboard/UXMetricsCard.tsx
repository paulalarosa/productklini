import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useUxMetrics } from "@/hooks/useProjectData";

export function UXMetricsCard() {
  const { data: metrics } = useUxMetrics();

  const items = (metrics ?? []).map((m) => ({
    label: m.metric_name,
    score: Number(m.score),
    previous: m.previous_score ? Number(m.previous_score) : null,
    inverted: m.metric_name.toLowerCase().includes("tempo"),
  }));

  const format = (label: string, v: number) => {
    if (label.toLowerCase().includes("tempo")) return `${v}min`;
    if (label.toLowerCase().includes("nps")) return `+${v}`;
    if (label.toLowerCase().includes("taxa")) return `${v}%`;
    return v.toString();
  };

  return (
    <div className="glass-card p-4 md:p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Métricas de UX
      </h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {items.map((m, i) => {
          const improved = m.previous !== null
            ? m.inverted ? m.score < m.previous : m.score > m.previous
            : true;
          return (
            <motion.div
              key={m.label}
              className="flex flex-col gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-xl font-bold text-foreground">{format(m.label, m.score)}</span>
                {improved ? (
                  <TrendingUp className="w-3.5 h-3.5 text-status-develop" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-status-urgent" />
                )}
              </div>
              {m.previous !== null && (
                <span className="text-[10px] text-muted-foreground">
                  Anterior: {format(m.label, m.previous)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
