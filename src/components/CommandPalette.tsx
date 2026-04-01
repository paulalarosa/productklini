import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search, Users, FileText, Layers, BarChart2, Zap, Code2,
  Map, CheckSquare, PenTool, Compass, FlaskConical, Settings,
  Brain, TrendingUp, Target, BookOpen, Microscope, Layout,
} from "lucide-react";

// ─── Mapa completo de todas as rotas do app ────────────────────────────────────
const ROUTES = [
  // UX / Discovery
  { label: "Pesquisas",           path: "/ux/pesquisas",          group: "UX & Discovery",    icon: Search },
  { label: "Entrevistas",         path: "/ux/interviews",          group: "UX & Discovery",    icon: Microscope },
  { label: "Personas",            path: "/ux/personas",            group: "UX & Discovery",    icon: Users },
  { label: "Mapa de Empatia",     path: "/ux/empathy-map",         group: "UX & Discovery",    icon: Brain },
  { label: "Benchmark",           path: "/ux/benchmark",           group: "UX & Discovery",    icon: BarChart2 },
  { label: "Jobs To Be Done",     path: "/ux/jtbd",                group: "UX & Discovery",    icon: Target },
  { label: "Matriz CSD",          path: "/ux/csd",                 group: "UX & Discovery",    icon: Layers },
  { label: "HMW",                 path: "/ux/hmw",                 group: "UX & Discovery",    icon: Compass },
  { label: "Diagrama de Afinidade", path: "/ux/affinity",          group: "UX & Discovery",    icon: Layout },
  { label: "Modelo de Comportamento", path: "/ux/behavior-model",  group: "UX & Discovery",    icon: Brain },
  { label: "Padrões UX",          path: "/ux/patterns",            group: "UX & Discovery",    icon: BookOpen },
  { label: "Fluxos",              path: "/ux/fluxos",              group: "UX & Discovery",    icon: Map },

  // UX Writing
  { label: "Tom de Voz",          path: "/ux/tone",                group: "UX Writing",        icon: PenTool },
  { label: "Biblioteca de Microcopy", path: "/ux/microcopy",       group: "UX Writing",        icon: FileText },
  { label: "Validador de Microcopy",  path: "/ux/microcopy-validator", group: "UX Writing",    icon: CheckSquare },
  { label: "Auditoria de Conteúdo",   path: "/ux/content-audit",   group: "UX Writing",        icon: Search },

  // Validação
  { label: "Avaliação Heurística", path: "/ux/heuristics",         group: "Validação",         icon: CheckSquare },
  { label: "Teste de Usabilidade", path: "/ux/usability-test",     group: "Validação",         icon: FlaskConical },
  { label: "Checklist WCAG",       path: "/ux/wcag",               group: "Validação",         icon: CheckSquare },
  { label: "Auditor WCAG",         path: "/ux/wcag-auditor",       group: "Validação",         icon: CheckSquare },

  // IA / IxD
  { label: "Sitemap Visual",       path: "/ia/sitemap-visual",     group: "IA & IxD",          icon: Map },
  { label: "Card Sorting",         path: "/ia/card-sorting",       group: "IA & IxD",          icon: Layers },
  { label: "Estados de Componente", path: "/ixd/states",           group: "IA & IxD",          icon: Layout },
  { label: "Task Flows",           path: "/ixd/task-flows",        group: "IA & IxD",          icon: Map },

  // Strategy
  { label: "Matriz de Priorização", path: "/strategy/prioritization", group: "Strategy",       icon: Target },
  { label: "Sitemap",              path: "/strategy/sitemap",      group: "Strategy",           icon: Map },
  { label: "Business Model Canvas", path: "/strategy/business-model", group: "Strategy",       icon: Layers },

  // UI
  { label: "Design System",        path: "/ui/design-system",      group: "UI",                icon: Layers },
  { label: "Telas",                path: "/ui/telas",              group: "UI",                icon: Layout },
  { label: "DS Hub",               path: "/ui/ds-hub",             group: "UI",                icon: Layers },
  { label: "Handoff",              path: "/ui/handoff",            group: "UI",                icon: Code2 },
  { label: "Visual Checker",       path: "/ui/visual-checker",     group: "UI",                icon: CheckSquare },
  { label: "Motion Gallery",       path: "/ui/motion-gallery",     group: "UI",                icon: Zap },
  { label: "SVG Manager",          path: "/ui/svg-manager",        group: "UI",                icon: PenTool },

  // Dev
  { label: "Kanban",               path: "/dev/kanban",            group: "Dev & QA",          icon: Layout },
  { label: "QA",                   path: "/dev/qa",                group: "Dev & QA",          icon: CheckSquare },
  { label: "Métricas do Time",     path: "/dev/metricas",          group: "Dev & QA",          icon: BarChart2 },

  // Analytics
  { label: "Analytics Hub",        path: "/analytics",             group: "Analytics",         icon: BarChart2 },
  { label: "Voice of Customer",    path: "/voice-of-customer",     group: "Analytics",         icon: Users },
  { label: "A/B Testing",          path: "/ab-testing",            group: "Analytics",         icon: FlaskConical },
  { label: "Responsive Audit",     path: "/responsive-audit",      group: "Analytics",         icon: Layout },
  { label: "UX Analysis",          path: "/ux-analysis",           group: "Analytics",         icon: Search },
  { label: "Relatório",            path: "/relatorio",             group: "Analytics",         icon: FileText },

  // Research
  { label: "Diary Studies",        path: "/research/diary-studies", group: "Research",         icon: BookOpen },
  { label: "Stakeholder Map",      path: "/research/stakeholder-map", group: "Research",       icon: Users },

  // Metrics
  { label: "HEART Framework",      path: "/metrics/heart",         group: "Metrics",           icon: TrendingUp },
  { label: "North Star",           path: "/metrics/north-star",    group: "Metrics",           icon: Target },
  { label: "NPS Surveys",          path: "/metrics/nps",           group: "Metrics",           icon: BarChart2 },

  // Product
  { label: "Roadmap",              path: "/product/roadmap",       group: "Product",           icon: Map },
  { label: "OKRs",                 path: "/product/okrs",          group: "Product",           icon: Target },

  // Knowledge
  { label: "Design Principles",    path: "/knowledge/design-principles", group: "Knowledge",   icon: BookOpen },
  { label: "Decision Log",         path: "/knowledge/decision-log",      group: "Knowledge",   icon: FileText },
  { label: "Design Critiques",     path: "/knowledge/design-critiques",  group: "Knowledge",   icon: Users },

  // Especiais
  { label: "AI Design Studio",     path: "/ai-studio",             group: "Ferramentas",       icon: Zap },
  { label: "Git Sync",             path: "/git-sync",              group: "Ferramentas",       icon: Code2 },
  { label: "Configurações",        path: "/config",                group: "Ferramentas",       icon: Settings },
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

export default CommandPalette;
