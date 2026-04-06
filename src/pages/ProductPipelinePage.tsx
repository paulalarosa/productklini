import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import {
  ChevronRight, ChevronLeft, Check, Rocket, Search, Lightbulb,
  PenTool, FlaskConical, Code2, Sparkles, BookOpen, Target, HelpCircle,
  ChevronDown, ExternalLink, Save, Compass, Eye, Users, Banknote, Trophy,
  Star, TrendingUp, BarChart3, AlertTriangle, Layers, ArrowUpRight, Zap,
  Columns3, ShieldCheck, Building2, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Json } from "@/integrations/supabase/types";

interface PipelineChecklist {
  key: string;
  label: string;
  route?: string;
}

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  whatIs: string;
  whyDo: string;
  howTo: string[];
  deliverables: string[];
  proTip: string;
  checklist: PipelineChecklist[];
}

// ---- Strategic Context Blocks (integrated into flow) ----
interface StrategicBlock {
  id: string; title: string; subtitle: string; icon: React.ElementType;
  questions: string[]; fieldKey: string; phase: "discovery" | "define";
}

const STRATEGIC_BLOCKS: StrategicBlock[] = [
  // Discovery phase blocks
  { id: "cenario", title: "Cenário Atual", subtitle: "Visão ampla dos processos e desafios", icon: Compass, questions: ["A empresa está em transformação digital?", "Existem restrições que podem impactar?", "Existe dependência de sistema legado?"], fieldKey: "current_scenario", phase: "discovery" },
  { id: "visao", title: "Visão de Produto", subtitle: "Maturidade e direcionamento estratégico", icon: Eye, questions: ["Existe uma visão de produto atual?", "Está atualizada e conectada à visão de negócio?"], fieldKey: "product_vision", phase: "discovery" },
  { id: "atores", title: "Atores / Personas", subtitle: "Envolvidos na jornada do produto", icon: Users, questions: ["Quem são os atores envolvidos?", "Quem é o público final?", "Quem tem maior contato com o cliente?"], fieldKey: "actors_personas", phase: "discovery" },
  { id: "modelo", title: "Modelo de Negócio", subtitle: "Como a empresa cobra e lucra", icon: Banknote, questions: ["Qual o modelo de negócio?", "Como é a composição de preço?"], fieldKey: "business_model", phase: "discovery" },
  { id: "posicionamento", title: "Posicionamento no Mercado", subtitle: "Liderança vs desafiante", icon: Trophy, questions: ["Quais os principais concorrentes?", "O que fazemos melhor?", "Onde deixamos a desejar?"], fieldKey: "market_position", phase: "discovery" },
  { id: "diferenciais", title: "Diferenciais", subtitle: "Proposta de valor única", icon: Star, questions: ["Qual a proposta de valor?", "O que fazemos que ninguém oferece?"], fieldKey: "differentials", phase: "discovery" },
  { id: "tendencias", title: "Tendências do Mercado", subtitle: "Como o mercado se movimenta", icon: TrendingUp, questions: ["Quais as tendências do segmento?", "Quão distantes estamos da inovação?"], fieldKey: "market_trends", phase: "discovery" },
  { id: "resultados", title: "Resultados Relevantes", subtitle: "Performance e métricas atuais", icon: BarChart3, questions: ["Onde a empresa performa bem?", "Quais resultados abaixo das metas?"], fieldKey: "relevant_results", phase: "discovery" },
  { id: "ameacas", title: "Ameaças Internas", subtitle: "Fricções organizacionais", icon: AlertTriangle, questions: ["As áreas colaboram ou são siladas?", "Existe disputa pelos resultados?"], fieldKey: "internal_threats", phase: "discovery" },
  { id: "ecossistema", title: "Produtos Próximos", subtitle: "Posição no ecossistema", icon: Layers, questions: ["Quais estruturas próximas?", "Como se relacionam?"], fieldKey: "ecosystem", phase: "discovery" },
  // Define phase blocks
  { id: "oportunidades", title: "Oportunidades Mapeadas", subtitle: "Esforços anteriores e possibilidades", icon: Lightbulb, questions: ["Quais oportunidades já mapeadas?", "São táticas, operacionais ou estratégicas?"], fieldKey: "opportunities", phase: "define" },
  { id: "dores", title: "Dores Atuais", subtitle: "Problemas de negócio e produto", icon: AlertTriangle, questions: ["Quais as dores de negócio?", "Quais as dores do produto?"], fieldKey: "current_pains", phase: "define" },
  { id: "necessidade", title: "Necessidade", subtitle: "Ponto A — onde estamos hoje", icon: Target, questions: ["Qual a necessidade principal?", "Todos alinhados sobre o problema?"], fieldKey: "necessity", phase: "define" },
  { id: "objetivo", title: "Objetivo", subtitle: "Ponto B — visão de longo prazo", icon: ArrowUpRight, questions: ["O que queremos alcançar?", "Quais indicadores de sucesso?"], fieldKey: "objective", phase: "define" },
  { id: "movimento", title: "Movimento Estratégico", subtitle: "O que fazer para ir de A a B", icon: Zap, questions: ["Qual a declaração do movimento?", "Ela direciona o projeto?"], fieldKey: "strategic_movement", phase: "define" },
  { id: "pilares", title: "Pilares", subtitle: "Forças que sustentam a estratégia", icon: Columns3, questions: ["O que é esse pilar?", "Como resolve a dor?"], fieldKey: "pillars", phase: "define" },
  { id: "premissas", title: "Premissas", subtitle: "Elementos transversais ao processo", icon: ShieldCheck, questions: ["Quais premissas orientam o plano tático?"], fieldKey: "premises", phase: "define" },
  { id: "estruturas", title: "Principais Estruturas", subtitle: "Soluções que mudam a dinâmica", icon: Building2, questions: ["Quais estruturas materializam o movimento?", "Qual a visão de sistema?"], fieldKey: "main_structures", phase: "define" },
  { id: "horizontes", title: "Horizontes", subtitle: "Evolução curto, médio e longo prazo", icon: MapPin, questions: ["Como cada estrutura evolui?", "O que entregar em cada horizonte?"], fieldKey: "horizons", phase: "define" },
];

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "discovery",
    title: "Discovery",
    description: "Entenda o problema, o contexto e os atores envolvidos",
    icon: Search,
    whatIs: "A fase de Discovery é a investigação contextual do projeto. Aqui você coleta informações essenciais sobre o cenário atual da organização, os atores/personas envolvidos, o modelo de negócio, o posicionamento no mercado e os diferenciais competitivos. É a base que direciona toda a estratégia.",
    whyDo: "Sem compreender profundamente o contexto, suas decisões de design serão reativas, não estratégicas. A Discovery evita retrabalho, reduz riscos e garante que você está resolvendo o problema certo. Como diz Ida Persson (ex-IDEO): 'Primeiro devemos dedicar tempo para entender qual é o problema certo a ser solucionado.'",
    howTo: [
      "Entreviste stakeholders para entender cenário atual, visão de produto e restrições",
      "Mapeie os atores da jornada: quem é o público final, intermediadores e operadores",
      "Realize benchmark competitivo para entender posicionamento no mercado",
      "Documente diferenciais e proposta de valor da organização",
      "Colete resultados relevantes (métricas, LTV, performance) com equipes de BI/analytics",
      "Identifique ameaças internas e fricções entre áreas",
    ],
    deliverables: ["Personas documentadas", "Mapas de Empatia", "Benchmark competitivo", "Entrevistas sintetizadas", "Análise competitiva", "Diary Studies"],
    proTip: "Muitas organizações não têm documentação organizada sobre seus atores. As informações estão fragmentadas e serão coletadas em diferentes momentos. Use isso como oportunidade para gerar valor organizacional.",
    checklist: [
      { key: "personas", label: "Personas definidas", route: "/ux/personas" },
      { key: "empathy_map", label: "Mapas de Empatia criados", route: "/ux/empathy-map" },
      { key: "benchmark", label: "Benchmark realizado", route: "/ux/benchmark" },
      { key: "interviews", label: "Entrevistas realizadas", route: "/ux/interviews" },
      { key: "competitive", label: "Análise competitiva", route: "/knowledge/competitive-landscape" },
      { key: "diary_studies", label: "Diary Studies", route: "/research/diary-studies" },
    ],
  },
  {
    id: "define",
    title: "Definição",
    description: "Defina necessidades, objetivos e o movimento estratégico",
    icon: Lightbulb,
    whatIs: "A fase de Definição transforma informações em decisões estratégicas. Aqui você identifica as dores atuais, define a necessidade principal (ponto A), o objetivo de longo prazo (ponto B) e articula o movimento estratégico — a declaração do que vamos fazer para sair de A e chegar em B.",
    whyDo: "A necessidade é o ponto de partida para um movimento estratégico assertivo. Sem uma declaração clara de necessidade e objetivo, o time trabalha de forma desalinhada. O movimento estratégico conecta a camada estratégica à camada tática, evitando que o projeto fique reativo.",
    howTo: [
      "Analise as dores atuais (negócio + produto) coletadas na Discovery",
      "Crie uma declaração de necessidade clara e compartilhada",
      "Defina o objetivo de longo prazo (ex: 'ser protagonista da jornada X')",
      "Articule o movimento estratégico como uma declaração inspiradora",
      "Mapeie riscos e identifique o que precisa ser habilitado",
      "Identifique os pilares que sustentam a estratégia",
    ],
    deliverables: ["JTBD definidos", "Matriz CSD", "How Might We", "Customer Journey", "Behavior Model", "Risk Register"],
    proTip: "O movimento estratégico é materializado como uma declaração, ex: 'Trazer o protagonismo para o cliente a partir de uma jornada digital baseada em auto-serviço.' Com base nessa declaração, fica claro o que desejamos construir.",
    checklist: [
      { key: "jtbd", label: "JTBD definidos", route: "/ux/jtbd" },
      { key: "csd", label: "Matriz CSD preenchida", route: "/ux/csd" },
      { key: "hmw", label: "How Might We criadas", route: "/ux/hmw" },
      { key: "customer_journey", label: "Customer Journey mapeada", route: "/product/customer-journey" },
      { key: "behavior_model", label: "Behavior Model (BJ Fogg)", route: "/ux/behavior-model" },
      { key: "risks", label: "Riscos identificados", route: "/product/risk-register" },
    ],
  },
  {
    id: "ideation",
    title: "Ideação",
    description: "Gere soluções, priorize e defina a arquitetura de informação",
    icon: Sparkles,
    whatIs: "A fase de Ideação transforma o movimento estratégico em estruturas concretas. Aqui você prioriza oportunidades, define a arquitetura de informação (sitemap, card sorting), cria fluxos de navegação e estabelece as principais estruturas do sistema que irão materializar a estratégia.",
    whyDo: "As oportunidades mapeadas devem ser priorizadas de acordo com critérios relevantes para a organização. É preciso definir se elas têm um teor mais tático, operacional ou estratégico. Sem priorização clara, o time se perde em demandas sem conexão estratégica.",
    howTo: [
      "Priorize oportunidades usando Impact vs Effort ou outras matrizes",
      "Realize Card Sorting para validar a arquitetura de informação",
      "Defina o Sitemap visual do produto",
      "Crie User Flows para os principais cenários",
      "Conecte cada estrutura proposta aos pilares estratégicos",
      "Valide o Business Model Canvas se necessário",
    ],
    deliverables: ["Card Sorting", "Sitemap", "User Flows", "Priorização", "Impact vs Effort", "Business Model Canvas"],
    proTip: "Quando começar a pensar nas soluções, identifique as 'principais estruturas' — coisas como área do cliente, programa de fidelidade, concierge automatizado. Entender como elas se relacionam compõe a visão de sistema.",
    checklist: [
      { key: "card_sorting", label: "Card Sorting", route: "/ia/card-sorting" },
      { key: "sitemap", label: "Sitemap definido", route: "/ia/sitemap-visual" },
      { key: "user_flows", label: "User Flows criados", route: "/design/user-flows" },
      { key: "prioritization", label: "Priorização feita", route: "/strategy/prioritization" },
      { key: "impact_effort", label: "Impact vs Effort", route: "/strategy/impact-effort" },
      { key: "bmc", label: "Business Model Canvas", route: "/strategy/business-model" },
    ],
  },
  {
    id: "design",
    title: "Design",
    description: "Crie a solução visual, o tom de voz e o sistema de design",
    icon: PenTool,
    whatIs: "A fase de Design materializa a estratégia em interfaces e experiências tangíveis. Aqui você define o Tom de Voz, cria o Design System, desenvolve Moodboards de referência visual e desenha as telas que compõem a jornada do usuário. É onde as 'principais estruturas' ganham forma.",
    whyDo: "Design sem estratégia é decoração. Com a base estratégica construída nas fases anteriores, cada decisão visual (cores, tipografia, microcopy) se conecta ao movimento estratégico. O Design System garante consistência e escalabilidade. Os princípios de design alinham o time.",
    howTo: [
      "Defina o Tom de Voz da marca/produto",
      "Crie microcopy alinhada ao tom e contexto",
      "Monte o Design System com tokens, componentes e documentação",
      "Desenvolva Moodboard com referências visuais",
      "Desenhe as telas seguindo os User Flows definidos",
      "Documente os Princípios de Design do projeto",
    ],
    deliverables: ["Tom de Voz", "Microcopy", "Design System", "Moodboard", "Telas", "Princípios de Design"],
    proTip: "Pense nos 'horizontes' de evolução: Horizonte 1 (MVP funcional), Horizonte 2 (enriquecimento com dados), Horizonte 3 (IA e personalização). Cada horizonte evolui as estruturas para entregar mais valor.",
    checklist: [
      { key: "tone_of_voice", label: "Tom de Voz definido", route: "/ux/tone" },
      { key: "microcopy", label: "Microcopy criada", route: "/ux/microcopy" },
      { key: "design_system", label: "Design System montado", route: "/ui/ds-hub" },
      { key: "moodboard", label: "Moodboard criado", route: "/design/moodboard" },
      { key: "screens", label: "Telas desenhadas", route: "/ui/telas" },
      { key: "design_principles", label: "Princípios de Design", route: "/knowledge/design-principles" },
    ],
  },
  {
    id: "validation",
    title: "Validação",
    description: "Teste e valide a solução com usuários reais e métricas",
    icon: FlaskConical,
    whatIs: "A fase de Validação testa se a solução desenhada resolve as dores identificadas e atinge os objetivos definidos. Inclui avaliações heurísticas, testes de usabilidade, auditorias de acessibilidade e testes A/B para validar hipóteses com dados reais.",
    whyDo: "Uma estratégia sem validação é uma aposta. Os testes revelam se as 'estruturas' projetadas realmente mudam a dinâmica da jornada. A validação com dados reforça a confiança dos stakeholders e embasa decisões de evolução nos próximos horizontes.",
    howTo: [
      "Realize avaliação heurística (Nielsen) nas telas",
      "Conduza testes de usabilidade com usuários reais",
      "Execute auditoria WCAG para garantir acessibilidade",
      "Configure testes A/B para validar hipóteses específicas",
      "Colete NPS/feedback quantitativo",
      "Documente insights e ajustes necessários",
    ],
    deliverables: ["Avaliação Heurística", "Teste de Usabilidade", "Auditoria WCAG", "Score de Acessibilidade", "Teste A/B", "NPS"],
    proTip: "Use os resultados de validação para criar uma 'jornada to-be' — mostrando como as estruturas, horizontes e o sistema funcionam para entregar uma experiência mais integrada. Isso facilita a comunicação com stakeholders.",
    checklist: [
      { key: "heuristics", label: "Avaliação Heurística", route: "/ux/heuristics" },
      { key: "usability_test", label: "Teste de Usabilidade", route: "/ux/usability-test" },
      { key: "wcag", label: "Auditoria WCAG", route: "/ux/wcag-auditor" },
      { key: "accessibility_score", label: "Score de Acessibilidade", route: "/testing/accessibility-score" },
      { key: "ab_testing", label: "Teste A/B", route: "/ab-testing" },
      { key: "nps", label: "Pesquisa NPS", route: "/metrics/nps" },
    ],
  },
  {
    id: "handoff",
    title: "Handoff",
    description: "Entregue specs, documentação e métricas para o dev",
    icon: Code2,
    whatIs: "O Handoff é a ponte entre Design e Desenvolvimento. Aqui você entrega especificações detalhadas (spacing, tipografia, cores), documenta interações, define métricas de sucesso (OKRs) e garante que a visão estratégica se traduza em código sem perder fidelidade.",
    whyDo: "Um handoff mal feito desperdiça todo o trabalho estratégico anterior. O impacto no negócio depende da implementação fiel das estruturas projetadas. Stakeholders precisam visualizar como a solução impacta resultados — o relatório final conecta estratégia a métricas de negócio.",
    howTo: [
      "Gere specs de handoff com espaçamentos, tipografia e cores",
      "Documente interações e estados de cada componente",
      "Revise QA e bugs encontrados",
      "Defina OKRs conectados ao movimento estratégico",
      "Atualize o Roadmap com próximos horizontes",
      "Gere relatório final com impacto estimado no negócio",
    ],
    deliverables: ["Specs de Handoff", "Analytics de Componentes", "QA/Bugs", "OKRs", "Roadmap", "Relatório"],
    proTip: "Compreenda como a solução impacta o negócio: como melhora resultados, muda coleta de dados e influencia métricas. Use essa visão de impacto para articular sua estratégia com stakeholders patrocinadores.",
    checklist: [
      { key: "handoff_specs", label: "Specs de Handoff", route: "/product/design-handoff" },
      { key: "component_analytics", label: "Analytics de Componentes", route: "/testing/component-analytics" },
      { key: "qa_bugs", label: "QA / Bugs", route: "/dev/qa" },
      { key: "okrs", label: "OKRs definidos", route: "/product/okrs" },
      { key: "roadmap", label: "Roadmap atualizado", route: "/product/roadmap" },
      { key: "report", label: "Relatório gerado", route: "/relatorio" },
    ],
  },
];

