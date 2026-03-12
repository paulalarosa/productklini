import { Palette, Layers, ArrowRightLeft, FileText } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useTasks, useDocuments } from "@/hooks/useProjectData";
import { DesignCanvas } from "@/components/dashboard/DesignCanvas";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";

export function DesignSystemPage() {
  const { data: dsDocs } = useDocuments("ds_foundation");
  const { data: tasks } = useTasks();
  const uiTasks = (tasks ?? []).filter((t) => t.module === "ui");

  return (
    <ModulePage
      title="Design System"
      subtitle="Fundamentos e biblioteca de componentes"
      icon={<Palette className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um documento de fundamentos de Design System para o projeto. Use create_document com doc_type='ds_foundation'. Inclua princípios de design, paleta de cores, tipografia, espaçamento, grid, e diretrizes de componentes baseados no contexto do projeto."
          label="Gerar DS Foundation"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Fundamentos do Design System
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Gerado com base nas pesquisas UX, personas e decisões de design. A IA lê todo o contexto do projeto.
          </p>
          <DocumentManager documents={dsDocs ?? []} docType="ds_foundation" docTypeLabel="Fundamentos DS" emptyIcon={<Palette className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum documento de Design System ainda. Gere com IA baseado nos dados de UX." />
        </div>
        {uiTasks.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Componentes em Desenvolvimento</h3>
            <div className="space-y-2">
              {uiTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs font-medium text-foreground">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground">{t.assignee || "Sem responsável"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    t.status === "done" ? "bg-status-develop/10 text-status-develop" :
                    t.status === "in_progress" ? "bg-status-discovery/10 text-status-discovery" :
                    "bg-secondary text-muted-foreground"
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function TelasPage() {
  return (
    <ModulePage title="Design Canvas" subtitle="Editor visual de telas" icon={<Layers className="w-4 h-4 text-primary-foreground" />}>
      <DesignCanvas />
    </ModulePage>
  );
}

export function HandoffPage() {
  const { data: handoffDocs } = useDocuments("dev_handoff");

  return (
    <ModulePage
      title="Handoff"
      subtitle="Entrega de Design para Desenvolvimento"
      icon={<ArrowRightLeft className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um documento de Handoff Design→Dev para o projeto. Use create_document com doc_type='dev_handoff'. Inclua especificações de componentes, tokens de design, breakpoints, estados de interação e anotações técnicas."
          label="Gerar Handoff"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <DocumentManager documents={handoffDocs ?? []} docType="dev_handoff" docTypeLabel="Handoff Dev" emptyIcon={<ArrowRightLeft className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum documento de handoff. Gere com IA baseado em todo o contexto UX + UI." />
    </ModulePage>
  );
}
