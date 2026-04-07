import { useState } from "react";
import { Heart, Star, BarChart3, Plus, Trash2, Check } from "lucide-react";
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { Database } from "@/integrations/supabase/types";

type IHeartMetric = Database["public"]["Tables"]["heart_metrics"]["Row"];
type INorthStarMetric = Database["public"]["Tables"]["north_star_metrics"]["Row"];
type INpsSurvey = Database["public"]["Tables"]["nps_surveys"]["Row"];

const HEART_CATEGORIES = [
  { key: "happiness", label: "Happiness", color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "engagement", label: "Engagement", color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "adoption", label: "Adoption", color: "text-green-500", bg: "bg-green-500/10" },
  { key: "retention", label: "Retention", color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "task_success", label: "Task Success", color: "text-purple-500", bg: "bg-purple-500/10" },
];

// ─── HEART Framework ─────────────────────────────────────────────────────────
export function HEARTFrameworkPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    category: "happiness",
    metric_name: "",
    signal: "",
    goal: "",
    current_value: "",
    target_value: "",
    unit: "%",
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["heart-metrics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("heart_metrics")
        .select("*")
        .eq("project_id", projectId)
        .order("category");
      if (error) throw error;
      return data as IHeartMetric[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    query,
    setQuery,
    activeFilters,
    setFilter,
    clearFilters,
    filtered,
    hasActiveFilters,
  } = useSearch({
    data: (metrics ?? []) as Record<string, unknown>[],
    searchFields: ["metric_name", "signal", "goal"],
    filters: [
      {
        key: "category",
        label: "Categoria",
        options: HEART_CATEGORIES.map(c => ({ key: c.key, label: c.label, value: c.key })),
      },
    ],
  });

  const handleAdd = async () => {
    if (!form.metric_name.trim() || !projectId) return;
    const { error } = await supabase.from("heart_metrics").insert({
      project_id: projectId,
      category: form.category,
      metric_name: form.metric_name,
      signal: form.signal,
      goal: form.goal,
      current_value: parseFloat(form.current_value) || 0,
      target_value: parseFloat(form.target_value) || 0,
      unit: form.unit,
    });

    if (error) {
      toast.error("Erro ao criar métrica");
      return;
    }

    qc.invalidateQueries({ queryKey: ["heart-metrics"] });
    setForm({
      category: "happiness",
      metric_name: "",
      signal: "",
      goal: "",
      current_value: "",
      target_value: "",
      unit: "%",
    });
    setAdding(false);
    toast.success("Métrica HEART criada");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("heart_metrics").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover métrica");
      return;
    }
    qc.invalidateQueries({ queryKey: ["heart-metrics"] });
    toast.success("Removida");
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="HEART Framework"
      subtitle="Happiness, Engagement, Adoption, Retention, Task Success"
      icon={<Heart className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Métrica
          </button>
          <AIGenerateButton
            prompt="Defina métricas HEART estratégicas para este projeto. Gere uma métrica para cada dimensão (happiness, engagement, adoption, retention, task_success) com metric_name, signal, goal, current_value, target_value e unit."
            label="Gerar com IA"
            invalidateKeys={[["heart-metrics"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-6">
          <h4 className="text-sm font-semibold text-foreground">Nova Métrica HEART</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {HEART_CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              value={form.metric_name}
              onChange={e => setForm(f => ({ ...f, metric_name: e.target.value }))}
              placeholder="Nome da métrica *"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <input
            value={form.signal}
            onChange={e => setForm(f => ({ ...f, signal: e.target.value }))}
            placeholder="Signal (comportamento que indica a métrica)"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Goal (objetivo que queremos alcançar)"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={form.current_value}
              onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
              placeholder="Valor atual"
              type="number"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
            <input
              value={form.target_value}
              onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
              placeholder="Meta final"
              type="number"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
            <input
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="Unidade (%, usuários...)"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium active:scale-95 transition-all"
            >
              <Check className="w-3 h-3 inline mr-1" />
              Criar Métrica
            </button>
          </div>
        </div>
      )}

      {(metrics ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          filters={[
            {
              key: "category",
              label: "Categoria",
              options: HEART_CATEGORIES.map(c => ({ key: c.key, label: c.label, value: c.key })),
            },
          ]}
          activeFilters={activeFilters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={metrics?.length}
          filtered={filtered.length}
          placeholder="Buscar métricas HEART..."
          className="mb-6"
        />
      )}

      {metrics && metrics.length > 0 && (
        <div className="glass-card p-6 mb-8 h-[300px] animate-fade-in">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">
            Visão Geral HEART
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="metric_name"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "10px",
                }}
              />
              <Bar dataKey="current_value" radius={[4, 4, 0, 0]} barSize={32}>
                {metrics.map((m, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={HEART_CATEGORIES.find(c => c.key === m.category)?.color.includes("pink") ? "#ec4899" : HEART_CATEGORIES.find(c => c.key === m.category)?.color.includes("blue") ? "#3b82f6" : HEART_CATEGORIES.find(c => c.key === m.category)?.color.includes("green") ? "#22c55e" : HEART_CATEGORIES.find(c => c.key === m.category)?.color.includes("amber") ? "#f59e0b" : "#a855f7"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ErrorBoundary level="section">
        {(metrics ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Heart}
            title="Nenhuma métrica HEART definida"
            description="Use o HEART Framework do Google para medir a qualidade da experiência do usuário em larga escala."
            action={{ label: "Criar primeira métrica", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhum resultado"
            description={`Nenhuma métrica HEART corresponde aos filtros aplicados.`}
            action={{ label: "Limpar filtros", onClick: clearFilters }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m: any) => {
              const cat = HEART_CATEGORIES.find(c => c.key === m.category) || HEART_CATEGORIES[0];
              const curVal = m.current_value;
              const tarVal = m.target_value;
              const pct = tarVal ? Math.min(100, Math.round((curVal / tarVal) * 100)) : 0;

              return (
                <div
                  key={m.id}
                  className="glass-card p-5 group hover:border-primary/20 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.color} border border-current/10`}
                    >
                      {cat.label}
                    </span>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2 leading-tight">
                    {m.metric_name}
                  </h3>
                  <div className="flex-1 space-y-2 mb-4">
                    {m.signal && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="font-bold opacity-70 uppercase">Signal:</span> {m.signal}
                      </p>
                    )}
                    {m.goal && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="font-bold opacity-70 uppercase">Goal:</span> {m.goal}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">
                        Progresso
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {curVal}
                        {m.unit} / {tarVal}
                        {m.unit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full ${cat.color.replace(
                          "text-",
                          "bg-"
                        )} transition-all duration-700 ease-out shadow-sm`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className={`text-[10px] font-bold text-right ${cat.color}`}>{pct}%</p>
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

// ─── NPS Tracker ─────────────────────────────────────────────────────────────
export function NPSTrackerPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    survey_type: "nps",
    score: "8",
    respondent_name: "",
    feedback: "",
    segment: "",
  });

  const { data: surveys, isLoading } = useQuery({
    queryKey: ["nps-surveys", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("nps_surveys")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as INpsSurvey[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    query,
    setQuery,
    activeFilters,
    setFilter,
    clearFilters,
    filtered,
    hasActiveFilters,
  } = useSearch({
    data: (surveys ?? []) as Record<string, unknown>[],
    searchFields: ["respondent_name", "feedback", "segment"],
    filters: [
      {
        key: "survey_type",
        label: "Tipo",
        options: [
          { key: "nps", label: "NPS", value: "nps" },
          { key: "csat", label: "CSAT", value: "csat" },
          { key: "ces", label: "CES", value: "ces" },
        ],
      },
    ],
  });

  const handleAdd = async () => {
    if (!projectId) return;
    const { error } = await supabase.from("nps_surveys").insert({
      project_id: projectId,
      survey_type: form.survey_type,
      score: Number(form.score),
      respondent_name: form.respondent_name,
      feedback: form.feedback,
      segment: form.segment,
    });

    if (error) {
      toast.error("Erro ao registrar resposta");
      return;
    }

    qc.invalidateQueries({ queryKey: ["nps-surveys"] });
    setForm({ survey_type: "nps", score: "8", respondent_name: "", feedback: "", segment: "" });
    setAdding(false);
    toast.success("Resposta registrada com sucesso");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("nps_surveys").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover resposta");
      return;
    }
    qc.invalidateQueries({ queryKey: ["nps-surveys"] });
    toast.success("Removido");
  };

  const npsColor = (score: number) =>
    score >= 9 ? "text-green-500" : score >= 7 ? "text-amber-500" : "text-destructive";
  const npsBg = (score: number) =>
    score >= 9 ? "bg-green-500/10" : score >= 7 ? "bg-amber-500/10" : "bg-destructive/10";
  const npsLabel = (score: number) => (score >= 9 ? "Promotor" : score >= 7 ? "Neutro" : "Detrator");

  const avgScore =
    surveys && surveys.length > 0
      ? Math.round((surveys.reduce((acc, s) => acc + s.score, 0) / surveys.length) * 10) / 10
      : null;

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Satisfaction Dashboard"
      subtitle="Tracker em tempo real de NPS, CSAT e Customer Effort Score"
      icon={<Star className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Resposta
          </button>
          <AIGenerateButton
            prompt="Simule 5 entradas de feedback de usuários variadas (NPS, CSAT, CES). Use a ferramenta create_nps_survey para cada uma com score, respondent_name, feedback, segment e survey_type (nps/csat/ces)."
            label="Gerar com IA"
            invalidateKeys={[["nps-surveys"]]}
            size="sm"
          />
        </div>
      }
    >
      {avgScore !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6 text-center border-b-4 border-primary/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Média Geral
            </p>
            <p className={`text-4xl font-black ${npsColor(avgScore)}`}>{avgScore}</p>
          </div>
          <div className="glass-card p-6 text-center border-b-4 border-green-500/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Promotores
            </p>
            <p className="text-4xl font-black text-green-500">
              {surveys?.filter(s => s.score >= 9).length}
            </p>
          </div>
          <div className="glass-card p-6 text-center border-b-4 border-destructive/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Detratores
            </p>
            <p className="text-4xl font-black text-destructive">
              {surveys?.filter(s => s.score < 7).length}
            </p>
          </div>
        </div>
      )}

      {adding && (
        <div className="glass-card p-6 space-y-4 border-2 border-primary/20 mb-6">
          <h4 className="text-sm font-bold text-foreground mb-2">Registrar Novo Feedback</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={form.survey_type}
              onChange={e => setForm(f => ({ ...f, survey_type: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="nps">NPS (Net Promoter Score)</option>
              <option value="csat">CSAT (Customer Satisfaction)</option>
              <option value="ces">CES (Customer Effort Score)</option>
            </select>
            <input
              value={form.respondent_name}
              onChange={e => setForm(f => ({ ...f, respondent_name: e.target.value }))}
              placeholder="Nome do respondente"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={form.segment}
              onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
              placeholder="Segmento (ex: Enterprise)"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <label className="text-[11px] font-bold text-muted-foreground mb-3 block uppercase tracking-wider">
              Nota atribuída: <span className={`text-sm ${npsColor(Number(form.score))}`}>{form.score}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={form.score}
              onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-muted-foreground/50">
              <span>0 - PÉSSIMO</span>
              <span>10 - EXCELENTE</span>
            </div>
          </div>
          <textarea
            value={form.feedback}
            onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
            placeholder="Feedback qualitativo detalhado (opcional)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
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
              className="px-6 py-2 rounded-xl text-xs gradient-primary text-primary-foreground hover:opacity-90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 inline mr-1.5" />
              Salvar Resposta
            </button>
          </div>
        </div>
      )}

      {(surveys ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          filters={[
            {
              key: "survey_type",
              label: "Tipo",
              options: [
                { key: "nps", label: "NPS", value: "nps" },
                { key: "csat", label: "CSAT", value: "csat" },
                { key: "ces", label: "CES", value: "ces" },
              ],
            },
          ]}
          activeFilters={activeFilters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={surveys?.length}
          filtered={filtered.length}
          placeholder="Buscar feedbacks por nome, comentário ou segmento..."
          className="mb-8"
        />
      )}

      <ErrorBoundary level="section">
        {(surveys ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Star}
            title="Nenhum feedback coletado"
            description="Comece a monitorar o pulso do seu produto registrando as primeiras respostas de satisfação."
            action={{ label: "Adicionar feedback", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Nenhum resultado"
            description={`Não encontramos feedbacks para a busca realizada.`}
            action={{ label: "Limpar filtros", onClick: clearFilters }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((s: Record<string, unknown>) => (
              <div
                key={s.id as string}
                className="glass-card p-5 flex items-start gap-5 group hover:border-primary/30 transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-current/10 ${npsBg(
                    s.score as number
                  )} ${npsColor(s.score as number)}`}
                >
                  <span className="text-xl font-black leading-none">{s.score as number}</span>
                  <span className="text-[8px] font-bold uppercase mt-1">NOTA</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {(s.respondent_name as string) || "Respondente Anônimo"}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-current/10 ${npsBg(
                        s.score as number
                      )} ${npsColor(s.score as number)}`}
                    >
                      {npsLabel(s.score as number)}
                    </span>
                    <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-md">
                      {s.survey_type as string}
                    </span>
                    {s.segment && (
                      <span className="text-[10px] text-muted-foreground font-medium italic">
                        {s.segment as string}
                      </span>
                    )}
                  </div>
                  {s.feedback && (
                    <div className="relative pl-4 border-l-2 border-border/50">
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "{s.feedback as string}"
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(s.id as string)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── North Star Metric ────────────────────────────────────────────────────────
export function NorthStarMetricPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    metric_name: "",
    description: "",
    current_value: "",
    target_value: "",
    unit: "",
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["north-star-metrics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("north_star_metrics")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as INorthStarMetric[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const { query, setQuery, clearFilters, filtered, hasActiveFilters } = useSearch({
    data: (metrics ?? []) as Record<string, unknown>[],
    searchFields: ["metric_name", "description"],
  });

  const handleAdd = async () => {
    if (!form.metric_name.trim() || !projectId) return;
    const { error } = await supabase.from("north_star_metrics").insert({
      project_id: projectId,
      metric_name: form.metric_name,
      description: form.description,
      current_value: parseFloat(form.current_value) || 0,
      target_value: parseFloat(form.target_value) || 0,
      unit: form.unit,
    });

    if (error) {
      toast.error("Erro ao definir North Star");
      return;
    }

    qc.invalidateQueries({ queryKey: ["north-star-metrics"] });
    setForm({ metric_name: "", description: "", current_value: "", target_value: "", unit: "" });
    setAdding(false);
    toast.success("North Star Metric definida!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("north_star_metrics").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover métrica");
      return;
    }
    qc.invalidateQueries({ queryKey: ["north-star-metrics"] });
    toast.success("Removida");
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="North Star Metric"
      subtitle="O farol que guia o crescimento estratégico do seu produto"
      icon={<BarChart3 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Definir North Star
          </button>
          <AIGenerateButton
            prompt="Defina uma North Star Metric ambiciosa e relevante para este projeto. Utilize a ferramenta create_north_star com metric_name (ex: valor total transacionado), description (explique a relevância), current_value, target_value e unit."
            label="Gerar com IA"
            invalidateKeys={[["north-star-metrics"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-6 space-y-4 border-2 border-primary/20 mb-8 max-w-2xl mx-auto shadow-2xl shadow-primary/10">
          <h4 className="text-sm font-black text-foreground uppercase tracking-widest text-center mb-2">
            Nova North Star Metric
          </h4>
          <input
            value={form.metric_name}
            onChange={e => setForm(f => ({ ...f, metric_name: e.target.value }))}
            placeholder="Nome da métrica que define o sucesso final *"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descreva por que esta métrica alinha valor ao usuário e receita ao negócio."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-2">
                Valor Atual
              </label>
              <input
                value={form.current_value}
                onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
                placeholder="Ex: 500"
                type="number"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-2">
                Meta Final
              </label>
              <input
                value={form.target_value}
                onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                placeholder="Ex: 5000"
                type="number"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block ml-2">
                Unidade
              </label>
              <input
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="Ex: Usuários"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-3">
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="px-8 py-2 rounded-xl text-xs gradient-primary text-primary-foreground hover:opacity-90 font-black uppercase shadow-lg shadow-primary/30 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 inline mr-1.5" />
              Consolidar North Star
            </button>
          </div>
        </div>
      )}

      {(metrics ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={metrics?.length}
          filtered={filtered.length}
          placeholder="Filtrar por nome ou descrição..."
          className="mb-8"
        />
      )}

      <ErrorBoundary level="section">
        {(metrics ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={BarChart3}
            title="Onde está o seu farol?"
            description="Sem uma North Star Metric, o time corre o risco de focar em métricas de vaidade. Defina o que realmente importa agora."
            action={{ label: "Definir North Star", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="North Star não encontrada"
            description={`Não encontramos métricas North Star com o termo "${query}".`}
            action={{ label: "Limpar filtros", onClick: clearFilters }}
          />
        ) : (
          <div className="space-y-6">
            {filtered.map((m: Record<string, unknown>) => {
              const cur = m.current_value as number;
              const tar = m.target_value as number;
              const pct = tar ? Math.min(100, Math.round((cur / tar) * 100)) : 0;

              return (
                <div
                  key={m.id as string}
                  className="glass-card p-10 group relative border-2 border-primary/10 overflow-hidden hover:border-primary/40 transition-all shadow-xl"
                >
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-start justify-between relative z-10 mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[2rem] gradient-primary flex items-center justify-center shrink-0 shadow-2xl shadow-primary/40 group-hover:rotate-12 transition-transform duration-500">
                        <Star className="w-8 h-8 text-primary-foreground fill-current" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tighter">
                          {m.metric_name as string}
                        </h3>
                        {m.description && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-xl font-medium leading-relaxed">
                            {m.description as string}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id as string)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Performance do Valor Central
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-foreground">{cur}</span>
                        <span className="text-sm font-bold text-muted-foreground uppercase">
                          de {tar} {m.unit as string}
                        </span>
                      </div>
                    </div>
                    <div className="h-4 rounded-full bg-secondary p-1 border border-border shadow-inner relative overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%` }}
                      >
                        <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move-background_1s_linear_infinite]" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-sm font-black text-primary tracking-tight">
                        {pct}% ATINGIDO
                      </p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase">
                          <Check className="w-3 h-3" /> Tendência Positiva
                        </div>
                      </div>
                    </div>
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
