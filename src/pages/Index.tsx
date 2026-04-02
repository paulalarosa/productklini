import React from "react";
import { useNavigate } from "react-router-dom";
import { DoubleDiamond } from "@/components/dashboard/DoubleDiamond";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { TaskList } from "@/components/dashboard/TaskList";
import { UXMetricsCard } from "@/components/dashboard/UXMetricsCard";
import { PersonasCard } from "@/components/dashboard/PersonasCard";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { useProject, useTasks } from "@/hooks/useProjectData";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap, Brain, Users, BarChart2, Map, CheckSquare,
  PenTool, Target, FlaskConical, ArrowRight, Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/ui/responsive-layout";

// ─── Atalhos rápidos — módulos mais usados por designers ─────────────────────
const QUICK_ACCESS = [
  { label: "AI Studio",        path: "/ai-studio",              icon: Zap,          color: "text-amber-500" },
  { label: "Personas",         path: "/ux/personas",            icon: Users,        color: "text-blue-500"  },
  { label: "Mapa de Empatia",  path: "/ux/empathy-map",         icon: Brain,        color: "text-purple-500"},
  { label: "Fluxos",           path: "/ux/fluxos",              icon: Map,          color: "text-teal-500"  },
  { label: "Heurísticas",      path: "/ux/heuristics",          icon: CheckSquare,  color: "text-green-500" },
  { label: "WCAG Auditor",     path: "/ux/wcag-auditor",        icon: PenTool,      color: "text-rose-500"  },
  { label: "Analytics",        path: "/analytics",              icon: BarChart2,    color: "text-cyan-500"  },
  { label: "OKRs",             path: "/product/okrs",           icon: Target,       color: "text-orange-500"},
  { label: "A/B Testing",      path: "/ab-testing",             icon: FlaskConical, color: "text-indigo-500"},
];

// ─── Utilitário: saudação por hora do dia ─────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ─── Componente de atalho ─────────────────────────────────────────────────────
function QuickAccessButton({
  label, path, icon: Icon, color,
}: (typeof QUICK_ACCESS)[number]) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors group text-center"
    >
      <Icon className={`h-5 w-5 ${color} group-hover:scale-110 transition-transform`} />
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const OverviewPage = () => {
  const { user } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const navigate = useNavigate();

  const isLoading = projectLoading || tasksLoading;

  if (isLoading) return <DashboardSkeleton />;

  // Tarefas urgentes ou em progresso (máx. 3 para o feed)
  const highlight = tasks
    ?.filter(t => t.status !== "done" && (t.priority === "urgent" || t.status === "in_progress"))
    .slice(0, 3) ?? [];

  const firstName = user?.user_metadata?.full_name?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "Designer";

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title={`${getGreeting()}, ${firstName} 👋`}
        description={project?.name ? `Projeto ativo: ${project.name}` : "Nenhum projeto ativo — crie um para começar."}
        actions={
          highlight.length > 0 && (
            <button
              onClick={() => navigate("/dev/kanban")}
              className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {highlight.length} tarefa{highlight.length > 1 ? "s" : ""} precisa{highlight.length > 1 ? "m" : ""} de atenção
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </button>
          )
        }
      />

      {/* ── Acesso rápido ──────────────────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Acesso rápido</h2>
          <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
            ou <kbd className="inline-flex h-4 items-center gap-1 rounded border bg-muted px-1 font-mono text-[9px] font-medium">⌘K</kbd> para buscar
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {QUICK_ACCESS.map(item => (
            <QuickAccessButton key={item.path} {...item} />
          ))}
        </div>
      </div>

      {/* ── Feed de tarefas em destaque (só se houver) ─────────────────────── */}
      {highlight.length > 0 && (
        <div className="border rounded-lg bg-card/50 backdrop-blur-sm divide-y animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Em andamento</span>
            <button
              onClick={() => navigate("/dev/kanban")}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors uppercase font-bold tracking-tighter"
            >
              Ver tudo <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {highlight.map(task => (
            <div
              key={task.id ?? task.title}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer group"
              onClick={() => navigate("/dev/kanban")}
            >
              <div
                className={`h-2 w-2 rounded-full shrink-0 group-hover:scale-125 transition-transform ${
                  task.priority === "urgent"
                    ? "bg-status-urgent shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    : task.status === "in_progress"
                    ? "bg-status-develop shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="text-sm flex-1 truncate text-foreground/90 font-medium">{task.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 uppercase font-semibold">
                {task.module ?? task.phase ?? "DEV"}
              </span>
              {task.updated_at && (
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-32 text-right">
                  {formatDistanceToNow(new Date(task.updated_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Double Diamond (fluxo do projeto) ─────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <DoubleDiamond />
      </div>

      {/* ── Status Cards ───────────────────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
        <StatusCards />
      </div>

      {/* ── Task List + métricas laterais ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <div className="lg:col-span-2">
          <TaskList />
        </div>
        <div className="space-y-4 md:space-y-6">
          <UXMetricsCard />
          <PersonasCard />
        </div>
      </div>

      {/* ── Analytics Charts ───────────────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 pb-6">
        <AnalyticsCharts />
      </div>
    </div>
  );
};

export default OverviewPage;
