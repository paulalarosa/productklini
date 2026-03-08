import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Users,
  Route,
  Palette,
  Layers,
  ArrowRightLeft,
  Kanban,
  Zap,
  ShieldCheck,
  Figma,
  GitBranch,
  Settings,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  active?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { label: "Visão Geral", icon: LayoutDashboard, active: true },
    ],
  },
  {
    title: "UX Research",
    items: [
      { label: "Pesquisas", icon: Search },
      { label: "Personas", icon: Users },
      { label: "Fluxos de Jornada", icon: Route },
    ],
  },
  {
    title: "UI Design",
    items: [
      { label: "Design System", icon: Palette },
      { label: "Telas", icon: Layers },
      { label: "Handoff", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Desenvolvimento",
    items: [
      { label: "Kanban", icon: Kanban },
      { label: "Sprints", icon: Zap },
      { label: "QA", icon: ShieldCheck },
    ],
  },
  {
    title: "Integrações",
    items: [
      { label: "Figma", icon: Figma },
      { label: "GitHub", icon: GitBranch },
      { label: "Configurações", icon: Settings },
    ],
  },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside className="w-[220px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">ProductOS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navGroups.map((group) => (
          <div key={group.title}>
            <button
              onClick={() => toggle(group.title)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              {group.title}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${collapsed[group.title] ? "-rotate-90" : ""}`}
              />
            </button>
            {!collapsed[group.title] && (
              <motion.div
                className="space-y-0.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                {group.items.map(item => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      item.active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
