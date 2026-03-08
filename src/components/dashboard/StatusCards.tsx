import { motion } from "framer-motion";
import { AlertTriangle, Clock, CheckCircle2, Ban } from "lucide-react";
import { tasks } from "@/data/mockData";

export function StatusCards() {
  const urgent = tasks.filter(t => t.priority === "urgent" && t.status !== "done");
  const blocked = tasks.filter(t => t.status === "blocked");
  const inProgress = tasks.filter(t => t.status === "in_progress");
  const done = tasks.filter(t => t.status === "done");

  const totalEstimated = tasks.reduce((a, t) => a + t.estimatedDays, 0);
  const totalSpent = tasks.reduce((a, t) => a + t.daysInPhase, 0);

  const cards = [
    {
      label: "Urgentes",
      value: urgent.length,
      icon: AlertTriangle,
      color: "text-status-urgent",
      bg: "bg-status-urgent/10",
    },
    {
      label: "Bloqueadas",
      value: blocked.length,
      icon: Ban,
      color: "text-status-blocked",
      bg: "bg-status-blocked/10",
    },
    {
      label: "Em Progresso",
      value: inProgress.length,
      icon: Clock,
      color: "status-develop",
      bg: "bg-status-develop\/10",
    },
    {
      label: "Concluídas",
      value: `${done.length}/${tasks.length}`,
      icon: CheckCircle2,
      color: "status-discovery",
      bg: "bg-status-discovery\/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="glass-card p-4 flex flex-col gap-3 hover:bg-accent/50 transition-colors cursor-default"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.08 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
            <div className={`p-1.5 rounded-md ${card.bg}`}>
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
          </div>
          <span className="text-2xl font-bold text-foreground">{card.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
