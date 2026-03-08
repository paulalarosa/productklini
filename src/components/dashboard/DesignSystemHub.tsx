import { useState, useCallback, useEffect } from "react";
import {
  Palette, Type, Layers, Box, Square, ToggleLeft, CreditCard, AlertCircle,
  ChevronRight, ChevronDown, Sparkles, Copy, Check, Eye, X, Loader2,
  Accessibility, Code2, Zap, BarChart3, Shield, Lightbulb,
  MousePointer, AlignLeft, Grid3X3, Droplets, SunMedium,
  CircleDot, RectangleHorizontal, BadgeCheck, ListFilter, FileCode,
  Trash2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/authHeaders";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// ---- Types ----
type DSCategory = "foundations" | "components" | "patterns" | "ai-analysis" | "flutter-core";

interface DSNavItem {
  label: string;
  icon: React.ElementType;
  id: string;
  children?: { label: string; id: string }[];
}

interface DSComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  code_react: string;
  code_vue: string;
  code_html: string;
  preview_elements: any[];
  specs: any;
  status: string;
  source: string;
  created_at: string;
}

import { getProjectId } from "@/lib/api";

// ---- Static Navigation ----
const STATIC_NAV: { category: DSCategory; title: string; items: DSNavItem[] }[] = [
  {
    category: "foundations",
    title: "Fundamentos",
    items: [
      { label: "Cores (Tokens)", icon: Droplets, id: "colors" },
      { label: "Tipografia", icon: Type, id: "typography" },
      { label: "Espaçamento", icon: Grid3X3, id: "spacing" },
      { label: "Sombras", icon: SunMedium, id: "shadows" },
      { label: "Histórico Tokens", icon: ListFilter, id: "token-history" },
    ],
  },
  {
    category: "flutter-core",
    title: "Flutter Core",
    items: [
      { label: "Tipografia (TextTheme)", icon: Type, id: "flutter-text-theme" },
      { label: "Cores (ColorScheme)", icon: Droplets, id: "flutter-color-scheme" },
      { label: "Nativos Customizados", icon: Box, id: "flutter-native-components" },
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

const insightIcons: Record<string, React.ElementType> = {
  accessibility: Accessibility,
  optimization: Zap,
  usage: BarChart3,
};

// ---- Flutter Code Generators ----
function generateFlutterWidget(comp: DSComponent): string {
  const className = comp.name.replace(/\s+/g, '');
  return `import 'package:flutter/material.dart';

class ${className} extends StatelessWidget {
  final String? label;
  final VoidCallback? onPressed;
  final bool isLoading;

  const ${className}({
    super.key,
    this.label,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 14,
            ),
            child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text(
                  label ?? '${comp.name}',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
          ),
        ),
      ),
    );
  }
}`;
}

function generateThemeData(comp: DSComponent): string {
  return `// ThemeData config for ${comp.name}
// Cole no seu arquivo theme.dart

import 'package:flutter/material.dart';

final appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF6366F1),  // --primary
    brightness: Brightness.dark,
    surface: const Color(0xFF131620),     // --background
    onSurface: const Color(0xFFE2E8F0),  // --foreground
    primary: const Color(0xFF818CF8),     // --primary
    onPrimary: const Color(0xFFFFFFFF),
    secondary: const Color(0xFF1E2130),   // --secondary
    error: const Color(0xFFEF4444),       // --destructive
  ),
  textTheme: const TextTheme(
    headlineLarge: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.5,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      height: 1.5,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
  ),
  cardTheme: CardThemeData(
    color: const Color(0xFF1E2130),
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(color: Colors.white.withOpacity(0.06)),
    ),
  ),
);`;
}

function generateDesignSpecs(comp: DSComponent): string {
  return `// Design Specs — ${comp.name}
// ─────────────────────────────────────

📐 Dimensões:
   Padding Horizontal: 24dp
   Padding Vertical:   14dp
   Border Radius:      12dp
   Min Height:         48dp

🎨 Cores:
   Background:  Linear Gradient (Primary → Primary/80%)
   Text:        OnPrimary (#FFFFFF)
   Shadow:      Primary @ 30% opacity, blur 12dp, offset (0, 4)

📝 Tipografia:
   Font:        labelLarge (14sp, w600)
   Tracking:    0.1

🔄 Estados:
   Default:     Gradient + Shadow
   Pressed:     Ripple InkWell (Material)
   Loading:     CircularProgressIndicator (20x20, stroke 2)
   Disabled:    opacity 0.5, onTap null

📱 Responsividade:
   Mobile:      Full width (stretch)
   Tablet+:     Wrap content

♿ Acessibilidade:
   Semantics:   Button role
   Min target:  48x48dp
   Contrast:    Verificar ratio ≥ 4.5:1`;
}

// ---- Main Component ----
export function DesignSystemHub() {
  const [activeItem, setActiveItem] = useState("colors");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ components: true, foundations: true });
  const [codeTab, setCodeTab] = useState<"preview" | "flutter" | "theme" | "specs">("preview");
  const [copied, setCopied] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [components, setComponents] = useState<DSComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<DSComponent | null>(null);

  const toggleCategory = (cat: string) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  // Load components from DB
  const loadComponents = useCallback(async () => {
    setLoadingComponents(true);
    const projectId = await getProjectId();
    const { data, error } = await supabase
      .from("ds_components" as any)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (data) {
      setComponents(data as unknown as DSComponent[]);
    }
    if (error) console.error("Error loading DS components:", error);
    setLoadingComponents(false);
  }, []);

  useEffect(() => { loadComponents(); }, [loadComponents]);

  const selectComponent = (comp: DSComponent) => {
    setSelectedComponent(comp);
    setActiveItem(`comp-${comp.id}`);
    setCodeTab("preview");
  };

  const deleteComponent = async (id: string) => {
    const { error } = await supabase.from("ds_components" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao deletar"); return; }
    toast.success("Componente removido");
    if (selectedComponent?.id === id) { setSelectedComponent(null); setActiveItem("colors"); }
    loadComponents();
  };

  const updateComponentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("ds_components" as any).update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success(`Status: ${status}`);
    loadComponents();
    if (selectedComponent?.id === id) setSelectedComponent(prev => prev ? { ...prev, status } : null);
  };

  const copyCode = () => {
    if (!selectedComponent) return;
    const code = codeTab === "flutter" ? generateFlutterWidget(selectedComponent) : codeTab === "theme" ? generateThemeData(selectedComponent) : codeTab === "specs" ? generateDesignSpecs(selectedComponent) : "";
    if (!code) { toast.error("Sem código disponível"); return; }
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const exportPubspec = () => {
    if (!selectedComponent) return;
    const yaml = `# Assets for ${selectedComponent.name}\nflutter:\n  assets:\n    - assets/icons/${selectedComponent.name.toLowerCase().replace(/\s+/g, '_')}.svg\n  fonts:\n    - family: AppIcons\n      fonts:\n        - asset: assets/fonts/app_icons.ttf`;
    navigator.clipboard.writeText(yaml);
    toast.success("pubspec.yaml copiado!");
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setGenLoading(true);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/design-studio`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: genPrompt, mode: "ui-make" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Erro ao gerar componente");
        setGenLoading(false);
        return;
      }

      const data = await resp.json();
      const result = data.result;

      // Save to DB
      const projectId = await getProjectId();
      const { error } = await supabase.from("ds_components" as any).insert([{
        project_id: projectId,
        name: result.component_name || "Componente",
        description: result.description || genPrompt,
        category: "components",
        code_react: result.code || "",
        code_vue: "",
        code_html: "",
        preview_elements: result.preview_elements || [],
        specs: {},
        status: "draft",
        source: "ds-hub",
      }]);

      if (error) throw error;
      toast.success("Componente gerado e salvo!");
      setShowGenModal(false);
      setGenPrompt("");
      loadComponents();
    } catch (e) {
      toast.error("Erro ao gerar componente");
    }
    setGenLoading(false);
  };

  // Build dynamic nav with real components
  const componentNavItems: DSNavItem[] = components.map(c => ({
    label: c.name,
    icon: Box,
    id: `comp-${c.id}`,
  }));

  const fullNav = [
    STATIC_NAV[0], // foundations
    {
      category: "components" as DSCategory,
      title: `Componentes (${components.length})`,
      items: componentNavItems.length > 0 ? componentNavItems : [{ label: "Nenhum ainda", icon: Box, id: "empty-comp" }],
    },
    STATIC_NAV[1], // patterns
    STATIC_NAV[2], // ai-analysis
  ];

  const isComponentView = activeItem.startsWith("comp-");

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-lg border border-border">
      {/* ====== LEFT: DS Navigation ====== */}
      <div className="w-[220px] flex flex-col bg-card border-r border-border shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Design System</span>
          </div>
          <button onClick={loadComponents} className="p-1 rounded hover:bg-accent transition-colors" title="Recarregar">
            <RefreshCw className={`w-3 h-3 text-muted-foreground ${loadingComponents ? "animate-spin" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {fullNav.map((group) => (
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
                        onClick={() => {
                          setActiveItem(item.id);
                          const comp = components.find(c => `comp-${c.id}` === item.id);
                          if (comp) selectComponent(comp);
                          else setSelectedComponent(null);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors ${
                          activeItem === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
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
            <h2 className="text-sm font-bold text-foreground">
              {selectedComponent ? selectedComponent.name : activeItem === "colors" ? "Cores (Tokens)" : activeItem === "typography" ? "Tipografia" : activeItem === "wcag" ? "Acessibilidade WCAG" : "Design System Hub"}
            </h2>
            {selectedComponent && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                selectedComponent.status === "approved" ? "bg-status-develop/20 text-status-develop" :
                selectedComponent.status === "review" ? "bg-status-deliver/20 text-status-deliver" :
                "bg-secondary text-muted-foreground"
              }`}>
                {selectedComponent.status === "approved" ? <><BadgeCheck className="w-3 h-3" /> Aprovado</> :
                 selectedComponent.status === "review" ? "Em Revisão" : "Rascunho"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedComponent && (
              <>
                {selectedComponent.status !== "approved" && (
                  <button
                    onClick={() => updateComponentStatus(selectedComponent.id, "approved")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-status-develop/20 text-status-develop text-[10px] font-medium hover:bg-status-develop/30 transition-colors"
                  >
                    <BadgeCheck className="w-3 h-3" /> Aprovar
                  </button>
                )}
                <button
                  onClick={() => deleteComponent(selectedComponent.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-medium hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Remover
                </button>
              </>
            )}
            <button
              onClick={() => setShowGenModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-[10px] font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3 h-3" />
              Gerar com IA
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Component View */}
          {isComponentView && selectedComponent ? (
            <>
              {/* Preview / Code Tabs */}
              <div className="glass-card overflow-hidden">
                <div className="flex border-b border-border">
                  {([
                    { key: "preview", label: "Preview", icon: Eye },
                    { key: "specs", label: "Design Specs", icon: FileCode },
                    { key: "flutter", label: "Flutter Widget (Dart)", icon: Code2 },
                    { key: "theme", label: "ThemeData Config", icon: Palette },
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
                  {codeTab !== "preview" && (
                    <div className="ml-auto mr-3 flex items-center gap-1.5">
                      <button onClick={copyCode} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        {copied ? <Check className="w-3 h-3 text-status-develop" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copiado!" : "Copiar Widget"}
                      </button>
                      <button onClick={exportPubspec} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors">
                        <FileCode className="w-3 h-3" /> Exportar pubspec
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {codeTab === "preview" ? (
                    <div className="rounded-lg p-6" style={{
                      backgroundImage: "radial-gradient(circle, hsl(228, 10%, 16%) 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                      backgroundColor: "hsl(228, 14%, 8%)",
                    }}>
                      {selectedComponent.preview_elements && selectedComponent.preview_elements.length > 0 ? (
                        <svg width="800" height="400" viewBox="0 0 800 400" className="w-full" style={{ borderRadius: "8px" }}>
                          {selectedComponent.preview_elements.map((el: any, i: number) => (
                            <g key={i}>
                              {el.type === "rect" && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={4} />}
                              {el.type === "circle" && <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} />}
                              {el.type === "text" && <text x={el.x} y={el.y + (el.fontSize || 14)} fill={el.fill} fontSize={el.fontSize || 14} fontFamily="Inter, sans-serif">{el.text}</text>}
                              {el.type === "line" && <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={el.fill} strokeWidth={2} />}
                            </g>
                          ))}
                        </svg>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Sem preview visual disponível</p>
                      )}
                    </div>
                  ) : (
                    <pre className="text-xs text-foreground/90 font-mono leading-relaxed overflow-x-auto max-h-[400px]">
                      <code>
                        {codeTab === "flutter" ? generateFlutterWidget(selectedComponent) :
                         codeTab === "theme" ? generateThemeData(selectedComponent) :
                         generateDesignSpecs(selectedComponent)}
                      </code>
                    </pre>
                  )}
                </div>
              </div>

              {/* Component Info */}
              <div className="glass-card p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Informações</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">Origem</span>
                    <p className="text-xs font-medium text-foreground mt-1">{selectedComponent.source === "ai-studio" ? "AI Design Studio" : selectedComponent.source === "ds-hub" ? "DS Hub" : selectedComponent.source}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">Categoria</span>
                    <p className="text-xs font-medium text-foreground mt-1">{selectedComponent.category}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">Criado em</span>
                    <p className="text-xs font-medium text-foreground mt-1">{new Date(selectedComponent.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">Status</span>
                    <p className="text-xs font-medium text-foreground mt-1 capitalize">{selectedComponent.status}</p>
                  </div>
                </div>
                {selectedComponent.description && (
                  <p className="text-xs text-muted-foreground mt-3">{selectedComponent.description}</p>
                )}
              </div>
            </>
          ) : activeItem === "colors" ? (
            <ColorsView />
          ) : activeItem === "typography" ? (
            <TypographyView />
          ) : activeItem === "wcag" ? (
            <WCAGView />
          ) : activeItem === "spacing" ? (
            <SpacingView />
          ) : activeItem === "shadows" ? (
            <ShadowsView />
          ) : activeItem === "token-history" ? (
            <TokenHistoryView />
          ) : (
            <div className="glass-card p-12 text-center">
              <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {loadingComponents ? "Carregando componentes..." : "Selecione um item à esquerda ou gere um novo componente com IA"}
              </p>
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
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {selectedComponent ? `Análise de: ${selectedComponent.name}` : "Selecione um componente para análise"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {selectedComponent ? (
            <>
              {/* Dynamic insights based on component */}
              {!selectedComponent.code_react && (
                <InsightCard type="optimization" severity="warning" title="Sem código React" description="Este componente não possui código React. Considere regerar com mais detalhes no prompt." action="Regerar" />
              )}
              {selectedComponent.status === "draft" && (
                <InsightCard type="usage" severity="info" title="Componente em rascunho" description="Revise este componente e aprove-o para que a equipe de desenvolvimento possa utilizá-lo." action="Aprovar para Dev" />
              )}
              {selectedComponent.code_react && !selectedComponent.code_react.includes("aria-") && (
                <InsightCard type="accessibility" severity="warning" title="Sem atributos aria" description="Considere adicionar aria-label e outros atributos de acessibilidade para melhor suporte a leitores de tela." />
              )}
              {selectedComponent.code_react && selectedComponent.code_react.length > 50 && (
                <InsightCard type="optimization" severity="success" title="Código disponível" description={`Componente com ${selectedComponent.code_react.split('\n').length} linhas de código React pronto para uso.`} />
              )}

              {/* Stats */}
              <div className="glass-card p-3 mt-4">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Detalhes</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Preview elements</span>
                    <span className="text-[10px] font-semibold text-foreground">{selectedComponent.preview_elements?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Linhas de código</span>
                    <span className="text-[10px] font-semibold text-foreground">{selectedComponent.code_react ? selectedComponent.code_react.split('\n').length : 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Origem</span>
                    <span className="text-[10px] font-semibold text-primary">{selectedComponent.source}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground">Selecione um componente para ver a análise de IA</p>
            </div>
          )}
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
              <p className="text-xs text-muted-foreground mb-4">O componente será gerado via IA e salvo automaticamente no Design System.</p>
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Ex: Um card de notificação com ícone, título, mensagem e botão de dismiss. Deve suportar variantes: info, success, warning, error."
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

// ---- Insight Card ----
function InsightCard({ type, severity, title, description, action }: { type: string; severity: string; title: string; description: string; action?: string }) {
  const Icon = insightIcons[type] || Lightbulb;
  return (
    <div className={`rounded-lg border p-3 ${severityColors[severity] || severityColors.info}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${severityTextColors[severity] || severityTextColors.info}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-foreground">{title}</p>
          <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
          {action && (
            <button className="mt-2 text-[9px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Foundation Views ----

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
          <p className={`text-foreground ${s.class}`}>Aa Bb Cc Dd Ee</p>
          <div className="text-right shrink-0 ml-4">
            <p className="text-[10px] font-semibold text-foreground">{s.name}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{s.size} / {s.weight}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpacingView() {
  const spacings = [
    { name: "xs", value: "4px", class: "w-1 h-4" },
    { name: "sm", value: "8px", class: "w-2 h-4" },
    { name: "md", value: "16px", class: "w-4 h-4" },
    { name: "lg", value: "24px", class: "w-6 h-4" },
    { name: "xl", value: "32px", class: "w-8 h-4" },
    { name: "2xl", value: "48px", class: "w-12 h-4" },
    { name: "3xl", value: "64px", class: "w-16 h-4" },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-xs font-semibold text-foreground">Escala de Espaçamento</h3>
      <div className="space-y-3">
        {spacings.map((s) => (
          <div key={s.name} className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-muted-foreground w-8">{s.name}</span>
            <div className={`${s.class} bg-primary rounded-sm`} />
            <span className="text-[10px] font-mono text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowsView() {
  const shadows = [
    { name: "sm", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
    { name: "default", value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" },
    { name: "md", value: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
    { name: "lg", value: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
    { name: "xl", value: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-xs font-semibold text-foreground">Sombras</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shadows.map((s) => (
          <div key={s.name} className="p-6 rounded-lg bg-card border border-border" style={{ boxShadow: s.value }}>
            <p className="text-[10px] font-semibold text-foreground">{s.name}</p>
            <p className="text-[8px] font-mono text-muted-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WCAGView() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Accessibility className="w-4 h-4 text-primary" />
          Relatório WCAG 2.1 — Nível AA
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        O relatório de acessibilidade será gerado automaticamente quando houver componentes no Design System. 
        Gere componentes via AI Design Studio ou pelo botão "Gerar com IA" acima.
      </p>
    </div>
  );
}

// ---- Token History View ----
function TokenHistoryView() {
  const [history] = useState([
    { token: "--primary", oldValue: "252 80% 60%", newValue: "252 80% 65%", date: "2026-03-06", author: "IA", reason: "Melhor contraste AA" },
    { token: "--background", oldValue: "228 14% 10%", newValue: "228 14% 8%", date: "2026-03-05", author: "Designer", reason: "Mais profundidade" },
    { token: "--status-discovery", oldValue: "214 80% 55%", newValue: "214 90% 60%", date: "2026-03-04", author: "IA", reason: "Maior saturação para destaque" },
  ]);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold text-foreground mb-1">Histórico de Tokens</h3>
        <p className="text-[10px] text-muted-foreground mb-4">Rastreie alterações nos Design Tokens. Cada mudança gera um registro para governança.</p>

        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold text-primary">{h.token}</span>
                <span className="text-[9px] text-muted-foreground">{h.date}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: `hsl(${h.oldValue})` }} />
                  <span className="text-[9px] font-mono text-muted-foreground line-through">{h.oldValue}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">→</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: `hsl(${h.newValue})` }} />
                  <span className="text-[9px] font-mono text-foreground">{h.newValue}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">{h.reason}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                  h.author === "IA" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>{h.author}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg border border-dashed border-border text-center">
          <p className="text-[10px] text-muted-foreground">Quando tokens forem alterados, o histórico será registrado automaticamente aqui.</p>
          <p className="text-[9px] text-muted-foreground/60 mt-1">Futuro: Alertas de mudança + Pull Request automático</p>
        </div>
      </div>
    </div>
  );
}
