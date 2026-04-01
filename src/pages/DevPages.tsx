import { useMemo, useState } from "react";
import { useTasks } from "@/hooks/useProjectData";
import { updateTaskStatus, type DbTask } from "@/lib/api";
import { KanbanSkeleton } from "@/components/ui/skeletons";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle, Clock, CheckCircle2, Circle,
  Eye, PlayCircle, Filter,
} from "lucide-react";

// ─── Configuração das colunas ─────────────────────────────────────────────────

const COLUMNS: {
  id: DbTask["status"];
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { id: "todo",        label: "A Fazer",     icon: Circle,       color: "text-muted-foreground",  bg: "bg-muted/30" },
  { id: "in_progress", label: "Em Progresso",icon: PlayCircle,   color: "text-blue-500",          bg: "bg-blue-500/10" },
  { id: "review",      label: "Em Revisão",  icon: Eye,          color: "text-amber-500",         bg: "bg-amber-500/10" },
  { id: "done",        label: "Concluído",   icon: CheckCircle2, color: "text-green-500",         bg: "bg-green-500/10" },
  { id: "blocked",     label: "Bloqueado",   icon: AlertCircle,  color: "text-destructive",       bg: "bg-destructive/10" },
];

const PRIORITY_COLORS: Record<DbTask["priority"], string> = {
  low:    "bg-muted/40 text-muted-foreground border-muted",
  medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  high:   "bg-amber-500/10 text-amber-600 border-amber-500/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

const MODULE_COLORS: Record<string, string> = {
  ux:  "bg-purple-500/10 text-purple-600",
  ui:  "bg-pink-500/10 text-pink-600",
  dev: "bg-cyan-500/10 text-cyan-600",
};

// ─── Card de tarefa ───────────────────────────────────────────────────────────

function TaskCard({
  task,
  onStatusChange,
}: {
  task: DbTask;
  onStatusChange: (id: string, status: DbTask["status"]) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const otherStatuses = COLUMNS.filter(c => c.id !== task.status);

  return (
    <div className="group relative border rounded-lg p-3 bg-card hover:border-border/80 transition-colors space-y-2">
      {/* Módulo + prioridade */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${MODULE_COLORS[task.module] ?? "bg-muted text-muted-foreground"}`}>
          {task.module?.toUpperCase()}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {/* Título */}
      <p className="text-xs font-medium text-foreground leading-snug">{task.title}</p>

      {/* Footer — assignee + dias + mover */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
              {task.assignee.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.days_in_phase}d / {task.estimated_days}d
          </span>
        </div>

        {/* Menu de mover para outra coluna */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="text-[10px] px-2 py-1 rounded border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            Mover
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-popover border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                {otherStatuses.map(col => {
                  const Icon = col.icon;
                  return (
                    <button
                      key={col.id}
                      onClick={() => { onStatusChange(task.id, col.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                      {col.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KanbanPage ───────────────────────────────────────────────────────────────

export function KanbanPage() {
  const { data: tasks, isLoading } = useTasks();
  const queryClient = useQueryClient();
  const [moduleFilter, setModuleFilter] = useState<"all" | "ux" | "ui" | "dev">("all");

  const filtered = useMemo(() => {
    if (!tasks) return [];
    return moduleFilter === "all" ? tasks : tasks.filter(t => t.module === moduleFilter);
  }, [tasks, moduleFilter]);

  const byStatus = useMemo(() => {
    const map: Record<string, DbTask[]> = {};
    for (const col of COLUMNS) map[col.id] = [];
    for (const task of filtered) {
      if (map[task.status]) map[task.status].push(task);
    }
    return map;
  }, [filtered]);

  const handleStatusChange = async (taskId: string, newStatus: DbTask["status"]) => {
    // Optimistic update
    queryClient.setQueryData<DbTask[]>(["tasks"], old =>
      old?.map(t => t.id === taskId ? { ...t, status: newStatus } : t) ?? [],
    );
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.error("Erro ao atualizar tarefa.");
    }
  };

  if (isLoading) return <KanbanSkeleton />;

  const blockedCount = byStatus["blocked"]?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} tarefas
            {blockedCount > 0 && (
              <span className="ml-2 text-destructive font-medium">
                · {blockedCount} bloqueada{blockedCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Filtro por módulo */}
        <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-0.5 border border-border/50 w-fit">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          {(["all", "ux", "ui", "dev"] as const).map(m => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                moduleFilter === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "all" ? "Todos" : m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const colTasks = byStatus[col.id] ?? [];
          return (
            <div key={col.id} className="min-w-[240px] w-[240px] shrink-0 space-y-2">
              {/* Cabeçalho da coluna */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${col.bg}`}>
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${col.color}`} />
                  <span className="text-xs font-medium text-foreground">{col.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.bg} ${col.color} border border-current/20`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colTasks.length === 0 ? (
                  <div className="border border-dashed border-border/50 rounded-lg p-4 text-center">
                    <p className="text-[10px] text-muted-foreground/50">Vazio</p>
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QAPage — placeholder funcional ──────────────────────────────────────────

export function QAPage() {
  const { data: tasks, isLoading } = useTasks();

  const qaIssues = useMemo(() =>
    tasks?.filter(t => t.status === "blocked" || t.priority === "urgent") ?? [],
    [tasks],
  );

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">QA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tarefas bloqueadas e urgentes — {qaIssues.length} issue{qaIssues.length !== 1 ? "s" : ""}
        </p>
      </div>

      {qaIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-2 text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 text-green-500/50" />
          <p className="text-sm">Nenhuma issue aberta. Tudo certo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {qaIssues.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
              <span className={`h-2 w-2 rounded-full shrink-0 ${task.status === "blocked" ? "bg-destructive" : "bg-amber-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.module?.toUpperCase()} · {task.phase}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TeamMetricsPage — resumo por assignee ────────────────────────────────────

export function TeamMetricsPage() {
  const { data: tasks, isLoading } = useTasks();

  const byAssignee = useMemo(() => {
    if (!tasks) return [];
    const map: Record<string, { total: number; done: number; blocked: number; inProgress: number }> = {};
    for (const t of tasks) {
      const key = t.assignee ?? "Sem responsável";
      if (!map[key]) map[key] = { total: 0, done: 0, blocked: 0, inProgress: 0 };
      map[key].total++;
      if (t.status === "done")        map[key].done++;
      if (t.status === "blocked")     map[key].blocked++;
      if (t.status === "in_progress") map[key].inProgress++;
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [tasks]);

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-36 rounded-md bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Métricas do Time</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {byAssignee.length} membro{byAssignee.length !== 1 ? "s" : ""} com tarefas atribuídas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {byAssignee.map(([name, stats]) => {
          const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
          return (
            <div key={name} className="border rounded-lg p-4 bg-card space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{stats.total} tarefa{stats.total !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {/* Stats */}
              <div className="flex gap-3 text-[10px]">
                <span className="text-blue-500">{stats.inProgress} em andamento</span>
                {stats.blocked > 0 && (
                  <span className="text-destructive font-medium">{stats.blocked} bloqueada{stats.blocked > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
