import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { ChevronRight, ChevronLeft, Check, Rocket, Search, Lightbulb, PenTool, FlaskConical, Code2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  checklist: { key: string; label: string; route?: string }[];
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "discovery", title: "Discovery", description: "Entenda o problema e o contexto", icon: Search,
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
    id: "define", title: "Definição", description: "Defina o escopo e os problemas", icon: Lightbulb,
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
    id: "ideation", title: "Ideação", description: "Gere e priorize soluções", icon: Sparkles,
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
    id: "design", title: "Design", description: "Crie a solução visual", icon: PenTool,
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
    id: "validation", title: "Validação", description: "Teste e valide a solução", icon: FlaskConical,
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
    id: "handoff", title: "Handoff", description: "Entregue para desenvolvimento", icon: Code2,
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

  const { data: pipeline } = useQuery({
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
  const overallProgress = Math.round((PIPELINE_STEPS.reduce((sum, s) => sum + s.checklist.filter(c => checklistState[c.key]).length, 0) / PIPELINE_STEPS.reduce((sum, s) => sum + s.checklist.length, 0)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Rocket className="w-6 h-6 text-primary" />Product Pipeline</h1>
          <p className="text-sm text-muted-foreground">Siga o fluxo completo: Discovery → Handoff</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Progresso geral:</span>
          <Progress value={overallProgress} className="w-32 h-2" />
          <span className="text-xs font-bold">{overallProgress}%</span>
        </div>
      </div>

      {/* Steps bar */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((s, idx) => {
          const checked = s.checklist.filter(c => checklistState[c.key]).length;
          const isDone = checked === s.checklist.length;
          const isCurrent = idx === currentStep;
          return (
            <button key={s.id} onClick={() => goToStep(idx)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-all ${isCurrent ? "bg-primary text-primary-foreground" : isDone ? "bg-green-500/10 text-green-700" : "bg-secondary text-muted-foreground hover:bg-accent"}`}>
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{s.title}</span>
              {isDone && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Current step detail */}
      {step && (
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
              <Badge variant={stepProgress === 100 ? "default" : "secondary"}>{stepProgress}%</Badge>
            </div>
            <Progress value={stepProgress} className="mt-3 h-1.5" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {step.checklist.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={!!checklistState[item.key]} onCheckedChange={() => toggleCheck(item.key)} />
                    <span className={`text-sm ${checklistState[item.key] ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
                  </div>
                  {item.route && (
                    <Button variant="ghost" size="sm" onClick={() => navigate(item.route!)} className="text-xs shrink-0">
                      Ir para módulo <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={currentStep === 0} onClick={() => goToStep(currentStep - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />Etapa anterior
        </Button>
        <AIGenerateButton prompt={`Estou na etapa "${step?.title}" do pipeline de produto. Analise o que já foi preenchido e gere automaticamente os artefatos pendentes desta fase. Use as ferramentas específicas para cada módulo.`} label="Preencher fase com IA" invalidateKeys={PIPELINE_STEPS.flatMap(s => s.checklist.map(c => [c.key]))} size="sm" />
        <Button disabled={currentStep === PIPELINE_STEPS.length - 1} onClick={() => goToStep(currentStep + 1)}>
          Próxima etapa<ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
