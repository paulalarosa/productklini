import { useState, useCallback } from "react";
import {
  Palette, Type, Layers, Box, Square, ToggleLeft, CreditCard, AlertCircle,
  ChevronRight, ChevronDown, Sparkles, Copy, Check, Eye, X, Loader2,
  Accessibility, Code2, Zap, BarChart3, Shield, Lightbulb,
  MousePointer, AlignLeft, Grid3X3, Droplets, SunMedium,
  CircleDot, RectangleHorizontal, BadgeCheck, ListFilter, FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ---- Types ----
type DSCategory = "foundations" | "components" | "patterns" | "ai-analysis";
type ComponentVariant = "default" | "primary" | "secondary" | "destructive" | "outline" | "ghost";
type ComponentSize = "sm" | "md" | "lg";
type ComponentState = "default" | "hover" | "active" | "disabled" | "focus";

interface DSNavItem {
  label: string;
  icon: React.ElementType;
  id: string;
  children?: { label: string; id: string }[];
}

interface AIInsight {
  type: "accessibility" | "optimization" | "usage";
  severity: "warning" | "info" | "success";
  title: string;
  description: string;
  action?: string;
}

// ---- Navigation Structure ----
const DS_NAV: { category: DSCategory; title: string; items: DSNavItem[] }[] = [
  {
    category: "foundations",
    title: "Fundamentos",
    items: [
      { label: "Cores (Tokens)", icon: Droplets, id: "colors" },
      { label: "Tipografia", icon: Type, id: "typography" },
      { label: "Espaçamento", icon: Grid3X3, id: "spacing" },
      { label: "Sombras", icon: SunMedium, id: "shadows" },
    ],
  },
  {
    category: "components",
    title: "Componentes",
    items: [
      { label: "Botões", icon: ToggleLeft, id: "buttons", children: [
        { label: "Primary", id: "btn-primary" },
        { label: "Secondary", id: "btn-secondary" },
        { label: "Destructive", id: "btn-destructive" },
        { label: "Ghost", id: "btn-ghost" },
      ]},
      { label: "Inputs", icon: AlignLeft, id: "inputs" },
      { label: "Cards", icon: CreditCard, id: "cards" },
      { label: "Badges", icon: BadgeCheck, id: "badges" },
      { label: "Modais", icon: Square, id: "modals" },
      { label: "Dropdowns", icon: ListFilter, id: "dropdowns" },
    ],
  },
  {
    category: "patterns",
    title: "Padrões",
    items: [
      { label: "Cabeçalhos", icon: RectangleHorizontal, id: "headers" },
      { label: "Rodapés", icon: RectangleHorizontal, id: "footers" },
      { label: "Forms de Login", icon: MousePointer, id: "login-forms" },
    ],
  },
  {
    category: "ai-analysis",
    title: "Análise de IA",
    items: [
      { label: "Consistência", icon: Shield, id: "consistency" },
      { label: "Acessibilidade (WCAG)", icon: Accessibility, id: "wcag" },
    ],
  },
];

// ---- Mock Data ----
const BUTTON_VARIANTS: Record<string, { bg: string; text: string; border?: string }> = {
  primary: { bg: "gradient-primary", text: "text-primary-foreground" },
  secondary: { bg: "bg-secondary", text: "text-secondary-foreground" },
  destructive: { bg: "bg-destructive", text: "text-destructive-foreground" },
  outline: { bg: "bg-transparent", text: "text-foreground", border: "border border-border" },
  ghost: { bg: "bg-transparent", text: "text-foreground" },
};

const MOCK_CODE: Record<string, string> = {
  react: `import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 rounded-md px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({ variant, size, children, ...props }) {
  return (
    <button className={buttonVariants({ variant, size })} {...props}>
      {children}
    </button>
  );
}`,
  vue: `<template>
  <button :class="buttonClasses" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
});

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-8 text-base' };
  return \`\${base} \${variants[props.variant]} \${sizes[props.size]}\`;
});
</script>`,
  html: `<!-- Primary Button -->
<button class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
  Button
</button>

<!-- Secondary Button -->
<button class="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
  Button
</button>`,
};

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    type: "accessibility",
    severity: "warning",
    title: "Contraste insuficiente no estado Disabled",
    description: "O contraste da cor do texto no botão 'Disabled' está em 2.5:1. O recomendado pelo WCAG AA é 4.5:1.",
    action: "Corrigir Automaticamente",
  },
  {
    type: "optimization",
    severity: "info",
    title: "Oportunidade de refatoração",
    description: "Sugestão: Transformar as classes Tailwind deste botão em um componente reutilizável com cva (Class Variance Authority) para melhor manutenção.",
    action: "Gerar Código",
  },
  {
    type: "usage",
    severity: "success",
    title: "Uso no projeto",
    description: "Este componente está sendo usado atualmente em 14 telas ativas e 3 fluxos de usuário.",
  },
  {
    type: "accessibility",
    severity: "info",
    title: "Atributo aria-label",
    description: "Considere adicionar aria-label em botões que contêm apenas ícones para melhor acessibilidade por leitores de tela.",
    action: "Adicionar aria-label",
  },
];

