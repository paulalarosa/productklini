import { useState, useRef, useCallback, useEffect } from "react";
import { Kanban, ShieldCheck, BarChart3, Plus, Bug, Sparkles, Loader2, Check } from "lucide-react";
import { TeamMetrics } from "@/components/dashboard/TeamMetrics";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useTasks } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProjectId, type DbTask } from "@/lib/api";
import { useQABugs, useUpdateBugStatus, useDeleteBug } from "@/hooks/useQABugs";
import { QABugTracker } from "@/components/dashboard/QABugTracker";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";

const columns = ["todo", "in_progress", "review", "done"] as const;
const columnLabels: Record<string, string> = { todo: "A Fazer", in_progress: "Em Andamento", review: "Em Revisão", done: "Concluído" };
const columnColors: Record<string, string> = { todo: "border-muted-foreground/30", in_progress: "border-status-develop/50", review: "border-status-discovery/50", done: "border-status-develop/30" };

export function KanbanPage() {
  const { data: tasks } = useTasks();
  const queryClient = useQueryClient();
  const allTasks = tasks ?? [];
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragGhost = useRef<HTMLDivElement | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingToCol, setAddingToCol] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:absolute;top:-1000px;left:-1000px;padding:8px 12px;border-radius:8px;background:hsl(228,12%,13%);border:1px solid hsl(252,80%,65%);color:hsl(210,20%,92%);font-size:11px;font-family:Inter;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    const task = (tasks ?? []).find(t => t.id === taskId);
    ghost.textContent = task?.title ?? "";
    document.body.appendChild(ghost);
    dragGhost.current = ghost;
    e.dataTransfer.setDragImage(ghost, 0, 0);
  }, [tasks]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverCol(null);
    setDragOverIndex(null);
    if (dragGhost.current) {
      document.body.removeChild(dragGhost.current);
      dragGhost.current = null;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, col: string, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
    if (index !== undefined) setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverCol(null);
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    const task = (tasks ?? []).find(t => t.id === taskId);
    if (!task || task.status === targetCol) { handleDragEnd(); return; }
    const { error } = await supabase.from("tasks").update({ status: targetCol }).eq("id", taskId);
    if (error) { toast.error("Erro ao mover tarefa"); } else { queryClient.invalidateQueries({ queryKey: ["tasks"] }); }
    handleDragEnd();
  }, [tasks, queryClient, handleDragEnd]);

  const handleAddTask = async (col: string) => {
    if (!newTaskTitle.trim()) { setIsAddingTask(false); setAddingToCol(null); return; }
    try {
      const projectId = await getProjectId();
      const { error } = await supabase.from("tasks").insert({ project_id: projectId, title: newTaskTitle.trim(), status: col, module: "dev", phase: "develop", priority: "medium", days_in_phase: 0, estimated_days: 3 });
      if (error) throw error;
      toast.success("Tarefa criada!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle(""); setIsAddingTask(false); setAddingToCol(null);
    } catch { toast.error("Erro ao criar tarefa"); }
  };

  return (
    <ModulePage title="Kanban" subtitle="Board de desenvolvimento" icon={<Kanban className="w-4 h-4 text-primary-foreground" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = allTasks.filter((t) => t.status === col);
          const isOver = dragOverCol === col;
          return (
            <div key={col} className={`glass-card p-4 transition-all duration-200 border-t-2 ${columnColors[col]} ${isOver ? "ring-2 ring-primary/50 bg-accent/30" : ""}`} onDragOver={(e) => handleDragOver(e, col)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col)}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                {columnLabels[col]}
                <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">{colTasks.length}</span>
              </h4>
              <div className="mb-3">
                {isAddingTask && addingToCol === col ? (
                  <div className="space-y-2">
                    <input autoFocus value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(col); if (e.key === "Escape") { setIsAddingTask(false); setAddingToCol(null); } }} placeholder="Título da tarefa..." className="w-full px-3 py-2 rounded-lg bg-background border border-primary/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    <div className="flex gap-1">
                      <button onClick={() => handleAddTask(col)} className="flex-1 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium">Adicionar</button>
                      <button onClick={() => { setIsAddingTask(false); setAddingToCol(null); }} className="px-2 py-1 rounded bg-secondary text-muted-foreground text-[10px]">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingToCol(col); setIsAddingTask(true); }} className="w-full py-1.5 rounded-lg border border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Nova Tarefa
                  </button>
                )}
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colTasks.map((t, i) => (
                  <div key={t.id}>
                    {isOver && dragOverIndex === i && <div className="h-1 bg-primary/50 rounded-full mb-2 transition-all" />}
                    <div draggable onDragStart={(e) => handleDragStart(e, t.id)} onDragEnd={handleDragEnd} onDragOver={(e) => handleDragOver(e, col, i)} className={`p-3 rounded-lg bg-secondary/50 hover:bg-accent/50 transition-all cursor-grab active:cursor-grabbing select-none ${draggedTask === t.id ? "opacity-30 scale-95" : ""}`}>
                      <p className="text-xs font-medium text-foreground">{t.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">{t.assignee}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.module === "ux" ? "bg-status-discovery/10 text-status-discovery" : t.module === "ui" ? "bg-status-define/10 text-status-define" : "bg-status-develop/10 text-status-develop"}`}>{t.module.toUpperCase()}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.priority === "urgent" ? "bg-destructive/10 text-status-urgent" : t.priority === "high" ? "bg-status-blocked/10 text-status-blocked" : "bg-secondary text-muted-foreground"}`}>{t.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-muted-foreground">{t.days_in_phase}d / {t.estimated_days}d</span>
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-semibold text-secondary-foreground">{t.avatar ?? "?"}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {isOver && colTasks.length === 0 && (
                  <div className="h-16 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center"><span className="text-[10px] text-primary/50">Soltar aqui</span></div>
                )}
                {!isOver && colTasks.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Vazio</p>}
              </div>
            </div>
          );
        })}
      </div>
    </ModulePage>
  );
}

