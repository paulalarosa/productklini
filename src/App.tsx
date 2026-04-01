import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// ─── Páginas carregadas imediatamente (críticas para auth) ───────────────────
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// ─── Page loader (skeleton enquanto carrega) ─────────────────────────────────
import { PageLoader } from "@/components/PageLoader";

// ─── Lazy imports — cada página vira um chunk separado ───────────────────────
const ShareViewPage          = lazy(() => import("./pages/ShareViewPage").then(m => ({ default: m.ShareViewPage })));
const NotFound               = lazy(() => import("./pages/NotFound"));

// UX / Discovery
const PesquisasPage          = lazy(() => import("./pages/UXPages").then(m => ({ default: m.PesquisasPage })));
const PersonasPage           = lazy(() => import("./pages/UXPages").then(m => ({ default: m.PersonasPage })));
const FluxosPage             = lazy(() => import("./pages/UXPages").then(m => ({ default: m.FluxosPage })));
const EmpathyMapPage         = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.EmpathyMapPage })));
const BenchmarkPage          = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.BenchmarkPage })));
const JTBDPage               = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.JTBDPage })));
const CSDMatrixPage          = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.CSDMatrixPage })));
const HMWPage                = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.HMWPage })));
const AffinityDiagramPage    = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.AffinityDiagramPage })));
const BehaviorModelPage      = lazy(() => import("./pages/BehaviorModelPage").then(m => ({ default: m.BehaviorModelPage })));
const UXPatternsPage         = lazy(() => import("./pages/UXPatternsPage"));
const InterviewTranscriberPage = lazy(() => import("./pages/InterviewPage").then(m => ({ default: m.InterviewTranscriberPage })));

// UX Writing
const ToneOfVoicePage        = lazy(() => import("./pages/UXWritingPages").then(m => ({ default: m.ToneOfVoicePage })));
const MicrocopyLibraryPage   = lazy(() => import("./pages/UXWritingPages").then(m => ({ default: m.MicrocopyLibraryPage })));
const ContentAuditPage       = lazy(() => import("./pages/UXWritingPages").then(m => ({ default: m.ContentAuditPage })));
const MicrocopyValidatorPage = lazy(() => import("./pages/MicrocopyValidatorPage").then(m => ({ default: m.MicrocopyValidatorPage })));

// Validation
const HeuristicEvalPage      = lazy(() => import("./pages/ValidationPages").then(m => ({ default: m.HeuristicEvalPage })));
const UsabilityTestPage      = lazy(() => import("./pages/ValidationPages").then(m => ({ default: m.UsabilityTestPage })));
const WCAGChecklistPage      = lazy(() => import("./pages/ValidationPages").then(m => ({ default: m.WCAGChecklistPage })));
const WCAGAuditorPage        = lazy(() => import("./pages/WCAGAuditorPage").then(m => ({ default: m.WCAGAuditorPage })));

// IA / IxD
const VisualSitemapPage      = lazy(() => import("./pages/VisualSitemapPage").then(m => ({ default: m.VisualSitemapPage })));
const CardSortingPage        = lazy(() => import("./pages/CardSortingPage").then(m => ({ default: m.CardSortingPage })));
const ComponentStatesPage    = lazy(() => import("./pages/InteractionDesignPages").then(m => ({ default: m.ComponentStatesPage })));
const TaskFlowsPage          = lazy(() => import("./pages/InteractionDesignPages").then(m => ({ default: m.TaskFlowsPage })));

// Strategy
const PrioritizationMatrixPage = lazy(() => import("./pages/StrategyPages").then(m => ({ default: m.PrioritizationMatrixPage })));
const SitemapPage            = lazy(() => import("./pages/StrategyPages").then(m => ({ default: m.SitemapPage })));
const BusinessModelCanvasPage = lazy(() => import("./pages/BusinessModelCanvasPage"));

