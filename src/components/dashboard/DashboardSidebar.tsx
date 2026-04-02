import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, Users, Route, Palette, Layers, ArrowRightLeft,
  Kanban, ShieldCheck, BarChart3, Sparkles, CircleDot, FileBarChart, Settings,
  ChevronDown, Menu, X, Heart, Briefcase, Grid3X3, HelpCircle, Lightbulb,
  MessageSquare, ClipboardList, ListChecks, PlayCircle, Accessibility,
  ArrowUpDown, Network, Mic, Type, Shield, Columns, GitBranch, LayoutGrid,
  BrainCircuit, MonitorSmartphone, Microscope, MessageSquareDot, BookMarked,
  Users2, Star, Target, Map, FileText, MessageSquareMore, BookOpen,
  FlaskConical, PenTool, Compass, GalleryHorizontal,
} from "lucide-react";
import { useTasks } from "@/hooks/useProjectData";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem  { label: string; icon: React.ElementType; path: string; }
interface NavGroup { title: string; items: NavItem[]; }

// ─── Mapa de navegação ────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { label: "Visão Geral",      icon: LayoutDashboard, path: "/" },
      { label: "AI Design Studio", icon: Sparkles,        path: "/ai-studio" },
    ],
  },
  {
    title: "Discovery & Research",
    items: [
      { label: "Pesquisas",        icon: Search,       path: "/ux/pesquisas" },
      { label: "Entrevistas",      icon: Mic,          path: "/ux/interviews" },
      { label: "Diary Studies",    icon: BookOpen,     path: "/research/diary-studies" },
      { label: "Stakeholder Map",  icon: Users2,       path: "/research/stakeholder-map" },
      { label: "Personas",         icon: Users,        path: "/ux/personas" },
      { label: "Mapa de Empatia",  icon: Heart,        path: "/ux/empathy-map" },
      { label: "Benchmark",        icon: BarChart3,    path: "/ux/benchmark" },
      { label: "JTBD",             icon: Briefcase,    path: "/ux/jtbd" },
      { label: "Matriz CSD",       icon: Grid3X3,      path: "/ux/csd" },
      { label: "How Might We",     icon: HelpCircle,   path: "/ux/hmw" },
      { label: "Afinidade",        icon: Lightbulb,    path: "/ux/affinity" },
      { label: "Behavior Model",   icon: BrainCircuit, path: "/ux/behavior-model" },
      { label: "UX Patterns",      icon: BookMarked,   path: "/ux/patterns" },
      { label: "Fluxos de Jornada",icon: Route,        path: "/ux/fluxos" },
    ],
  },
  {
    title: "Métricas & KPIs",
    items: [
      { label: "HEART Framework",  icon: Heart,    path: "/metrics/heart" },
      { label: "North Star",       icon: Compass,  path: "/metrics/north-star" },
      { label: "NPS / CSAT / CES", icon: BarChart3,path: "/metrics/nps" },
    ],
  },
  {
    title: "Arq. Informação",
    items: [
      { label: "Sitemap Visual",   icon: Network,    path: "/ia/sitemap-visual" },
      { label: "Sitemap (Doc)",    icon: FileText,   path: "/strategy/sitemap" },
      { label: "Card Sorting",     icon: LayoutGrid, path: "/ia/card-sorting" },
    ],
  },
  {
    title: "UX Writing",
    items: [
      { label: "Tom de Voz",          icon: MessageSquare, path: "/ux/tone" },
      { label: "Microcopy",           icon: PenTool,       path: "/ux/microcopy" },
      { label: "Validador Microcopy", icon: Type,          path: "/ux/microcopy-validator" },
      { label: "Inventário Conteúdo", icon: ClipboardList, path: "/ux/content-audit" },
    ],
  },
  {
    title: "Interaction Design",
    items: [
      { label: "Estados Componentes", icon: Columns,    path: "/ixd/states" },
      { label: "Task Flows",          icon: GitBranch,  path: "/ixd/task-flows" },
    ],
  },
  {
    title: "Validação & Teste",
    items: [
      { label: "Heurísticas Nielsen", icon: ListChecks,   path: "/ux/heuristics" },
      { label: "Teste Usabilidade",   icon: PlayCircle,   path: "/ux/usability-test" },
      { label: "WCAG Checklist",      icon: Accessibility,path: "/ux/wcag" },
      { label: "Auditor WCAG (IA)",   icon: Shield,       path: "/ux/wcag-auditor" },
    ],
  },
  {
    title: "Estratégia & Produto",
    items: [
      { label: "Priorização",           icon: ArrowUpDown, path: "/strategy/prioritization" },
      { label: "Business Model Canvas", icon: Briefcase,   path: "/strategy/business-model" },
      { label: "Roadmap",               icon: Map,         path: "/product/roadmap" },
      { label: "OKRs",                  icon: Target,      path: "/product/okrs" },
    ],
  },
  {
    title: "UI Design",
    items: [
      { label: "Design System",    icon: Palette,               path: "/ui/design-system" },
      { label: "DS Hub",           icon: CircleDot,             path: "/ui/ds-hub" },
      { label: "Verificador Visual",icon: FlaskConical,         path: "/ui/visual-checker" },
      { label: "Motion Gallery",   icon: GalleryHorizontal,     path: "/ui/motion-gallery" },
      { label: "Assets SVG",       icon: Grid3X3,               path: "/ui/svg-manager" },
      { label: "Telas",            icon: Layers,                path: "/ui/telas" },
      { label: "Handoff",          icon: ArrowRightLeft,        path: "/ui/handoff" },
    ],
  },
  {
    title: "Validação & Experimentos",
    items: [
      { label: "A/B Testing",      icon: CircleDot,       path: "/ab-testing" },
      { label: "Audit Responsivo", icon: MonitorSmartphone,path: "/responsive-audit" },
      { label: "Análise UX (IA)",  icon: Microscope,      path: "/ux-analysis" },
      { label: "Analytics Hub",    icon: BarChart3,        path: "/analytics" },
      { label: "Voice of Customer",icon: MessageSquareDot, path: "/voice-of-customer" },
    ],
  },
  {
    title: "Knowledge Base",
    items: [
      { label: "Design Principles", icon: Star,             path: "/knowledge/design-principles" },
      { label: "Decision Log",      icon: ClipboardList,    path: "/knowledge/decision-log" },
      { label: "Design Critiques",  icon: MessageSquareMore,path: "/knowledge/design-critiques" },
    ],
  },
  {
    title: "Desenvolvimento",
    items: [
      { label: "Kanban",       icon: Kanban,      path: "/dev/kanban" },
      { label: "QA",           icon: ShieldCheck, path: "/dev/qa" },
      { label: "Métricas",     icon: BarChart3,   path: "/dev/metricas" },
      { label: "Git Sync Hub", icon: GitBranch,   path: "/git-sync" },
    ],
  },
  {
    title: "Projeto",
    items: [
      { label: "Relatório",     icon: FileBarChart, path: "/relatorio" },
      { label: "Configurações", icon: Settings,     path: "/config" },
    ],
  },
];