const COLOR_TOKENS = [
  { name: "--background", value: "228 14% 8%", label: "Background" },
  { name: "--foreground", value: "210 20% 92%", label: "Foreground" },
  { name: "--primary", value: "252 80% 65%", label: "Primary" },
  { name: "--secondary", value: "228 12% 16%", label: "Secondary" },
  { name: "--muted", value: "228 10% 14%", label: "Muted" },
  { name: "--accent", value: "228 12% 18%", label: "Accent" },
  { name: "--destructive", value: "0 72% 55%", label: "Destructive" },
  { name: "--status-discovery", value: "214 90% 60%", label: "Discovery" },
  { name: "--status-define", value: "270 70% 60%", label: "Define" },
  { name: "--status-develop", value: "160 70% 50%", label: "Develop" },
  { name: "--status-deliver", value: "40 90% 60%", label: "Deliver" },
];

const insightIcons: Record<string, React.ElementType> = {
  accessibility: Accessibility,
  optimization: Zap,
  usage: BarChart3,
};

const severityColors: Record<string, string> = {
  warning: "border-status-deliver/30 bg-status-deliver/5",
  info: "border-status-discovery/30 bg-status-discovery/5",
  success: "border-status-develop/30 bg-status-develop/5",
};

const severityTextColors: Record<string, string> = {
  warning: "text-status-deliver",
  info: "text-status-discovery",
  success: "text-status-develop",
};

