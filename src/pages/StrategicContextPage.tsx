import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Compass, Eye, Users, Banknote, Trophy, Star, TrendingUp,
  BarChart3, AlertTriangle, Layers, ChevronDown, Save,
  Target, Lightbulb, Zap, Columns3, ShieldCheck, Building2,
  MapPin, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface StrategicBlock {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  questions: string[];
  howToCollect: string;
  fieldKey: string;
}

const INVESTIGATION_BLOCKS: StrategicBlock[] = [
  { id: "cenario", title: "Cenário Atual", subtitle: "Visão ampla dos processos e desafios", icon: Compass, questions: ["A empresa está em transformação digital?", "Está tentando integrar seu ecossistema?", "Existem restrições que podem impactar?", "Existem novos stakeholders?", "Existe dependência de sistema legado?"], howToCollect: "Entrevistar stakeholders, reuniões de kick-off.", fieldKey: "current_scenario" },
  { id: "visao", title: "Visão de Produto", subtitle: "Maturidade e direcionamento estratégico", icon: Eye, questions: ["Existe uma visão de produto atual?", "A equipe segue essa visão?", "Está atualizada e conectada à visão de negócio?", "As pessoas estão alinhadas?"], howToCollect: "Conversa com stakeholders, reunião com PM.", fieldKey: "product_vision" },
  { id: "atores", title: "Atores / Personas", subtitle: "Envolvidos na jornada do produto", icon: Users, questions: ["Quem são os atores envolvidos?", "Quem é o público final?", "Existe intermediador?", "Quem tem maior contato com o cliente?", "Quais perfis variantes existem?"], howToCollect: "Personas, jornadas, entrevistas.", fieldKey: "actors_personas" },
  { id: "modelo", title: "Modelo de Negócio", subtitle: "Como a empresa cobra e lucra", icon: Banknote, questions: ["Qual o modelo de negócio?", "Como é a composição de preço?", "Qual produto gera mais rentabilidade?", "Como o preço é percebido?"], howToCollect: "Stakeholders e equipe de pricing.", fieldKey: "business_model" },
  { id: "posicionamento", title: "Posicionamento no Mercado", subtitle: "Liderança vs desafiante", icon: Trophy, questions: ["A empresa está distante dos concorrentes?", "Quais os principais concorrentes?", "O que fazemos melhor?", "Onde deixamos a desejar?"], howToCollect: "Benchmarking, análise da experiência.", fieldKey: "market_position" },
  { id: "diferenciais", title: "Diferenciais", subtitle: "Proposta de valor única", icon: Star, questions: ["Qual a proposta de valor?", "O que fazemos que ninguém oferece?", "Como os consumidores percebem?"], howToCollect: "Stakeholders, clientes, análise do produto.", fieldKey: "differentials" },
  { id: "tendencias", title: "Tendências do Mercado", subtitle: "Como o mercado se movimenta", icon: TrendingUp, questions: ["Quais as tendências do segmento?", "Quão distantes estamos da inovação?", "O que aproveitar para a estratégia?"], howToCollect: "Reports, publicações, ferramentas de IA.", fieldKey: "market_trends" },
  { id: "resultados", title: "Resultados Relevantes", subtitle: "Performance e métricas atuais", icon: BarChart3, questions: ["Onde a empresa performa bem?", "Quais resultados abaixo das metas?", "Existem dados comportamentais?", "Qual o LTV dos clientes?"], howToCollect: "Analytics, BI, ferramentas de dados.", fieldKey: "relevant_results" },
  { id: "ameacas", title: "Ameaças Internas", subtitle: "Fricções organizacionais", icon: AlertTriangle, questions: ["Existem intermediadores que distanciam o cliente?", "As áreas colaboram ou são siladas?", "Existe disputa pelos resultados?"], howToCollect: "Dinâmicas internas, análise organizacional.", fieldKey: "internal_threats" },
  { id: "ecossistema", title: "Produtos Próximos", subtitle: "Posição no ecossistema", icon: Layers, questions: ["Quais estruturas próximas?", "Como se relacionam?", "Existe colaboração entre equipes?"], howToCollect: "Stakeholders, mapeamento do ecossistema.", fieldKey: "ecosystem" },
];