// UI
const DesignSystemPage       = lazy(() => import("./pages/UIPages").then(m => ({ default: m.DesignSystemPage })));
const TelasPage              = lazy(() => import("./pages/UIPages").then(m => ({ default: m.TelasPage })));
const HandoffPage            = lazy(() => import("./pages/UIPages").then(m => ({ default: m.HandoffPage })));
const DesignSystemHubPage    = lazy(() => import("./pages/DesignSystemHubPage").then(m => ({ default: m.DesignSystemHubPage })));
const VisualCheckerPage      = lazy(() => import("./pages/VisualCheckerPage").then(m => ({ default: m.VisualCheckerPage })));
const MotionGalleryPage      = lazy(() => import("./pages/MotionGalleryPage").then(m => ({ default: m.MotionGalleryPage })));
const SVGManagerPage         = lazy(() => import("./pages/SVGManagerPage").then(m => ({ default: m.SVGManagerPage })));

// Dev
const KanbanPage             = lazy(() => import("./pages/DevPages").then(m => ({ default: m.KanbanPage })));
const QAPage                 = lazy(() => import("./pages/DevPages").then(m => ({ default: m.QAPage })));
const TeamMetricsPage        = lazy(() => import("./pages/DevPages").then(m => ({ default: m.TeamMetricsPage })));

// Analytics & extras
const AnalyticsHubPage       = lazy(() => import("./pages/AnalyticsHubPage").then(m => ({ default: m.AnalyticsHubPage })));
const VoiceOfCustomerPage    = lazy(() => import("./pages/VoiceOfCustomerPage").then(m => ({ default: m.VoiceOfCustomerPage })));
const ABTestingPage          = lazy(() => import("./pages/ABTestingPage").then(m => ({ default: m.ABTestingPage })));
const ResponsiveAuditPage    = lazy(() => import("./pages/ResponsiveAuditPage").then(m => ({ default: m.ResponsiveAuditPage })));
const UXAnalysisPage         = lazy(() => import("./pages/UXAnalysisPage").then(m => ({ default: m.UXAnalysisPage })));
const EnhancedReportPage     = lazy(() => import("./pages/EnhancedReportPage").then(m => ({ default: m.EnhancedReportPage })));
const GitSyncHubPage         = lazy(() => import("./pages/GitSyncHubPage").then(m => ({ default: m.GitSyncHubPage })));
const AIDesignStudioPage     = lazy(() => import("./pages/AIStudioPage").then(m => ({ default: m.AIDesignStudioPage })));
const ConfigPage             = lazy(() => import("./pages/ConfigPage").then(m => ({ default: m.ConfigPage })));

// Research
const DiaryStudiesPage       = lazy(() => import("./pages/ResearchPages").then(m => ({ default: m.DiaryStudiesPage })));
const StakeholderMapPage     = lazy(() => import("./pages/ResearchPages").then(m => ({ default: m.StakeholderMapPage })));

// Metrics
const HEARTFrameworkPage     = lazy(() => import("./pages/MetricsPages").then(m => ({ default: m.HEARTFrameworkPage })));
const NorthStarPage          = lazy(() => import("./pages/MetricsPages").then(m => ({ default: m.NorthStarPage })));
const NPSSurveysPage         = lazy(() => import("./pages/MetricsPages").then(m => ({ default: m.NPSSurveysPage })));

// Product Management
const RoadmapPage            = lazy(() => import("./pages/ProductManagementPages").then(m => ({ default: m.RoadmapPage })));
const OKRsPage               = lazy(() => import("./pages/ProductManagementPages").then(m => ({ default: m.OKRsPage })));

// Knowledge
const DesignPrinciplesPage   = lazy(() => import("./pages/KnowledgePages").then(m => ({ default: m.DesignPrinciplesPage })));
const DecisionLogPage        = lazy(() => import("./pages/KnowledgePages").then(m => ({ default: m.DecisionLogPage })));
const DesignCritiquesPage    = lazy(() => import("./pages/KnowledgePages").then(m => ({ default: m.DesignCritiquesPage })));

