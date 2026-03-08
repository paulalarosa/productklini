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
import { KanbanPage, QAPage, TeamMetricsPage } from "./pages/DevPages";
import { ConfigPage } from "./pages/ConfigPage";
import { AIDesignStudioPage } from "./pages/AIStudioPage";
import { ReportPage } from "./pages/ReportPage";
import { EmpathyMapPage, BenchmarkPage, JTBDPage, CSDMatrixPage, HMWPage, AffinityDiagramPage } from "./pages/DiscoveryPages";
import { ToneOfVoicePage, MicrocopyLibraryPage, ContentAuditPage } from "./pages/UXWritingPages";
import { HeuristicEvalPage, UsabilityTestPage, WCAGChecklistPage } from "./pages/ValidationPages";
import { PrioritizationMatrixPage, SitemapPage } from "./pages/StrategyPages";
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
              <Route path="/ux/empathy-map" element={<EmpathyMapPage />} />
              <Route path="/ux/benchmark" element={<BenchmarkPage />} />
              <Route path="/ux/jtbd" element={<JTBDPage />} />
              <Route path="/ux/csd" element={<CSDMatrixPage />} />
              <Route path="/ux/hmw" element={<HMWPage />} />
              <Route path="/ux/affinity" element={<AffinityDiagramPage />} />
              <Route path="/ux/fluxos" element={<FluxosPage />} />
              <Route path="/ux/tone" element={<ToneOfVoicePage />} />
              <Route path="/ux/microcopy" element={<MicrocopyLibraryPage />} />
              <Route path="/ux/content-audit" element={<ContentAuditPage />} />
              <Route path="/ux/heuristics" element={<HeuristicEvalPage />} />
              <Route path="/ux/usability-test" element={<UsabilityTestPage />} />
              <Route path="/ux/wcag" element={<WCAGChecklistPage />} />
              <Route path="/strategy/prioritization" element={<PrioritizationMatrixPage />} />
              <Route path="/strategy/sitemap" element={<SitemapPage />} />
              <Route path="/ui/design-system" element={<DesignSystemPage />} />
              <Route path="/ui/telas" element={<TelasPage />} />
              <Route path="/ui/ds-hub" element={<DesignSystemHubPage />} />
              <Route path="/ui/handoff" element={<HandoffPage />} />
              <Route path="/dev/kanban" element={<KanbanPage />} />
              <Route path="/dev/qa" element={<QAPage />} />
              <Route path="/dev/metricas" element={<TeamMetricsPage />} />
              <Route path="/relatorio" element={<ReportPage />} />
              <Route path="/config" element={<ConfigPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