export function QAPage() {
  const projectId = useCurrentProjectId();
  const { data: bugs, isLoading } = useQABugs(projectId);
  const updateStatusMutation = useUpdateBugStatus();
  const deleteMutation = useDeleteBug();
  const { data: tasks } = useTasks();
  const blockedTasks = (tasks ?? []).filter((t) => t.status === "blocked" || t.status === "review");
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ bug_title: "", steps_to_reproduce: "", severity: "Média" });

  const handleAdd = async () => {
    if (!projectId || !form.bug_title.trim()) return;
    const { error } = await supabase.from("qa_bugs").insert({
      project_id: projectId,
      bug_title: form.bug_title.trim(),
      steps_to_reproduce: form.steps_to_reproduce.trim() || null,
      severity: form.severity,
      status: "Aberto",
    });
    if (error) { toast.error("Erro ao criar"); return; }
    queryClient.invalidateQueries({ queryKey: ["qa-bugs"] });
    setForm({ bug_title: "", steps_to_reproduce: "", severity: "Média" });
    setAdding(false);
    toast.success("Bug reportado");
  };

  return (
    <ModulePage
      title="QA & Qualidade"
      subtitle="Gerenciamento de bugs e tickets técnicos"
      icon={<ShieldCheck className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Reportar Bug
          </button>
          <AIGenerateButton
            prompt="Analise o projeto e identifique possíveis bugs e problemas técnicos. Use create_qa_bug para cada bug encontrado. Considere problemas de responsividade, acessibilidade, performance e edge cases."
            label="Gerar Análise QA"
            invalidateKeys={[["qa-bugs"]]}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground">Reportar Bug</h4>
            <input value={form.bug_title} onChange={e => setForm(f => ({ ...f, bug_title: e.target.value }))} placeholder="Título do bug *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <textarea value={form.steps_to_reproduce} onChange={e => setForm(f => ({ ...f, steps_to_reproduce: e.target.value }))} placeholder="Passos para reproduzir" rows={3} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
            <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Reportar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Bug className="w-4 h-4 text-red-500" /> Bug Tracker</h3>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse"><Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" /></div>
            ) : bugs && bugs.length > 0 ? (
              <QABugTracker bugs={bugs} onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })} onDelete={(id) => deleteMutation.mutate({ id })} />
            ) : (
              <div className="text-center py-12 glass-card bg-card/10 border-dashed border-2">
                <Bug className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-foreground mb-1">Nenhum Bug Reportado</h3>
                <p className="text-[11px] text-muted-foreground">Sistema operando nominalmente.</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Tarefas em Revisão / Bloqueadas</h3>
            <div className="space-y-2">
              {blockedTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-white/5">
                  <div><p className="text-xs font-bold text-foreground">{t.title}</p><p className="text-[10px] text-muted-foreground">{t.assignee} · {t.days_in_phase}d</p></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "blocked" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>{t.status === "blocked" ? "BLOQUEADO" : "REVISÃO"}</span>
                </div>
              ))}
              {blockedTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-8 bg-secondary/10 rounded-lg">Nenhuma tarefa crítica no momento ✅</p>}
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}

export function TeamMetricsPage() {
  return (
    <ModulePage title="Métricas do Time" subtitle="Velocity, burndown e carga de trabalho" icon={<BarChart3 className="w-4 h-4 text-primary-foreground" />}>
      <TeamMetrics />
    </ModulePage>
  );
}
