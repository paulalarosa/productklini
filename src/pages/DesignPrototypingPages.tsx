import { useState } from "react";
import { GitBranch, Image, Plus, Trash2, Check, ArrowRight, ExternalLink } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── User Flow Editor ───
interface IFlowStep { id: string; label: string; description: string; type: string; }

export function UserFlowEditorPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ flow_name: "", description: "", persona: "", goal: "", steps: "" });

  const { data: flows, isLoading } = useQuery({
    queryKey: ["user-flows", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("user_flows").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = async () => {
    if (!form.flow_name.trim() || !projectId) return;
    const steps = form.steps.split("\n").filter(Boolean).map((s, i) => ({ id: crypto.randomUUID(), label: s.trim(), description: "", type: i === 0 ? "start" : "step" }));
    const { error } = await supabase.from("user_flows").insert({ project_id: projectId, flow_name: form.flow_name, description: form.description, persona: form.persona, goal: form.goal, steps });
    if (error) { toast.error("Erro ao criar fluxo"); return; }
    qc.invalidateQueries({ queryKey: ["user-flows"] });
    setForm({ flow_name: "", description: "", persona: "", goal: "", steps: "" });
    setAdding(false);
    toast.success("Fluxo criado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_flows").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["user-flows"] });
    toast.success("Removido");
  };

  if (isLoading) {
    return (
      <ModulePage title="User Flow Editor" subtitle="Fluxos de usuário visuais e interativos" icon={<GitBranch className="w-4 h-4 text-primary-foreground" />}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-40" />
              <div className="h-3 bg-muted rounded w-64" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, j) => <div key={j} className="h-6 bg-muted rounded w-16" />)}
              </div>
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage title="User Flow Editor" subtitle="Fluxos de usuário visuais e interativos" icon={<GitBranch className="w-4 h-4 text-primary-foreground" />}
      actions={<div className="flex items-center gap-2">
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-3.5 h-3.5" /> Novo Fluxo</button>
        <AIGenerateButton prompt="Crie 3 user flows para o projeto. Use create_user_flow para cada com flow_name, description, persona, goal e steps (array de objetos com id, label, description, type)." label="Gerar com IA" invalidateKeys={[["user-flows"]]} size="sm" />
      </div>}>
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo User Flow</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.flow_name} onChange={e => setForm(f => ({ ...f, flow_name: e.target.value }))} placeholder="Nome do fluxo *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.persona} onChange={e => setForm(f => ({ ...f, persona: e.target.value }))} placeholder="Persona" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Objetivo do fluxo" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} placeholder="Etapas (uma por linha)&#10;Ex: Abrir app&#10;Fazer login&#10;Ver dashboard" rows={4} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
          </div>
        </div>
      )}

      <ErrorBoundary level="section">
        {(flows ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={GitBranch}
            title="Nenhum user flow criado"
            description="Mapeie jornadas de usuário com etapas visuais e conectadas."
            action={{ label: "Criar primeiro fluxo", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="space-y-4">
            {(flows ?? []).map((flow) => {
              const steps = Array.isArray(flow.steps) ? (flow.steps as unknown as IFlowStep[]) : [];
              return (
                <div key={flow.id} className="glass-card p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{flow.flow_name}</h3>
                      <p className="text-xs text-muted-foreground">{flow.persona && `Persona: ${flow.persona} • `}{flow.goal && `Objetivo: ${flow.goal}`}</p>
                      {flow.description && <p className="text-xs text-muted-foreground mt-1">{flow.description}</p>}
                    </div>
                    <button onClick={() => handleDelete(flow.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                  {steps.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {steps.map((step, i) => (
                        <div key={step.id || i} className="flex items-center gap-1">
                          <span className={`text-[10px] px-2 py-1 rounded-md border ${step.type === "start" ? "bg-primary/10 border-primary/30 text-primary" : step.type === "decision" ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-secondary border-border text-foreground"}`}>
                            {step.label}
                          </span>
                          {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Moodboard ───
export function MoodboardPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", tags: "", image_urls: "", color_palette: "", references_notes: "" });

  const { data: boards, isLoading } = useQuery({
    queryKey: ["moodboards", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("moodboards").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const { error } = await supabase.from("moodboards").insert({
      project_id: projectId, title: form.title, description: form.description,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      image_urls: form.image_urls.split("\n").map(u => u.trim()).filter(Boolean),
      color_palette: form.color_palette.split(",").map(c => c.trim()).filter(Boolean),
      references_notes: form.references_notes,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["moodboards"] });
    setForm({ title: "", description: "", tags: "", image_urls: "", color_palette: "", references_notes: "" });
    setAdding(false);
    toast.success("Moodboard criado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("moodboards").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["moodboards"] });
    toast.success("Removido");
  };

  if (isLoading) {
    return (
      <ModulePage title="Moodboards" subtitle="Coleção de referências visuais e inspirações" icon={<Image className="w-4 h-4 text-primary-foreground" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="flex gap-1">
                {[...Array(4)].map((_, j) => <div key={j} className="w-6 h-6 rounded-md bg-muted" />)}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[...Array(6)].map((_, j) => <div key={j} className="aspect-square rounded-md bg-muted" />)}
              </div>
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage title="Moodboards" subtitle="Coleção de referências visuais e inspirações" icon={<Image className="w-4 h-4 text-primary-foreground" />}
      actions={<div className="flex items-center gap-2">
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-3.5 h-3.5" /> Novo Board</button>
        <AIGenerateButton prompt="Crie 2 moodboards para o projeto with referências visuais relevantes. Use create_moodboard para cada com title, description, tags, color_palette e references_notes." label="Gerar com IA" invalidateKeys={[["moodboards"]]} size="sm" />
      </div>}>
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo Moodboard</h4>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (separadas por vírgula)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.image_urls} onChange={e => setForm(f => ({ ...f, image_urls: e.target.value }))} placeholder="URLs de imagens (uma por linha)" rows={3} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <input value={form.color_palette} onChange={e => setForm(f => ({ ...f, color_palette: e.target.value }))} placeholder="Paleta de cores (ex: #FF5733, #3498DB, #2ECC71)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.references_notes} onChange={e => setForm(f => ({ ...f, references_notes: e.target.value }))} placeholder="Notas e referências" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
          </div>
        </div>
      )}

      <ErrorBoundary level="section">
        {(boards ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Image}
            title="Nenhum moodboard criado"
            description="Colecione referências visuais, paletas e inspirações para o seu produto."
            action={{ label: "Criar primeiro moodboard", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(boards ?? []).map((board) => (
              <div key={board.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground">{board.title}</h3>
                  <button onClick={() => handleDelete(board.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
                {board.description && <p className="text-xs text-muted-foreground mb-2">{board.description}</p>}
                {(board.color_palette as string[])?.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {(board.color_palette as string[]).map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-md border border-border" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                )}
                {(board.tags as string[])?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {(board.tags as string[]).map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                {(board.image_urls as string[])?.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {(board.image_urls as string[]).slice(0, 6).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-md bg-secondary border border-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                        <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </a>
                    ))}
                  </div>
                )}
                {board.references_notes && <p className="text-[10px] text-muted-foreground mt-2 italic">{board.references_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Impact vs Effort Matrix ───
const quadrantLabels: Record<string, { label: string; color: string }> = {
  "high-impact-low-effort": { label: "Quick Wins 🎯", color: "bg-green-500/10 border-green-500/30 text-green-600" },
  "high-impact-high-effort": { label: "Big Bets 🚀", color: "bg-blue-500/10 border-blue-500/30 text-blue-600" },
  "low-impact-low-effort": { label: "Fill-ins 📝", color: "bg-secondary border-border text-muted-foreground" },
  "low-impact-high-effort": { label: "Avoid ⚠️", color: "bg-destructive/10 border-destructive/30 text-destructive" },
};

function getQuadrant(impact: string, effort: string): string {
  const hi = impact === "high";
  const he = effort === "high";
  if (hi && !he) return "high-impact-low-effort";
  if (hi && he) return "high-impact-high-effort";
  if (!hi && !he) return "low-impact-low-effort";
  return "low-impact-high-effort";
}

export function ImpactEffortPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", impact_level: "high", effort_level: "low", category: "feature" });

  const { data: items, isLoading } = useQuery({
    queryKey: ["impact-effort", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("impact_effort_items").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const quadrant = getQuadrant(form.impact_level, form.effort_level);
    const { error } = await supabase.from("impact_effort_items").insert({ project_id: projectId, ...form, quadrant });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["impact-effort"] });
    setForm({ title: "", description: "", impact_level: "high", effort_level: "low", category: "feature" });
    setAdding(false);
    toast.success("Item adicionado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("impact_effort_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["impact-effort"] });
    toast.success("Removido");
  };

  const grouped = Object.keys(quadrantLabels).map(q => ({
    quadrant: q,
    ...quadrantLabels[q],
    items: (items ?? []).filter(i => getQuadrant(i.impact_level, i.effort_level) === q),
  }));

  if (isLoading) {
    return (
      <ModulePage title="Impact vs Effort Matrix" subtitle="Priorização visual 2x2" icon={<ExternalLink className="w-4 h-4 text-primary-foreground" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-24" />
              {[...Array(2)].map((_, j) => (
                <div key={j} className="bg-card rounded-md p-3 border border-border space-y-1.5">
                  <div className="h-3 bg-muted rounded w-32" />
                  <div className="h-2.5 bg-muted rounded w-48" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage title="Impact vs Effort Matrix" subtitle="Priorização visual 2x2" icon={<ExternalLink className="w-4 h-4 text-primary-foreground" />}
      actions={<div className="flex items-center gap-2">
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-3.5 h-3.5" /> Novo Item</button>
        <AIGenerateButton prompt="Crie 6 itens para a matriz Impact vs Effort do projeto. Use create_impact_effort_item para cada com title, description, impact_level (high/low), effort_level (high/low), category (feature/improvement/tech_debt/research)." label="Gerar com IA" invalidateKeys={[["impact-effort"]]} size="sm" />
      </div>}>
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo Item</h4>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.impact_level} onChange={e => setForm(f => ({ ...f, impact_level: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="high">Impacto Alto</option><option value="low">Impacto Baixo</option>
            </select>
            <select value={form.effort_level} onChange={e => setForm(f => ({ ...f, effort_level: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="low">Esforço Baixo</option><option value="high">Esforço Alto</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grouped.map(g => (
            <div key={g.quadrant} className={`rounded-lg border p-4 ${g.color}`}>
              <h3 className="text-sm font-bold mb-3">{g.label}</h3>
              {g.items.length === 0 ? (
                <p className="text-[10px] opacity-60">Nenhum item neste quadrante</p>
              ) : (
                <div className="space-y-2">
                  {g.items.map(item => (
                    <div key={item.id} className="bg-card rounded-md p-3 border border-border group">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.title}</p>
                          {item.description && <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>}
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}
