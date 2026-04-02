import { AlertTriangle, Clock, CheckCircle2, Ban } from "lucide-react";
import { useTasks } from "@/hooks/useProjectData";
import { MetricCard } from "@/components/ui/responsive-layout";

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
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={<card.icon className={`w-3.5 h-3.5 ${card.color}`} />}
        />
      ))}
    </div>
  );
}
