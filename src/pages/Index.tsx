import { DoubleDiamond } from "@/components/dashboard/DoubleDiamond";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { TaskList } from "@/components/dashboard/TaskList";
import { UXMetricsCard } from "@/components/dashboard/UXMetricsCard";
import { PersonasCard } from "@/components/dashboard/PersonasCard";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";

const OverviewPage = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <DoubleDiamond />
      <StatusCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <TaskList />
        </div>
        <div className="space-y-4 md:space-y-6">
          <UXMetricsCard />
          <PersonasCard />
        </div>
      </div>
      <AnalyticsCharts />
    </div>
  );
};

export default OverviewPage;
