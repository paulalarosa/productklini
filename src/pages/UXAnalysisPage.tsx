import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject, usePersonas, useUxMetrics, useTasks } from "@/hooks/useProjectData";
import { useBehaviorModels } from "@/hooks/useBehaviorModels";
import { useUXPatterns } from "@/hooks/useUXPatterns";
import { Sparkles, Loader2, Users, BrainCircuit, BarChart3, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/authHeaders";
import { getProjectId } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type AnalysisResult = { title: string; content: string; generatedAt: string };

export function UXAnalysisPage() {
  const { data: project } = useProject();
  const { data: personas } = usePersonas();
  const { data: metrics } = useUxMetrics();
  const { data: tasks } = useTasks();
  const { data: behaviorModels } = useBehaviorModels();
  const { data: patterns } = useUXPatterns();

  const [loading, setLoading] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});

  const runAnalysis = async (type: string, label: string) => {
    setLoading(type);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();

      const context = {
        project: { name: project?.name, description: project?.description, phase: project?.current_phase, progress: project?.progress },
        personas: personas?.map((p) => ({ name: p.name, role: p.role, goals: p.goals, pain_points: p.pain_points })) ?? [],
        metrics: metrics?.map((m) => ({ name: m.metric_name, score: m.score, previous: m.previous_score })) ?? [],
        tasks: {
          total: tasks?.length ?? 0,
          byStatus: tasks?.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {} as Record<string, number>) ?? {},
          byModule: tasks?.reduce((acc, t) => ({ ...acc, [t.module]: (acc[t.module] || 0) + 1 }), {} as Record<string, number>) ?? {},
        },
        behaviorModels: behaviorModels?.slice(0, 10).map((b) => ({
          behavior: b.behavior, motivation: b.motivation_score, ability: b.ability_score, prompt: b.prompt_score,
        })) ?? [],
        patterns: patterns?.slice(0, 10).map((p) => ({ name: p.name, category: p.category, type: p.pattern_type })) ?? [],
      };

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: `ai_ux_${type}`, content: JSON.stringify(context), project_id: projectId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro na análise");
      }

      const data = await resp.json();
      setAnalyses((prev) => ({
        ...prev,
        [type]: { title: label, content: data.result, generatedAt: new Date().toISOString() },
      }));
      toast.success(`${label} concluída!`);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Erro ao analisar");
    } finally {
      setLoading(null);
    }
  };

  const analysisTypes = [
    { key: "overview", label: "Visão Geral UX", icon: BarChart3, description: "Análise completa do estado atual do projeto" },
    { key: "personas", label: "Análise de Personas", icon: Users, description: "Gaps, oportunidades e sugestões de novas personas" },
    { key: "behavior", label: "Padrões de Comportamento", icon: BrainCircuit, description: "Análise do modelo de comportamento dos usuários" },
    { key: "improvements", label: "Sugestões de Melhoria", icon: Lightbulb, description: "Recomendações prioritizadas baseadas nos dados" },
    { key: "maturity", label: "Maturidade UX", icon: TrendingUp, description: "Nível de maturidade e roadmap de evolução" },
    { key: "risks", label: "Riscos e Gaps", icon: AlertTriangle, description: "Identificação de riscos e lacunas no projeto" },
  ];

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Análise UX com IA</h1>
        <p className="text-sm text-muted-foreground">
          Análise automática de personas, comportamentos e métricas — {personas?.length ?? 0} personas, {metrics?.length ?? 0} métricas, {tasks?.length ?? 0} tarefas
        </p>
      </div>

      {/* Analysis cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysisTypes.map(({ key, label, icon: Icon, description }) => (
          <Card key={key} className="group hover:border-primary/30 transition-colors">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={analyses[key] ? "outline" : "default"}
                  onClick={() => runAnalysis(key, label)}
                  disabled={loading !== null}
                  className="w-full gap-2"
                >
                  {loading === key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {analyses[key] ? "Reanalisar" : "Analisar"}
                </Button>
              </div>
              {analyses[key] && (
                <Badge variant="secondary" className="text-[10px]">
                  Gerado em {new Date(analyses[key].generatedAt).toLocaleTimeString("pt-BR")}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results */}
      {Object.keys(analyses).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-4 h-4 text-primary" /> Resultados da Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Object.keys(analyses)[Object.keys(analyses).length - 1]}>
              <TabsList className="flex-wrap h-auto gap-1">
                {Object.entries(analyses).map(([key, val]) => (
                  <TabsTrigger key={key} value={key} className="text-xs">{val.title}</TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(analyses).map(([key, val]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
                    <ReactMarkdown>{val.content}</ReactMarkdown>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
