import { useState } from "react";
import { ListChecks, PlayCircle, Accessibility, Sparkles, Loader2, Plus, Check } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useNielsen, useDeleteNielsen } from "@/hooks/useNielsen";
import { useUsabilityTest, useDeleteUsabilityTest } from "@/hooks/useUsabilityTest";
import { useWCAG, useDeleteWCAG } from "@/hooks/useWCAG";
import { HeuristicsList } from "@/components/dashboard/HeuristicsList";
import { UsabilityResults } from "@/components/dashboard/UsabilityResults";
import { WCAGAuditList } from "@/components/dashboard/WCAGAuditList";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function HeuristicEvalPage() {
  const projectId = useCurrentProjectId();
  const { data: heuristics, isLoading } = useNielsen(projectId);
  const deleteMutation = useDeleteNielsen();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ heuristic_name: "", evaluation_notes: "", severity_level: "3", recommendation: "" });

  const handleAdd = async () => {
    if (!projectId || !form.heuristic_name.trim()) return;
    const { error } = await supabase.from("nielsen_heuristics").insert({
      project_id: projectId,
      heuristic_name: form.heuristic_name.trim(),
      evaluation_notes: form.evaluation_notes.trim() || null,
      severity_level: parseInt(form.severity_level),
      recommendation: form.recommendation.trim() || null,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    queryClient.invalidateQueries({ queryKey: ["nielsen"] });
    setForm({ heuristic_name: "", evaluation_notes: "", severity_level: "3", recommendation: "" });
    setAdding(false);
    toast.success("Heurística adicionada");
  };

  return (
    <ModulePage
      title="Avaliação Heurística"
      subtitle="Análise baseada nas 10 heurísticas de Nielsen"
      icon={<ListChecks className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Manual
          </button>
          <AIGenerateButton
            prompt="Faça uma avaliação heurística completa baseada nas 10 heurísticas de Nielsen para o projeto. Use create_nielsen_evaluation para cada heurística. Avalie cada uma com notas, nível de severidade (1-5) e recomendações."
            label="Gerar Avaliação"
            invalidateKeys={[["nielsen"]]}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground">Nova Avaliação Heurística</h4>
            <input value={form.heuristic_name} onChange={e => setForm(f => ({ ...f, heuristic_name: e.target.value }))} placeholder="Nome da Heurística (ex: Visibilidade do Status) *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <textarea value={form.evaluation_notes} onChange={e => setForm(f => ({ ...f, evaluation_notes: e.target.value }))} placeholder="Notas de avaliação" rows={3} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Severidade (1-5)</label>
                <select value={form.severity_level} onChange={e => setForm(f => ({ ...f, severity_level: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {["Cosmético","Menor","Médio","Grave","Catastrófico"][n-1]}</option>)}
                </select>
              </div>
              <input value={form.recommendation} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))} placeholder="Recomendação" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <PageSkeleton />
        ) : heuristics && heuristics.length > 0 ? (
          <ErrorBoundary level="section">
            <HeuristicsList heuristics={heuristics} onDelete={(id) => deleteMutation.mutate({ id })} />
          </ErrorBoundary>
        ) : !adding ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhuma avaliação encontrada"
            description="Avalie seu produto com base nas 10 heurísticas de Nielsen para identificar problemas de usabilidade."
            action={{ label: "Gerar Avaliação", onClick: () => {} }}
          />
        ) : null}
      </div>
    </ModulePage>
  );
}

