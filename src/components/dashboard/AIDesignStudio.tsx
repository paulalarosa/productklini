import { useState, useCallback } from "react";
import {
  Sparkles, Send, History, Wand2, Users, Route, CreditCard, LayoutDashboard,
  Loader2, Code2, Save, Pencil, FileDown, ChevronRight, Compass, Blocks,
  Map, UserCircle, GitBranch, ArrowRight, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// ---- Types ----
type StudioMode = "ux-pilot" | "ui-make";

interface Iteration {
  id: string;
  mode: StudioMode;
  prompt: string;
  result: any;
  timestamp: Date;
  savedToDS?: boolean;
}

const PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

// ---- Loading Messages ----
const UX_LOADING_MSGS = [
  "Analisando requisitos de UX...",
  "Mapeando jornadas de usuário...",
  "Gerando personas realistas...",
  "Estruturando fluxos de interação...",
];

const UI_LOADING_MSGS = [
  "Analisando requisitos visuais...",
  "Gerando wireframes base...",
  "Renderizando componentes Tailwind...",
  "Montando código React...",
];

// ---- Quick Chips ----
const UX_CHIPS = [
  { label: "Criar Persona", icon: UserCircle, prompt: "Crie uma persona detalhada para um app de delivery de comida, incluindo demographics, goals, pain points e behaviors" },
  { label: "Gerar Fluxo de Login", icon: GitBranch, prompt: "Gere um fluxo completo de login/cadastro para um app mobile, incluindo login social, recuperação de senha e onboarding" },
  { label: "Mapa de Jornada", icon: Map, prompt: "Crie um mapa de jornada do usuário para um e-commerce de roupas, desde a descoberta até a compra e pós-venda" },
  { label: "Sitemap", icon: Compass, prompt: "Gere um sitemap completo para um SaaS de gestão de projetos com áreas de dashboard, projetos, equipe e configurações" },
];

const UI_CHIPS = [
  { label: "Pricing Table", icon: CreditCard, prompt: "Gere um componente de Pricing Table moderno com 3 planos (Free, Pro, Enterprise) estilo SaaS com toggle mensal/anual" },
  { label: "Dashboard Analytics", icon: LayoutDashboard, prompt: "Crie um card de Dashboard Analytics com gráfico de receita, métricas KPI e lista de atividades recentes" },
  { label: "Card de Perfil", icon: Users, prompt: "Gere um card de perfil de usuário com avatar, informações, estatísticas e botão de ação" },
  { label: "Hero Section", icon: Blocks, prompt: "Crie uma Hero Section moderna para landing page SaaS com headline, subtítulo, CTA e imagem ilustrativa" },
];

// ---- Emotion colors ----
const emotionColors: Record<string, { bg: string; text: string; emoji: string }> = {
  happy: { bg: "bg-status-develop/20", text: "text-status-develop", emoji: "😊" },
  satisfied: { bg: "bg-status-discovery/20", text: "text-status-discovery", emoji: "😌" },
  neutral: { bg: "bg-secondary", text: "text-muted-foreground", emoji: "😐" },
  confused: { bg: "bg-status-deliver/20", text: "text-status-deliver", emoji: "😕" },
  frustrated: { bg: "bg-destructive/20", text: "text-destructive", emoji: "😤" },
};

const flowNodeColors: Record<string, string> = {
  start: "bg-status-develop text-status-develop",
  end: "bg-destructive text-destructive",
  action: "bg-status-discovery text-status-discovery",
  decision: "bg-status-deliver text-status-deliver",
  screen: "bg-status-define text-status-define",
};

// ---- Save to DS Hub ----
async function saveComponentToDS(result: any, prompt: string) {
  const { error } = await supabase.from("ds_components" as any).insert([{
    project_id: PROJECT_ID,
    name: result.component_name || "Componente sem nome",
    description: result.description || prompt,
    category: "components",
    code_react: result.code || "",
    code_vue: "",
    code_html: "",
    preview_elements: result.preview_elements || [],
    specs: {},
    status: "draft",
    source: "ai-studio",
  }]);
  if (error) {
    console.error("Error saving to DS:", error);
    throw error;
  }
}

// ---- Main Component ----
export function AIDesignStudio() {
  const [mode, setMode] = useState<StudioMode>("ux-pilot");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savingToDS, setSavingToDS] = useState(false);

  const chips = mode === "ux-pilot" ? UX_CHIPS : UI_CHIPS;
  const loadingMsgs = mode === "ux-pilot" ? UX_LOADING_MSGS : UI_LOADING_MSGS;

  const currentIterationSaved = iterations.length > 0 && iterations[0]?.savedToDS;

  const generate = useCallback(async (inputPrompt?: string) => {
    const text = inputPrompt || prompt;
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setLoadingStep(0);
    setShowCode(false);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMsgs.length);
    }, 1800);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/design-studio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: text, mode }),
      });

      clearInterval(interval);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || `Erro ${resp.status}`);
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      setResult(data.result);

      const iteration: Iteration = {
        id: Date.now().toString(),
        mode,
        prompt: text,
        result: data.result,
        timestamp: new Date(),
        savedToDS: false,
      };

      // Auto-save UI Make components to DS Hub
      if (mode === "ui-make" && data.result?.component_name) {
        try {
          await saveComponentToDS(data.result, text);
          iteration.savedToDS = true;
          toast.success("Componente gerado e salvo no Design System!");
        } catch {
          toast.success("Componente gerado! (Falha ao salvar no DS Hub)");
        }
      } else {
        toast.success("Gerado com sucesso!");
      }

      setIterations((prev) => [iteration, ...prev]);
    } catch {
      clearInterval(interval);
      toast.error("Erro ao gerar artefato");
    }

    setIsLoading(false);
  }, [prompt, mode, isLoading, loadingMsgs.length]);

  const manualSaveToDS = useCallback(async () => {
    if (!result || savingToDS) return;
    setSavingToDS(true);
    try {
      await saveComponentToDS(result, prompt);
      setIterations(prev => prev.map((it, i) => i === 0 ? { ...it, savedToDS: true } : it));
      toast.success("Salvo no Design System Hub!");
    } catch {
      toast.error("Erro ao salvar no DS Hub");
    }
    setSavingToDS(false);
  }, [result, prompt, savingToDS]);

  const restoreIteration = (iter: Iteration) => {
    setMode(iter.mode);
    setPrompt(iter.prompt);
    setResult(iter.result);
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      generate();
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 overflow-hidden rounded-lg border border-border">
      {/* ====== LEFT PANEL: Command Center (30%) ====== */}
      <div className="w-[30%] min-w-[300px] flex flex-col bg-card border-r border-border">
        {/* Mode Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setMode("ux-pilot"); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mode === "ux-pilot"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            UX Pilot
          </button>
          <button
            onClick={() => { setMode("ui-make"); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mode === "ui-make"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <Blocks className="w-3.5 h-3.5" />
            UI Make
          </button>
        </div>

        {/* Mode Description */}
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[11px] text-muted-foreground">
            {mode === "ux-pilot"
              ? "Gere personas, mapas de jornada, fluxos de usuário e conceitos de wireframe com IA."
              : "Gere componentes de UI com código React + Tailwind. Componentes são salvos automaticamente no Design System Hub."}
          </p>
        </div>

        {/* Prompt Area */}
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="relative flex-1 min-h-0">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "ux-pilot"
                ? "Descreva o artefato de UX que quer gerar...\nEx: Crie uma persona para um app de fitness"
                : "Descreva o componente que quer criar...\nEx: Um card de pricing com 3 planos"}
              className="w-full h-full min-h-[120px] bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none resize-none font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={() => generate()}
              disabled={isLoading || !prompt.trim()}
              className="absolute bottom-3 right-3 p-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[9px] text-muted-foreground/50">⌘+Enter para enviar</p>

          {/* Quick Chips */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atalhos Rápidos</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => { setPrompt(chip.prompt); generate(chip.prompt); }}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <chip.icon className="w-3 h-3" />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History Toggle */}
        <div className="border-t border-border">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/30 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3 h-3" />
              Histórico ({iterations.length})
            </span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showHistory ? "rotate-90" : ""}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto", maxHeight: 200 }}
                exit={{ height: 0 }}
                className="overflow-y-auto border-t border-border/50"
              >
                {iterations.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma iteração ainda</p>
                ) : (
                  iterations.map((iter) => (
                    <button
                      key={iter.id}
                      onClick={() => restoreIteration(iter)}
                      className="w-full text-left px-4 py-2 border-b border-border/30 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${iter.mode === "ux-pilot" ? "bg-status-discovery/20 text-status-discovery" : "bg-status-define/20 text-status-define"}`}>
                          {iter.mode === "ux-pilot" ? "UX" : "UI"}
                        </span>
                        {iter.savedToDS && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-status-develop/20 text-status-develop">DS</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {iter.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground mt-0.5 truncate">{iter.prompt}</p>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ====== RIGHT PANEL: Canvas (70%) ====== */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Canvas Header */}
        {result && (
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {result.title || result.component_name || "Resultado"}
              </span>
              <span className="text-[9px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                {mode === "ux-pilot" ? result.artifact_type : "component"}
              </span>
              {mode === "ui-make" && currentIterationSaved && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-status-develop/20 text-status-develop flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> No DS Hub
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {mode === "ui-make" && result.code && (
                <button
                  onClick={() => setShowCode(!showCode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ${showCode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  <Code2 className="w-3 h-3" />
                  {showCode ? "Preview" : "Ver Código"}
                </button>
              )}
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <FileDown className="w-3 h-3" />
                Exportar
              </button>
              {mode === "ui-make" && !currentIterationSaved && (
                <button
                  onClick={manualSaveToDS}
                  disabled={savingToDS}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md gradient-primary text-primary-foreground text-[10px] hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {savingToDS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Salvar no Design System
                </button>
              )}
            </div>
          </div>
        )}

        {/* Canvas Content */}
        <div className="flex-1 overflow-auto relative">
          {/* Grid Background */}
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle, hsl(228, 10%, 18%) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          <div className="relative z-10 p-6 min-h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {/* Loading State */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center ai-glow">
                      <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Gerando...</p>
                      <motion.p
                        key={loadingStep}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-primary"
                      >
                        {loadingMsgs[loadingStep]}
                      </motion.p>
                    </div>
                  </div>

                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="glass-card p-5 space-y-3"
                    >
                      <div className="h-4 bg-secondary rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-secondary/70 rounded w-2/3 animate-pulse" />
                      <div className="h-3 bg-secondary/50 rounded w-1/2 animate-pulse" />
                      <div className="flex gap-2 mt-2">
                        <div className="h-8 bg-secondary/60 rounded-lg w-20 animate-pulse" />
                        <div className="h-8 bg-secondary/60 rounded-lg w-20 animate-pulse" />
                        <div className="h-8 bg-secondary/60 rounded-lg w-20 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Empty State */}
              {!isLoading && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center opacity-40">
                    {mode === "ux-pilot" ? <Compass className="w-8 h-8 text-primary-foreground" /> : <Blocks className="w-8 h-8 text-primary-foreground" />}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground/40 mb-1">
                    {mode === "ux-pilot" ? "UX Pilot" : "UI Make"}
                  </h3>
                  <p className="text-sm text-muted-foreground/60">
                    Descreva o que vamos construir hoje
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 mt-2">
                    Use os atalhos rápidos ou escreva seu prompt à esquerda
                  </p>
                </motion.div>
              )}

              {/* UX Pilot Result */}
              {!isLoading && result && mode === "ux-pilot" && (
                <motion.div
                  key="ux-result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-4xl"
                >
                  {result.artifact_type === "persona" && <PersonaView data={result.data} title={result.title} description={result.description} />}
                  {result.artifact_type === "journey_map" && <JourneyMapView data={result.data} title={result.title} description={result.description} />}
                  {result.artifact_type === "user_flow" && <UserFlowView data={result.data} title={result.title} description={result.description} />}
                  {result.artifact_type === "sitemap" && <SitemapView data={result.data} title={result.title} description={result.description} />}
                  {result.artifact_type === "wireframe_concept" && <WireframeConceptView data={result.data} title={result.title} description={result.description} />}
                </motion.div>
              )}

              {/* UI Make Result */}
              {!isLoading && result && mode === "ui-make" && (
                <motion.div
                  key="ui-result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-4xl"
                >
                  {showCode ? (
                    <CodeView code={result.code} name={result.component_name} />
                  ) : (
                    <ComponentPreview elements={result.preview_elements} name={result.component_name} description={result.description} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Sub-Components ----

function PersonaView({ data, title, description }: { data: any; title: string; description: string }) {
  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <UserCircle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{data.name || title}</h2>
          <p className="text-xs text-muted-foreground">{data.role} {data.age ? `· ${data.age} anos` : ""}</p>
          <p className="text-sm text-secondary-foreground mt-1">{data.bio || description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-status-develop/5 border border-status-develop/20 rounded-lg p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-status-develop mb-2">🎯 Objetivos</h4>
          <ul className="space-y-1.5">
            {(data.goals || []).map((g: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="text-status-develop mt-0.5">•</span>{g}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-2">😤 Dores</h4>
          <ul className="space-y-1.5">
            {(data.pain_points || []).map((p: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="text-destructive mt-0.5">•</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-status-discovery/5 border border-status-discovery/20 rounded-lg p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-status-discovery mb-2">💡 Comportamentos</h4>
          <ul className="space-y-1.5">
            {(data.behaviors || []).map((b: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="text-status-discovery mt-0.5">•</span>{b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function JourneyMapView({ data, title, description }: { data: any; title: string; description: string }) {
  const stages = data.stages || [];
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {stages.map((stage: any, i: number) => {
          const emotion = emotionColors[stage.emotion] || emotionColors.neutral;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="min-w-[200px] glass-card p-4 flex flex-col gap-2 relative"
            >
              {i < stages.length - 1 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fase {i + 1}</span>
                <span className={`text-lg ${emotion.text}`}>{emotion.emoji}</span>
              </div>
              <h4 className="text-xs font-semibold text-foreground">{stage.name}</h4>
              <p className="text-[10px] text-muted-foreground">{stage.description}</p>
              <div className="space-y-1.5 mt-auto pt-2 border-t border-border/50">
                <div>
                  <span className="text-[8px] font-semibold uppercase text-muted-foreground/60">Touchpoint</span>
                  <p className="text-[10px] text-foreground">{stage.touchpoint}</p>
                </div>
                <div>
                  <span className="text-[8px] font-semibold uppercase text-muted-foreground/60">Ação</span>
                  <p className="text-[10px] text-foreground">{stage.action}</p>
                </div>
                {stage.opportunity && (
                  <div className="bg-primary/5 rounded px-2 py-1">
                    <span className="text-[8px] font-semibold uppercase text-primary">Oportunidade</span>
                    <p className="text-[10px] text-foreground">{stage.opportunity}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Emotion curve */}
      <div className="glass-card p-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Curva Emocional</h4>
        <div className="flex items-end gap-1 h-16">
          {stages.map((stage: any, i: number) => {
            const levels: Record<string, number> = { happy: 100, satisfied: 80, neutral: 50, confused: 30, frustrated: 10 };
            const h = levels[stage.emotion] || 50;
            const emotion = emotionColors[stage.emotion] || emotionColors.neutral;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`flex-1 rounded-t ${emotion.bg} relative group`}
                title={`${stage.name}: ${stage.emotion}`}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {emotionColors[stage.emotion]?.emoji}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {stages.map((stage: any, i: number) => (
            <span key={i} className="flex-1 text-[7px] text-muted-foreground text-center truncate">{stage.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserFlowView({ data, title, description }: { data: any; title: string; description: string }) {
  const steps = data.steps || [];
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="glass-card p-6 overflow-x-auto">
        <div className="flex flex-wrap gap-3 items-start justify-center">
          {steps.map((step: any, i: number) => {
            const color = flowNodeColors[step.type] || flowNodeColors.action;
            const isDecision = step.type === "decision";

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2"
              >
                <div className={`relative ${isDecision ? "rotate-0" : ""}`}>
                  <div className={`px-4 py-2.5 rounded-lg border-2 bg-card ${color.replace("text-", "border-")} min-w-[120px] text-center ${isDecision ? "transform rotate-0 border-dashed" : ""}`}>
                    <span className={`text-[8px] font-bold uppercase ${color.split(" ")[1]}`}>{step.type}</span>
                    <p className="text-[11px] font-medium text-foreground mt-0.5">{step.label}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SitemapView({ data, title, description }: { data: any; title: string; description: string }) {
  const pages = data.pages || [];
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {pages.map((page: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-border rounded-lg p-3 bg-card hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-foreground">{page.name}</span>
              </div>
              <p className="text-[9px] text-muted-foreground font-mono">{page.path}</p>
              {page.children && page.children.length > 0 && (
                <div className="mt-2 space-y-1 pl-3 border-l border-border/50">
                  {page.children.map((child: any, j: number) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      <span className="text-[9px] text-muted-foreground">{child.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WireframeConceptView({ data, title, description }: { data: any; title: string; description: string }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="bg-secondary/50 rounded-lg p-4">
        <pre className="text-xs text-foreground whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}

function ComponentPreview({ elements, name, description }: { elements: any[]; name: string; description: string }) {
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-sm font-bold text-foreground">{name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="glass-card p-2 rounded-lg" style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.3)" }}>
        <svg width="800" height="500" viewBox="0 0 800 500" className="w-full" style={{ background: "hsl(228, 14%, 10%)", borderRadius: "8px" }}>
          <defs>
            <pattern id="studio-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(228, 10%, 14%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="500" fill="url(#studio-grid)" />
          {(elements || []).map((el: any, i: number) => (
            <g key={i}>
              {el.type === "rect" && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={4} />}
              {el.type === "circle" && <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} />}
              {el.type === "text" && <text x={el.x} y={el.y + (el.fontSize || 14)} fill={el.fill} fontSize={el.fontSize || 14} fontFamily="Inter, sans-serif">{el.text}</text>}
              {el.type === "line" && <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={el.fill} strokeWidth={2} />}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function CodeView({ code, name }: { code: string; name: string }) {
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-foreground">{name}.tsx</span>
          </div>
          <button onClick={copyCode} className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors">
            Copiar
          </button>
        </div>
        <pre className="p-4 overflow-auto max-h-[500px] text-xs text-foreground/90 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
