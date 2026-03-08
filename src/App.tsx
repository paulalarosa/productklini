import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { PesquisasPage, PersonasPage, FluxosPage } from "./pages/UXPages";
import { DesignSystemPage, TelasPage, HandoffPage } from "./pages/UIPages";
import { DesignSystemHubPage } from "./pages/DesignSystemHubPage";
import { KanbanPage, SprintsPage, QAPage, TeamMetricsPage } from "./pages/DevPages";
import { FigmaPage, GitHubPage, ConfigPage } from "./pages/IntegrationPages";
import { AIDesignStudioPage } from "./pages/AIStudioPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/ai-studio" element={<AIDesignStudioPage />} />
              <Route path="/ux/pesquisas" element={<PesquisasPage />} />
              <Route path="/ux/personas" element={<PersonasPage />} />
              <Route path="/ux/fluxos" element={<FluxosPage />} />
              <Route path="/ui/design-system" element={<DesignSystemPage />} />
              <Route path="/ui/telas" element={<TelasPage />} />
              <Route path="/ui/handoff" element={<HandoffPage />} />
              <Route path="/dev/kanban" element={<KanbanPage />} />
              <Route path="/dev/sprints" element={<SprintsPage />} />
              <Route path="/dev/qa" element={<QAPage />} />
              <Route path="/dev/metricas" element={<TeamMetricsPage />} />
              <Route path="/integracoes/figma" element={<FigmaPage />} />
              <Route path="/integracoes/github" element={<GitHubPage />} />
              <Route path="/integracoes/config" element={<ConfigPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
