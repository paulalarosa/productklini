import { useState } from "react";
import { BookMarked, FileText, MessageSquareMore, Plus, Trash2, Check, Star } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface IDesignPrinciple {
  id: string;
  title: string;
  description: string;
  example: string;
  sort_order: number;
}

interface IDecisionLog {
  id: string;
  title: string;
  context: string;
  decision: string;
  alternatives: string[];
  rationale: string;
  impact: string;
  decided_by: string;
  decided_at: string;
}

interface IDesignCritique {
  id: string;
  screen_name: string;
  critique_type: string;
  feedback: string;
  severity: string;
  status: string;
  reviewer: string;
  created_at: string;
}


// ─── Design Principles ───
export function DesignPrinciplesPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", example: "" });

  const { data: principles } = useQuery({
    queryKey: ["design-principles", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("design_principles").select("*").eq("project_id", projectId).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const { error } = await supabase.from("design_principles").insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description.trim(),
      example: form.example.trim(),
      sort_order: (principles ?? []).length,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["design-principles"] });
    setForm({ title: "", description: "", example: "" });
    setAdding(false);
    toast.success("Princípio adicionado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("design_principles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["design-principles"] });
    toast.success("Removido");
  };

  return (
    <ModulePage
      title="Design Principles"
      subtitle="Princípios que guiam as decisões de design"
      icon={<Star className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo Princípio
          </button>
          <AIGenerateButton
            prompt="Crie 5 design principles para o projeto. Use create_design_principle para cada com title, description e example."
            label="Gerar com IA"
            invalidateKeys={[["design-principles"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo Princípio de Design</h4>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do princípio *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição - o que este princípio significa?" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <textarea value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))} placeholder="Exemplo prático de aplicação" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
          </div>
        </div>
      )}

      {(principles ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum princípio de design definido</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Princípios de design ajudam a alinhar decisões do time.</p>
          <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Criar primeiro princípio</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {(principles ?? []).map((p: IDesignPrinciple, i: number) => (

            <div key={p.id} className="glass-card p-5 group animate-slide-up">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">{i + 1}</div>
                  <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                </div>
                <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{p.description}</p>
              {p.example && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Exemplo</p>
                  <p className="text-xs text-foreground">{p.example}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

// ─── Decision Log ───
export function DecisionLogPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", context: "", decision: "", alternatives: "", rationale: "", impact: "medium", decided_by: "" });

  const { data: decisions } = useQuery({
    queryKey: ["decision-log", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("decision_log").select("*").eq("project_id", projectId).order("decided_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!form.title.trim() || !projectId) return;
    const { error } = await supabase.from("decision_log").insert({
      project_id: projectId,
      title: form.title.trim(),
      context: form.context.trim(),
      decision: form.decision.trim(),
      alternatives: form.alternatives.split(",").map(a => a.trim()).filter(Boolean),
      rationale: form.rationale.trim(),
      impact: form.impact,
      decided_by: form.decided_by.trim(),
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["decision-log"] });
    setForm({ title: "", context: "", decision: "", alternatives: "", rationale: "", impact: "medium", decided_by: "" });
    setAdding(false);
    toast.success("Decisão registrada");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("decision_log").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["decision-log"] });
    toast.success("Removido");
  };

  const impactColors: Record<string, string> = { high: "bg-destructive/10 text-destructive", medium: "bg-amber-500/10 text-amber-500", low: "bg-green-500/10 text-green-500" };

  return (
    <ModulePage
      title="Decision Log"
      subtitle="Registro de decisões e justificativas"
      icon={<FileText className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Decisão
          </button>
          <AIGenerateButton
            prompt="Crie 3 entradas de decision log para o projeto. Use create_decision_log para cada com title, context, decision, alternatives (array), rationale, impact (high/medium/low) e decided_by."
            label="Gerar com IA"
            invalidateKeys={[["decision-log"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Registrar Decisão</h4>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título da decisão *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Contexto: qual problema motivou a decisão?" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <textarea value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))} placeholder="Decisão tomada" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <input value={form.alternatives} onChange={e => setForm(f => ({ ...f, alternatives: e.target.value }))} placeholder="Alternativas consideradas (separadas por vírgula)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} placeholder="Justificativa / racional" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="high">Impacto Alto</option><option value="medium">Médio</option><option value="low">Baixo</option>
            </select>
            <input value={form.decided_by} onChange={e => setForm(f => ({ ...f, decided_by: e.target.value }))} placeholder="Decidido por" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Registrar</button>
          </div>
        </div>
      )}

      {(decisions ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma decisão registrada</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Documente decisões para manter o histórico e contexto do projeto.</p>
          <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Registrar primeira decisão</button>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {(decisions ?? []).map((d: IDecisionLog) => (

            <div key={d.id} className="glass-card p-5 group animate-slide-up">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{d.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${impactColors[d.impact]}`}>{d.impact === "high" ? "Alto impacto" : d.impact === "medium" ? "Médio impacto" : "Baixo impacto"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(d.decided_at).toLocaleDateString("pt-BR")} {d.decided_by && `• ${d.decided_by}`}</p>
                </div>
                <button onClick={() => handleDelete(d.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
              {d.context && <p className="text-xs text-muted-foreground mb-2"><span className="font-medium text-foreground">Contexto:</span> {d.context}</p>}
              {d.decision && <p className="text-xs text-foreground mb-2"><span className="font-medium">Decisão:</span> {d.decision}</p>}
              {d.rationale && <p className="text-xs text-muted-foreground mb-2"><span className="font-medium text-foreground">Racional:</span> {d.rationale}</p>}
              {(d.alternatives || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {d.alternatives.map((a: string) => (
                    <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">❌ {a}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}

// ─── Design Critiques ───
export function DesignCritiquesPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ screen_name: "", critique_type: "visual", feedback: "", severity: "medium", reviewer: "" });

  const { data: critiques } = useQuery({
    queryKey: ["design-critiques", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("design_critiques").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!form.screen_name.trim() || !projectId) return;
    const { error } = await supabase.from("design_critiques").insert({ project_id: projectId, ...form });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["design-critiques"] });
    setForm({ screen_name: "", critique_type: "visual", feedback: "", severity: "medium", reviewer: "" });
    setAdding(false);
    toast.success("Crítica registrada");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("design_critiques").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["design-critiques"] });
    toast.success("Removido");
  };

  const sevColors: Record<string, string> = { high: "bg-destructive/10 text-destructive", medium: "bg-amber-500/10 text-amber-500", low: "bg-green-500/10 text-green-500" };
  const statusColors: Record<string, string> = { open: "bg-blue-500/10 text-blue-500", in_review: "bg-amber-500/10 text-amber-500", resolved: "bg-green-500/10 text-green-500" };

  return (
    <ModulePage
      title="Design Critiques"
      subtitle="Log de feedback e revisões de design"
      icon={<MessageSquareMore className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Crítica
          </button>
          <AIGenerateButton
            prompt="Analise o projeto e crie 3 design critiques. Use create_design_critique para cada com screen_name, critique_type (visual/usability/accessibility/content), feedback, severity (high/medium/low) e reviewer."
            label="Gerar com IA"
            invalidateKeys={[["design-critiques"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Nova Crítica de Design</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.screen_name} onChange={e => setForm(f => ({ ...f, screen_name: e.target.value }))} placeholder="Nome da tela *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.reviewer} onChange={e => setForm(f => ({ ...f, reviewer: e.target.value }))} placeholder="Revisor" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.critique_type} onChange={e => setForm(f => ({ ...f, critique_type: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="visual">Visual</option><option value="usability">Usabilidade</option><option value="accessibility">Acessibilidade</option><option value="content">Conteúdo</option>
            </select>
            <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="high">Severidade Alta</option><option value="medium">Média</option><option value="low">Baixa</option>
            </select>
          </div>
          <textarea value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Feedback detalhado" rows={3} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Registrar</button>
          </div>
        </div>
      )}

      {(critiques ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <MessageSquareMore className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma critique registrada</p>
          <button onClick={() => setAdding(true)} className="mt-4 px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Registrar primeira critique</button>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {(critiques ?? []).map((c: IDesignCritique) => (

            <div key={c.id} className="glass-card p-4 group animate-slide-up">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">{c.screen_name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${sevColors[c.severity]}`}>{c.severity}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{c.critique_type}</span>
                </div>
                <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
              <p className="text-xs text-muted-foreground">{c.feedback}</p>
              {c.reviewer && <p className="text-[10px] text-muted-foreground mt-2">— {c.reviewer}</p>}
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