// ---- Main Component ----
export function DesignSystemHub() {
  const [activeItem, setActiveItem] = useState("buttons");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ components: true, foundations: true });
  const [variant, setVariant] = useState<ComponentVariant>("primary");
  const [size, setSize] = useState<ComponentSize>("md");
  const [state, setState] = useState<ComponentState>("default");
  const [codeTab, setCodeTab] = useState<"specs" | "react" | "vue" | "html">("specs");
  const [copied, setCopied] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  const toggleCategory = (cat: string) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  const copyCode = () => {
    const code = MOCK_CODE[codeTab] || "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setGenLoading(true);
    // Simulated generation
    await new Promise(r => setTimeout(r, 2000));
    setGenLoading(false);
    setShowGenModal(false);
    toast.success("Componente gerado! Disponível em 'Componentes > Custom'");
    setGenPrompt("");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-lg border border-border">
      {/* ====== LEFT: DS Navigation ====== */}
      <div className="w-[220px] flex flex-col bg-card border-r border-border shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Design System</span>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-status-develop/20 text-status-develop font-semibold">v2.1</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {DS_NAV.map((group) => (
            <div key={group.category}>
              <button
                onClick={() => toggleCategory(group.category)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {group.title}
                {expanded[group.category] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {expanded[group.category] && (
                <div className="space-y-0.5 ml-1">
                  {group.items.map((item) => (
                    <div key={item.id}>
                      <button
                        onClick={() => setActiveItem(item.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors ${
                          activeItem === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </button>
                      {item.children && activeItem === item.id && (
                        <div className="ml-6 space-y-0.5 mt-0.5">
                          {item.children.map((child) => (
                            <button key={child.id} onClick={() => setActiveItem(child.id)}
                              className="w-full text-left px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ====== CENTER: Main Canvas ====== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">Primary Button</h2>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-status-develop/20 text-status-develop font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" /> Aprovado para Dev
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-[10px] font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3 h-3" />
              Gerar Novo Componente com IA
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Playground */}
          {activeItem.startsWith("btn") || activeItem === "buttons" ? (
            <>
              {/* Live Preview */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-primary" /> Live Preview
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Variant selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground">Variant:</span>
                      {(["primary", "secondary", "destructive", "outline", "ghost"] as ComponentVariant[]).map((v) => (
                        <button key={v} onClick={() => setVariant(v)}
                          className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${variant === v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                    {/* Size selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground">Size:</span>
                      {(["sm", "md", "lg"] as ComponentSize[]).map((s) => (
                        <button key={s} onClick={() => setSize(s)}
                          className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${size === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {/* State selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground">State:</span>
                      {(["default", "hover", "active", "disabled", "focus"] as ComponentState[]).map((st) => (
                        <button key={st} onClick={() => setState(st)}
                          className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${state === st ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview area */}
                <div className="rounded-lg p-12 flex items-center justify-center" style={{
                  backgroundImage: "radial-gradient(circle, hsl(228, 10%, 16%) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                  backgroundColor: "hsl(228, 14%, 8%)",
                }}>
                  <ButtonPreview variant={variant} size={size} state={state} />
                </div>
              </div>

              {/* Code Tabs */}
              <div className="glass-card overflow-hidden">
                <div className="flex border-b border-border">
                  {([
                    { key: "specs", label: "Design Specs", icon: Layers },
                    { key: "react", label: "React Code", icon: FileCode },
                    { key: "vue", label: "Vue Code", icon: FileCode },
                    { key: "html", label: "HTML/Tailwind", icon: Code2 },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setCodeTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-medium transition-colors border-b-2 ${
                        codeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                  {codeTab !== "specs" && (
                    <button onClick={copyCode} className="ml-auto mr-3 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <Check className="w-3 h-3 text-status-develop" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {codeTab === "specs" ? (
                    <DesignSpecs variant={variant} size={size} />
                  ) : (
                    <pre className="text-xs text-foreground/90 font-mono leading-relaxed overflow-x-auto">
                      <code>{MOCK_CODE[codeTab]}</code>
                    </pre>
                  )}
                </div>
              </div>
            </>
          ) : activeItem === "colors" ? (
            <ColorsView />
          ) : activeItem === "typography" ? (
            <TypographyView />
          ) : activeItem === "wcag" ? (
            <WCAGView />
          ) : (
            <div className="glass-card p-12 text-center">
              <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Selecione um componente à esquerda para visualizar</p>
            </div>
          )}
        </div>
      </div>

      {/* ====== RIGHT: AI QA Panel ====== */}
      <div className="w-[280px] flex flex-col bg-card border-l border-border shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Inspetor Inteligente
          </h3>
          <p className="text-[9px] text-muted-foreground mt-0.5">Análise de IA do componente selecionado</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {MOCK_AI_INSIGHTS.map((insight, i) => {
            const Icon = insightIcons[insight.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-lg border p-3 ${severityColors[insight.severity]}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${severityTextColors[insight.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-foreground">{insight.title}</p>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <button className="mt-2 text-[9px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {insight.action}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Quick stats */}
          <div className="glass-card p-3 mt-4">
            <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Estatísticas</h4>
            <div className="space-y-2">
              {[
                { label: "Telas usando", value: "14", color: "text-status-discovery" },
                { label: "Variantes", value: "5", color: "text-status-define" },
                { label: "WCAG Score", value: "AA", color: "text-status-develop" },
                { label: "Bundle size", value: "1.2kb", color: "text-muted-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                  <span className={`text-[10px] font-semibold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowGenModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] glass-card rounded-xl p-6 border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Gerar Componente com IA
                </h3>
                <button onClick={() => setShowGenModal(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Descreva o componente que você precisa adicionar ao Design System...</p>
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Ex: Um card de notificação com ícone, título, mensagem e botão de dismiss. Deve suportar 4 variantes: info, success, warning, error."
                rows={4}
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none border border-border focus:border-primary/50 transition-colors"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setShowGenModal(false)} className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={genLoading || !genPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {genLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {genLoading ? "Gerando..." : "Gerar Componente"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Sub Components ----

function ButtonPreview({ variant, size, state }: { variant: ComponentVariant; size: ComponentSize; state: ComponentState }) {
  const sizeClasses = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-8 text-base" };
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        disabled={state === "disabled"}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${v.bg} ${v.text} ${v.border || ""} ${sizeClasses[size]} ${
          state === "disabled" ? "opacity-50 cursor-not-allowed" :
          state === "hover" ? "ring-2 ring-primary/30" :
          state === "active" ? "scale-95" :
          state === "focus" ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""
        }`}
      >
        Button
      </button>

      {/* Show all variants row */}
      <div className="flex items-center gap-3">
        {Object.entries(BUTTON_VARIANTS).map(([key, val]) => (
          <button key={key} className={`inline-flex items-center justify-center rounded-md font-medium text-xs px-3 h-8 transition-colors ${val.bg} ${val.text} ${val.border || ""}`}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}

function DesignSpecs({ variant, size }: { variant: string; size: string }) {
  const specs = {
    sm: { height: "32px", paddingX: "12px", fontSize: "12px", borderRadius: "6px" },
    md: { height: "40px", paddingX: "16px", fontSize: "14px", borderRadius: "6px" },
    lg: { height: "48px", paddingX: "32px", fontSize: "16px", borderRadius: "6px" },
  };
  const s = specs[size as keyof typeof specs] || specs.md;

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(s).map(([key, val]) => (
        <div key={key} className="bg-secondary/50 rounded-lg p-3">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</span>
          <p className="text-sm font-mono font-semibold text-foreground mt-1">{val}</p>
        </div>
      ))}
      <div className="bg-secondary/50 rounded-lg p-3">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">variant</span>
        <p className="text-sm font-mono font-semibold text-foreground mt-1">{variant}</p>
      </div>
      <div className="bg-secondary/50 rounded-lg p-3">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">font weight</span>
        <p className="text-sm font-mono font-semibold text-foreground mt-1">500 (Medium)</p>
      </div>
    </div>
  );
}

function ColorsView() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-4">Design Tokens — Cores</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLOR_TOKENS.map((token) => (
            <div key={token.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="w-10 h-10 rounded-lg border border-border shrink-0" style={{ backgroundColor: `hsl(${token.value})` }} />
              <div>
                <p className="text-[10px] font-semibold text-foreground">{token.label}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{token.name}</p>
                <p className="text-[8px] font-mono text-muted-foreground/60">{token.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypographyView() {
  const scales = [
    { name: "Display", class: "text-4xl font-bold", size: "36px", weight: "700" },
    { name: "Heading 1", class: "text-2xl font-bold", size: "24px", weight: "700" },
    { name: "Heading 2", class: "text-xl font-semibold", size: "20px", weight: "600" },
    { name: "Heading 3", class: "text-lg font-semibold", size: "18px", weight: "600" },
    { name: "Body", class: "text-sm font-normal", size: "14px", weight: "400" },
    { name: "Small", class: "text-xs font-normal", size: "12px", weight: "400" },
    { name: "Caption", class: "text-[10px] font-medium", size: "10px", weight: "500" },
  ];

  return (
    <div className="glass-card p-5 space-y-6">
      <h3 className="text-xs font-semibold text-foreground">Escala Tipográfica — Inter</h3>
      {scales.map((s) => (
        <div key={s.name} className="flex items-baseline justify-between border-b border-border/30 pb-3">
          <div>
            <p className={`text-foreground ${s.class}`}>Aa Bb Cc Dd Ee</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-[10px] font-semibold text-foreground">{s.name}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{s.size} / {s.weight}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WCAGView() {
  const checks = [
    { label: "Contraste Texto Normal", status: "pass", ratio: "7.2:1", min: "4.5:1" },
    { label: "Contraste Texto Grande", status: "pass", ratio: "7.2:1", min: "3:1" },
    { label: "Contraste Botão Primary", status: "pass", ratio: "8.1:1", min: "4.5:1" },
    { label: "Contraste Botão Disabled", status: "fail", ratio: "2.5:1", min: "4.5:1" },
    { label: "Focus Indicator", status: "pass", ratio: "—", min: "Visível" },
    { label: "Touch Target (48px)", status: "warning", ratio: "40px", min: "48px" },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Accessibility className="w-4 h-4 text-primary" />
          Relatório WCAG 2.1 — Nível AA
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-deliver/20 text-status-deliver font-semibold">4/6 pass</span>
      </div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${check.status === "pass" ? "bg-status-develop" : check.status === "fail" ? "bg-destructive" : "bg-status-deliver"}`} />
              <span className="text-[10px] text-foreground">{check.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-muted-foreground">Atual: {check.ratio}</span>
              <span className="text-[9px] font-mono text-muted-foreground/50">Min: {check.min}</span>
              <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                check.status === "pass" ? "bg-status-develop/20 text-status-develop" :
                check.status === "fail" ? "bg-destructive/20 text-destructive" :
                "bg-status-deliver/20 text-status-deliver"
              }`}>
                {check.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
