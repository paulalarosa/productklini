import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AIMentorPanel } from "@/components/dashboard/AIMentorPanel";
import { ProjectSetupWizard } from "@/components/dashboard/ProjectSetupWizard";
import { GamificationPanel } from "@/components/dashboard/GamificationPanel";
import { CommandPalette } from "@/components/CommandPalette";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Outlet, useLocation } from "react-router-dom";
import { useProject, useTasks } from "@/hooks/useProjectData";

export function DashboardLayout() {
  const [aiOpen, setAiOpen] = useState(false);
  const [gamificationOpen, setGamificationOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { data: project, isLoading } = useProject();
  const { data: tasks } = useTasks();
  const location = useLocation();

  // Fecha o painel de AI ao navegar entre páginas
  useEffect(() => {
    setAiOpen(false);
  }, [location.pathname]);

  // Exibe o wizard apenas se não houver projeto após o carregamento
  useEffect(() => {
    if (!isLoading && !project) {
      setShowSetup(true);
    }
  }, [project, isLoading]);

  const projectContext = {
    project: project ?? {},
    tasksSummary: {
      total: tasks?.length ?? 0,
      blocked: tasks?.filter((t) => t.status === "blocked").length ?? 0,
      urgent: tasks?.filter((t) => t.priority === "urgent" && t.status !== "done").length ?? 0,
      inProgress: tasks?.filter((t) => t.status === "in_progress").length ?? 0,
      done: tasks?.filter((t) => t.status === "done").length ?? 0,
    },
    tasks: tasks?.map((t) => ({
      title: t.title,
      module: t.module,
      phase: t.phase,
      status: t.status,
      assignee: t.assignee,
      daysInPhase: t.days_in_phase,
      estimatedDays: t.estimated_days,
      priority: t.priority,
    })) ?? [],
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Command Palette — ativado via Cmd+K em qualquer página */}
      <CommandPalette />

      {/* Sidebar — oculta no mobile (drawer), fixa no desktop */}
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full">
        <DashboardHeader
          onToggleAI={() => setAiOpen(!aiOpen)}
          onCreateProject={() => setShowSetup(true)}
          aiOpen={aiOpen}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6">
          <ErrorBoundary level="page">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <AIMentorPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        projectContext={projectContext}
      />

      <GamificationPanel
        isOpen={gamificationOpen}
        onToggle={() => setGamificationOpen(!gamificationOpen)}
      />

      {showSetup && (
        <ProjectSetupWizard onComplete={() => setShowSetup(false)} />
      )}
    </div>
  );
}
