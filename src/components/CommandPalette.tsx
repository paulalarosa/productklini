import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Search, Users, FileBarChart, Layers, BarChart3, Sparkles, ShieldCheck,
  Map, Accessibility, PenTool, Compass, FlaskConical, Settings,
  BookOpen, Microscope, LayoutDashboard, Network, LayoutGrid, GitBranch,
  Columns, Palette, Grid3X3, GalleryHorizontal, Image, ListChecks,
  PlayCircle, CircleDot, Flag, MessageSquareMore, Activity, Eye,
  Heart, Target, Briefcase, ShieldAlert, RotateCcw, ArrowRightLeft,
  CheckSquare, ScrollText, Kanban, Star, ClipboardList, BookMarked,
  ArrowUpDown, MessageSquare, Route, Mic, Users2, Lightbulb, BrainCircuit,
  HelpCircle, Globe, MessageSquareDot, FolderSearch, Rocket, MonitorSmartphone,
} from "lucide-react";

// ─── Mapa completo de todas as rotas do app — sincronizado com DashboardSidebar ───
const ROUTES = [
  // Geral
  { label: "Visão Geral",          path: "/",                            group: "Geral",                  icon: LayoutDashboard },
  { label: "Product Pipeline",     path: "/pipeline",                    group: "Geral",                  icon: Rocket },
  { label: "AI Design Studio",     path: "/ai-studio",                   group: "Geral",                  icon: Sparkles },

  // Discovery & Research
  { label: "Pesquisas",            path: "/ux/pesquisas",                group: "Discovery & Research",   icon: Search },
  { label: "Entrevistas",          path: "/ux/interviews",               group: "Discovery & Research",   icon: Mic },
  { label: "Diary Studies",        path: "/research/diary-studies",      group: "Discovery & Research",   icon: BookOpen },
  { label: "Stakeholder Map",      path: "/research/stakeholder-map",    group: "Discovery & Research",   icon: Users2 },
  { label: "Personas",             path: "/ux/personas",                 group: "Discovery & Research",   icon: Users },
  { label: "Mapa de Empatia",      path: "/ux/empathy-map",              group: "Discovery & Research",   icon: Heart },
  { label: "Customer Journey",     path: "/product/customer-journey",    group: "Discovery & Research",   icon: Map },
  { label: "Voice of Customer",    path: "/voice-of-customer",           group: "Discovery & Research",   icon: MessageSquareDot },
  { label: "Análise Competitiva",  path: "/knowledge/competitive-landscape", group: "Discovery & Research", icon: Globe },
  { label: "JTBD",                 path: "/ux/jtbd",                     group: "Discovery & Research",   icon: Briefcase },
  { label: "Matriz CSD",           path: "/ux/csd",                      group: "Discovery & Research",   icon: Grid3X3 },
  { label: "How Might We",         path: "/ux/hmw",                      group: "Discovery & Research",   icon: HelpCircle },

  // Definição
  { label: "Afinidade",            path: "/ux/affinity",                 group: "Definição",              icon: Lightbulb },
  { label: "Behavior Model",       path: "/ux/behavior-model",           group: "Definição",              icon: BrainCircuit },
  { label: "Benchmark",            path: "/ux/benchmark",                group: "Definição",              icon: BarChart3 },
  { label: "Research Repository",  path: "/research/repository",         group: "Definição",              icon: FolderSearch },
  { label: "Priorização",          path: "/strategy/prioritization",     group: "Definição",              icon: ArrowUpDown },

  // Arq. Informação
  { label: "Sitemap",              path: "/ia/sitemap-visual",           group: "Arq. Informação",        icon: Network },
  { label: "Card Sorting",         path: "/ia/card-sorting",             group: "Arq. Informação",        icon: LayoutGrid },

  // UX Writing
  { label: "Tom de Voz",           path: "/ux/tone",                     group: "UX Writing",             icon: MessageSquare },
  { label: "Microcopy",            path: "/ux/microcopy",                group: "UX Writing",             icon: PenTool },
  { label: "Inventário Conteúdo",  path: "/ux/content-audit",            group: "UX Writing",             icon: ClipboardList },

  // Interaction Design
  { label: "User Flow Editor",     path: "/design/user-flows",           group: "Interaction Design",     icon: GitBranch },
  { label: "Task Flows",           path: "/ixd/task-flows",              group: "Interaction Design",     icon: GitBranch },
  { label: "Fluxos de Jornada",    path: "/ux/fluxos",                   group: "Interaction Design",     icon: Route },
  { label: "Estados Componentes",  path: "/ixd/states",                  group: "Interaction Design",     icon: Columns },

  // UI Design
  { label: "Design System Hub",    path: "/ui/ds-hub",                   group: "UI Design",              icon: Palette },
  { label: "Moodboard",            path: "/design/moodboard",            group: "UI Design",              icon: Image },
  { label: "Motion Gallery",       path: "/ui/motion-gallery",           group: "UI Design",              icon: GalleryHorizontal },
  { label: "Assets SVG",           path: "/ui/svg-manager",              group: "UI Design",              icon: Grid3X3 },
  { label: "Telas",                path: "/ui/telas",                    group: "UI Design",              icon: Layers },
  { label: "Verificador Visual",   path: "/ui/visual-checker",           group: "UI Design",              icon: FlaskConical },

  // Validação & Testes
  { label: "Heurísticas Nielsen",  path: "/ux/heuristics",               group: "Validação & Testes",     icon: ListChecks },
  { label: "Teste Usabilidade",    path: "/ux/usability-test",           group: "Validação & Testes",     icon: PlayCircle },
  { label: "Acessibilidade",       path: "/ux/wcag",                     group: "Validação & Testes",     icon: Accessibility },
  { label: "A/B Testing",          path: "/ab-testing",                  group: "Validação & Testes",     icon: CircleDot },
  { label: "Feature Flags",        path: "/testing/feature-flags",       group: "Validação & Testes",     icon: Flag },
  { label: "Design Critiques",     path: "/knowledge/design-critiques",  group: "Validação & Testes",     icon: MessageSquareMore },
  { label: "Heatmap Viewer",       path: "/testing/heatmap",             group: "Validação & Testes",     icon: Activity },
  { label: "Session Recording",    path: "/testing/session-recording",   group: "Validação & Testes",     icon: Eye },

  // Métricas & Analytics
  { label: "HEART Framework",      path: "/metrics/heart",               group: "Métricas & Analytics",   icon: Heart },
  { label: "North Star",           path: "/metrics/north-star",          group: "Métricas & Analytics",   icon: Compass },
  { label: "NPS / CSAT / CES",     path: "/metrics/nps",                 group: "Métricas & Analytics",   icon: BarChart3 },
  { label: "Component Analytics",  path: "/testing/component-analytics", group: "Métricas & Analytics",   icon: BarChart3 },
  { label: "Analytics Hub",        path: "/analytics",                   group: "Métricas & Analytics",   icon: BarChart3 },
  { label: "Audit Responsivo",     path: "/responsive-audit",            group: "Métricas & Analytics",   icon: MonitorSmartphone },
  { label: "Análise UX (IA)",      path: "/ux-analysis",                 group: "Métricas & Analytics",   icon: Microscope },

  // Estratégia & Produto
  { label: "Business Model Canvas",path: "/strategy/business-model",     group: "Estratégia & Produto",   icon: Briefcase },
  { label: "Roadmap",              path: "/product/roadmap",             group: "Estratégia & Produto",   icon: Map },
  { label: "OKRs",                 path: "/product/okrs",                group: "Estratégia & Produto",   icon: Target },
  { label: "Risk Register",        path: "/product/risk-register",       group: "Estratégia & Produto",   icon: ShieldAlert },
  { label: "Sprint Retro",         path: "/product/sprint-retro",        group: "Estratégia & Produto",   icon: RotateCcw },

  // Design Handoff
  { label: "Handoff & Specs",      path: "/ui/handoff",                  group: "Design Handoff",         icon: ArrowRightLeft },
  { label: "Acceptance Criteria",  path: "/handoff/acceptance-criteria", group: "Design Handoff",         icon: CheckSquare },
  { label: "Release Notes",        path: "/handoff/release-notes",       group: "Design Handoff",         icon: ScrollText },

  // Desenvolvimento
  { label: "Kanban",               path: "/dev/kanban",                  group: "Desenvolvimento",         icon: Kanban },
  { label: "QA",                   path: "/dev/qa",                      group: "Desenvolvimento",         icon: ShieldCheck },
  { label: "Métricas Dev",         path: "/dev/metricas",                group: "Desenvolvimento",         icon: BarChart3 },
  { label: "Git Sync Hub",         path: "/git-sync",                    group: "Desenvolvimento",         icon: GitBranch },

  // Knowledge Base
  { label: "Design Principles",    path: "/knowledge/design-principles", group: "Knowledge Base",         icon: Star },
  { label: "Decision Log",         path: "/knowledge/decision-log",      group: "Knowledge Base",         icon: ClipboardList },
  { label: "UX Patterns",          path: "/ux/patterns",                 group: "Knowledge Base",         icon: BookMarked },

  // Projeto
  { label: "Relatório",            path: "/relatorio",                   group: "Projeto",                icon: FileBarChart },
  { label: "Configurações",        path: "/config",                      group: "Projeto",                icon: Settings },
];

// Agrupa por categoria para exibição
const grouped = ROUTES.reduce<Record<string, typeof ROUTES>>((acc, r) => {
  if (!acc[r.group]) acc[r.group] = [];
  acc[r.group].push(r);
  return acc;
}, {});

// ─── Componente ───────────────────────────────────────────────────────────────
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Ativa com Cmd+K ou Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar módulo, ferramenta ou página..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {Object.entries(grouped).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map(item => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${group}`}
                  onSelect={() => go(item.path)}
                  className="gap-2 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                    {item.path}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
