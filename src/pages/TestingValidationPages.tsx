import { useState } from "react";
import { Flag, Activity, Eye, Plus, Trash2, Check } from "lucide-react";
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

import type { Database } from "@/integrations/supabase/types";

type IFeatureFlag = Database["public"]["Tables"]["feature_flags"]["Row"];
// Heatmaps and Sessions are currently static in the UI but defined for future consistency
interface IHeatmap { id: string; name: string; url: string; device: string; }
interface ISession { id: string; user_id: string; duration: string; issues: string[]; }

// ─── Feature Flags ────────────────────────────────────────────────────────────
export function FeatureFlagsPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    flag_name: "",
    description: "",
    status: "off",
    rollout_percentage: "0",
    target_segments: "",
    owner: "",
  });

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
  } = useSearch<IFeatureFlag>({
    data: (flags ?? []) as IFeatureFlag[],
    searchFields: ["flag_name", "description", "owner"],
    filters: [
      {
        key: "status",
        label: "Status",
        options: [
          { key: "on", label: "Ligada", value: "on" },
          { key: "off", label: "Desligada", value: "off" },
          { key: "partial", label: "Parcial", value: "partial" },
        ],
      },
    ],
  });

  const handleAdd = async () => {
    if (!form.flag_name.trim() || !projectId) return;
    const { error } = await supabase.from("feature_flags").insert({
      project_id: projectId,
      flag_name: form.flag_name,
      description: form.description,
      status: form.status,
      rollout_percentage: Number(form.rollout_percentage),
      target_segments: form.target_segments
        .split(",")
        .map(s => s.trim())
        .filter(Boolean),
      owner: form.owner,
    });

    if (error) {
      toast.error("Erro ao criar");
      return;
    }

    qc.invalidateQueries({ queryKey: ["feature-flags"] });
    setForm({
      flag_name: "",
      description: "",
      status: "off",
      rollout_percentage: "0",
      target_segments: "",
      owner: "",
    });
    setAdding(false);
    toast.success("Feature flag criada");
  };

  const handleToggle = async (id: string, current: string) => {
    const newStatus = current === "on" ? "off" : "on";
    const { error } = await supabase
      .from("feature_flags")
      .update({
        status: newStatus,
        rollout_percentage: newStatus === "on" ? 100 : 0,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feature_flags").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
    toast.success("Removida");
  };

  if (isLoading) {
    return (
      <ModulePage
        title="Feature Flags"
        subtitle="Controle de rollout de funcionalidades"
        icon={<Flag className="w-4 h-4 text-primary-foreground" />}
      >
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-5 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title="Feature Flags"
      subtitle="Controle de rollout de funcionalidades"
      icon={<Flag className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Flag
          </button>
          <AIGenerateButton
            prompt="Crie 4 feature flags estratégicas para o projeto. Use a ferramenta create_feature_flag para cada uma com flag_name, description, status (on/off/partial), rollout_percentage (0-100), target_segments (array) e owner."
            label="Gerar com IA"
            invalidateKeys={[["feature-flags"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-6">
          <h4 className="text-sm font-semibold text-foreground">Nova Feature Flag</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.flag_name}
              onChange={e => setForm(f => ({ ...f, flag_name: e.target.value }))}
              placeholder="Nome da flag *"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
              placeholder="Responsável"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            >
              <option value="off">Desligada</option>
              <option value="on">Ligada</option>
              <option value="partial">Parcial</option>
            </select>
            <input
              value={form.rollout_percentage}
              onChange={e => setForm(f => ({ ...f, rollout_percentage: e.target.value }))}
              placeholder="Rollout %"
              type="number"
              min="0"
              max="100"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
            <input
              value={form.target_segments}
              onChange={e => setForm(f => ({ ...f, target_segments: e.target.value }))}
              placeholder="Segmentos (separados por vírgula)"
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
              className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"
            >
              <Check className="w-3 h-3 inline mr-1" />
              Criar
            </button>
          </div>
        </div>
      )}

      {(flags ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { key: "on", label: "Ligada", value: "on" },
                { key: "off", label: "Desligada", value: "off" },
                { key: "partial", label: "Parcial", value: "partial" },
              ],
            },
          ]}
          activeFilters={activeFilters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={flags?.length}
          filtered={filtered.length}
          placeholder="Buscar flags..."
          className="mb-6"
        />
      )}

      <ErrorBoundary level="section">
        {(flags ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Flag}
            title="Nenhuma feature flag configurada"
            description="Controle o rollout progressivo de novas funcionalidades para grupos específicos de usuários."
            action={{ label: "Criar primeira flag", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Nenhum resultado"
            description={`Nenhuma feature flag corresponde aos termos buscados.`}
            action={{ label: "Limpar filtros", onClick: clearFilters }}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((flag: IFeatureFlag) => (
              <div key={flag.id} className="glass-card p-4 flex items-center gap-4 group hover:border-primary/20 transition-all">
                <button
                  onClick={() => handleToggle(flag.id, flag.status || "off")}
                  className={`w-10 h-5 rounded-full relative transition-colors shadow-inner ${
                    flag.status === "on" ? "bg-green-500" : flag.status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      flag.status === "on" ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground font-mono tracking-tight">{flag.flag_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
                      {flag.rollout_percentage}% rollout
                    </span>
                  </div>
                  {flag.description && <p className="text-xs text-muted-foreground mt-1 truncate">{flag.description}</p>}
                  {flag.owner && <p className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase font-medium">Responsável: {flag.owner}</p>}
                </div>
                <button
                  onClick={() => handleDelete(flag.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Heatmap Viewer ───────────────────────────────────────────────────────────
export function HeatmapViewerPage() {
  return (
    <ModulePage
      title="Heatmap Viewer"
      subtitle="Visualização de cliques, scroll e atenção"
      icon={<Activity className="w-4 h-4 text-primary-foreground" />}
    >
      <ErrorBoundary level="section">
        <div className="glass-card p-10 text-center">
          <Activity className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-lg font-bold text-foreground mb-3">Heatmap Engine</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
            Visualize mapas de calor de interações reais. Integre com ferramentas como Hotjar ou Clarity para importar dados ou use nosso SDK nativo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-6">
            {[
              { label: "Click Map", gradient: "from-destructive/40 via-amber-500/20 to-green-500/10" },
              { label: "Scroll Map", gradient: "from-blue-500/40 via-primary/20 to-secondary" },
              { label: "Attention Map", gradient: "from-green-500/40 via-amber-500/20 to-destructive/10" }
            ].map((item, i) => (
              <div key={item.label} className="p-4 rounded-xl border border-border bg-secondary/30 group hover:border-primary/20 transition-colors">
                <div className={`w-full h-32 rounded-lg bg-gradient-to-b ${item.gradient} mb-3 shadow-inner`} />
                <p className="text-xs text-foreground font-bold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Simulação de dados</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 border border-primary/20 bg-primary/5 rounded-xl inline-block">
            <p className="text-xs text-primary font-medium">💡 Dica: O Mentor IA pode analisar screenshots destes heatmaps para sugerir mudanças de UX.</p>
          </div>
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Session Recording ────────────────────────────────────────────────────────
export function SessionRecordingPage() {
  const insights = [
    { label: "Rage Clicks detectados no Checkout", value: "24 ocorrências", severity: "high" },
    { label: "Confusão na navegação mobile", value: "18% das sessões", severity: "medium" },
    { label: "Drop-off precoce em Onboarding", value: "42% usuários", severity: "high" },
    { label: "Sucesso em novos fluxos", value: "+12% conversão", severity: "low" }
  ];

  return (
    <ModulePage
      title="Session Insights"
      subtitle="Análise automatizada de gravações de usuários"
      icon={<Eye className="w-4 h-4 text-primary-foreground" />}
    >
      <ErrorBoundary level="section">
        <div className="glass-card p-10 text-center">
          <Eye className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-lg font-bold text-foreground mb-3">Session Intelligence</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
            Analisamos automaticamente gravações de sessões para detectar atritos, bugs visuais e oportunidades de otimização de conversão.
          </p>
          <div className="max-w-xl mx-auto space-y-3 mt-6 text-left">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
                <div className={`w-3 h-3 rounded-full shrink-0 animate-pulse ${
                  insight.severity === "high" ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                  insight.severity === "medium" ? "bg-amber-500" : "bg-green-500"
                }`} />
                <span className="text-sm text-foreground font-medium flex-1">{insight.label}</span>
                <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
                  {insight.value}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-8 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Analisar novas sessões com Mentor IA
          </button>
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}
