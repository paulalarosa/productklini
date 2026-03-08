import { MessageSquare, BookOpen, ClipboardList } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";

export function ToneOfVoicePage() {
  const { data: docs } = useDocuments("tone_of_voice");
  return (
    <ModulePage title="Tom de Voz" subtitle="Guia de linguagem e personalidade do produto" icon={<MessageSquare className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="tone_of_voice" docTypeLabel="Guia de Tom de Voz" emptyIcon={<MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum guia de tom de voz criado" />
    </ModulePage>
  );
}

export function MicrocopyLibraryPage() {
  const { data: docs } = useDocuments("microcopy_library");
  return (
    <ModulePage title="Biblioteca de Microcopy" subtitle="Textos padrão de erro, sucesso, CTAs e tooltips" icon={<BookOpen className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="microcopy_library" docTypeLabel="Biblioteca de Microcopy" emptyIcon={<BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma biblioteca de microcopy criada" />
    </ModulePage>
  );
}

export function ContentAuditPage() {
  const { data: docs } = useDocuments("content_audit");
  return (
    <ModulePage title="Inventário de Conteúdo" subtitle="Auditoria completa dos textos da interface" icon={<ClipboardList className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="content_audit" docTypeLabel="Inventário de Conteúdo" emptyIcon={<ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum inventário de conteúdo criado" />
    </ModulePage>
  );
}
