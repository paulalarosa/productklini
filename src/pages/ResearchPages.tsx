import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Trash2, Pencil, Check, Users2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/skeletons";

// ─── Diary Studies ───
export function DiaryStudiesPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ participant_name: "", context: "", activity: "", emotions: "", pain_points: "", insights: "" });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["diary-studies", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("diary_studies").select("*").eq("project_id", projectId).order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) return <PageSkeleton />;

  const handleAdd = async () => {
    if (!form.participant_name.trim() || !projectId) return;
    const { error } = await supabase.from("diary_studies").insert({
      project_id: projectId,
      participant_name: form.participant_name.trim(),
      context: form.context.trim(),
      activity: form.activity.trim(),
      emotions: form.emotions.trim(),
      pain_points: form.pain_points.split(",").map(s => s.trim()).filter(Boolean),
      insights: form.insights.split(",").map(s => s.trim()).filter(Boolean),
    });
    if (error) { toast.error("Erro ao criar entrada"); return; }
    qc.invalidateQueries({ queryKey: ["diary-studies"] });
    setForm({ participant_name: "", context: "", activity: "", emotions: "", pain_points: "", insights: "" });
    setAdding(false);
    toast.success("Entrada adicionada");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("diary_studies").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["diary-studies"] });
    toast.success("Removido");
  };

  return (
    <ModulePage
      title="Diary Studies"
      subtitle="Registro diário de experiências dos participantes"
      icon={<BookOpen className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Entrada
          </button>
          <AIGenerateButton
            prompt="Crie 3 entradas de diary study simuladas para o projeto. Use create_diary_study para cada entrada com participant_name, context, activity, emotions, pain_points (array) e insights (array)."
            label="Gerar com IA"
            invalidateKeys={[["diary-studies"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Nova Entrada de Diário</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.participant_name} onChange={e => setForm(f => ({ ...f, participant_name: e.target.value }))} placeholder="Nome do participante *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Contexto (onde, quando)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} placeholder="Atividade realizada" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={form.emotions} onChange={e => setForm(f => ({ ...f, emotions: e.target.value }))} placeholder="Emoções sentidas" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={form.pain_points} onChange={e => setForm(f => ({ ...f, pain_points: e.target.value }))} placeholder="Dores (separadas por vírgula)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={form.insights} onChange={e => setForm(f => ({ ...f, insights: e.target.value }))} placeholder="Insights (separados por vírgula)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
              <Check className="w-3 h-3 inline mr-1" />Criar Entrada
            </button>
          </div>
        </div>
      )}

      {(entries ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum diary study registrado</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Diary studies capturam experiências reais dos usuários ao longo do tempo.</p>
          <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Criar primeira entrada</button>
        </div>
      ) : (
        <div className="space-y-3">
          {(entries ?? []).map((e: any) => (
            <div key={e.id} className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{e.participant_name}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(e.entry_date).toLocaleDateString("pt-BR")} • {e.context}</p>
                </div>
                <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition-all"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
              {e.activity && <p className="text-xs text-foreground mb-2"><span className="font-medium">Atividade:</span> {e.activity}</p>}
              {e.emotions && <p className="text-xs text-foreground mb-2"><span className="font-medium">Emoções:</span> {e.emotions}</p>}
              <div className="flex flex-wrap gap-1 mt-2">
                {(e.pain_points || []).map((p: string) => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{p}</span>
                ))}
                {(e.insights || []).map((i: string) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{i}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

// ─── Stakeholder Map ───
export function StakeholderMapPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", influence_level: "medium", interest_level: "medium", relationship: "neutral", notes: "" });

  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ["stakeholder-maps", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("stakeholder_maps").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) return <PageSkeleton />;

  const handleAdd = async () => {
    if (!form.name.trim() || !projectId) return;
    const { error } = await supabase.from("stakeholder_maps").insert({ project_id: projectId, ...form });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["stakeholder-maps"] });
    setForm({ name: "", role: "", influence_level: "medium", interest_level: "medium", relationship: "neutral", notes: "" });
    setAdding(false);
    toast.success("Stakeholder adicionado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("stakeholder_maps").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["stakeholder-maps"] });
    toast.success("Removido");
  };

  const levelColors: Record<string, string> = { high: "text-destructive", medium: "text-amber-500", low: "text-muted-foreground" };
  const levelLabels: Record<string, string> = { high: "Alto", medium: "Médio", low: "Baixo" };

  return (
    <ModulePage
      title="Mapa de Stakeholders"
      subtitle="Mapeie influência e interesse dos stakeholders"
      icon={<Users2 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo Stakeholder
          </button>
          <AIGenerateButton
            prompt="Crie 4 stakeholders para o projeto. Use create_stakeholder para cada um com name, role, influence_level (high/medium/low), interest_level (high/medium/low), relationship (champion/supporter/neutral/critic) e notes."
            label="Gerar com IA"
            invalidateKeys={[["stakeholder-maps"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo Stakeholder</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Cargo/Papel" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={form.influence_level} onChange={e => setForm(f => ({ ...f, influence_level: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="high">Influência Alta</option>
              <option value="medium">Influência Média</option>
              <option value="low">Influência Baixa</option>
            </select>
            <select value={form.interest_level} onChange={e => setForm(f => ({ ...f, interest_level: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="high">Interesse Alto</option>
              <option value="medium">Interesse Médio</option>
              <option value="low">Interesse Baixo</option>
            </select>
            <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="champion">Champion</option>
              <option value="supporter">Apoiador</option>
              <option value="neutral">Neutro</option>
              <option value="critic">Crítico</option>
            </select>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Adicionar</button>
          </div>
        </div>
      )}

      {(stakeholders ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <Users2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum stakeholder mapeado</p>
          <button onClick={() => setAdding(true)} className="mt-4 px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Mapear primeiro stakeholder</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stakeholders ?? []).map((s: any) => (
            <div key={s.id} className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">{s.role}</p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition-all"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
              <div className="space-y-1 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Influência</span>
                  <span className={`font-medium ${levelColors[s.influence_level]}`}>{levelLabels[s.influence_level]}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Interesse</span>
                  <span className={`font-medium ${levelColors[s.interest_level]}`}>{levelLabels[s.interest_level]}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Relação</span>
                  <span className="font-medium text-foreground capitalize">{s.relationship}</span>
                </div>
              </div>
              {s.notes && <p className="text-xs text-muted-foreground mt-3 italic">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
