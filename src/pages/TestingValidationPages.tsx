import { useState } from "react";
import { Flag, Activity, Eye, Plus, Trash2, Check } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/skeletons";

// ─── Feature Flags ───
export function FeatureFlagsPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ flag_name: "", description: "", status: "off", rollout_percentage: "0", target_segments: "", owner: "" });

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("feature_flags").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });

  const handleAdd = async () => {
    if (!form.flag_name.trim() || !projectId) return;
    const { error } = await supabase.from("feature_flags").insert({
      project_id: projectId, flag_name: form.flag_name, description: form.description, status: form.status,
      rollout_percentage: Number(form.rollout_percentage),
      target_segments: form.target_segments.split(",").map(s => s.trim()).filter(Boolean),
      owner: form.owner,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
    setForm({ flag_name: "", description: "", status: "off", rollout_percentage: "0", target_segments: "", owner: "" });
    setAdding(false);
    toast.success("Feature flag criada");
  };

  const handleToggle = async (id: string, current: string) => {
    const newStatus = current === "on" ? "off" : "on";
    await supabase.from("feature_flags").update({ status: newStatus, rollout_percentage: newStatus === "on" ? 100 : 0 }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("feature_flags").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
    toast.success("Removida");
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage title="Feature Flags" subtitle="Controle de rollout de funcionalidades" icon={<Flag className="w-4 h-4 text-primary-foreground" />}
      actions={<div className="flex items-center gap-2">
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-3.5 h-3.5" /> Nova Flag</button>
        <AIGenerateButton prompt="Crie 4 feature flags para o projeto. Use create_feature_flag para cada com flag_name, description, status (on/off/partial), rollout_percentage (0-100), target_segments (array) e owner." label="Gerar com IA" invalidateKeys={[["feature-flags"]]} size="sm" />
      </div>}>
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Nova Feature Flag</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.flag_name} onChange={e => setForm(f => ({ ...f, flag_name: e.target.value }))} placeholder="Nome da flag *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsável" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="off">Desligada</option><option value="on">Ligada</option><option value="partial">Parcial</option>
            </select>
            <input value={form.rollout_percentage} onChange={e => setForm(f => ({ ...f, rollout_percentage: e.target.value }))} placeholder="Rollout %" type="number" min="0" max="100" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.target_segments} onChange={e => setForm(f => ({ ...f, target_segments: e.target.value }))} placeholder="Segmentos (vírgula)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
          </div>
        </div>
      )}

      <ErrorBoundary level="section">
        {(flags ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Flag}
            title="Nenhuma feature flag"
            description="Controle o rollout de funcionalidades com flags configuráveis."
            action={{ label: "Criar primeira flag", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="space-y-2">
            {(flags ?? []).map(flag => (
              <div key={flag.id} className="glass-card p-4 flex items-center gap-4 group">
                <button onClick={() => handleToggle(flag.id, flag.status)} className={`w-10 h-5 rounded-full relative transition-colors ${flag.status === "on" ? "bg-green-500" : flag.status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${flag.status === "on" ? "right-0.5" : "left-0.5"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground font-mono">{flag.flag_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{flag.rollout_percentage}%</span>
                  </div>
                  {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
                  {flag.owner && <p className="text-[10px] text-muted-foreground">Owner: {flag.owner}</p>}
                </div>
                <button onClick={() => handleDelete(flag.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 transition-all"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Heatmap Viewer (placeholder informativo) ───
export function HeatmapViewerPage() {
  return (
    <ModulePage title="Heatmap Viewer" subtitle="Visualização de cliques, scroll e atenção" icon={<Activity className="w-4 h-4 text-primary-foreground" />}>
      <ErrorBoundary level="section">
        <div className="glass-card p-8 text-center bg-card/30">
          <Activity className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-foreground mb-2">Heatmap Viewer</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
            Visualize mapas de calor de cliques, scroll e atenção dos usuários. Integre com Hotjar, FullStory ou Microsoft Clarity para importar dados reais.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
            <div className="p-4 rounded-lg border border-border bg-secondary/50">
              <div className="w-full h-32 rounded-md bg-gradient-to-b from-destructive/30 via-amber-500/20 to-green-500/10 mb-2 relative overflow-hidden">
                <div className="absolute top-4 left-8 w-6 h-6 rounded-full bg-destructive/60 blur-sm" />
                <div className="absolute top-8 right-12 w-4 h-4 rounded-full bg-destructive/40 blur-sm" />
                <div className="absolute bottom-8 left-16 w-3 h-3 rounded-full bg-amber-500/40 blur-sm" />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Click Map</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-secondary/50">
              <div className="w-full h-32 rounded-md bg-gradient-to-b from-destructive/40 via-amber-500/30 via-green-500/10 to-transparent mb-2" />
              <p className="text-[10px] text-muted-foreground font-medium">Scroll Map</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-secondary/50">
              <div className="w-full h-32 rounded-md bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-2 relative overflow-hidden">
                <div className="absolute top-3 left-3 w-16 h-3 rounded bg-primary/30" />
                <div className="absolute top-8 left-3 w-24 h-3 rounded bg-primary/20" />
                <div className="absolute top-14 left-3 w-12 h-3 rounded bg-primary/10" />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Attention Map</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 italic opacity-70">💡 Use o Mentor IA para analisar screenshots de heatmaps reais e gerar insights estratégicos.</p>
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── Session Recording Insights ───
export function SessionRecordingPage() {
  return (
    <ModulePage title="Session Recording Insights" subtitle="Resumo e análise de sessões de usuário" icon={<Eye className="w-4 h-4 text-primary-foreground" />}>
      <ErrorBoundary level="section">
        <div className="glass-card p-8 text-center bg-card/30">
          <Eye className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-foreground mb-2">Session Recording Insights</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
            Importe dados de sessões gravadas (Hotjar, FullStory, LogRocket) e use o Mentor IA para gerar insights automatizados e identificar gargalos de UX.
          </p>
          <div className="max-w-lg mx-auto space-y-3 mt-6 text-left">
            {[
              { label: "Rage Clicks detectados", value: "23 sessões", severity: "high" },
              { label: "Dead Clicks em CTA principal", value: "15 sessões", severity: "medium" },
              { label: "Drop-off na etapa de pagamento", value: "42%", severity: "high" },
              { label: "Tempo médio na tela de onboarding", value: "4.2 min", severity: "low" },
            ].map((insight, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card group hover:bg-accent transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${insight.severity === "high" ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : insight.severity === "medium" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"}`} />
                <span className="text-xs text-foreground flex-1 font-medium">{insight.label}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{insight.value}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 italic opacity-70">💡 Envie screenshots ou dados CSV ao Mentor IA para gerar insights personalizados e priorizar melhorias.</p>
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}
