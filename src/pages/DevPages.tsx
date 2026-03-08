import { Kanban, Zap, ShieldCheck } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useTasks } from "@/hooks/useProjectData";

export function KanbanPage() {
  const { data: tasks } = useTasks();
  const devTasks = (tasks ?? []).filter((t) => t.module === "dev");
  const columns = ["todo", "in_progress", "review", "done"];
  const columnLabels: Record<string, string> = { todo: "A Fazer", in_progress: "Em Andamento", review: "Em Revisão", done: "Concluído" };

  return (
    <ModulePage title="Kanban" subtitle="Board de desenvolvimento" icon={<Kanban className="w-4 h-4 text-primary-foreground" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = devTasks.filter((t) => t.status === col);
          return (
            <div key={col} className="glass-card p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {columnLabels[col]} ({colTasks.length})
              </h4>
              <div className="space-y-2">
                {colTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-lg bg-secondary/50 hover:bg-accent/50 transition-colors">
                    <p className="text-xs font-medium text-foreground">{t.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">{t.assignee}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        t.priority === "urgent" ? "bg-destructive/10 text-status-urgent" :
                        t.priority === "high" ? "bg-status-blocked/10 text-status-blocked" :
                        "bg-secondary text-muted-foreground"
                      }`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ModulePage>
  );
}

export function SprintsPage() {
  return (
    <ModulePage title="Sprints" subtitle="Planejamento de sprints" icon={<Zap className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Planejamento de sprints será configurado aqui.</p>
        </div>
      </div>
    </ModulePage>
  );
}

export function QAPage() {
  const { data: tasks } = useTasks();
  const blockedTasks = (tasks ?? []).filter((t) => t.status === "blocked" || t.status === "review");

  return (
    <ModulePage title="QA" subtitle="Qualidade e testes" icon={<ShieldCheck className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tarefas em Revisão / Bloqueadas</h3>
        <div className="space-y-2">
          {blockedTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-xs font-medium text-foreground">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.assignee} · {t.days_in_phase}d na fase</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                t.status === "blocked" ? "bg-destructive/10 text-status-urgent" : "bg-status-discovery/10 text-status-discovery"
              }`}>{t.status}</span>
            </div>
          ))}
          {blockedTasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa em revisão ou bloqueada ✅</p>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
