import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import { PesquisasPage, PersonasPage, FluxosPage } from "./pages/UXPages";
import { DesignSystemPage, TelasPage, HandoffPage } from "./pages/UIPages";
import { KanbanPage, SprintsPage, QAPage } from "./pages/DevPages";
import { FigmaPage, GitHubPage, ConfigPage } from "./pages/IntegrationPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/ux/pesquisas" element={<PesquisasPage />} />
            <Route path="/ux/personas" element={<PersonasPage />} />
            <Route path="/ux/fluxos" element={<FluxosPage />} />
            <Route path="/ui/design-system" element={<DesignSystemPage />} />
            <Route path="/ui/telas" element={<TelasPage />} />
            <Route path="/ui/handoff" element={<HandoffPage />} />
            <Route path="/dev/kanban" element={<KanbanPage />} />
            <Route path="/dev/sprints" element={<SprintsPage />} />
            <Route path="/dev/qa" element={<QAPage />} />
            <Route path="/integracoes/figma" element={<FigmaPage />} />
            <Route path="/integracoes/github" element={<GitHubPage />} />
            <Route path="/integracoes/config" element={<ConfigPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
