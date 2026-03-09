import { ListChecks, PlayCircle, Accessibility, Sparkles, Loader2 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useNielsen, useDeleteNielsen } from "@/hooks/useNielsen";
import { useUsabilityTest, useDeleteUsabilityTest } from "@/hooks/useUsabilityTest";
import { useWCAG, useDeleteWCAG } from "@/hooks/useWCAG";
import { HeuristicsList } from "@/components/dashboard/HeuristicsList";
import { UsabilityResults } from "@/components/dashboard/UsabilityResults";
import { WCAGAuditList } from "@/components/dashboard/WCAGAuditList";
import { getProjectId } from "@/lib/api";
import { useEffect, useState } from "react";

export function HeuristicEvalPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: heuristics, isLoading } = useNielsen(projectId);
  const deleteMutation = useDeleteNielsen();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Avaliação Heurística" subtitle="Análise profunda baseada nas 10 heurísticas de Nielsen" icon={<ListChecks className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-primary">Auditoria Inteligente</h4>
            <p className="text-sm text-foreground/70">
              O Mentor IA pode avaliar sua interface em tempo real. Peça: "Faça uma avaliação heurística da minha tela de checkout".
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">Analisando heurísticas...</p>
          </div>
        ) : heuristics && heuristics.length > 0 ? (
          <HeuristicsList heuristics={heuristics} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <ListChecks className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Peça ao Mentor IA para conduzir uma análise de Heurísticas de Nielsen para identificar problemas de usabilidade.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function UsabilityTestPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: tests, isLoading } = useUsabilityTest(projectId);
  const deleteMutation = useDeleteUsabilityTest();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Teste de Usabilidade" subtitle="Registro estruturado de observações e taxas de sucesso" icon={<PlayCircle className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-primary">Resultados Estruturados</h4>
            <p className="text-sm text-foreground/70">
              Transforme observações soltas em dados acionáveis. Peça: "Registre o resultado do teste de usabilidade da tarefa X".
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
          </div>
        ) : tests && tests.length > 0 ? (
          <UsabilityResults tests={tests} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <PlayCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Sem testes registrados</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Documente os resultados de testes com usuários reais aqui para acompanhar a evolução da usabilidade.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function WCAGChecklistPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: audits, isLoading } = useWCAG(projectId);
  const deleteMutation = useDeleteWCAG();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Audit de Acessibilidade" subtitle="Checklist técnico de conformidade WCAG 2.1" icon={<Accessibility className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-primary">Acessibilidade Garantida</h4>
            <p className="text-sm text-foreground/70">
              O Mentor pode auditar componentes para acessibilidade. Peça: "Crie a auditoria WCAG para os botões do sistema".
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
          </div>
        ) : audits && audits.length > 0 ? (
          <WCAGAuditList audits={audits} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <Accessibility className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Checklist Limpo</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Nenhuma violação ou auditoria de acessibilidade registrada. Use a IA para varrer seus componentes.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
