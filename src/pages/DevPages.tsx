import { useMemo, useState, useRef, useCallback } from "react";
import { useTasks } from "@/hooks/useProjectData";
import { updateTaskStatus, type DbTask } from "@/lib/api";
import { KanbanSkeleton } from "@/components/ui/skeletons";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertCircle, Clock, CheckCircle2, Circle,
  Eye, PlayCircle, Filter, FileDown, Loader2
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, ActionBar, ResponsiveTable, type Column } from "@/components/ui/responsive-layout";
import { notify } from "@/lib/notifications";

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
  const queryClient    = useQueryClient();
  const reportRef      = useRef<HTMLDivElement>(null);
  const [moduleFilter, setModuleFilter] = useState<"all" | "ux" | "ui" | "dev">("all");
  const [draggingTask, setDraggingTask] = useState<DbTask | null>(null);
  const [exporting,    setExporting]    = useState(false);

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

  const handleStatusChange = useCallback(async (taskId: string, newStatus: DbTask["status"]) => {
    const task = tasks?.find(t => t.id === taskId);
    setDraggingTask(null);
    
    // Optimistic update
    queryClient.setQueryData<DbTask[]>(["tasks"], old =>
      old?.map(t => t.id === taskId ? { ...t, status: newStatus } : t) ?? [],
    );

    try {
      await updateTaskStatus(taskId, newStatus);
      
      // Notify if unblocked
      if (task && task.status === "blocked" && newStatus !== "blocked") {
        await notify.success(
          "🔓 Tarefa Desbloqueada",
          `A tarefa "${task.title}" não está mais bloqueada e pode seguir para ${newStatus}.`
        );
      }
    } catch {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.error("Erro ao atualizar tarefa.");
    }
  }, [queryClient, tasks]);

  const handleExportPdf = async () => {
    if (!reportRef.current || filtered.length === 0) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e12",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`kanban-${new Date().getTime()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <KanbanSkeleton />;

  const blockedCount = byStatus["blocked"]?.length ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kanban"
        description={`${filtered.length} tarefas${blockedCount > 0 ? ` · ${blockedCount} bloqueada${blockedCount > 1 ? "s" : ""}` : ""}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting || filtered.length === 0}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1.5" />
            )}
            PDF
          </Button>
        }
      />

      <ActionBar
        primary={
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
        }
      />

      {/* Board */}
      <div
        ref={reportRef}
        className="flex gap-3 overflow-x-auto pb-4"
        // Cancela drop fora de qualquer coluna
        onDragOver={e => e.preventDefault()}
      >
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
                  <EmptyState title="Vazio" size="inline" />
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
  const reportRef   = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const qaIssues = useMemo(() =>
    tasks?.filter(t => t.status === "blocked" || t.priority === "urgent") ?? [],
    [tasks],
  );

  const handleExportPdf = async () => {
    if (!reportRef.current || qaIssues.length === 0) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e12",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      pdf.save(`qa-${new Date().getTime()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<Column<DbTask>[]>(() => [
    {
      key:      "title",
      header:   "Tarefa",
      pinned:   true,
      minWidth: 180,
      render:   (t) => (
        <span className="font-medium text-foreground">{t.title}</span>
      ),
    },
    {
      key:    "priority",
      header: "Prioridade",
      pinned: true,
      render: (t) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[t.priority]}`}>
          {t.priority}
        </span>
      ),
    },
    {
      key:    "module",
      header: "Módulo",
      render: (t) => <span className="text-xs text-muted-foreground uppercase">{t.module}</span>,
    },
    {
      key:    "status",
      header: "Status",
      render: (t) => <span className="text-xs text-muted-foreground">{t.status}</span>,
    },
    {
      key:    "assignee",
      header: "Responsável",
      render: (t) => (
        <span className="text-xs text-muted-foreground">{t.assignee ?? "—"}</span>
      ),
    },
  ], []);

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
      <PageHeader
        title="QA"
        description={`Tarefas bloqueadas e urgentes — ${qaIssues.length} issue${qaIssues.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting || qaIssues.length === 0}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1.5" />
            )}
            PDF
          </Button>
        }
      />

      {qaIssues.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nenhuma issue aberta"
          description="Tudo certo! Não há tarefas bloqueadas ou urgentes no momento."
          size="page"
        />
      ) : (
        <div ref={reportRef}>
          <ResponsiveTable
            columns={columns}
            data={qaIssues}
            keyExtractor={(t) => t.id}
          />
        </div>
      )}
    </div>
  );
}

// ─── TeamMetricsPage — resumo por assignee ────────────────────────────────────

export function TeamMetricsPage() {
  const { data: tasks, isLoading } = useTasks();
  const reportRef   = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

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

  const handleExportPdf = async () => {
    if (!reportRef.current || byAssignee.length === 0) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e12",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      pdf.save(`team-metrics-${new Date().getTime()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

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
      <PageHeader
        title="Métricas do Time"
        description={`${byAssignee.length} membro${byAssignee.length !== 1 ? "s" : ""} com tarefas atribuídas`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting || byAssignee.length === 0}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1.5" />
            )}
            PDF
          </Button>
        }
      />

      <div ref={reportRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
