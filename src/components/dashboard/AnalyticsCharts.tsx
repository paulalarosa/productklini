import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks, useUxMetrics } from "@/hooks/useProjectData";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  ux: "hsl(214, 90%, 60%)",
  ui: "hsl(270, 70%, 60%)",
  dev: "hsl(160, 70%, 50%)",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "hsl(215, 12%, 50%)",
  in_progress: "hsl(160, 70%, 50%)",
  review: "hsl(214, 90%, 60%)",
  done: "hsl(160, 70%, 40%)",
  blocked: "hsl(0, 72%, 55%)",
};

const tooltipStyle = {
  background: "hsl(228, 12%, 11%)",
  border: "1px solid hsl(228, 10%, 18%)",
  borderRadius: "8px",
  fontSize: "11px",
  color: "hsl(210, 20%, 92%)",
};

export function AnalyticsCharts() {
  const { data: tasks } = useTasks();
  const { data: metrics } = useUxMetrics();
  const allTasks = tasks ?? [];

  const moduleDistribution = useMemo(() => {
    const counts = { ux: 0, ui: 0, dev: 0 };
    allTasks.forEach((t) => { if (t.module in counts) counts[t.module as keyof typeof counts]++; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [allTasks]);

  const statusDistribution = useMemo(() => {
    const labels: Record<string, string> = { todo: "A Fazer", in_progress: "Em Andamento", review: "Revisão", done: "Concluído", blocked: "Bloqueado" };
    const counts: Record<string, number> = {};
    allTasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: labels[key] || key, value, key }));
  }, [allTasks]);

  const timeComparison = useMemo(() => {
    return allTasks
      .filter((t) => t.days_in_phase > 0)
      .slice(0, 6)
      .map((t) => ({
        name: t.title.length > 15 ? t.title.slice(0, 15) + "…" : t.title,
        estimado: t.estimated_days,
        real: t.days_in_phase,
      }));
  }, [allTasks]);

  const uxMetricsData = useMemo(() => {
    return (metrics ?? []).map((m) => ({
      name: m.metric_name.length > 12 ? m.metric_name.slice(0, 12) + "…" : m.metric_name,
      atual: Number(m.score),
      anterior: m.previous_score ? Number(m.previous_score) : 0,
    }));
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
      {/* Distribution by module */}
      <motion.div className="glass-card p-3 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tarefas por Módulo</h3>
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={moduleDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {moduleDistribution.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || "#666"} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Status distribution */}
      <motion.div className="glass-card p-3 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Status das Tarefas</h3>
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9 }} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusDistribution.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "#666"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Time comparison */}
      <motion.div className="glass-card p-3 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tempo Estimado vs Real</h3>
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis type="number" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 8 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "9px" }} />
              <Bar dataKey="estimado" fill="hsl(214, 90%, 60%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="real" fill="hsl(270, 70%, 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* UX Metrics evolution */}
      <motion.div className="glass-card p-3 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Evolução Métricas UX</h3>
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={uxMetricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 8 }} interval={0} angle={-20} textAnchor="end" height={45} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 9 }} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "9px" }} />
              <Bar dataKey="anterior" fill="hsl(215, 12%, 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="atual" fill="hsl(160, 70%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
