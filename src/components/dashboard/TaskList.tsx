import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useProjectData";
import type { DbTask } from "@/lib/api";

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Andamento",
  review: "Em Revisão",
  done: "Concluído",
  blocked: "Bloqueado",
};

const statusDot: Record<string, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-status-develop",
  review: "bg-status-discovery",
  done: "bg-status-develop",
  blocked: "bg-status-urgent",
};

const moduleLabels: Record<string, { label: string; color: string }> = {
  ux: { label: "UX", color: "bg-status-discovery/10 status-discovery" },
  ui: { label: "UI", color: "bg-status-define/10 status-define" },
  dev: { label: "DEV", color: "bg-status-develop/10 status-develop" },
};

function TaskRow({ task, index }: { task: DbTask; index: number }) {
  const isOverdue = task.days_in_phase > task.estimated_days && task.status !== "done";
  const mod = moduleLabels[task.module] ?? { label: task.module, color: "" };

  return (
    <motion.div
      className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-3 hover:bg-accent/50 transition-colors rounded-md"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[task.status] ?? "bg-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm font-medium text-foreground truncate">{task.title}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground">{statusLabels[task.status] ?? task.status}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${mod.color}`}>
        {mod.label}
      </span>
      <div className="text-right shrink-0">
        <span className={`text-[10px] md:text-xs ${isOverdue ? "text-status-urgent font-medium" : "text-muted-foreground"}`}>
          {task.days_in_phase}d/{task.estimated_days}d
        </span>
      </div>
      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-secondary flex items-center justify-center text-[9px] md:text-[10px] font-semibold text-secondary-foreground shrink-0">
        {task.avatar ?? "?"}
      </div>
    </motion.div>
  );
}

export function TaskList() {
  const { data: tasks, isLoading } = useTasks();

  const activeTasks = (tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const priority: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3);
    });

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-3 md:px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isLoading ? "Carregando..." : `Tarefas Ativas (${activeTasks.length})`}
        </h3>
      </div>
      <div className="divide-y divide-border/50">
        {activeTasks.map((task, i) => (
          <TaskRow key={task.id} task={task} index={i} />
        ))}
      </div>
    </div>
  );
}