// ─── QueryClient com configuração otimizada ───────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos de cache
      retry: 1,                  // apenas 1 retry em vez de 3
      refetchOnWindowFocus: false,
    },
  },
});

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/share/:token" element={<ShareViewPage />} />
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
                <Route path="/ux/interviews" element={<InterviewTranscriberPage />} />
                <Route path="/ux/personas" element={<PersonasPage />} />
                <Route path="/ux/empathy-map" element={<EmpathyMapPage />} />
                <Route path="/ux/benchmark" element={<BenchmarkPage />} />
                <Route path="/ux/jtbd" element={<JTBDPage />} />
                <Route path="/ux/csd" element={<CSDMatrixPage />} />
                <Route path="/ux/hmw" element={<HMWPage />} />
                <Route path="/ux/affinity" element={<AffinityDiagramPage />} />
                <Route path="/ux/behavior-model" element={<BehaviorModelPage />} />
                <Route path="/ux/patterns" element={<UXPatternsPage />} />
                <Route path="/ux/fluxos" element={<FluxosPage />} />
                <Route path="/ux/tone" element={<ToneOfVoicePage />} />
                <Route path="/ux/microcopy" element={<MicrocopyLibraryPage />} />
                <Route path="/ux/microcopy-validator" element={<MicrocopyValidatorPage />} />
                <Route path="/ux/content-audit" element={<ContentAuditPage />} />
                <Route path="/ux/heuristics" element={<HeuristicEvalPage />} />
                <Route path="/ux/usability-test" element={<UsabilityTestPage />} />
                <Route path="/ux/wcag" element={<WCAGChecklistPage />} />
                <Route path="/ux/wcag-auditor" element={<WCAGAuditorPage />} />
                <Route path="/ia/sitemap-visual" element={<VisualSitemapPage />} />
                <Route path="/ia/card-sorting" element={<CardSortingPage />} />
                <Route path="/ixd/states" element={<ComponentStatesPage />} />
                <Route path="/ixd/task-flows" element={<TaskFlowsPage />} />
                <Route path="/strategy/prioritization" element={<PrioritizationMatrixPage />} />
                <Route path="/strategy/sitemap" element={<SitemapPage />} />
                <Route path="/strategy/business-model" element={<BusinessModelCanvasPage />} />
                <Route path="/ui/design-system" element={<DesignSystemPage />} />
                <Route path="/ui/telas" element={<TelasPage />} />
                <Route path="/ui/ds-hub" element={<DesignSystemHubPage />} />
                <Route path="/ui/handoff" element={<HandoffPage />} />
                <Route path="/ui/visual-checker" element={<VisualCheckerPage />} />
                <Route path="/ui/motion-gallery" element={<MotionGalleryPage />} />
                <Route path="/ui/svg-manager" element={<SVGManagerPage />} />
                <Route path="/dev/kanban" element={<KanbanPage />} />
                <Route path="/dev/qa" element={<QAPage />} />
                <Route path="/dev/metricas" element={<TeamMetricsPage />} />
                <Route path="/analytics" element={<AnalyticsHubPage />} />
                <Route path="/voice-of-customer" element={<VoiceOfCustomerPage />} />
                <Route path="/ab-testing" element={<ABTestingPage />} />
                <Route path="/responsive-audit" element={<ResponsiveAuditPage />} />
                <Route path="/ux-analysis" element={<UXAnalysisPage />} />
                <Route path="/relatorio" element={<EnhancedReportPage />} />
                <Route path="/git-sync" element={<GitSyncHubPage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/research/diary-studies" element={<DiaryStudiesPage />} />
                <Route path="/research/stakeholder-map" element={<StakeholderMapPage />} />
                <Route path="/metrics/heart" element={<HEARTFrameworkPage />} />
                <Route path="/metrics/north-star" element={<NorthStarPage />} />
                <Route path="/metrics/nps" element={<NPSSurveysPage />} />
                <Route path="/product/roadmap" element={<RoadmapPage />} />
                <Route path="/product/okrs" element={<OKRsPage />} />
                <Route path="/knowledge/design-principles" element={<DesignPrinciplesPage />} />
                <Route path="/knowledge/decision-log" element={<DecisionLogPage />} />
                <Route path="/knowledge/design-critiques" element={<DesignCritiquesPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
