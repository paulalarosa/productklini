import { useState } from "react";
import { BookOpen, Users2, Plus, Trash2, Check } from "lucide-react";
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

type IDiaryEntry = Database["public"]["Tables"]["diary_studies"]["Row"];
type IStakeholder = Database["public"]["Tables"]["stakeholder_maps"]["Row"];

// ─── Diary Studies ────────────────────────────────────────────────────────────
export function DiaryStudiesPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    participant_name: "",
    context: "",
    activity: "",
    emotions: "",
    pain_points: "",
    insights: "",
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["diary-studies", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("diary_studies")
        .select("*")
        .eq("project_id", projectId)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });

  const { query, setQuery, clearFilters, filtered, hasActiveFilters } = useSearch({
    data: (entries ?? []) as Record<string, unknown>[],
    searchFields: ["participant_name", "context", "activity", "emotions"],
  });

  const handleAdd = async () => {
    if (!form.participant_name.trim() || !projectId) return;
    const { error } = await supabase.from("diary_studies").insert({
      project_id: projectId,
      participant_name: form.participant_name.trim(),
      context: form.context.trim(),
      activity: form.activity.trim(),
      emotions: form.emotions.trim(),
      pain_points: form.pain_points
        .split(",")
        .map(s => s.trim())
        .filter(Boolean),
      insights: form.insights
        .split(",")
        .map(s => s.trim())
        .filter(Boolean),
    });

    if (error) {
      toast.error("Erro ao criar entrada");
      return;
    }

    qc.invalidateQueries({ queryKey: ["diary-studies"] });
    setForm({
      participant_name: "",
      context: "",
      activity: "",
      emotions: "",
      pain_points: "",
      insights: "",
    });
    setAdding(false);
    toast.success("Entrada adicionada");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("diary_studies").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover entrada");
      return;
    }
    qc.invalidateQueries({ queryKey: ["diary-studies"] });
    toast.success("Removido");
  };

  if (isLoading) {
    return (
      <ModulePage
        title="Diary Studies"
        subtitle="Registro diário de experiências dos participantes"
        icon={<BookOpen className="w-4 h-4 text-primary-foreground" />}
      >
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2.5 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title="Diary Studies"
      subtitle="Registro diário de experiências dos participantes"
      icon={<BookOpen className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Entrada
          </button>
          <AIGenerateButton
            prompt="Crie 3 entradas de diary study simuladas e realistas. Use a ferramenta create_diary_study para cada uma com participant_name, context, activity, emotions, pain_points e insights."
            label="Gerar com IA"
            invalidateKeys={[["diary-studies"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-6">
          <h4 className="text-sm font-semibold text-foreground">Nova Entrada de Diário</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.participant_name}
              onChange={e => setForm(f => ({ ...f, participant_name: e.target.value }))}
              placeholder="Nome do participante *"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <input
              value={form.context}
              onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
              placeholder="Contexto (onde, quando)"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <input
            value={form.activity}
            onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="Atividade realizada"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            value={form.emotions}
            onChange={e => setForm(f => ({ ...f, emotions: e.target.value }))}
            placeholder="Emoções sentidas"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            value={form.pain_points}
            onChange={e => setForm(f => ({ ...f, pain_points: e.target.value }))}
            placeholder="Dores (separadas por vírgula)"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <input
            value={form.insights}
            onChange={e => setForm(f => ({ ...f, insights: e.target.value }))}
            placeholder="Insights (separados por vírgula)"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
              className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium shadow-md shadow-primary/10 active:scale-95 transition-all"
            >
              <Check className="w-3 h-3 inline mr-1" />
              Criar Entrada
            </button>
          </div>
        </div>
      )}

      {(entries ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={entries?.length}
          filtered={filtered.length}
          placeholder="Buscar por participante, contexto, atividade..."
          className="mb-6"
        />
      )}

      <ErrorBoundary level="section">
        {(entries ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum diary study registrado"
            description="Diary studies capturam as flutuações da experiência do usuário ao longo de dias ou semanas."
            action={{ label: "Criar primeira entrada", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum resultado"
            description={`Não encontramos entradas de diário correspondentes a "${query}".`}
            action={{ label: "Limpar busca", onClick: clearFilters }}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((e: Record<string, unknown>) => (
              <div key={e.id as string} className="glass-card p-5 group hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{e.participant_name as string}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                      {new Date(e.entry_date as string).toLocaleDateString("pt-BR")} • {e.context as string}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(e.id as string)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {e.activity && (
                  <div className="mb-2">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-bold text-primary/80">Atividade:</span> {e.activity as string}
                    </p>
                  </div>
                )}
                {e.emotions && (
                  <div className="mb-3">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-bold text-amber-500/80">Emoções:</span> {e.emotions as string}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                  {((e.pain_points as string[]) || []).map((p, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium"
                    >
                      {p}
                    </span>
                  ))}
                  {((e.insights as string[]) || []).map((ins, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                    >
                      {ins}
                    </span>
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

// ─── Stakeholder Map ──────────────────────────────────────────────────────────
export function StakeholderMapPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    influence_level: "medium",
    interest_level: "medium",
    relationship: "neutral",
    notes: "",
  });

  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ["stakeholder-maps", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("stakeholder_maps")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
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
    data: (stakeholders ?? []) as Record<string, unknown>[],
    searchFields: ["name", "role", "notes"],
    filters: [
      {
        key: "influence_level",
        label: "Influência",
        options: [
          { key: "high", label: "Alta", value: "high" },
          { key: "medium", label: "Média", value: "medium" },
          { key: "low", label: "Baixa", value: "low" },
        ],
      },
      {
        key: "relationship",
        label: "Relação",
        options: [
          { key: "champion", label: "Champion", value: "champion" },
          { key: "supporter", label: "Apoiador", value: "supporter" },
          { key: "neutral", label: "Neutro", value: "neutral" },
          { key: "critic", label: "Crítico", value: "critic" },
        ],
      },
    ],
  });

  const handleAdd = async () => {
    if (!form.name.trim() || !projectId) return;
    const { error } = await supabase.from("stakeholder_maps").insert({
      project_id: projectId,
      ...form,
    });

    if (error) {
      toast.error("Erro ao criar stakeholder");
      return;
    }

    qc.invalidateQueries({ queryKey: ["stakeholder-maps"] });
    setForm({
      name: "",
      role: "",
      influence_level: "medium",
      interest_level: "medium",
      relationship: "neutral",
      notes: "",
    });
    setAdding(false);
    toast.success("Stakeholder adicionado");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("stakeholder_maps").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover stakeholder");
      return;
    }
    qc.invalidateQueries({ queryKey: ["stakeholder-maps"] });
    toast.success("Removido");
  };

  const levelColors: Record<string, string> = {
    high: "text-destructive",
    medium: "text-amber-500",
    low: "text-muted-foreground",
  };
  const levelLabels: Record<string, string> = { high: "Alta", medium: "Média", low: "Baixa" };
  const relationColors: Record<string, string> = {
    champion: "text-green-500",
    supporter: "text-blue-500",
    neutral: "text-muted-foreground",
    critic: "text-destructive",
  };

  if (isLoading) {
    return (
      <ModulePage
        title="Mapa de Stakeholders"
        subtitle="Mapeie influência e interesse dos stakeholders estratégicos"
        icon={<Users2 className="w-4 h-4 text-primary-foreground" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-10 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title="Mapa de Stakeholders"
      subtitle="Mapeie influência e interesse dos stakeholders estratégicos"
      icon={<Users2 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Stakeholder
          </button>
          <AIGenerateButton
            prompt="Crie um mapeamento de 4 stakeholders principais para este projeto. Use a ferramenta create_stakeholder para cada um com name, role, influence_level (high/medium/low), interest_level (high/medium/low), relationship (champion/supporter/neutral/critic) e notes."
            label="Gerar com IA"
            invalidateKeys={[["stakeholder-maps"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-5 space-y-3 border-2 border-primary/20 mb-6">
          <h4 className="text-sm font-semibold text-foreground">Novo Stakeholder</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome *"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <input
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="Cargo / Papel"
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={form.influence_level}
              onChange={e => setForm(f => ({ ...f, influence_level: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="high">Influência Alta</option>
              <option value="medium">Influência Média</option>
              <option value="low">Influência Baixa</option>
            </select>
            <select
              value={form.interest_level}
              onChange={e => setForm(f => ({ ...f, interest_level: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="high">Interesse Alto</option>
              <option value="medium">Interesse Médio</option>
              <option value="low">Interesse Baixo</option>
            </select>
            <select
              value={form.relationship}
              onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="champion">Champion</option>
              <option value="supporter">Apoiador</option>
              <option value="neutral">Neutro</option>
              <option value="critic">Crítico</option>
            </select>
          </div>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notas adicionais"
            rows={2}
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
              className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium active:scale-95 transition-all"
            >
              <Check className="w-3 h-3 inline mr-1" />
              Adicionar
            </button>
          </div>
        </div>
      )}

      {(stakeholders ?? []).length > 0 && (
        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          filters={[
            {
              key: "influence_level",
              label: "Influência",
              options: [
                { key: "high", label: "Alta", value: "high" },
                { key: "medium", label: "Média", value: "medium" },
                { key: "low", label: "Baixa", value: "low" },
              ],
            },
            {
              key: "relationship",
              label: "Relação",
              options: [
                { key: "champion", label: "Champion", value: "champion" },
                { key: "supporter", label: "Apoiador", value: "supporter" },
                { key: "neutral", label: "Neutro", value: "neutral" },
                { key: "critic", label: "Crítico", value: "critic" },
              ],
            },
          ]}
          activeFilters={activeFilters}
          onFilterChange={setFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={stakeholders?.length}
          filtered={filtered.length}
          placeholder="Buscar stakeholders por nome, papel..."
          className="mb-6"
        />
      )}

      <ErrorBoundary level="section">
        {(stakeholders ?? []).length === 0 && !adding ? (
          <EmptyState
            icon={Users2}
            title="Nenhum stakeholder mapeado"
            description="Mapear a influência e o interesse dos stakeholders é crucial para a gestão de expectativas do projeto."
            action={{ label: "Mapear primeiro stakeholder", onClick: () => setAdding(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="Nenhum resultado"
            description={`Não encontramos stakeholders correspondentes à busca "${query}".`}
            action={{ label: "Limpar filtros", onClick: clearFilters }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s: Record<string, unknown>) => (
              <div key={s.id as string} className="glass-card p-5 group hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between mb-3 min-w-0">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate" title={s.name as string}>
                      {s.name as string}
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5 truncate">
                      {s.role as string || "Papel não definido"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id as string)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                  {[
                    { label: "Influência", key: "influence_level", colors: levelColors, labels: levelLabels },
                    { label: "Interesse", key: "interest_level", colors: levelColors, labels: levelLabels },
                  ].map(({ label, key, colors, labels }) => (
                    <div key={key} className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`font-bold ${colors[s[key] as string]}`}>
                        {labels[s[key] as string] || "Média"}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Relação</span>
                    <span className={`font-bold capitalize ${relationColors[s.relationship as string]}`}>
                      {s.relationship as string}
                    </span>
                  </div>
                </div>
                {s.notes && (
                  <div className="mt-4 p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                      “{s.notes as string}”
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}