// ─── Grupos que começam abertos independentemente da rota ─────────────────────
const ALWAYS_OPEN = new Set(["Geral"]);

// ─── Utilitário: qual grupo contém a rota atual ───────────────────────────────
function findActiveGroup(pathname: string): string | null {
  for (const g of navGroups) {
    if (g.items.some(i => i.path === pathname)) return g.title;
  }
  return null;
}

// ─── Sub-componente: botão de busca ───────────────────────────────────────────
function SearchButton() {
  const trigger = () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );

  return (
    <div className="px-3 md:px-4 py-2 border-b border-sidebar-border">
      <button
        onClick={trigger}
        className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-muted-foreground rounded-lg border border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all active:scale-[0.98]"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Buscar módulos...</span>
        <kbd className="hidden md:inline-flex h-4 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent/50 px-1 font-mono text-[9px] font-medium text-muted-foreground">
          <span>⌘</span>K
        </kbd>
      </button>
    </div>
  );
}

// ─── Sub-componente: conteúdo da sidebar ──────────────────────────────────────
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { data: tasks } = useTasks();

  // Tarefas bloqueadas — badge na seção Desenvolvimento
  const blockedCount = useMemo(
    () => tasks?.filter(t => t.status === "blocked").length ?? 0,
    [tasks],
  );

  // Estado de colapso — grupos abertos por padrão: "Geral" + grupo da rota atual
  const activeGroup = findActiveGroup(location.pathname);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of navGroups) {
      const isOpen = ALWAYS_OPEN.has(g.title) || g.title === activeGroup;
      init[g.title] = !isOpen; // true = colapsado
    }
    return init;
  });

  const toggle = (title: string) =>
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="px-3 md:px-4 py-3 md:py-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">ProductOS</span>
        </div>
      </div>

      <SearchButton />

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 md:px-2 space-y-0.5 overscroll-contain">
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.title] ?? false;

          return (
            <div key={group.title}>
              {/* Cabeçalho do grupo */}
              <button
                onClick={() => toggle(group.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {group.title}
                  {/* Badge de bloqueados na seção Desenvolvimento */}
                  {group.title === "Desenvolvimento" && blockedCount > 0 && (
                    <span className="inline-flex items-center justify-center h-3.5 min-w-[14px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none">
                      {blockedCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                />
              </button>

              {/* Itens do grupo — animados */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 pb-1">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 md:py-1.5 rounded-md text-xs transition-colors active:scale-[0.98] ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            }`}
                          >
                            <item.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Botão hambúrguer mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-2 left-2 z-50 p-2 rounded-lg bg-card border border-border md:hidden active:scale-95 transition-transform"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Sidebar mobile — drawer animado */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col md:hidden safe-area-inset"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-accent z-10"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar desktop — fixo */}
      <aside className="hidden md:flex w-[220px] h-screen bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
