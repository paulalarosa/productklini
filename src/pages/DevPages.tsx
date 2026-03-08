import { useState, useRef, useCallback } from "react";
import { Kanban, Zap, ShieldCheck } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useTasks } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DbTask } from "@/lib/api";

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

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    // Custom ghost
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:absolute;top:-1000px;left:-1000px;padding:8px 12px;border-radius:8px;background:hsl(228,12%,13%);border:1px solid hsl(252,80%,65%);color:hsl(210,20%,92%);font-size:11px;font-family:Inter;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    const task = allTasks.find(t => t.id === taskId);
    ghost.textContent = task?.title ?? "";
    document.body.appendChild(ghost);
    dragGhost.current = ghost;
    e.dataTransfer.setDragImage(ghost, 0, 0);
  }, [allTasks]);

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
    // Only reset if leaving the column entirely
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

    const task = allTasks.find(t => t.id === taskId);
    if (!task || task.status === targetCol) {
      handleDragEnd();
      return;
    }

    const { error } = await supabase.from("tasks").update({ status: targetCol }).eq("id", taskId);
    if (error) {
      toast.error("Erro ao mover tarefa");
    } else {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
    handleDragEnd();
  }, [allTasks, queryClient, handleDragEnd]);

  return (
    <ModulePage title="Kanban" subtitle="Board de desenvolvimento" icon={<Kanban className="w-4 h-4 text-primary-foreground" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = allTasks.filter((t) => t.status === col);
          const isOver = dragOverCol === col;

          return (
            <div
              key={col}
              className={`glass-card p-4 transition-all duration-200 border-t-2 ${columnColors[col]} ${isOver ? "ring-2 ring-primary/50 bg-accent/30" : ""}`}
              onDragOver={(e) => handleDragOver(e, col)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                {columnLabels[col]}
                <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">{colTasks.length}</span>
              </h4>
              <div className="space-y-2 min-h-[100px]">
                {colTasks.map((t, i) => (
                  <div key={t.id}>
                    {isOver && dragOverIndex === i && (
                      <div className="h-1 bg-primary/50 rounded-full mb-2 transition-all" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, col, i)}
                      className={`p-3 rounded-lg bg-secondary/50 hover:bg-accent/50 transition-all cursor-grab active:cursor-grabbing select-none ${draggedTask === t.id ? "opacity-30 scale-95" : ""}`}
                    >
                      <p className="text-xs font-medium text-foreground">{t.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">{t.assignee}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            t.module === "ux" ? "bg-status-discovery/10 text-status-discovery" :
                            t.module === "ui" ? "bg-status-define/10 text-status-define" :
                            "bg-status-develop/10 text-status-develop"
                          }`}>{t.module.toUpperCase()}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            t.priority === "urgent" ? "bg-destructive/10 text-status-urgent" :
                            t.priority === "high" ? "bg-status-blocked/10 text-status-blocked" :
                            "bg-secondary text-muted-foreground"
                          }`}>{t.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-muted-foreground">{t.days_in_phase}d / {t.estimated_days}d</span>
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-semibold text-secondary-foreground">
                          {t.avatar ?? "?"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isOver && colTasks.length === 0 && (
                  <div className="h-16 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] text-primary/50">Soltar aqui</span>
                  </div>
                )}
                {!isOver && colTasks.length === 0 && (
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
