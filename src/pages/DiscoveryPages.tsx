import { Heart, BarChart3, Briefcase, Grid3X3, HelpCircle, Lightbulb, TrendingUp } from "lucide-react";
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
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export function EmpathyMapPage() {
  const { id: projectId } = useParams();
  const { data: maps, isLoading } = useEmpathyMaps(projectId);
  const { mutate: deleteMap } = useDeleteEmpathyMap();

  const handleDelete = (id: string) => {
    if (!projectId) return;
    deleteMap({ id, projectId }, {
      onSuccess: () => toast.success("Mapa excluído"),
    });
  };

  return (
    <ModulePage 
      title="Mapa de Empatia" 
      subtitle="O que o usuário pensa, sente, vê e faz" 
      icon={<Heart className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um mapa de empatia completo e detalhado para a persona principal do projeto. Use a ferramenta create_empathy_map para inserir diretamente na tabela empathy_maps. Baseie-se no contexto do projeto, nas personas existentes e nos dados disponíveis. Preencha todos os quadrantes (pensa e sente, escuta, vê, fala e faz, dores, ganhos) com pelo menos 3-4 itens cada."
          label="Gerar Mapa de Empatia"
          invalidateKeys={[["empathy-maps", projectId || ""]]}
          size="sm"
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {maps?.map((map) => (
          <EmpathyMapCard key={map.id} map={map} onDelete={handleDelete} />
        ))}
        
        {!isLoading && (!maps || maps.length === 0) && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-muted rounded-xl">
            <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum Mapa Criado</h3>
            <p className="text-sm text-muted-foreground mb-4">Gere um mapa de empatia automaticamente ou peça ao Mentor IA.</p>
            <AIGenerateButton
              prompt="Crie um mapa de empatia completo e detalhado para a persona principal do projeto. Use a ferramenta create_empathy_map para inserir diretamente na tabela empathy_maps. Preencha todos os quadrantes com pelo menos 3-4 itens cada."
              label="Gerar Mapa de Empatia"
              invalidateKeys={[["empathy-maps", projectId || ""]]}
            />
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function BenchmarkPage() {
  const { id: projectId } = useParams();
  const { data: benchmarks, isLoading } = useBenchmarks(projectId);
  const { mutate: deleteBenchmark } = useDeleteBenchmark();

  const handleDelete = (id: string) => {
    if (!projectId) return;
    deleteBenchmark({ id, projectId }, {
      onSuccess: () => toast.success("Benchmark excluído"),
    });
  };

  return (
    <ModulePage 
      title="Benchmark" 
      subtitle="Análise competitiva e referências de mercado" 
      icon={<BarChart3 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Realize uma análise de benchmark competitiva completa para o projeto. Use a ferramenta create_benchmark para inserir diretamente na tabela benchmarks. Identifique 3-5 concorrentes reais do mercado, analise forças e fraquezas de cada um, compare funcionalidades-chave e gere insights estratégicos acionáveis."
          label="Gerar Benchmark"
          invalidateKeys={[["benchmarks", projectId || ""]]}
          size="sm"
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {benchmarks?.map((b) => (
          <BenchmarkCard key={b.id} benchmark={b} onDelete={handleDelete} />
        ))}
        
        {!isLoading && (!benchmarks || benchmarks.length === 0) && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-muted rounded-xl">
            <BarChart3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Análise Vazia</h3>
            <p className="text-sm text-muted-foreground mb-4">Gere uma análise de benchmark automaticamente ou peça ao Mentor IA.</p>
            <AIGenerateButton
              prompt="Realize uma análise de benchmark competitiva completa para o projeto. Use a ferramenta create_benchmark. Identifique 3-5 concorrentes reais, analise forças/fraquezas, compare funcionalidades e gere insights."
              label="Gerar Benchmark"
              invalidateKeys={[["benchmarks", projectId || ""]]}
            />
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function JTBDPage() {
  const { id: projectId } = useParams();
  const { data: frameworks, isLoading } = useJTBD(projectId);
  const { mutate: deleteJTBD } = useDeleteJTBD();

  const handleDelete = (id: string) => {
    deleteJTBD({ id }, {
      onSuccess: () => toast.success("JTBD excluído"),
    });
  };

  return (
    <ModulePage 
      title="Jobs To Be Done" 
      subtitle="Motivações e contextos de uso dos usuários" 
      icon={<Briefcase className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie 3 frameworks JTBD (Jobs To Be Done) para o projeto. Use a ferramenta create_jtbd para cada um. Considere jobs funcionais, emocionais e sociais. Para cada job, defina claramente: situação, motivação e resultado esperado. Baseie-se no contexto do projeto e nas personas existentes."
          label="Gerar JTBD"
          invalidateKeys={[["jtbd", projectId || ""]]}
          size="sm"
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {frameworks?.map((jtbd) => (
          <JTBDCard key={jtbd.id} jtbd={jtbd} onDelete={handleDelete} />
        ))}
        
        {!isLoading && (!frameworks || frameworks.length === 0) && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-muted rounded-xl">
            <Briefcase className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum JTBD Criado</h3>
            <p className="text-sm text-muted-foreground mb-4">Gere frameworks JTBD automaticamente ou peça ao Mentor IA.</p>
            <AIGenerateButton
              prompt="Crie 3 frameworks JTBD para o projeto. Use create_jtbd para cada um. Considere jobs funcionais, emocionais e sociais."
              label="Gerar JTBD"
              invalidateKeys={[["jtbd", projectId || ""]]}
            />
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function CSDMatrixPage() {
  const { id: projectId } = useParams();
  const { data: items, isLoading } = useCSD(projectId);
  const { mutate: deleteCSD } = useDeleteCSD();

  const handleDelete = (id: string) => {
    deleteCSD({ id }, {
      onSuccess: () => toast.success("Item excluído"),
    });
  };

  return (
    <ModulePage 
      title="Matriz CSD" 
      subtitle="Certezas, Suposições e Dúvidas" 
      icon={<Grid3X3 className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie uma Matriz CSD completa para o projeto. Use a ferramenta create_csd_matrix. Gere pelo menos 3 Certezas, 4 Suposições e 3 Dúvidas baseadas no contexto do projeto, cada uma com nível de impacto (Low, Medium, High)."
          label="Gerar Matriz CSD"
          invalidateKeys={[["csd", projectId || ""]]}
          size="sm"
        />
      }
    >
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">Carregando matriz...</div>
      ) : (
        <CSDMatrix items={items || []} onDelete={handleDelete} />
      )}
      
      {!isLoading && (!items || items.length === 0) && (
        <div className="mt-8 py-20 text-center border-2 border-dashed border-muted rounded-xl">
          <Grid3X3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Matriz Vazia</h3>
          <p className="text-sm text-muted-foreground mb-4">Gere uma Matriz CSD automaticamente ou peça ao Mentor IA.</p>
          <AIGenerateButton
            prompt="Crie uma Matriz CSD completa para o projeto. Use create_csd_matrix. Gere pelo menos 3 Certezas, 4 Suposições e 3 Dúvidas."
            label="Gerar Matriz CSD"
            invalidateKeys={[["csd", projectId || ""]]}
          />
        </div>
      )}
    </ModulePage>
  );
}

export function HMWPage() {
  const { id: projectId } = useParams();
  const { data: questions, isLoading } = useHMW(projectId);
  const { mutate: deleteHMW } = useDeleteHMW();

  const handleDelete = (id: string) => {
    deleteHMW({ id }, {
      onSuccess: () => toast.success("HMW excluído"),
    });
  };

  return (
    <ModulePage 
      title="How Might We" 
      subtitle="Perguntas de oportunidade para ideação" 
      icon={<HelpCircle className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie 5 perguntas How Might We para o projeto. Use a ferramenta create_hmw. Baseie-se nos problemas e dores identificados. Cada pergunta deve ter um problem statement claro e prioridade (P1, P2 ou P3)."
          label="Gerar HMW"
          invalidateKeys={[["hmw", projectId || ""]]}
          size="sm"
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions?.map((hmw) => (
          <HMWCard key={hmw.id} hmw={hmw} onDelete={handleDelete} />
        ))}
        
        {!isLoading && (!questions || questions.length === 0) && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-muted rounded-xl">
            <Lightbulb className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma Pergunta</h3>
            <p className="text-sm text-muted-foreground mb-4">Gere perguntas How Might We automaticamente ou peça ao Mentor IA.</p>
            <AIGenerateButton
              prompt="Crie 5 perguntas How Might We para o projeto. Use create_hmw. Transforme problemas em oportunidades."
              label="Gerar HMW"
              invalidateKeys={[["hmw", projectId || ""]]}
            />
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function AffinityDiagramPage() {
  const { data: docs } = useDocuments("affinity_diagram");
  return (
    <ModulePage 
      title="Diagrama de Afinidade" 
      subtitle="Agrupamento de insights em clusters temáticos" 
      icon={<Lightbulb className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie um diagrama de afinidade para o projeto. Use create_document com doc_type='affinity_diagram'. Agrupe os insights disponíveis em clusters temáticos."
          label="Gerar Diagrama"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <DocumentManager documents={docs ?? []} docType="affinity_diagram" docTypeLabel="Diagrama de Afinidade" emptyIcon={<Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhum diagrama de afinidade criado" />
    </ModulePage>
  );
}
