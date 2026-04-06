import { useState } from "react";
import { Globe, Plus, Trash2, Check, ExternalLink } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = { direct: "Direto", indirect: "Indireto", substitute: "Substituto", potential: "Potencial" };
const categoryColors: Record<string, string> = { direct: "bg-destructive/10 text-destructive", indirect: "bg-amber-500/10 text-amber-600", substitute: "bg-blue-500/10 text-blue-600", potential: "bg-secondary text-muted-foreground" };

export function CompetitiveLandscapePage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ competitor_name: "", category: "direct", strengths: "", weaknesses: "", market_position: "", notes: "", website_url: "" });

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["competitive-landscape", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase.from("competitive_landscape").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = async () => {
    if (!form.competitor_name.trim() || !projectId) return;
    const { error } = await supabase.from("competitive_landscape").insert({
      project_id: projectId, competitor_name: form.competitor_name, category: form.category,
      strengths: form.strengths.split("\n").map(s => s.trim()).filter(Boolean),
      weaknesses: form.weaknesses.split("\n").map(s => s.trim()).filter(Boolean),
      market_position: form.market_position, notes: form.notes, website_url: form.website_url,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    qc.invalidateQueries({ queryKey: ["competitive-landscape"] });
    setForm({ competitor_name: "", category: "direct", strengths: "", weaknesses: "", market_position: "", notes: "", website_url: "" });
    setAdding(false);
    toast.success("Concorrente adicionado");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("competitive_landscape").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["competitive-landscape"] });
    toast.success("Removido");
  };

  if (isLoading) {
    return (
      <ModulePage title="Competitive Landscape" subtitle="Mapeamento visual de concorrentes" icon={<Globe className="w-4 h-4 text-primary-foreground" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-4 bg-muted rounded w-14" />
              </div>
              <div className="h-3 bg-muted rounded w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-2.5 bg-muted rounded w-full" />)}
                </div>
                <div className="space-y-1.5">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-2.5 bg-muted rounded w-full" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage title="Competitive Landscape" subtitle="Mapeamento visual de concorrentes" icon={<Globe className="w-4 h-4 text-primary-foreground" />}
      actions={<div className="flex items-center gap-2">
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus className="w-3.5 h-3.5" /> Novo</button>
        <AIGenerateButton prompt="Crie uma análise competitiva do projeto. Use create_competitor para cada concorrente com competitor_name, category (direct/indirect/substitute/potential), strengths (array), weaknesses (array), market_position e notes." label="Gerar com IA" invalidateKeys={[["competitive-landscape"]]} size="sm" />
      </div>}>

      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-4">
          <h4 className="text-sm font-semibold text-foreground">Novo Concorrente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.competitor_name} onChange={e => setForm(f => ({ ...f, competitor_name: e.target.value }))} placeholder="Nome do concorrente *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="direct">Direto</option><option value="indirect">Indireto</option><option value="substitute">Substituto</option><option value="potential">Potencial</option>
            </select>
          </div>
          <input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="Website URL" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input value={form.market_position} onChange={e => setForm(f => ({ ...f, market_position: e.target.value }))} placeholder="Posição de mercado" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} placeholder="Pontos fortes (um por linha)" rows={3} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <textarea value={form.weaknesses} onChange={e => setForm(f => ({ ...f, weaknesses: e.target.value }))} placeholder="Pontos fracos (um por linha)" rows={3} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionais" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Adicionar</button>
          </div>
        </div>
      )}

      <ErrorBoundary level="section">
        {(competitors ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Globe}
            title="Nenhum concorrente mapeado"
            description="Mapeie concorrentes diretos, indiretos, substitutos e potenciais do seu produto."
            action={{ label: "Mapear primeiro concorrente", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(competitors ?? []).map(c => (
              <div key={c.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{c.competitor_name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[c.category]}`}>{categoryLabels[c.category]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.website_url && <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent"><ExternalLink className="w-3 h-3 text-muted-foreground" /></a>}
                    <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </div>
                </div>
                {c.market_position && <p className="text-xs text-muted-foreground mb-2">{c.market_position}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-green-600 mb-1">✅ Pontos fortes</p>
                    {(c.strengths as string[]).map((s, i) => <p key={i} className="text-[10px] text-muted-foreground">• {s}</p>)}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-destructive mb-1">❌ Pontos fracos</p>
                    {(c.weaknesses as string[]).map((w, i) => <p key={i} className="text-[10px] text-muted-foreground">• {w}</p>)}
                  </div>
                </div>
                {c.notes && <p className="text-[10px] text-muted-foreground mt-2 italic">{c.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}
