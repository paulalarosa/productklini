import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Plus, Trash2, BarChart3, Check, X } from "lucide-react";
import { useUxMetrics } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function UXMetricsCard() {
  const { data: metrics } = useUxMetrics();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScore, setNewScore] = useState("");

  const items = (metrics ?? []).map((m) => ({
    id: m.id,
    label: m.metric_name,
    score: Number(m.score),
    previous: m.previous_score ? Number(m.previous_score) : null,
    inverted: m.metric_name.toLowerCase().includes("tempo"),
  }));

  const format = (label: string, v: number) => {
    if (label.toLowerCase().includes("tempo")) return `${v}min`;
    if (label.toLowerCase().includes("nps")) return `+${v}`;
    if (label.toLowerCase().includes("taxa")) return `${v}%`;
    return v.toString();
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newScore.trim()) return;
    const projectId = await getProjectId();
    const { error } = await supabase.from("ux_metrics").insert({
      project_id: projectId,
      metric_name: newName.trim(),
      score: parseFloat(newScore) || 0,
    });
    if (error) { toast.error("Erro ao adicionar métrica"); return; }
    queryClient.invalidateQueries({ queryKey: ["ux-metrics"] });
    setNewName(""); setNewScore(""); setAdding(false);
    toast.success("Métrica adicionada");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ux_metrics").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    queryClient.invalidateQueries({ queryKey: ["ux-metrics"] });
    toast.success("Métrica removida");
  };

  return (
    <div className="glass-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Métricas de UX</h3>
        <button onClick={() => setAdding(true)} className="p-1 rounded hover:bg-accent transition-colors">
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {items.length === 0 && !adding && (
        <div className="text-center py-6">
          <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma métrica definida</p>
          <button onClick={() => setAdding(true)} className="text-xs text-primary hover:text-primary/80 mt-2 font-medium">
            + Adicionar primeira métrica
          </button>
        </div>
      )}

      {adding && (
        <div className="mb-3 p-3 rounded-lg border border-border space-y-2">
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nome (ex: NPS, SUS Score)" className="flex-1 px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={50} autoFocus />
            <input type="number" value={newScore} onChange={e => setNewScore(e.target.value)}
              placeholder="Valor" className="w-20 px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setNewName(""); setNewScore(""); }} className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground"><X className="w-3 h-3 inline mr-1" />Cancelar</button>
            <button onClick={handleAdd} className="px-3 py-1 rounded text-xs gradient-primary text-primary-foreground hover:opacity-90">
              <Check className="w-3 h-3 inline mr-1" />Adicionar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {items.map((m, i) => {
          const improved = m.previous !== null
            ? m.inverted ? m.score < m.previous : m.score > m.previous
            : true;
          return (
            <motion.div
              key={m.id}
              className="flex flex-col gap-1 group relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <button onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10">
                  <Trash2 className="w-2.5 h-2.5 text-destructive" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-xl font-bold text-foreground">{format(m.label, m.score)}</span>
                {improved ? (
                  <TrendingUp className="w-3.5 h-3.5 text-status-develop" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-status-urgent" />
                )}
              </div>
              {m.previous !== null && (
                <span className="text-[10px] text-muted-foreground">
                  Anterior: {format(m.label, m.previous)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
