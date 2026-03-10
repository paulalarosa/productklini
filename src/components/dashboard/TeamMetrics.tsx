import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useProjectData";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

export function TeamMetrics() {
  const { data: tasks } = useTasks();
  const allTasks = tasks ?? [];

  // Velocity: tasks completed per "sprint" (simulated weekly buckets)
  const velocityData = useMemo(() => {
    const done = (tasks ?? []).filter((t) => t.status === "done");
    const sorted = [...done].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    const weeks: Record<string, number> = {};
    sorted.forEach((t) => {
      const d = new Date(t.updated_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks).slice(-8).map(([week, count]) => ({
      sprint: new Date(week).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      tarefas: count,
    }));
  }, [tasks]);

  // Burndown: remaining tasks over time
  const burndownData = useMemo(() => {
    const currentTasks = (tasks ?? []);
    const total = currentTasks.length;
    const sorted = [...currentTasks].filter(t => t.status === "done").sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    const points: { dia: string; restantes: number; ideal: number }[] = [];
    let completed = 0;
    const days = new Set<string>();
    sorted.forEach((t) => {
      const day = new Date(t.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      if (!days.has(day)) {
        days.add(day);
        completed++;
        points.push({ dia: day, restantes: total - completed, ideal: Math.max(0, total - (points.length * (total / Math.max(sorted.length, 1)))) });
      } else {
        completed++;
        points[points.length - 1].restantes = total - completed;
      }
    });
    if (points.length === 0) {
      points.push({ dia: "Início", restantes: total, ideal: total });
      points.push({ dia: "Fim", restantes: 0, ideal: 0 });
    }
    return points;
  }, [tasks]);

  // Workload per assignee
  const workloadData = useMemo(() => {
    const assignees: Record<string, { total: number; done: number }> = {};
    (tasks ?? []).forEach((t) => {
      const name = t.assignee || "Sem atribuição";
      if (!assignees[name]) assignees[name] = { total: 0, done: 0 };
      assignees[name].total++;
      if (t.status === "done") assignees[name].done++;
    });
    return Object.entries(assignees).map(([name, v]) => ({
      nome: name.length > 12 ? name.slice(0, 12) + "..." : name,
      total: v.total,
      concluídas: v.done,
      pendentes: v.total - v.done,
    }));
  }, [tasks]);

  // Summary stats
  const stats = useMemo(() => {
    const currentTasks = (tasks ?? []);
    const done = currentTasks.filter((t) => t.status === "done").length;
    const inProgress = currentTasks.filter((t) => t.status === "in_progress").length;
    const avgDays = currentTasks.filter(t => t.days_in_phase > 0).reduce((s, t) => s + t.days_in_phase, 0) / Math.max(currentTasks.filter(t => t.days_in_phase > 0).length, 1);
    const blocked = currentTasks.filter((t) => t.status === "blocked").length;
    return [
      { label: "Concluídas", value: done, color: "text-status-develop" },
      { label: "Em andamento", value: inProgress, color: "text-status-discovery" },
      { label: "Bloqueadas", value: blocked, color: "text-destructive" },
      { label: "Média dias/tarefa", value: avgDays.toFixed(1), color: "text-status-define" },
    ];
  }, [tasks]);

  const tooltipStyle = { background: "hsl(228, 12%, 11%)", border: "1px solid hsl(228, 10%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 20%, 92%)" };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} className="glass-card p-4 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Velocity */}
        <motion.div className="glass-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Velocity (Tarefas/Sprint)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis dataKey="sprint" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="tarefas" fill="hsl(252, 80%, 65%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Burndown */}
        <motion.div className="glass-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Burndown Chart</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={burndownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis dataKey="dia" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area type="monotone" dataKey="restantes" stroke="hsl(214, 90%, 60%)" fill="hsl(214, 90%, 60%)" fillOpacity={0.2} />
              <Area type="monotone" dataKey="ideal" stroke="hsl(215, 12%, 40%)" fill="none" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Workload */}
        <motion.div className="glass-card p-4 md:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Carga de Trabalho por Membro</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis dataKey="nome" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="concluídas" stackId="a" fill="hsl(160, 70%, 50%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pendentes" stackId="a" fill="hsl(214, 90%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
