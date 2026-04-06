import { useState } from "react";
import {
  Search, Users, Route, Plus, Trash2, Pencil, Check,
  User, FileText, Lightbulb, Map,
} from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { usePersonas, useDocuments } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId, type DbPersona } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { PageSkeleton, PersonaSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ─── PesquisasPage ────────────────────────────────────────────────────────────

export function PesquisasPage() {
  const { data: researchDocs, isLoading: loadingResearch } = useDocuments("research_plan");
  const { data: insightDocs,  isLoading: loadingInsights  } = useDocuments("insights_summary");

  if (loadingResearch || loadingInsights) return <PageSkeleton />;

  return (
    <ModulePage
      title="Pesquisas"
      subtitle="Repositório de pesquisas e insights UX"
      icon={<Search className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um plano de pesquisa UX completo para o projeto. Use create_document com doc_type='research_plan'. Inclua objetivos, metodologia, perfil de participantes, roteiro e métricas de sucesso."
          label="Gerar Plano de Pesquisa"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <div className="space-y-6">
        <ErrorBoundary level="section">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Planos de Pesquisa
            </h3>
            <DocumentManager
              documents={researchDocs ?? []}
              docType="research_plan"
              docTypeLabel="Plano de Pesquisa"
              emptyIcon={<Search className="w-10 h-10 text-muted-foreground/30 mx-auto" />}
              emptyMessage="Nenhum plano de pesquisa ainda"
            />
          </div>
        </ErrorBoundary>

        <ErrorBoundary level="section">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-status-deliver" /> Síntese de Insights
            </h3>
            <DocumentManager
              documents={insightDocs ?? []}
              docType="insights_summary"
              docTypeLabel="Síntese de Insights"
              emptyIcon={<Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto" />}
              emptyMessage="Nenhum insight documentado"
            />
          </div>
        </ErrorBoundary>
      </div>
    </ModulePage>
  );
}

// ─── PersonasPage ─────────────────────────────────────────────────────────────

// Formulário isolado — não re-renderiza a lista ao digitar
function PersonaForm({
  editingId,
  form,
  setForm,
  onSave,
  onCancel,
}: {
  editingId: string | null;
  form: { name: string; role: string; goals: string; painPoints: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
      <h4 className="text-sm font-semibold text-foreground">
        {editingId ? "Editar Persona" : "Nova Persona"}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Nome da Persona *"
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          maxLength={50}
          autoFocus
        />
        <input
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          placeholder="Perfil (ex: Jovem Profissional)"
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          maxLength={50}
        />
      </div>
      <input
        value={form.goals}
        onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
        placeholder="Objetivos (separados por vírgula)"
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        maxLength={300}
      />
      <input
        value={form.painPoints}
        onChange={e => setForm(f => ({ ...f, painPoints: e.target.value }))}
        placeholder="Dores (separadas por vírgula)"
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        maxLength={300}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"
        >
          <Check className="w-3 h-3 inline mr-1" />
          {editingId ? "Salvar" : "Criar Persona"}
        </button>
      </div>
    </div>
  );
}

export function PersonasPage() {
  const { data: personas, isLoading } = usePersonas();
  const queryClient = useQueryClient();
  const [adding,    setAdding]    = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "", goals: "", painPoints: "" });

  if (isLoading) return <PersonaSkeleton />;

  const resetForm = () => {
    setForm({ name: "", role: "", goals: "", painPoints: "" });
    setAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const pid = await getProjectId();
    const { error } = await supabase.from("personas").insert({
      project_id:  pid,
      name:        form.name.trim(),
      role:        form.role.trim() || "Usuário",
      goals:       form.goals.split(",").map(g => g.trim()).filter(Boolean),
      pain_points: form.painPoints.split(",").map(p => p.trim()).filter(Boolean),
    });
    if (error) { toast.error("Erro ao criar persona"); return; }
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    resetForm();
    toast.success("Persona adicionada");
  };

  const handleUpdate = async (id: string) => {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("personas").update({
      name:        form.name.trim(),
      role:        form.role.trim(),
      goals:       form.goals.split(",").map(g => g.trim()).filter(Boolean),
      pain_points: form.painPoints.split(",").map(p => p.trim()).filter(Boolean),
    }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    resetForm();
    toast.success("Persona atualizada");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("personas").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    queryClient.invalidateQueries({ queryKey: ["personas"] });
    toast.success("Persona removida");
  };

  const startEdit = (p: DbPersona) => {
    setEditingId(p.id);
    setForm({ name: p.name, role: p.role, goals: p.goals.join(", "), painPoints: p.pain_points.join(", ") });
    setAdding(false);
  };

  const list = personas ?? [];

  return (
    <ModulePage
      title="Personas"
      subtitle="Perfis de usuários do projeto"
      icon={<Users className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setAdding(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Persona
          </button>
          <AIGenerateButton
            prompt="Crie 3 personas detalhadas para o projeto. Use a ferramenta create_personas. Para cada persona, defina nome, perfil, objetivos e dores baseados no contexto do projeto."
            label="Gerar Personas"
            invalidateKeys={[["personas"]]}
            size="sm"
          />
        </div>
      }
    >
      {(adding || editingId) && (
        <div className="mb-4">
          <PersonaForm
            editingId={editingId}
            form={form}
            setForm={setForm}
            onSave={() => editingId ? handleUpdate(editingId) : handleAdd()}
            onCancel={resetForm}
          />
        </div>
      )}

      <ErrorBoundary level="section">
        {list.length === 0 && !adding ? (
          <EmptyState
            icon={User}
            title="Nenhuma persona definida ainda"
            description="Personas ajudam a manter o foco no usuário durante todo o projeto."
            action={{ label: "Criar primeira persona", onClick: () => setAdding(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map(p => (
              <div key={p.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.role}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-accent">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-status-urgent">Dores</span>
                    <ul className="mt-1 space-y-1">
                      {p.pain_points.length > 0
                        ? p.pain_points.map(pp => (
                            <li key={pp} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-status-urgent mt-0.5">•</span>{pp}
                            </li>
                          ))
                        : <li className="text-xs text-muted-foreground/50 italic">Nenhuma dor definida</li>
                      }
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-status-develop">Objetivos</span>
                    <ul className="mt-1 space-y-1">
                      {p.goals.length > 0
                        ? p.goals.map(g => (
                            <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-status-develop mt-0.5">•</span>{g}
                            </li>
                          ))
                        : <li className="text-xs text-muted-foreground/50 italic">Nenhum objetivo definido</li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── FluxosPage ───────────────────────────────────────────────────────────────

export function FluxosPage() {
  const { data: journeyDocs, isLoading } = useDocuments("journey_map");

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Fluxos de Jornada"
      subtitle="Mapas de jornada do usuário"
      icon={<Route className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um mapa de jornada do usuário para a persona principal do projeto. Use create_document com doc_type='journey_map'. Inclua etapas, touchpoints, emoções, pain points e oportunidades."
          label="Gerar Jornada"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        <DocumentManager
          documents={journeyDocs ?? []}
          docType="journey_map"
          docTypeLabel="Mapa de Jornada"
          emptyIcon={<Map className="w-10 h-10 text-muted-foreground/30 mx-auto" />}
          emptyMessage="Nenhum mapa de jornada criado"
        />
      </ErrorBoundary>
    </ModulePage>
  );
}
