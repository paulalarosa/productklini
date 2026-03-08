import { useState } from "react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getProjectId, type DbTask } from "@/lib/api";

const statusLabels: Record<string, string> = {
  todo: "A Fazer", in_progress: "Em Andamento", review: "Em Revisão", done: "Concluído", blocked: "Bloqueado",
};
const statusDot: Record<string, string> = {
  todo: "bg-muted-foreground", in_progress: "bg-status-develop", review: "bg-status-discovery", done: "bg-status-develop", blocked: "bg-status-urgent",
};
const moduleLabels: Record<string, { label: string; color: string }> = {
  ux: { label: "UX", color: "bg-status-discovery/10 status-discovery" },
  ui: { label: "UI", color: "bg-status-define/10 status-define" },
  dev: { label: "DEV", color: "bg-status-develop/10 status-develop" },
};
const statuses = ["todo", "in_progress", "review", "done", "blocked"];
const priorities = ["low", "medium", "high", "urgent"];
const modules = ["ux", "ui", "dev"];
const phases = ["discovery", "define", "develop", "deliver"];



function TaskRow({ task, index, onUpdate, onDelete }: { task: DbTask; index: number; onUpdate: () => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState(task.status);
  const isOverdue = task.days_in_phase > task.estimated_days && task.status !== "done";
  const mod = moduleLabels[task.module] ?? { label: task.module, color: "" };

  const saveEdit = async () => {
    const { error } = await supabase.from("tasks").update({ title, status }).eq("id", task.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setEditing(false);
    onUpdate();
  };

  return (
    <motion.div
      className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-3 hover:bg-accent/50 transition-colors rounded-md group"
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[task.status] ?? "bg-muted-foreground"}`} />

      {editing ? (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none" />
          <select value={status} onChange={(e) => setStatus(e.target.value as DbTask["status"])} className="bg-secondary rounded px-1 py-1 text-[10px] text-foreground outline-none">
            {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </select>
          <button onClick={saveEdit} className="p-1 text-status-develop hover:bg-accent rounded"><Check className="w-3 h-3" /></button>
          <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:bg-accent rounded"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)}>
            <p className="text-xs md:text-sm font-medium text-foreground truncate">{task.title}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">{statusLabels[task.status] ?? task.status}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${mod.color}`}>{mod.label}</span>
          <div className="text-right shrink-0">
            <span className={`text-[10px] md:text-xs ${isOverdue ? "text-status-urgent font-medium" : "text-muted-foreground"}`}>
              {task.days_in_phase}d/{task.estimated_days}d
            </span>
          </div>
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-secondary flex items-center justify-center text-[9px] md:text-[10px] font-semibold text-secondary-foreground shrink-0">
            {task.avatar ?? "?"}
          </div>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
            <Trash2 className="w-3 h-3 text-status-urgent" />
          </button>
        </>
      )}
    </motion.div>
  );
}

function AddTaskForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [module, setModule] = useState("dev");
  const [phase, setPhase] = useState("develop");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("tasks").insert({
      project_id: PROJECT_ID, title, module, phase, priority, status: "todo", days_in_phase: 0, estimated_days: 3,
    });
    if (error) { toast.error("Erro ao criar tarefa"); setLoading(false); return; }
    setTitle(""); setOpen(false); setLoading(false);
    onAdded();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full">
        <Plus className="w-3.5 h-3.5" /> Adicionar tarefa
      </button>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-border space-y-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da tarefa" className="w-full bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none" autoFocus />
      <div className="flex gap-2 flex-wrap">
        <select value={module} onChange={(e) => setModule(e.target.value)} className="bg-secondary rounded px-2 py-1 text-[10px] text-foreground outline-none">
          {modules.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
        </select>
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className="bg-secondary rounded px-2 py-1 text-[10px] text-foreground outline-none">
          {phases.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-secondary rounded px-2 py-1 text-[10px] text-foreground outline-none">
          {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={handleAdd} disabled={loading} className="px-3 py-1 rounded gradient-primary text-primary-foreground text-[10px] font-medium disabled:opacity-50">
          {loading ? "..." : "Criar"}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-1 rounded bg-secondary text-[10px] text-muted-foreground hover:text-foreground">Cancelar</button>
      </div>
    </div>
  );
}

export function TaskList() {
  const { data: tasks, isLoading } = useTasks();
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    refresh();
  };

  const activeTasks = (tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
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
          <TaskRow key={task.id} task={task} index={i} onUpdate={refresh} onDelete={handleDelete} />
        ))}
      </div>
      <AddTaskForm onAdded={refresh} />
    </div>
  );
}