export function ProductPipelinePage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(true);
  const [showStrategic, setShowStrategic] = useState(false);
  const [strategicLocal, setStrategicLocal] = useState<Record<string, string>>({});

  // Load strategic context doc
  const { data: strategicDoc } = useQuery({
    queryKey: ["strategic-context", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("project_documents").select("*").eq("project_id", projectId).eq("doc_type", "strategic_context").maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  const strategicContent: Record<string, string> = strategicDoc?.content ? (() => { try { return JSON.parse(strategicDoc.content); } catch { return {}; } })() : {};
  const getStrategicValue = (key: string) => strategicLocal[key] ?? strategicContent[key] ?? "";

  const saveStrategicField = async (fieldKey: string) => {
    if (!projectId) return;
    const newContent = { ...strategicContent, ...strategicLocal };
    const payload = {
      project_id: projectId, doc_type: "strategic_context",
      title: "Investigação Contextual & Imersão",
      content: JSON.stringify(newContent), metadata: {} as Json,
    };
    if (strategicDoc?.id) {
      const { error } = await supabase.from("project_documents").update(payload).eq("id", strategicDoc.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("project_documents").insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    qc.invalidateQueries({ queryKey: ["strategic-context"] });
    toast.success("Salvo!");
  };

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["product-pipeline", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase.from("product_pipeline").select("*").eq("project_id", projectId).maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });

  const currentStep = pipeline?.current_step ?? 0;
  const checklistState = (pipeline?.checklist_state ?? {}) as Record<string, boolean>;

  const upsertMut = useMutation({
    mutationFn: async (updates: { current_step?: number; checklist_state?: Record<string, boolean> }) => {
      if (!projectId) throw new Error("No project");
      const payload = {
        project_id: projectId,
        current_step: updates.current_step ?? currentStep,
        checklist_state: updates.checklist_state ?? checklistState,
      };
      const { error } = await supabase.from("product_pipeline").upsert(payload, { onConflict: "project_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product-pipeline"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCheck = (key: string) => {
    const newState = { ...checklistState, [key]: !checklistState[key] };
    upsertMut.mutate({ checklist_state: newState });
  };

  const goToStep = (step: number) => {
    upsertMut.mutate({ current_step: step });
  };

  const step = PIPELINE_STEPS[currentStep];
  const totalChecked = step?.checklist.filter(c => checklistState[c.key]).length ?? 0;
  const totalItems = step?.checklist.length ?? 1;
  const stepProgress = Math.round((totalChecked / totalItems) * 100);
  const overallProgress = Math.round(
    (PIPELINE_STEPS.reduce((sum, s) => sum + s.checklist.filter(c => checklistState[c.key]).length, 0) /
      PIPELINE_STEPS.reduce((sum, s) => sum + s.checklist.length, 0)) * 100
  );

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-muted animate-pulse" />
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            Product Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            Siga o fluxo completo: Discovery → Handoff
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showGuide ? "Ocultar guia" : "Mostrar guia"}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Progresso geral:</span>
            <Progress value={overallProgress} className="w-32 h-2" />
            <span className="text-xs font-bold">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Steps bar */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((s, idx) => {
          const checked = s.checklist.filter(c => checklistState[c.key]).length;
          const isDone = checked === s.checklist.length;
          const isCurrent = idx === currentStep;
          return (
            <button
              key={s.id}
              onClick={() => goToStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-all ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isDone
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{s.title}</span>
              {isDone && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Educational Guide */}
      {showGuide && step && (
        <div className="animate-slide-up">
          <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 space-y-4">
                {/* What is */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">O que é esta etapa?</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                    {step.whatIs}
                  </p>
                </div>

                {/* Why */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Por que fazer?</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                    {step.whyDo}
                  </p>
                </div>

                {/* How */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                    <div className="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Como fazer?</h3>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto group-data-[state=open]:rotate-180 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ol className="mt-2 space-y-1.5 pl-8">
                      {step.howTo.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </CollapsibleContent>
                </Collapsible>

                {/* Deliverables + Pro Tip */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                  <div className="bg-background/60 rounded-lg p-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      📦 Entregáveis desta fase
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {step.deliverables.map((d, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{d}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                      💡 Dica estratégica
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {step.proTip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      )}

      {/* Current step detail */}
      {step && (
        <ErrorBoundary level="section">
          <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <Badge variant={stepProgress === 100 ? "default" : "secondary"}>
                {stepProgress}%
              </Badge>
            </div>
            <Progress value={stepProgress} className="mt-3 h-1.5" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {step.checklist.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={!!checklistState[item.key]}
                      onCheckedChange={() => toggleCheck(item.key)}
                    />
                    <span
                      className={`text-sm ${
                        checklistState[item.key]
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.route && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.route!)}
                      className="text-xs shrink-0"
                    >
                      Ir para módulo
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>
      )}

      {/* Strategic Context — embedded in Discovery & Define phases */}
      {step && (step.id === "discovery" || step.id === "define") && (
        <ErrorBoundary level="section">
          <Collapsible open={showStrategic} onOpenChange={setShowStrategic}>
            <Card className="border-primary/20">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Compass className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        {step.id === "discovery" ? "Investigação Contextual" : "Imersão Estratégica"}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground">
                        {step.id === "discovery"
                          ? "Mapeie cenário, atores, modelo de negócio e posicionamento"
                          : "Defina dores, necessidade, objetivo e movimento estratégico"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[9px]">
                      {STRATEGIC_BLOCKS.filter(b => b.phase === step.id && (strategicContent[b.fieldKey] || "").trim().length > 0).length}/
                      {STRATEGIC_BLOCKS.filter(b => b.phase === step.id).length}
                    </Badge>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showStrategic ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {STRATEGIC_BLOCKS.filter(b => b.phase === step.id).map(block => {
                  const val = getStrategicValue(block.fieldKey);
                  const filled = val.trim().length > 0;
                  return (
                    <Collapsible key={block.id}>
                      <CollapsibleTrigger className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 transition-colors">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${filled ? "bg-green-500/10" : "bg-secondary"}`}>
                          <block.icon className={`w-3.5 h-3.5 ${filled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            {block.title}
                            {filled && <span className="text-[8px] text-green-600 dark:text-green-400">✓</span>}
                          </span>
                          <p className="text-[10px] text-muted-foreground">{block.subtitle}</p>
                        </div>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-9 space-y-2 pb-3">
                          <div className="bg-primary/5 rounded-lg p-2.5">
                            <ul className="space-y-0.5">
                              {block.questions.map((q, i) => (
                                <li key={i} className="text-[10px] text-muted-foreground flex gap-1">
                                  <span className="text-primary">•</span> {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Textarea
                            value={val}
                            onChange={e => setStrategicLocal(p => ({ ...p, [block.fieldKey]: e.target.value }))}
                            placeholder={`Descreva ${block.title.toLowerCase()}...`}
                            className="min-h-[80px] text-xs"
                          />
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={() => saveStrategicField(block.fieldKey)} className="text-[10px] h-7">
                              <Save className="w-3 h-3 mr-1" />Salvar
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </CollapsibleContent>
          </Card>
          </Collapsible>
        </ErrorBoundary>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={() => goToStep(currentStep - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Etapa anterior
        </Button>
        <AIGenerateButton
          prompt={`Estou na etapa "${step?.title}" do pipeline de produto. Analise o que já foi preenchido e gere automaticamente os artefatos pendentes desta fase. Use as ferramentas específicas para cada módulo.`}
          label="Preencher fase com IA"
          invalidateKeys={PIPELINE_STEPS.flatMap((s) =>
            s.checklist.map((c) => [c.key])
          )}
          size="sm"
        />
        <Button
          disabled={currentStep === PIPELINE_STEPS.length - 1}
          onClick={() => goToStep(currentStep + 1)}
        >
          Próxima etapa
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