export function UsabilityTestPage() {
  const projectId = useCurrentProjectId();
  const { data: tests, isLoading } = useUsabilityTest(projectId);
  const deleteMutation = useDeleteUsabilityTest();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ task_description: "", success_rate: "80", user_feedback: "", key_observations: "" });

  const handleAdd = async () => {
    if (!projectId || !form.task_description.trim()) return;
    const { error } = await supabase.from("usability_tests").insert({
      project_id: projectId,
      task_description: form.task_description.trim(),
      success_rate_percentage: parseInt(form.success_rate),
      user_feedback: form.user_feedback.trim() || null,
      key_observations: form.key_observations.trim() || null,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    queryClient.invalidateQueries({ queryKey: ["usability-tests"] });
    setForm({ task_description: "", success_rate: "80", user_feedback: "", key_observations: "" });
    setAdding(false);
    toast.success("Teste adicionado");
  };

  return (
    <ModulePage
      title="Teste de Usabilidade"
      subtitle="Registro estruturado de observações e taxas de sucesso"
      icon={<PlayCircle className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Manual
          </button>
          <AIGenerateButton
            prompt="Crie cenários de teste de usabilidade para o projeto. Use create_usability_result para cada cenário. Inclua descrição da tarefa, taxa de sucesso estimada, feedback e observações baseadas no contexto do projeto."
            label="Gerar Testes"
            invalidateKeys={[["usability-tests"]]}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground">Novo Teste de Usabilidade</h4>
            <input value={form.task_description} onChange={e => setForm(f => ({ ...f, task_description: e.target.value }))} placeholder="Descrição da tarefa (ex: Completar cadastro) *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Taxa de Sucesso (%)</label>
                <input type="number" value={form.success_rate} onChange={e => setForm(f => ({ ...f, success_rate: e.target.value }))} min="0" max="100" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <input value={form.user_feedback} onChange={e => setForm(f => ({ ...f, user_feedback: e.target.value }))} placeholder="Feedback dos usuários" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <textarea value={form.key_observations} onChange={e => setForm(f => ({ ...f, key_observations: e.target.value }))} placeholder="Observações-chave" rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <PageSkeleton />
        ) : tests && tests.length > 0 ? (
          <ErrorBoundary level="section">
            <UsabilityResults tests={tests} onDelete={(id) => deleteMutation.mutate({ id })} />
          </ErrorBoundary>
        ) : !adding ? (
          <EmptyState
            icon={PlayCircle}
            title="Sem testes registrados"
            description="Documente resultados de testes com usuários reais para validar suas hipóteses."
            action={{ label: "Gerar Testes", onClick: () => {} }}
          />
        ) : null}
      </div>
    </ModulePage>
  );
}

export function WCAGChecklistPage() {
  const projectId = useCurrentProjectId();
  const { data: audits, isLoading } = useWCAG(projectId);
  const deleteMutation = useDeleteWCAG();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ guideline_reference: "", compliance_status: "Pass", issue_description: "", fix_suggestion: "" });

  const handleAdd = async () => {
    if (!projectId || !form.guideline_reference.trim()) return;
    const { error } = await supabase.from("wcag_audits").insert({
      project_id: projectId,
      guideline_reference: form.guideline_reference.trim(),
      compliance_status: form.compliance_status,
      issue_description: form.issue_description.trim() || null,
      fix_suggestion: form.fix_suggestion.trim() || null,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    queryClient.invalidateQueries({ queryKey: ["wcag"] });
    setForm({ guideline_reference: "", compliance_status: "Pass", issue_description: "", fix_suggestion: "" });
    setAdding(false);
    toast.success("Auditoria adicionada");
  };

  return (
    <ModulePage
      title="Audit de Acessibilidade"
      subtitle="Checklist técnico de conformidade WCAG 2.1"
      icon={<Accessibility className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Manual
          </button>
          <AIGenerateButton
            prompt="Faça uma auditoria WCAG 2.1 completa para o projeto. Use create_wcag_audit para cada critério. Avalie os principais guidelines (1.1.1, 1.3.1, 1.4.1, 2.1.1, 2.4.1, etc) com status Pass/Fail/Warning e sugestões de correção."
            label="Gerar Auditoria WCAG"
            invalidateKeys={[["wcag"]]}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground">Nova Auditoria WCAG</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.guideline_reference} onChange={e => setForm(f => ({ ...f, guideline_reference: e.target.value }))} placeholder="Referência (ex: WCAG 2.1 - 1.1.1) *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
              <select value={form.compliance_status} onChange={e => setForm(f => ({ ...f, compliance_status: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="Pass">✅ Pass</option>
                <option value="Fail">❌ Fail</option>
                <option value="Warning">⚠️ Warning</option>
              </select>
            </div>
            <input value={form.issue_description} onChange={e => setForm(f => ({ ...f, issue_description: e.target.value }))} placeholder="Descrição do problema" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.fix_suggestion} onChange={e => setForm(f => ({ ...f, fix_suggestion: e.target.value }))} placeholder="Sugestão de correção" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <PageSkeleton />
        ) : audits && audits.length > 0 ? (
          <ErrorBoundary level="section">
            <WCAGAuditList audits={audits} onDelete={(id) => deleteMutation.mutate({ id })} />
          </ErrorBoundary>
        ) : !adding ? (
          <EmptyState
            icon={Accessibility}
            title="Checklist Limpo"
            description="Nenhuma auditoria registrada. Use a IA para varrer seus componentes e garantir acessibilidade."
            action={{ label: "Gerar Auditoria WCAG", onClick: () => {} }}
          />
        ) : null}
      </div>
    </ModulePage>
  );
}
