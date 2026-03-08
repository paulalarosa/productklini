import { motion } from "framer-motion";
import { AlertTriangle, Clock, CheckCircle2, Ban } from "lucide-react";
import { useTasks } from "@/hooks/useProjectData";

export function StatusCards() {
  const { data: tasks } = useTasks();
  const allTasks = tasks ?? [];

  const urgent = allTasks.filter((t) => t.priority === "urgent" && t.status !== "done");
  const blocked = allTasks.filter((t) => t.status === "blocked");
  const inProgress = allTasks.filter((t) => t.status === "in_progress");
  const done = allTasks.filter((t) => t.status === "done");

  const cards = [
    { label: "Urgentes", value: urgent.length, icon: AlertTriangle, color: "text-status-urgent", bg: "bg-destructive/10" },
    { label: "Bloqueadas", value: blocked.length, icon: Ban, color: "text-status-blocked", bg: "bg-status-blocked/10" },
    { label: "Em Progresso", value: inProgress.length, icon: Clock, color: "text-status-develop", bg: "bg-status-develop/10" },
    { label: "Concluídas", value: `${done.length}/${allTasks.length}`, icon: CheckCircle2, color: "text-status-discovery", bg: "bg-status-discovery/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="glass-card p-3 md:p-4 flex flex-col gap-2 md:gap-3 hover:bg-accent/50 transition-colors cursor-default"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.08 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
            <div className={`p-1.5 rounded-md ${card.bg}`}>
              <card.icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${card.color}`} />
            </div>
          </div>
          <span className="text-xl md:text-2xl font-bold text-foreground">{card.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
