import { Heart, Target, Briefcase, HelpCircle, Lightbulb, Grid3X3, Search, BarChart3 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";

export function EmpathyMapPage() {
  const { data: docs } = useDocuments("empathy_map");
  return (
    <ModulePage title="Mapa de Empatia" subtitle="O que o usuário pensa, sente, vê e faz" icon={<Heart className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="empathy_map" docTypeLabel="Mapa de Empatia" emptyIcon={<Heart className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum mapa de empatia criado" />
    </ModulePage>
  );
}

export function BenchmarkPage() {
  const { data: docs } = useDocuments("benchmark");
  return (
    <ModulePage title="Benchmark" subtitle="Análise competitiva e referências de mercado" icon={<BarChart3 className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="benchmark" docTypeLabel="Análise de Benchmark" emptyIcon={<BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma análise de benchmark criada" />
    </ModulePage>
  );
}

export function JTBDPage() {
  const { data: docs } = useDocuments("jtbd");
  return (
    <ModulePage title="Jobs To Be Done" subtitle="Motivações e contextos de uso dos usuários" icon={<Briefcase className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="jtbd" docTypeLabel="Jobs To Be Done" emptyIcon={<Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum JTBD documentado" />
    </ModulePage>
  );
}

export function CSDMatrixPage() {
  const { data: docs } = useDocuments("csd_matrix");
  return (
    <ModulePage title="Matriz CSD" subtitle="Certezas, Suposições e Dúvidas" icon={<Grid3X3 className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="csd_matrix" docTypeLabel="Matriz CSD" emptyIcon={<Grid3X3 className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma matriz CSD criada" />
    </ModulePage>
  );
}

export function HMWPage() {
  const { data: docs } = useDocuments("hmw");
  return (
    <ModulePage title="How Might We" subtitle="Perguntas de oportunidade para ideação" icon={<HelpCircle className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="hmw" docTypeLabel="How Might We" emptyIcon={<HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma pergunta HMW criada" />
    </ModulePage>
  );
}

export function AffinityDiagramPage() {
  const { data: docs } = useDocuments("affinity_diagram");
  return (
    <ModulePage title="Diagrama de Afinidade" subtitle="Agrupamento de insights em clusters temáticos" icon={<Lightbulb className="w-4 h-4 text-primary-foreground" />}>
      <DocumentManager documents={docs ?? []} docType="affinity_diagram" docTypeLabel="Diagrama de Afinidade" emptyIcon={<Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum diagrama de afinidade criado" />
    </ModulePage>
  );
}
