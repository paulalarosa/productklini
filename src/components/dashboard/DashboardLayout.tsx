import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AIMentorPanel } from "@/components/dashboard/AIMentorPanel";
import { ProjectSetupWizard } from "@/components/dashboard/ProjectSetupWizard";
import { GamificationPanel } from "@/components/dashboard/GamificationPanel";
import { Outlet } from "react-router-dom";
import { useProject, useTasks } from "@/hooks/useProjectData";

export function DashboardLayout() {
  const [aiOpen, setAiOpen] = useState(false);
  const [gamificationOpen, setGamificationOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { data: project, isLoading } = useProject();
  const { data: tasks } = useTasks();

  // Show setup wizard if project exists but has default name (just created)
  useEffect(() => {
    if (!isLoading && project && project.name === "Meu Projeto" && !project.description) {
      setShowSetup(true);
    }
  }, [project, isLoading]);

  // Close AI panel on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && aiOpen) {
        // Keep panel but ensure it's full-screen on mobile
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [aiOpen]);

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
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader onToggleAI={() => setAiOpen(!aiOpen)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6">
          <Outlet />
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
