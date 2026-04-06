import { Heart, BarChart3, Briefcase, Grid3X3, HelpCircle, Lightbulb } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { EmpathyMapCard } from "@/components/dashboard/EmpathyMapCard";
import { BenchmarkCard } from "@/components/dashboard/BenchmarkCard";
import { JTBDCard } from "@/components/dashboard/JTBDCard";
import { CSDMatrix } from "@/components/dashboard/CSDMatrix";
import { HMWCard } from "@/components/dashboard/HMWCard";
import { useEmpathyMaps, useDeleteEmpathyMap } from "@/hooks/useEmpathyMap";
import { useBenchmarks, useDeleteBenchmark } from "@/hooks/useBenchmark";
import { useJTBD, useDeleteJTBD } from "@/hooks/useJTBD";
import { useCSD, useDeleteCSD } from "@/hooks/useCSD";
import { useHMW, useDeleteHMW } from "@/hooks/useHMW";
import { useDocuments } from "@/hooks/useProjectData";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageSkeleton } from "@/components/ui/skeletons";

// ─── Helper: no longer needed as we use EmptyState ──────────────────────────────

// ─── EmpathyMapPage ───────────────────────────────────────────────────────────

export function EmpathyMapPage() {
  const projectId = useCurrentProjectId();
  const { data: maps, isLoading } = useEmpathyMaps(projectId);
  const { mutate: deleteMap } = useDeleteEmpathyMap();

  const handleDelete = (id: string) => {
    if (!projectId) return;
    deleteMap({ id, projectId }, { onSuccess: () => toast.success("Mapa excluído") });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Mapa de Empatia"
      subtitle="O que o usuário pensa, sente, vê e faz"
      icon={<Heart className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um mapa de empatia completo e detalhado para a persona principal do projeto. Use a ferramenta create_empathy_map para inserir diretamente na tabela empathy_maps. Preencha todos os quadrantes com pelo menos 3-4 itens cada."
          label="Gerar Mapa de Empatia"
          invalidateKeys={[["empathy-maps", projectId ?? ""]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {maps && maps.length > 0
            ? maps.map(map => (
                <EmpathyMapCard key={map.id} map={map} onDelete={handleDelete} />
              ))
            : (
              <EmptyState
                icon={Heart}
                title="Nenhum Mapa Criado"
                description="Gere um mapa de empatia automaticamente ou peça ao Mentor IA."
                action={{
                  label: "Gerar Mapa de Empatia",
                  onClick: () => {}, // Handled by AIGenerateButton which is integrated below
                }}
              />
            )
          }
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── BenchmarkPage ────────────────────────────────────────────────────────────

export function BenchmarkPage() {
  const projectId = useCurrentProjectId();
  const { data: benchmarks, isLoading } = useBenchmarks(projectId);
  const { mutate: deleteBenchmark } = useDeleteBenchmark();

  const handleDelete = (id: string) => {
    if (!projectId) return;
    deleteBenchmark({ id, projectId }, { onSuccess: () => toast.success("Benchmark excluído") });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Benchmark"
      subtitle="Análise competitiva e referências de mercado"
      icon={<BarChart3 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Realize uma análise de benchmark competitiva completa para o projeto. Use create_benchmark. Identifique 3-5 concorrentes reais, analise forças/fraquezas, compare funcionalidades e gere insights estratégicos."
          label="Gerar Benchmark"
          invalidateKeys={[["benchmarks", projectId ?? ""]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {benchmarks && benchmarks.length > 0
            ? benchmarks.map(b => (
                <BenchmarkCard key={b.id} benchmark={b} onDelete={handleDelete} />
              ))
            : (
              <EmptyState
                icon={BarChart3}
                title="Análise Vazia"
                description="Gere uma análise de benchmark automaticamente ou peça ao Mentor IA."
                action={{
                  label: "Gerar Benchmark",
                  onClick: () => {},
                }}
              />
            )
          }
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── JTBDPage ─────────────────────────────────────────────────────────────────

export function JTBDPage() {
  const projectId = useCurrentProjectId();
  const { data: frameworks, isLoading } = useJTBD(projectId);
  const { mutate: deleteJTBD } = useDeleteJTBD();

  const handleDelete = (id: string) => {
    deleteJTBD({ id }, { onSuccess: () => toast.success("JTBD excluído") });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Jobs To Be Done"
      subtitle="Motivações e contextos de uso dos usuários"
      icon={<Briefcase className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie 3 frameworks JTBD para o projeto. Use create_jtbd para cada um. Considere jobs funcionais, emocionais e sociais."
          label="Gerar JTBD"
          invalidateKeys={[["jtbd", projectId ?? ""]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {frameworks && frameworks.length > 0
            ? frameworks.map(jtbd => (
                <JTBDCard key={jtbd.id} jtbd={jtbd} onDelete={handleDelete} />
              ))
            : (
              <EmptyState
                icon={Briefcase}
                title="Nenhum JTBD Criado"
                description="Gere frameworks JTBD automaticamente ou peça ao Mentor IA."
                action={{
                  label: "Gerar JTBD",
                  onClick: () => {},
                }}
              />
            )
          }
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── CSDMatrixPage ────────────────────────────────────────────────────────────

export function CSDMatrixPage() {
  const projectId = useCurrentProjectId();
  const { data: items, isLoading } = useCSD(projectId);
  const { mutate: deleteCSD } = useDeleteCSD();

  const handleDelete = (id: string) => {
    deleteCSD({ id }, { onSuccess: () => toast.success("Item excluído") });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Matriz CSD"
      subtitle="Certezas, Suposições e Dúvidas"
      icon={<Grid3X3 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie uma Matriz CSD completa para o projeto. Use create_csd_matrix. Gere pelo menos 3 Certezas, 4 Suposições e 3 Dúvidas, cada uma com nível de impacto."
          label="Gerar Matriz CSD"
          invalidateKeys={[["csd", projectId ?? ""]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        {items && items.length > 0
          ? <CSDMatrix items={items} onDelete={handleDelete} />
          : (
            <div className="mt-4">
              <EmptyState
                icon={Grid3X3}
                title="Matriz Vazia"
                description="Gere uma Matriz CSD automaticamente ou peça ao Mentor IA."
                action={{
                  label: "Gerar Matriz CSD",
                  onClick: () => {},
                }}
              />
            </div>
          )
        }
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── HMWPage ──────────────────────────────────────────────────────────────────

export function HMWPage() {
  const projectId = useCurrentProjectId();
  const { data: questions, isLoading } = useHMW(projectId);
  const { mutate: deleteHMW } = useDeleteHMW();

  const handleDelete = (id: string) => {
    deleteHMW({ id }, { onSuccess: () => toast.success("HMW excluído") });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="How Might We"
      subtitle="Perguntas de oportunidade para ideação"
      icon={<HelpCircle className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie 5 perguntas How Might We para o projeto. Use create_hmw. Cada pergunta deve ter um problem statement claro e prioridade (P1, P2 ou P3)."
          label="Gerar HMW"
          invalidateKeys={[["hmw", projectId ?? ""]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions && questions.length > 0
            ? questions.map(hmw => (
                <HMWCard key={hmw.id} hmw={hmw} onDelete={handleDelete} />
              ))
            : (
              <EmptyState
                icon={Lightbulb}
                title="Nenhuma Pergunta"
                description="Gere perguntas How Might We automaticamente ou peça ao Mentor IA."
                action={{
                  label: "Gerar HMW",
                  onClick: () => {},
                }}
              />
            )
          }
        </div>
      </ErrorBoundary>
    </ModulePage>
  );
}

// ─── AffinityDiagramPage ──────────────────────────────────────────────────────

export function AffinityDiagramPage() {
  const { data: docs, isLoading } = useDocuments("affinity_diagram");

  if (isLoading) return <PageSkeleton />;

  return (
    <ModulePage
      title="Diagrama de Afinidade"
      subtitle="Agrupamento de insights em clusters temáticos"
      icon={<Lightbulb className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um diagrama de afinidade para o projeto. Use create_document com doc_type='affinity_diagram'. Agrupe os insights em clusters temáticos."
          label="Gerar Diagrama"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <ErrorBoundary level="section">
        <DocumentManager
          documents={docs ?? []}
          docType="affinity_diagram"
          docTypeLabel="Diagrama de Afinidade"
          emptyIcon={<Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto" />}
          emptyMessage="Nenhum diagrama de afinidade criado"
        />
      </ErrorBoundary>
    </ModulePage>
  );
}
