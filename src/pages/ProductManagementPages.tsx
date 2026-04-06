import { useState } from "react";
import { Map, Target, Flag, Plus, Trash2, Check } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface IRoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  status: string;
  priority: string;
  effort: string;
  impact: string;
  category: string;
}

interface IKeyResult {
  id: string;
  description: string;
  progress: number;
}

interface IOKR {
  id: string;
  objective: string;
  key_results: IKeyResult[];
  quarter: string;
  owner: string;
  status: string;
}


// ─── Roadmap ───
const statusColors: Record<string, string> = { planned: "bg-secondary text-muted-foreground", in_progress: "bg-blue-500/10 text-blue-500", done: "bg-green-500/10 text-green-500", blocked: "bg-destructive/10 text-destructive" };
const statusLabels: Record<string, string> = { planned: "Planejado", in_progress: "Em andamento", done: "Concluído", blocked: "Bloqueado" };
const priorityColors: Record<string, string> = { high: "text-destructive", medium: "text-amber-500", low: "text-muted-foreground" };

export function RoadmapPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", quarter: "Q1 2026", status: "planned", priority: "medium", effort: "medium", impact: "medium", category: "feature" });

  const { data: items, isLoading } = useQuery({
    queryKey: ["roadmap-items", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("roadmap_items").select("*").eq("project_id", projectId).order("quarter").order("priority");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageSkeleton />;

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const { error } = await supabase.from("roadmap_items").insert({ project_id: projectId, ...form });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["roadmap-items"] });
    setForm({ title: "", description: "", quarter: "Q1 2026", status: "planned", priority: "medium", effort: "medium", impact: "medium", category: "feature" });
    setAdding(false);
    toast.success("Item adicionado ao roadmap");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("roadmap_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["roadmap-items"] });
    toast.success("Removido");
  };

  const quarters = [...new Set((items ?? []).map((i: IRoadmapItem) => i.quarter))].sort();



  return (
    <ModulePage
      title="Roadmap de Produto"
      subtitle="Planejamento visual por quarters"
      icon={<Map className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo Item
          </button>
          <AIGenerateButton
            prompt="Crie um roadmap de produto para os próximos 4 quarters. Use create_roadmap_item para cada item com title, description, quarter (Q1 2026, Q2 2026...), status (planned), priority (high/medium/low), effort (high/medium/low), impact (high/medium/low) e category (feature/improvement/tech_debt/research)."
            label="Gerar com IA"
            invalidateKeys={[["roadmap-items"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo Item do Roadmap</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} placeholder="Quarter (ex: Q1 2026)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="high">Prioridade Alta</option><option value="medium">Média</option><option value="low">Baixa</option>
            </select>
            <select value={form.effort} onChange={e => setForm(f => ({ ...f, effort: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="high">Esforço Alto</option><option value="medium">Médio</option><option value="low">Baixo</option>
            </select>
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="high">Impacto Alto</option><option value="medium">Médio</option><option value="low">Baixo</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="feature">Feature</option><option value="improvement">Melhoria</option><option value="tech_debt">Tech Debt</option><option value="research">Research</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Adicionar</button>
          </div>
        </div>
      )}

      <ErrorBoundary level="section">
        {quarters.length === 0 && !adding ? (
          <EmptyState
            icon={Map}
            title="Nenhum item no roadmap"
            description="Planeje a evolução do seu produto por quarters e priorize o que realmente importa."
            action={{ label: "Criar primeiro item", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="space-y-6">
            {quarters.map(q => (
              <div key={q} className="animate-fade-in">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Flag className="w-4 h-4 text-primary" />{q}</h3>
                <div className="space-y-2">
                  {(items ?? []).filter((i: IRoadmapItem) => i.quarter === q).map((i: IRoadmapItem) => (
                    <div key={i.id} className="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{i.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[i.status]}`}>{statusLabels[i.status]}</span>
                          <span className={`text-[10px] font-medium ${priorityColors[i.priority]}`}>{i.priority === "high" ? "🔴" : i.priority === "medium" ? "🟡" : "🟢"}</span>
                        </div>
                        {i.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{i.description}</p>}
                      </div>
                      <button onClick={() => handleDelete(i.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition-all"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── OKRs ───
export function OKRsPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ objective: "", key_results: "", quarter: "Q1 2026", owner: "" });

  const { data: okrs, isLoading } = useQuery({
    queryKey: ["okrs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("okrs").select("*").eq("project_id", projectId).order("quarter").order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageSkeleton />;

  const handleAdd = async () => {
    if (!form.objective.trim() || !projectId) return;
    const krs = form.key_results.split("\n").filter(Boolean).map((kr, i) => ({ id: crypto.randomUUID(), description: kr.trim(), progress: 0 }));
    const { error } = await supabase.from("okrs").insert({
      project_id: projectId,
      objective: form.objective.trim(),
      key_results: krs,
      quarter: form.quarter,
      owner: form.owner.trim(),
    });
    if (error) { toast.error("Erro ao criar OKR"); return; }
    qc.invalidateQueries({ queryKey: ["okrs"] });
    setForm({ objective: "", key_results: "", quarter: "Q1 2026", owner: "" });
    setAdding(false);
    toast.success("OKR criado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("okrs").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["okrs"] });
    toast.success("Removido");
  };

  const statusColors: Record<string, string> = { on_track: "bg-green-500/10 text-green-500", at_risk: "bg-amber-500/10 text-amber-500", off_track: "bg-destructive/10 text-destructive" };
  const statusLabels: Record<string, string> = { on_track: "No caminho", at_risk: "Em risco", off_track: "Fora do caminho" };

  return (
    <ModulePage
      title="OKRs"
      subtitle="Objetivos e Key Results do produto"
      icon={<Target className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo OKR
          </button>
          <AIGenerateButton
            prompt="Crie 3 OKRs relevantes para o projeto com base no contexto. Use create_okr para cada com objective, key_results (array de objetos com description e progress 0-100), quarter e owner."
            label="Gerar com IA"
            invalidateKeys={[["okrs"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo OKR</h4>
          <input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Objetivo *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.key_results} onChange={e => setForm(f => ({ ...f, key_results: e.target.value }))} placeholder="Key Results (um por linha)" rows={3} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} placeholder="Quarter" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsável" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar OKR</button>
          </div>
        </div>
      )}

      <ErrorBoundary level="section">
        {(okrs ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Target}
            title="Nenhum OKR definido"
            description="Defina objetivos ambiciosos e resultados mensuráveis para alinhar o time."
            action={{ label: "Criar primeiro OKR", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="space-y-4">
            {(okrs ?? []).map((okr) => {
              const krs = Array.isArray(okr.key_results) ? (okr.key_results as unknown as IKeyResult[]) : [];
              const avgProgress = krs.length > 0 ? krs.reduce((sum: number, kr: IKeyResult) => sum + (kr.progress || 0), 0) / krs.length : 0;

              return (
                <div key={okr.id} className="glass-card p-5 group hover:border-primary/20 transition-all animate-fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{okr.objective}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[okr.status] || statusColors.on_track}`}>{statusLabels[okr.status] || "No caminho"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{okr.quarter} {okr.owner && `• ${okr.owner}`}</p>
                    </div>
                    <button onClick={() => handleDelete(okr.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition-all"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                  <div className="space-y-2">
                    {krs.map((kr: IKeyResult, i: number) => (
                      <div key={kr.id || i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">KR{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-xs text-foreground">{kr.description}</p>
                          <div className="w-full h-1 rounded-full bg-secondary mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${kr.progress || 0}%` }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{kr.progress || 0}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${avgProgress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{avgProgress.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}
