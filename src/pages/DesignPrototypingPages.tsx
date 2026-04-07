import { useState } from "react";
import { GitBranch, Image, Plus, Trash2, Check, ArrowRight } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { useSearch } from "@/hooks/useSearch";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/skeletons";
import type { Database } from "@/integrations/supabase/types";

type IUserFlow = Database["public"]["Tables"]["user_flows"]["Row"];
type IMoodboard = Database["public"]["Tables"]["moodboards"]["Row"];
type IImpactEffortItem = Database["public"]["Tables"]["impact_effort_items"]["Row"];

// ─── User Flow Editor ─────────────────────────────────────────────────────────
export function UserFlowEditorPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ flow_name: "", description: "", persona: "", goal: "", steps: "" });

  const { data: flows, isLoading } = useQuery({
    queryKey: ["user-flows", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("user_flows")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const { query, setQuery, clearFilters, filtered, hasActiveFilters } = useSearch({
    data: (flows ?? []) as Record<string, unknown>[],
    searchFields: ["flow_name", "description", "persona", "goal"],
  });

  const handleAdd = async () => {
    if (!form.flow_name.trim() || !projectId) return;
    const steps = form.steps.split("\n").filter(Boolean).map((s, i) => ({
      id: crypto.randomUUID(),
      label: s.trim(),
      description: "",
      type: i === 0 ? "start" : "step"
    }));
    
    const { error } = await supabase.from("user_flows").insert({
      project_id: projectId,
      flow_name: form.flow_name,
      description: form.description,
      persona: form.persona,
      goal: form.goal,
      steps
    });

    if (error) {
      toast.error("Erro ao criar fluxo");
      return;
    }

    qc.invalidateQueries({ queryKey: ["user-flows"] });
    setForm({ flow_name: "", description: "", persona: "", goal: "", steps: "" });
    setAdding(false);
    toast.success("Fluxo criado");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_flows").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover fluxo");
      return;
    }
    qc.invalidateQueries({ queryKey: ["user-flows"] });
    toast.success("Removido");
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="User Flow Editor"
      subtitle="Fluxos de usuário visuais e interativos"
      icon={<GitBranch className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Fluxo
          </button>
          <AIGenerateButton
            prompt="Crie 2 user flows estratégicos para este projeto. Use a ferramenta create_user_flow para cada um com flow_name, description, persona, goal e steps (array de objetos com id, label, description, type: start/action/decision/screen/end)."
            label="Gerar com IA"
            invalidateKeys={[["user-flows"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-6">
          <h4 className="text-sm font-semibold text-foreground">Novo User Flow</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.flow_name}
              onChange={e => setForm(f => ({ ...f, flow_name: e.target.value }))}
              placeholder="Nome do fluxo *"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <input
              value={form.persona}
              onChange={e => setForm(f => ({ ...f, persona: e.target.value }))}
              placeholder="Persona alvo"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <input
            value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Objetivo principal do fluxo"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição breve"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
          />
          <textarea
            value={form.steps}
            onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
            placeholder="Passos do fluxo (um por linha)&#10;Ex: Abrir tela inicial&#10;Clicar em cadastrar&#10;Preencher formulário"
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium active:scale-95 transition-all shadow-md shadow-primary/10"
            >
              <Check className="w-3 h-3 inline mr-1" />
              Criar Fluxo
            </button>
          </div>
        </div>
      )}

      {(flows ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={flows?.length}
          filtered={filtered.length}
          placeholder="Buscar flows, personas ou objetivos..."
          className="mb-6"
        />
      )}

      <ErrorBoundary level="section">
        {(flows ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={GitBranch}
            title="Nenhum fluxo de usuário"
            description="Mapeie os caminhos lógicos que seus usuários percorrem para atingir seus objetivos no produto."
            action={{ label: "Criar primeiro fluxo", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="Nenhum resultado"
            description={`Não encontramos fluxos correspondentes à sua busca.`}
            action={{ label: "Limpar busca", onClick: clearFilters }}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((flow: Record<string, unknown>) => {
              const steps = (flow.steps as { id: string; label: string; type: string }[]) || [];
              return (
                <div key={flow.id as string} className="glass-card p-5 group hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{flow.flow_name as string}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        {flow.persona && (
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <span className="opacity-60">PERSONA</span> {flow.persona as string}
                          </span>
                        )}
                        {flow.goal && (
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <span className="opacity-60">OBJETIVO</span> {flow.goal as string}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(flow.id as string)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {steps.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mt-2 p-3 rounded-xl bg-secondary/30 border border-border/50">
                      {steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold shadow-sm transition-all hover:scale-105 cursor-default ${
                            step.type === "start" ? "border-green-500/30 bg-green-500/10 text-green-600" :
                            step.type === "end" ? "border-destructive/30 bg-destructive/10 text-destructive" :
                            step.type === "decision" ? "border-amber-500/30 bg-amber-500/10 text-amber-600" :
                            "border-border bg-card text-foreground"
                          }`}>
                            {step.label}
                          </div>
                          {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
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

// ─── Moodboard ────────────────────────────────────────────────────────────────
export function MoodboardPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", style_keywords: "", color_palette: "", references: "" });

  const { data: moodboards, isLoading } = useQuery({
    queryKey: ["moodboards", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("moodboards")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const { query, setQuery, clearFilters, filtered, hasActiveFilters } = useSearch({
    data: (moodboards ?? []) as Record<string, unknown>[],
    searchFields: ["title", "description", "style_keywords"],
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const { error } = await supabase.from("moodboards").insert({
      project_id: projectId,
      title: form.title,
      description: form.description,
      style_keywords: form.style_keywords.split(",").map(s => s.trim()).filter(Boolean),
      color_palette: form.color_palette.split(",").map(s => s.trim()).filter(Boolean).map(c => c.startsWith("#") ? c : `#${c}`),
      references: form.references.split("\n").map(s => s.trim()).filter(Boolean)
    });

    if (error) {
      toast.error("Erro ao criar moodboard");
      return;
    }

    qc.invalidateQueries({ queryKey: ["moodboards"] });
    setForm({ title: "", description: "", style_keywords: "", color_palette: "", references: "" });
    setAdding(false);
    toast.success("Moodboard criado com sucesso");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("moodboards").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    qc.invalidateQueries({ queryKey: ["moodboards"] });
    toast.success("Removido");
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Moodboard"
      subtitle="Referências visuais, paletas e direção artística"
      icon={<Image className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Moodboard
          </button>
          <AIGenerateButton
            prompt="Crie uma direção artística completa para este projeto. Utilize a ferramenta create_moodboard com title, description, style_keywords (ex: minimal, cyberpunk, organic), color_palette (array de hex) e references (array de links)."
            label="Gerar com IA"
            invalidateKeys={[["moodboards"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-6 space-y-4 border-2 border-primary/20 mb-8">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Nova Direção Visual</h4>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Título do Moodboard *"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descreva o conceito visual desta direção."
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.style_keywords}
              onChange={e => setForm(f => ({ ...f, style_keywords: e.target.value }))}
              placeholder="Estilos (ex: minimal, dark mode)"
              className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground"
            />
            <input
              value={form.color_palette}
              onChange={e => setForm(f => ({ ...f, color_palette: e.target.value }))}
              placeholder="Paleta (ex: #6366f1, #1e293b)"
              className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground"
            />
          </div>
          <textarea
            value={form.references}
            onChange={e => setForm(f => ({ ...f, references: e.target.value }))}
            placeholder="Links de referência (um por linha)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-6 py-2 rounded-xl text-xs gradient-primary text-primary-foreground hover:opacity-90 font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Check className="w-4 h-4 inline mr-1.5" />
              Consolidar Direção
            </button>
          </div>
        </div>
      )}

      {(moodboards ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={moodboards?.length}
          filtered={filtered.length}
          placeholder="Buscar inspirações, cores ou estilos..."
          className="mb-8"
        />
      )}

      <ErrorBoundary level="section">
        {(moodboards ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Image}
            title="Nenhum moodboard"
            description="Defina a linguagem visual do projeto através de referências, keywords e paletas de cores."
            action={{ label: "Criar primeiro moodboard", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Image}
            title="Nenhum resultado"
            description={`Não encontramos moodboards para sua busca.`}
            action={{ label: "Limpar filtros", onClick: clearFilters }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((mb: Record<string, unknown>) => (
              <div key={mb.id as string} className="glass-card p-6 group hover:border-primary/30 transition-all flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-black text-foreground tracking-tight">{mb.title as string}</h3>
                  <button
                    onClick={() => handleDelete(mb.id as string)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {mb.description && <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{mb.description as string}</p>}
                
                <div className="mt-auto space-y-4">
                  {(mb.color_palette as string[])?.length > 0 && (
                    <div className="flex gap-2">
                      {(mb.color_palette as string[]).map((c, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-lg border border-white/10 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                  
                  {(mb.style_keywords as string[])?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(mb.style_keywords as string[]).map((kw, i) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/20 font-bold uppercase">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {(mb.references as string[])?.length > 0 && (
                    <div className="pt-4 border-t border-border/50 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Referências Externas</p>
                      {(mb.references as string[]).slice(0, 3).map((ref, i) => (
                        <a
                          key={i}
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] text-primary hover:underline truncate font-medium flex items-center gap-1"
                        >
                          {ref.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Impact Effort Matrix ─────────────────────────────────────────────────────
export function ImpactMatrixPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", impact_level: "medium", effort_level: "medium", category: "feature", status: "backlog" });

  const { data: items, isLoading } = useQuery({
    queryKey: ["impact-effort-items", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("impact_effort_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const { query, setQuery, activeFilters, setFilter, clearFilters, filtered, hasActiveFilters } = useSearch({
    data: (items ?? []) as Record<string, unknown>[],
    searchFields: ["title", "description", "category"],
    filters: [
      { key: "impact_level", label: "Impacto", options: [{ key: "high", label: "Alto", value: "high" }, { key: "medium", label: "Médio", value: "medium" }, { key: "low", label: "Baixo", value: "low" }] },
      { key: "effort_level", label: "Esforço", options: [{ key: "high", label: "Alto", value: "high" }, { key: "medium", label: "Médio", value: "medium" }, { key: "low", label: "Baixo", value: "low" }] },
    ],
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const { error } = await supabase.from("impact_effort_items").insert({
      project_id: projectId,
      ...form
    });

    if (error) {
      toast.error("Erro ao priorizar iniciativa");
      return;
    }

    qc.invalidateQueries({ queryKey: ["impact-effort-items"] });
    setForm({ title: "", description: "", impact_level: "medium", effort_level: "medium", category: "feature", status: "backlog" });
    setAdding(false);
    toast.success("Iniciativa integrada ao backlog estratégico");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("impact_effort_items").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    qc.invalidateQueries({ queryKey: ["impact-effort-items"] });
    toast.success("Iniciativa removida");
  };

  const getQuadrant = (impact: string, effort: string) => {
    if (impact === "high" && effort === "low") return { label: "Quick Wins 🚀", color: "text-green-500 bg-green-500/5 border-green-500/20" };
    if (impact === "high" && effort === "high") return { label: "Major Projects 💪", color: "text-blue-500 bg-blue-500/5 border-blue-500/20" };
    if (impact === "low" && effort === "low") return { label: "Fill-ins ✅", color: "text-muted-foreground bg-secondary/50 border-border" };
    return { label: "Reconsider ❌", color: "text-destructive bg-destructive/5 border-destructive/20" };
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Prioritization Matrix"
      subtitle="Otimize recursos focando em alto impacto e baixo esforço"
      icon={<Plus className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Priorizar Item
          </button>
          <AIGenerateButton
            prompt="Analise os artefatos atuais e gere 6 iniciativas de produto variadas para a matriz impacto x esforço. Use a ferramenta create_impact_effort_item para cada iniciativa com title, description, impact_level (high/medium/low), effort_level (high/medium/low) e category (feature/improvement/tech_debt/research)."
            label="Gerar com IA"
            invalidateKeys={[["impact-effort-items"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-6 space-y-4 border-2 border-primary/20 mb-8 max-w-3xl mx-auto">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Nova Iniciativa Estratégica</h4>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Título da Funcionalidade ou Iniciativa *"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Por que priorizar este item agora?"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/50 resize-none transition-all"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={form.impact_level}
              onChange={e => setForm(f => ({ ...f, impact_level: e.target.value }))}
              className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground"
            >
              <option value="high">Impacto [ALTO]</option>
              <option value="medium">Impacto [MÉDIO]</option>
              <option value="low">Impacto [BAIXO]</option>
            </select>
            <select
              value={form.effort_level}
              onChange={e => setForm(f => ({ ...f, effort_level: e.target.value }))}
              className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground"
            >
              <option value="low">Esforço [BAIXO]</option>
              <option value="medium">Esforço [MÉDIO]</option>
              <option value="high">Esforço [ALTO]</option>
            </select>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground"
            >
              <option value="feature">Feature</option>
              <option value="improvement">Melhoria</option>
              <option value="tech_debt">Tech Debt</option>
              <option value="research">Pesquisa</option>
            </select>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground"
            >
              <option value="backlog">Backlog</option>
              <option value="planned">Planejado</option>
              <option value="in_progress">Fazendo</option>
              <option value="done">Pronto</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground font-bold uppercase transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-8 py-2 rounded-xl text-xs gradient-primary text-primary-foreground font-black uppercase shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 inline mr-1.5" />
              Priorizar
            </button>
          </div>
        </div>
      )}

      {(items ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          filters={[
            { key: "impact_level", label: "Impacto", options: [{ key: "high", label: "Alto", value: "high" }, { key: "medium", label: "Médio", value: "medium" }, { key: "low", label: "Baixo", value: "low" }] },
            { key: "effort_level", label: "Esforço", options: [{ key: "high", label: "Alto", value: "high" }, { key: "medium", label: "Médio", value: "medium" }, { key: "low", label: "Baixo", value: "low" }] },
          ]}
          activeFilters={activeFilters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={items?.length}
          filtered={filtered.length}
          placeholder="Buscar iniciativas ou categorias..."
          className="mb-8"
        />
      )}

      <ErrorBoundary level="section">
        {(items ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Plus}
            title="Matriz de Priorização"
            description="Mapeie suas iniciativas para identificar Quick Wins e focar no que realmente move o ponteiro."
            action={{ label: "Priorizar primeira iniciativa", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nenhum item encontrado"
            description={`Não encontramos iniciativas correspondentes aos seus filtros.`}
            action={{ label: "Limpar busca", onClick: clearFilters }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item: Record<string, unknown>) => {
              const q = getQuadrant(item.impact_level as string, item.effort_level as string);
              return (
                <div key={item.id as string} className={`glass-card p-6 group border ${q.color} transition-all hover:scale-[1.01] hover:shadow-xl shadow-primary/5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-base font-black text-foreground truncate max-w-[200px]">{item.title as string}</h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${q.color}`}>
                          {q.label}
                        </span>
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.description as string}</p>}
                      
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Impacto</span>
                          <span className="text-xs font-bold text-foreground uppercase">{item.impact_level as string}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Esforço</span>
                          <span className="text-xs font-bold text-foreground uppercase">{item.effort_level as string}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Tipo</span>
                          <span className="text-xs font-bold text-primary/80 uppercase">{item.category as string || "Feature"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id as string)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
