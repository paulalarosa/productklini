import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { uxMetrics } from "@/data/mockData";

export function UXMetricsCard() {
  const metrics = [
    { ...uxMetrics.sus, format: (v: number) => v.toString(), inverted: false },
    { ...uxMetrics.nps, format: (v: number) => `+${v}`, inverted: false },
    { ...uxMetrics.taskSuccess, format: (v: number) => `${v}%`, inverted: false },
    { ...uxMetrics.timeOnTask, format: (v: number) => `${v}min`, inverted: true },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Métricas de UX
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m, i) => {
          const improved = m.inverted ? m.score < m.previous : m.score > m.previous;
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
                <span className="text-xl font-bold text-foreground">{m.format(m.score)}</span>
                {improved ? (
                  <TrendingUp className="w-3.5 h-3.5 text-status-develop" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-status-urgent" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Anterior: {m.format(m.previous)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
