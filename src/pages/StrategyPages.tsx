import { ArrowUpDown, Network } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";

export function PrioritizationMatrixPage() {
  const { data: docs } = useDocuments("prioritization_matrix");
  return (
    <ModulePage title="Matriz de Priorização" subtitle="Impacto vs Esforço para decisões de produto" icon={<ArrowUpDown className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="prioritization_matrix" docTypeLabel="Matriz de Priorização" emptyIcon={<ArrowUpDown className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma matriz de priorização criada" />
    </ModulePage>
  );
}

export function SitemapPage() {
  const { data: docs } = useDocuments("sitemap");
  return (
    <ModulePage title="Sitemap" subtitle="Mapa hierárquico de telas e navegação" icon={<Network className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="sitemap" docTypeLabel="Sitemap" emptyIcon={<Network className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum sitemap criado" />
    </ModulePage>
  );
}
