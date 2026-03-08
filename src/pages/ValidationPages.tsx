import { ListChecks, PlayCircle, Accessibility } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";

export function HeuristicEvalPage() {
  const { data: docs } = useDocuments("heuristic_evaluation");
  return (
    <ModulePage title="Avaliação Heurística" subtitle="Checklist das 10 heurísticas de Nielsen" icon={<ListChecks className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="heuristic_evaluation" docTypeLabel="Avaliação Heurística" emptyIcon={<ListChecks className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma avaliação heurística criada" />
    </ModulePage>
  );
}

export function UsabilityTestPage() {
  const { data: docs } = useDocuments("usability_test");
  return (
    <ModulePage title="Teste de Usabilidade" subtitle="Roteiro de teste e registro de resultados" icon={<PlayCircle className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="usability_test" docTypeLabel="Teste de Usabilidade" emptyIcon={<PlayCircle className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum teste de usabilidade documentado" />
    </ModulePage>
  );
}

export function WCAGChecklistPage() {
  const { data: docs } = useDocuments("wcag_checklist");
  return (
    <ModulePage title="Checklist WCAG" subtitle="Verificação de acessibilidade do produto" icon={<Accessibility className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="wcag_checklist" docTypeLabel="Checklist WCAG" emptyIcon={<Accessibility className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum checklist de acessibilidade criado" />
    </ModulePage>
  );
}
