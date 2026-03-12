import { Columns, GitBranch } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";

export function ComponentStatesPage() {
  const { data: docs } = useDocuments("component_states");
  return (
    <ModulePage
      title="Estados de Componentes"
      subtitle="Mapeamento de estados (hover, active, disabled, loading, error, empty)"
      icon={<Columns className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um mapeamento de estados de componentes para o projeto. Use create_document com doc_type='component_states'. Inclua estados para botões, inputs, cards, modais e outros componentes com descrições de hover, active, disabled, loading, error e empty states."
          label="Gerar Estados"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <DocumentManager documents={docs ?? []} docType="component_states" docTypeLabel="Mapeamento de Estados" emptyIcon={<Columns className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum mapeamento de estados criado" />
    </ModulePage>
  );
}

export function TaskFlowsPage() {
  const { data: docs } = useDocuments("task_flows");
  return (
    <ModulePage
      title="Task Flows"
      subtitle="Fluxos de tarefa passo a passo do usuário"
      icon={<GitBranch className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie task flows detalhados para as principais tarefas do projeto. Use create_document com doc_type='task_flows'. Inclua fluxos step-by-step com decisões, caminhos alternativos e edge cases."
          label="Gerar Task Flows"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <DocumentManager documents={docs ?? []} docType="task_flows" docTypeLabel="Task Flow" emptyIcon={<GitBranch className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum task flow criado" />
    </ModulePage>
  );
}
