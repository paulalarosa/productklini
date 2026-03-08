import { motion } from "framer-motion";
import { tasks, type ProjectTask, type TaskStatus } from "@/data/mockData";

const statusLabels: Record<TaskStatus, string> = {
  todo: "A Fazer",
  in_progress: "Em Andamento",
  review: "Em Revisão",
  done: "Concluído",
  blocked: "Bloqueado",
};

const statusDot: Record<TaskStatus, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-status-develop",
  review: "bg-status-discovery",
  done: "bg-status-develop",
  blocked: "bg-status-urgent",
};

const moduleLabels: Record<string, { label: string; color: string }> = {
  ux: { label: "UX", color: "bg-status-discovery\/10 status-discovery" },
  ui: { label: "UI", color: "bg-status-define\/10 status-define" },
  dev: { label: "DEV", color: "bg-status-develop\/10 status-develop" },
};

function TaskRow({ task, index }: { task: ProjectTask; index: number }) {
  const isOverdue = task.daysInPhase > task.estimatedDays && task.status !== "done";
  const mod = moduleLabels[task.module];

  return (
    <motion.div
      className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors rounded-md group"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[task.status]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{statusLabels[task.status]}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${mod.color}`}>
        {mod.label}
      </span>
      <div className="text-right shrink-0 w-20">
        <span className={`text-xs ${isOverdue ? "text-status-urgent font-medium" : "text-muted-foreground"}`}>
          {task.daysInPhase}d / {task.estimatedDays}d
        </span>
      </div>
      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-secondary-foreground shrink-0">
        {task.avatar}
      </div>
    </motion.div>
  );
}

export function TaskList() {
  const activeTasks = tasks.filter(t => t.status !== "done").sort((a, b) => {
    const priority = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tarefas Ativas ({activeTasks.length})
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
