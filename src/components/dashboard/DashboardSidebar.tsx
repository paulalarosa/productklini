import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Search, Users, Route, Palette, Layers, ArrowRightLeft,
  Kanban, ShieldCheck, BarChart3, Sparkles, CircleDot, FileBarChart, Settings,
  ChevronDown, Menu, X, Heart, Briefcase, Grid3X3, HelpCircle, Lightbulb,
  MessageSquare, BookOpen, ClipboardList, ListChecks, PlayCircle, Accessibility,
  ArrowUpDown, Network, Mic, Type, Shield, Columns, GitBranch, LayoutGrid, BrainCircuit,
  MonitorSmartphone, Microscope
} from "lucide-react";

interface NavItem { label: string; icon: React.ElementType; path: string; }
interface NavGroup { title: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { label: "Visão Geral", icon: LayoutDashboard, path: "/" },
      { label: "AI Design Studio", icon: Sparkles, path: "/ai-studio" },
    ],
  },
  {
    title: "Discovery & Research",
    items: [
      { label: "Pesquisas", icon: Search, path: "/ux/pesquisas" },
      { label: "Entrevistas", icon: Mic, path: "/ux/interviews" },
      { label: "Personas", icon: Users, path: "/ux/personas" },
      { label: "Mapa de Empatia", icon: Heart, path: "/ux/empathy-map" },
      { label: "Benchmark", icon: BarChart3, path: "/ux/benchmark" },
      { label: "JTBD", icon: Briefcase, path: "/ux/jtbd" },
      { label: "Matriz CSD", icon: Grid3X3, path: "/ux/csd" },
      { label: "How Might We", icon: HelpCircle, path: "/ux/hmw" },
      { label: "Afinidade", icon: Lightbulb, path: "/ux/affinity" },
      { label: "Behavior Model", icon: BrainCircuit, path: "/ux/behavior-model" },
      { label: "UX Patterns", icon: BookOpen, path: "/ux/patterns" },
      { label: "Fluxos de Jornada", icon: Route, path: "/ux/fluxos" },
    ],
  },
  {
    title: "Arq. Informação",
    items: [
      { label: "Sitemap Visual", icon: Network, path: "/ia/sitemap-visual" },
      { label: "Sitemap (Doc)", icon: Network, path: "/strategy/sitemap" },
      { label: "Card Sorting", icon: LayoutGrid, path: "/ia/card-sorting" },
    ],
  },
  {
    title: "UX Writing",
    items: [
      { label: "Tom de Voz", icon: MessageSquare, path: "/ux/tone" },
      { label: "Microcopy", icon: BookOpen, path: "/ux/microcopy" },
      { label: "Validador Microcopy", icon: Type, path: "/ux/microcopy-validator" },
      { label: "Inventário Conteúdo", icon: ClipboardList, path: "/ux/content-audit" },
    ],
  },
  {
    title: "Interaction Design",
    items: [
      { label: "Estados Componentes", icon: Columns, path: "/ixd/states" },
      { label: "Task Flows", icon: GitBranch, path: "/ixd/task-flows" },
    ],
  },
  {
    title: "Validação & Teste",
    items: [
      { label: "Heurísticas Nielsen", icon: ListChecks, path: "/ux/heuristics" },
      { label: "Teste Usabilidade", icon: PlayCircle, path: "/ux/usability-test" },
      { label: "WCAG Checklist", icon: Accessibility, path: "/ux/wcag" },
      { label: "Auditor WCAG (IA)", icon: Shield, path: "/ux/wcag-auditor" },
    ],
  },
  {
    title: "Estratégia",
    items: [
      { label: "Priorização", icon: ArrowUpDown, path: "/strategy/prioritization" },
      { label: "Business Model Canvas", icon: Briefcase, path: "/strategy/business-model" },
    ],
  },
  {
    title: "UI Design",
    items: [
      { label: "Design System", icon: Palette, path: "/ui/design-system" },
      { label: "DS Hub", icon: CircleDot, path: "/ui/ds-hub" },
      { label: "Verificador Visual", icon: Palette, path: "/ui/visual-checker" },
      { label: "Motion Gallery", icon: Sparkles, path: "/ui/motion-gallery" },
      { label: "Assets SVG", icon: Grid3X3, path: "/ui/svg-manager" },
      { label: "Telas", icon: Layers, path: "/ui/telas" },
      { label: "Handoff", icon: ArrowRightLeft, path: "/ui/handoff" },
    ],
  },
  {
    title: "Validação & Experimentos",
    items: [
      { label: "A/B Testing", icon: CircleDot, path: "/ab-testing" },
      { label: "Analytics Hub", icon: BarChart3, path: "/analytics" },
    ],
  },
  {
    title: "Desenvolvimento",
    items: [
      { label: "Kanban", icon: Kanban, path: "/dev/kanban" },
      { label: "QA", icon: ShieldCheck, path: "/dev/qa" },
      { label: "Métricas", icon: BarChart3, path: "/dev/metricas" },
      { label: "Git Sync Hub", icon: GitBranch, path: "/git-sync" },
    ],
  },
  {
    title: "Projeto",
    items: [
      { label: "Relatório", icon: FileBarChart, path: "/relatorio" },
      { label: "Configurações", icon: Settings, path: "/config" },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">ProductOS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navGroups.map((group, gi) => (
          <div key={`${group.title}-${gi}`}>
            <button
              onClick={() => toggle(`${group.title}-${gi}`)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              {group.title}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${collapsed[`${group.title}-${gi}`] ? "-rotate-90" : ""}`}
              />
            </button>
            {!collapsed[`${group.title}-${gi}`] && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border md:hidden"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col md:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-accent"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-[220px] h-screen bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}