import { useState } from "react";
import { Heart, Star, BarChart3, Plus, Trash2, Check, Target, TrendingUp } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── HEART Framework ───
const HEART_CATEGORIES = [
  { key: "happiness", label: "Happiness", color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "engagement", label: "Engagement", color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "adoption", label: "Adoption", color: "text-green-500", bg: "bg-green-500/10" },
  { key: "retention", label: "Retention", color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "task_success", label: "Task Success", color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function HEARTFrameworkPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "happiness", metric_name: "", signal: "", goal: "", current_value: "", target_value: "", unit: "%" });

  const { data: metrics } = useQuery({
    queryKey: ["heart-metrics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("heart_metrics").select("*").eq("project_id", projectId).order("category");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!form.metric_name.trim() || !projectId) return;
    const { error } = await supabase.from("heart_metrics").insert({
      project_id: projectId,
      category: form.category,
      metric_name: form.metric_name.trim(),
      signal: form.signal.trim(),
      goal: form.goal.trim(),
      current_value: parseFloat(form.current_value) || 0,
      target_value: parseFloat(form.target_value) || 0,
      unit: form.unit,
    });
    if (error) { toast.error("Erro ao criar métrica"); return; }
    qc.invalidateQueries({ queryKey: ["heart-metrics"] });
    setForm({ category: "happiness", metric_name: "", signal: "", goal: "", current_value: "", target_value: "", unit: "%" });
    setAdding(false);
    toast.success("Métrica adicionada");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("heart_metrics").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["heart-metrics"] });
    toast.success("Removido");
  };

  return (
    <ModulePage
      title="HEART Framework"
      subtitle="Happiness, Engagement, Adoption, Retention, Task Success"
      icon={<Heart className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Métrica
          </button>
          <AIGenerateButton
            prompt="Crie métricas HEART completas para o projeto. Use create_heart_metric para cada uma com category (happiness/engagement/adoption/retention/task_success), metric_name, signal, goal, current_value, target_value e unit."
            label="Gerar com IA"
            invalidateKeys={[["heart-metrics"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Nova Métrica HEART</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              {HEART_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input value={form.metric_name} onChange={e => setForm(f => ({ ...f, metric_name: e.target.value }))} placeholder="Nome da métrica *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unidade (%, pts, etc)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <input value={form.signal} onChange={e => setForm(f => ({ ...f, signal: e.target.value }))} placeholder="Sinal (o que medir)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Goal (objetivo)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} placeholder="Valor atual" type="number" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} placeholder="Meta" type="number" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
          </div>
        </div>
      )}

      {HEART_CATEGORIES.map(cat => {
        const catMetrics = (metrics ?? []).filter((m: any) => m.category === cat.key);
        if (catMetrics.length === 0 && !adding) return null;
        return (
          <div key={cat.key} className="mb-6">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${cat.color} mb-3`}>{cat.label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {catMetrics.map((m: any) => {
                const progress = m.target_value > 0 ? Math.min(100, (m.current_value / m.target_value) * 100) : 0;
                return (
                  <div key={m.id} className="glass-card p-4 group">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">{m.metric_name}</h4>
                      <button onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                    {m.signal && <p className="text-xs text-muted-foreground mb-1"><span className="font-medium">Sinal:</span> {m.signal}</p>}
                    {m.goal && <p className="text-xs text-muted-foreground mb-2"><span className="font-medium">Goal:</span> {m.goal}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-foreground">{m.current_value}{m.unit}</span>
                      <span className="text-xs text-muted-foreground">/ {m.target_value}{m.unit}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary mt-2">
                      <div className={`h-full rounded-full ${cat.bg.replace('/10', '')} opacity-70`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(metrics ?? []).length === 0 && !adding && (
        <div className="glass-card p-8 text-center">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma métrica HEART definida</p>
          <button onClick={() => setAdding(true)} className="mt-4 px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Criar primeira métrica</button>
        </div>
      )}
    </ModulePage>
  );
}

// ─── North Star Metric ───
export function NorthStarPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ metric_name: "", description: "", current_value: "", target_value: "", unit: "" });

  const { data: metrics } = useQuery({
    queryKey: ["north-star", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("north_star_metrics").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!form.metric_name.trim() || !projectId) return;
    const { error } = await supabase.from("north_star_metrics").insert({
      project_id: projectId,
      metric_name: form.metric_name.trim(),
      description: form.description.trim(),
      current_value: parseFloat(form.current_value) || 0,
      target_value: parseFloat(form.target_value) || 0,
      unit: form.unit.trim(),
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["north-star"] });
    setForm({ metric_name: "", description: "", current_value: "", target_value: "", unit: "" });
    setAdding(false);
    toast.success("North Star adicionada");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("north_star_metrics").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["north-star"] });
    toast.success("Removido");
  };

  return (
    <ModulePage
      title="North Star Metric"
      subtitle="A métrica que mais importa para o produto"
      icon={<Star className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Definir North Star
          </button>
          <AIGenerateButton
            prompt="Defina a North Star Metric ideal para o projeto. Use create_north_star com metric_name, description, current_value, target_value e unit."
            label="Gerar com IA"
            invalidateKeys={[["north-star"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Definir North Star Metric</h4>
          <input value={form.metric_name} onChange={e => setForm(f => ({ ...f, metric_name: e.target.value }))} placeholder="Nome da métrica *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Por que esta métrica é a mais importante?" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="grid grid-cols-3 gap-3">
            <input value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} placeholder="Valor atual" type="number" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} placeholder="Meta" type="number" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Unidade" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Definir</button>
          </div>
        </div>
      )}

      {(metrics ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma North Star definida</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">A North Star Metric é o indicador que melhor captura o valor que seu produto entrega.</p>
          <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Definir North Star</button>
        </div>
      ) : (
        <div className="space-y-4">
          {(metrics ?? []).map((m: any) => {
            const progress = m.target_value > 0 ? Math.min(100, (m.current_value / m.target_value) * 100) : 0;
            return (
              <div key={m.id} className="glass-card p-6 border-2 border-primary/20 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><Star className="w-5 h-5 text-primary-foreground" /></div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{m.metric_name}</h3>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(m.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-bold text-foreground">{m.current_value}</span>
                  <span className="text-sm text-muted-foreground mb-1">{m.unit}</span>
                  <span className="text-xs text-muted-foreground mb-1.5">/ meta: {m.target_value} {m.unit}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary mt-3">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% da meta</p>
              </div>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}

// ─── NPS / CSAT / CES ───
export function NPSSurveysPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ survey_type: "nps", score: "", respondent_name: "", feedback: "", segment: "" });

  const { data: surveys } = useQuery({
    queryKey: ["nps-surveys", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("nps_surveys").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!projectId) return;
    const { error } = await supabase.from("nps_surveys").insert({
      project_id: projectId,
      survey_type: form.survey_type,
      score: parseFloat(form.score) || 0,
      respondent_name: form.respondent_name.trim() || "Anônimo",
      feedback: form.feedback.trim(),
      segment: form.segment.trim(),
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["nps-surveys"] });
    setForm({ survey_type: "nps", score: "", respondent_name: "", feedback: "", segment: "" });
    setAdding(false);
    toast.success("Resposta registrada");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("nps_surveys").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["nps-surveys"] });
    toast.success("Removido");
  };

  // NPS calculation
  const npsSurveys = (surveys ?? []).filter((s: any) => s.survey_type === "nps");
  const promoters = npsSurveys.filter((s: any) => s.score >= 9).length;
  const detractors = npsSurveys.filter((s: any) => s.score <= 6).length;
  const npsScore = npsSurveys.length > 0 ? Math.round(((promoters - detractors) / npsSurveys.length) * 100) : null;

  const typeLabels: Record<string, string> = { nps: "NPS", csat: "CSAT", ces: "CES" };

  return (
    <ModulePage
      title="NPS / CSAT / CES"
      subtitle="Pesquisas de satisfação e esforço do cliente"
      icon={<BarChart3 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Resposta
          </button>
          <AIGenerateButton
            prompt="Crie 5 respostas NPS simuladas para o projeto. Use create_nps_survey para cada com survey_type (nps/csat/ces), score (0-10 para NPS, 1-5 para CSAT/CES), respondent_name, feedback e segment."
            label="Gerar com IA"
            invalidateKeys={[["nps-surveys"]]}
            size="sm"
          />
        </div>
      }
    >
      {/* Score Cards */}
      {npsScore !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">NPS Score</p>
            <p className={`text-3xl font-bold ${npsScore >= 50 ? "text-green-500" : npsScore >= 0 ? "text-amber-500" : "text-destructive"}`}>{npsScore}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Promotores</p>
            <p className="text-2xl font-bold text-green-500">{promoters}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Detratores</p>
            <p className="text-2xl font-bold text-destructive">{detractors}</p>
          </div>
        </div>
      )}

      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Nova Resposta</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={form.survey_type} onChange={e => setForm(f => ({ ...f, survey_type: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="nps">NPS (0-10)</option>
              <option value="csat">CSAT (1-5)</option>
              <option value="ces">CES (1-7)</option>
            </select>
            <input value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="Score" type="number" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.respondent_name} onChange={e => setForm(f => ({ ...f, respondent_name: e.target.value }))} placeholder="Respondente" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <input value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Feedback" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} placeholder="Segmento" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Registrar</button>
          </div>
        </div>
      )}

      {(surveys ?? []).length === 0 && !adding ? (
        <div className="glass-card p-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma pesquisa registrada</p>
          <button onClick={() => setAdding(true)} className="mt-4 px-4 py-2 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">Registrar primeira resposta</button>
        </div>
      ) : (
        <div className="space-y-2">
          {(surveys ?? []).map((s: any) => (
            <div key={s.id} className="glass-card p-4 flex items-center gap-4 group">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${s.survey_type === "nps" ? (s.score >= 9 ? "bg-green-500/10 text-green-500" : s.score <= 6 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500") : "bg-primary/10 text-primary"}`}>
                {s.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{s.respondent_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{typeLabels[s.survey_type]}</span>
                  {s.segment && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s.segment}</span>}
                </div>
                {s.feedback && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.feedback}</p>}
              </div>
              <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
