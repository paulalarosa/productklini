import { useState } from "react";
import { motion } from "framer-motion";
import { User, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { usePersonas, type Persona } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function PersonasCard() {
  const { data: personas } = usePersonas();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "", goals: "", painPoints: "" });

  const resetForm = () => { setForm({ name: "", role: "", goals: "", painPoints: "" }); setAdding(false); setEditingId(null); };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const projectId = await getProjectId();
    const { error } = await supabase.from("personas").insert({
      project_id: projectId,
      name: form.name.trim(),
      role: form.role.trim() || "Usuário",
      goals: form.goals.split(",").map(g => g.trim()).filter(Boolean),
      pain_points: form.painPoints.split(",").map(p => p.trim()).filter(Boolean),
    });
    if (error) { toast.error("Erro ao criar persona"); return; }
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    resetForm();
    toast.success("Persona adicionada");
  };

  const handleUpdate = async (id: string) => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("personas").update({
      name: form.name.trim(),
      role: form.role.trim(),
      goals: form.goals.split(",").map(g => g.trim()).filter(Boolean),
      pain_points: form.painPoints.split(",").map(p => p.trim()).filter(Boolean),
    }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    resetForm();
    toast.success("Persona atualizada");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("personas").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    toast.success("Persona removida");
  };

  const startEdit = (p: Persona) => {
    setEditingId(p.id);
    setForm({ 
      name: p.name, 
      role: p.role || "", 
      goals: (p.goals as string[] || []).join(", "), 
      painPoints: (p.pain_points as string[] || []).join(", ") 
    });
    setAdding(false);
  };

  const allPersonas = personas ?? [];

  return (
    <div className="glass-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personas</h3>
        <button onClick={() => { resetForm(); setAdding(true); }} className="p-1 rounded hover:bg-accent transition-colors">
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {allPersonas.length === 0 && !adding && (
        <div className="text-center py-6">
          <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma persona definida</p>
          <button onClick={() => setAdding(true)} className="text-xs text-primary hover:text-primary/80 mt-2 font-medium">
            + Criar primeira persona
          </button>
        </div>
      )}

      {(adding || editingId) && (
        <div className="mb-3 p-3 rounded-lg border border-border space-y-2">
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome" className="flex-1 px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={50} autoFocus />
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Perfil" className="flex-1 px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={50} />
          </div>
          <input value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
            placeholder="Objetivos (separados por vírgula)" className="w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={200} />
          <input value={form.painPoints} onChange={e => setForm(f => ({ ...f, painPoints: e.target.value }))}
            placeholder="Dores (separadas por vírgula)" className="w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" maxLength={200} />
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground"><X className="w-3 h-3 inline mr-1" />Cancelar</button>
            <button onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
              className="px-3 py-1 rounded text-xs gradient-primary text-primary-foreground hover:opacity-90">
              <Check className="w-3 h-3 inline mr-1" />{editingId ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {allPersonas.map((p, i) => (
          <motion.div
            key={p.id}
            className="p-3 rounded-lg bg-secondary/50 hover:bg-accent/50 transition-colors group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.role}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => startEdit(p)} className="p-1 rounded hover:bg-accent"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(p.goals as string[] || []).map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-develop/10 text-status-develop">{g}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