const IMMERSION_BLOCKS: StrategicBlock[] = [
  { id: "oportunidades", title: "Oportunidades Mapeadas", subtitle: "Esforços anteriores e possibilidades", icon: Lightbulb, questions: ["Quais oportunidades já mapeadas?", "São táticas, operacionais ou estratégicas?"], howToCollect: "Backlog, equipes anteriores.", fieldKey: "opportunities" },
  { id: "dores", title: "Dores Atuais", subtitle: "Problemas de negócio e produto", icon: AlertTriangle, questions: ["Quais as dores de negócio?", "Quais as dores do produto?", "O que resolver AGORA?"], howToCollect: "Stakeholders, resultados, entrevistas.", fieldKey: "current_pains" },
  { id: "necessidade", title: "Necessidade", subtitle: "Ponto A — onde estamos hoje", icon: Target, questions: ["Qual a necessidade principal?", "Contempla mais de uma dor?", "Todos alinhados sobre o problema?"], howToCollect: "Stakeholders, análise das dores.", fieldKey: "necessity" },
  { id: "objetivo", title: "Objetivo", subtitle: "Ponto B — visão de longo prazo", icon: ArrowUpRight, questions: ["O que queremos alcançar?", "Quais indicadores de sucesso?", "Qual o real objetivo além das métricas?"], howToCollect: "Declaração de stakeholders, liderança.", fieldKey: "objective" },
  { id: "movimento", title: "Movimento Estratégico", subtitle: "O que fazer para ir de A a B", icon: Zap, questions: ["Qual a declaração do movimento?", "Ela direciona o projeto?", "As pessoas compreendem?"], howToCollect: "Síntese de necessidade + objetivo + cenário.", fieldKey: "strategic_movement" },
  { id: "pilares", title: "Pilares", subtitle: "Forças que sustentam a estratégia", icon: Columns3, questions: ["O que é esse pilar?", "Como resolve a dor?", "Como apoia a estratégia?", "Qual exemplo de materialização?"], howToCollect: "Derivação do movimento estratégico.", fieldKey: "pillars" },
  { id: "premissas", title: "Premissas", subtitle: "Elementos transversais ao processo", icon: ShieldCheck, questions: ["Quais premissas orientam o plano tático?", "Estamos confundindo premissas com pilares?"], howToCollect: "Análise da jornada.", fieldKey: "premises" },
  { id: "estruturas", title: "Principais Estruturas", subtitle: "Soluções que mudam a dinâmica", icon: Building2, questions: ["Quais estruturas materializam o movimento?", "Como se integram?", "Qual a visão de sistema?"], howToCollect: "Derivação dos pilares.", fieldKey: "main_structures" },
  { id: "horizontes", title: "Horizontes", subtitle: "Evolução curto, médio e longo prazo", icon: MapPin, questions: ["Como cada estrutura evolui?", "O que entregar em cada horizonte?"], howToCollect: "Roadmap, viabilidade técnica.", fieldKey: "horizons" },
];

export function StrategicContextPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();

  const { data: doc } = useQuery({
    queryKey: ["strategic-context", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .eq("doc_type", "strategic_context")
        .maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  const content: Record<string, string> = doc?.content ? (() => { try { return JSON.parse(doc.content); } catch { return {}; } })() : {};

  const saveMut = useMutation({
    mutationFn: async (fieldUpdates: Record<string, string>) => {
      if (!projectId) throw new Error("No project");
      const newContent = { ...content, ...fieldUpdates };
      const payload = {
        project_id: projectId,
        doc_type: "strategic_context",
        title: "Investigação Contextual & Imersão",
        content: JSON.stringify(newContent),
        metadata: {} as Json,
      };
      if (doc?.id) {
        const { error } = await supabase.from("project_documents").update(payload).eq("id", doc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_documents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategic-context"] });
      toast.success("Salvo!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const getValue = (key: string) => localValues[key] ?? content[key] ?? "";
  const handleSave = (key: string) => {
    saveMut.mutate({ [key]: localValues[key] ?? content[key] ?? "" });
  };

  const allBlocks = [...INVESTIGATION_BLOCKS, ...IMMERSION_BLOCKS];
  const filledCount = allBlocks.filter(b => (content[b.fieldKey] || "").trim().length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Estratégia de Produto
          </h1>
          <p className="text-sm text-muted-foreground">Framework de Investigação Contextual + Imersão</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filledCount}/{allBlocks.length} preenchidos</Badge>
          <AIGenerateButton
            prompt="Analise o projeto e preencha todos os campos do framework de estratégia para Product Designers incluindo cenário atual, visão de produto, atores, modelo de negócio, posicionamento, diferenciais, tendências, resultados, ameaças, ecossistema, oportunidades, dores, necessidade, objetivo, movimento estratégico, pilares, premissas, estruturas e horizontes."
            label="Preencher com IA"
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Parte 1</span>
          Investigação Contextual
        </h2>
        <p className="text-xs text-muted-foreground">O que precisamos compreender para gerar insumos estratégicos?</p>
        {INVESTIGATION_BLOCKS.map(block => (
          <BlockCard key={block.id} block={block} value={getValue(block.fieldKey)} onChange={val => setLocalValues(p => ({ ...p, [block.fieldKey]: val }))} onSave={() => handleSave(block.fieldKey)} isSaving={saveMut.isPending} />
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Parte 2</span>
          Imersão
        </h2>
        <p className="text-xs text-muted-foreground">Materializando informações em decisões estratégicas.</p>
        {IMMERSION_BLOCKS.map(block => (
          <BlockCard key={block.id} block={block} value={getValue(block.fieldKey)} onChange={val => setLocalValues(p => ({ ...p, [block.fieldKey]: val }))} onSave={() => handleSave(block.fieldKey)} isSaving={saveMut.isPending} />
        ))}
      </div>
    </div>
  );
}

function BlockCard({ block, value, onChange, onSave, isSaving }: {
  block: StrategicBlock; value: string; onChange: (v: string) => void; onSave: () => void; isSaving: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const filled = value.trim().length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={filled ? "border-green-500/20" : ""}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${filled ? "bg-green-500/10" : "bg-primary/10"}`}>
                  <block.icon className={`w-4 h-4 ${filled ? "text-green-600 dark:text-green-400" : "text-primary"}`} />
                </div>
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {block.title}
                    {filled && <Badge variant="secondary" className="text-[9px] bg-green-500/10 text-green-700 dark:text-green-400">✓</Badge>}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">{block.subtitle}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <div className="bg-primary/5 rounded-lg p-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">🎯 O que mapear</h4>
              <ul className="space-y-1">
                {block.questions.map((q, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                    <span className="text-primary">•</span> {q}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground/70 mt-2 italic">📋 {block.howToCollect}</p>
            </div>
            <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder={`Descreva ${block.title.toLowerCase()}...`} className="min-h-[100px] text-sm" />
            <div className="flex justify-end">
              <Button size="sm" onClick={onSave} disabled={isSaving}>
                <Save className="w-3.5 h-3.5 mr-1" />Salvar
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
