import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DoubleDiamond } from "@/components/dashboard/DoubleDiamond";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { TaskList } from "@/components/dashboard/TaskList";
import { UXMetricsCard } from "@/components/dashboard/UXMetricsCard";
import { PersonasCard } from "@/components/dashboard/PersonasCard";
import { AIMentorPanel } from "@/components/dashboard/AIMentorPanel";

const Index = () => {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <DashboardSidebar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader onToggleAI={() => setAiOpen(!aiOpen)} />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <DoubleDiamond />
            <StatusCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TaskList />
              </div>
              <div className="space-y-6">
                <UXMetricsCard />
                <PersonasCard />
              </div>
            </div>
          </main>
        </div>

        <AIMentorPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>
    </div>
  );
};

export default Index;
