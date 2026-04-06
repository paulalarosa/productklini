import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const ShareViewPage          = lazy(() => import("./pages/ShareViewPage").then(m => ({ default: m.ShareViewPage as unknown as React.ComponentType<unknown> })));
const NotFound               = lazy(() => import("./pages/NotFound").then(m => ({ default: m.default as unknown as React.ComponentType<unknown> })));

// UX / Discovery
const PesquisasPage          = lazy(() => import("./pages/UXPages").then(m => ({ default: m.PesquisasPage as unknown as React.ComponentType<unknown> })));
const PersonasPage           = lazy(() => import("./pages/UXPages").then(m => ({ default: m.PersonasPage as unknown as React.ComponentType<unknown> })));
const FluxosPage             = lazy(() => import("./pages/UXPages").then(m => ({ default: m.FluxosPage as unknown as React.ComponentType<unknown> })));
const EmpathyMapPage         = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.EmpathyMapPage as unknown as React.ComponentType<unknown> })));
const BenchmarkPage          = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.BenchmarkPage as unknown as React.ComponentType<unknown> })));
const JTBDPage               = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.JTBDPage as unknown as React.ComponentType<unknown> })));
const CSDMatrixPage          = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.CSDMatrixPage as unknown as React.ComponentType<unknown> })));
const HMWPage                = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.HMWPage as unknown as React.ComponentType<unknown> })));
const AffinityDiagramPage    = lazy(() => import("./pages/DiscoveryPages").then(m => ({ default: m.AffinityDiagramPage as unknown as React.ComponentType<unknown> })));
const BehaviorModelPage      = lazy(() => import("./pages/BehaviorModelPage").then(m => ({ default: m.BehaviorModelPage as unknown as React.ComponentType<unknown> })));
const UXPatternsPage         = lazy(() => import("./pages/UXPatternsPage").then(m => ({ default: m.default as unknown as React.ComponentType<unknown> })));
const InterviewTranscriberPage = lazy(() => import("./pages/InterviewPage").then(m => ({ default: m.InterviewTranscriberPage as unknown as React.ComponentType<unknown> })));




// UX Writing
const ToneOfVoicePage        = lazy(() => import("./pages/UXWritingPages").then(m => ({ default: m.ToneOfVoicePage as unknown as React.ComponentType<unknown> })));
const MicrocopyLibraryPage   = lazy(() => import("./pages/UXWritingPages").then(m => ({ default: m.MicrocopyLibraryPage as unknown as React.ComponentType<unknown> })));
const ContentAuditPage       = lazy(() => import("./pages/UXWritingPages").then(m => ({ default: m.ContentAuditPage as unknown as React.ComponentType<unknown> })));
const MicrocopyValidatorPage = lazy(() => import("./pages/MicrocopyValidatorPage").then(m => ({ default: m.MicrocopyValidatorPage as unknown as React.ComponentType<unknown> })));

// Validation
const HeuristicEvalPage      = lazy(() => import("./pages/ValidationPages").then(m => ({ default: m.HeuristicEvalPage as unknown as React.ComponentType<unknown> })));
const UsabilityTestPage      = lazy(() => import("./pages/ValidationPages").then(m => ({ default: m.UsabilityTestPage as unknown as React.ComponentType<unknown> })));
const WCAGChecklistPage      = lazy(() => import("./pages/ValidationPages").then(m => ({ default: m.WCAGChecklistPage as unknown as React.ComponentType<unknown> })));

// IA / IxD

const VisualSitemapPage      = lazy(() => import("./pages/VisualSitemapPage").then(m => ({ default: m.VisualSitemapPage as unknown as React.ComponentType<unknown> })));
const CardSortingPage        = lazy(() => import("./pages/CardSortingPage").then(m => ({ default: m.CardSortingPage as unknown as React.ComponentType<unknown> })));
const ComponentStatesPage    = lazy(() => import("./pages/InteractionDesignPages").then(m => ({ default: m.ComponentStatesPage as unknown as React.ComponentType<unknown> })));
const TaskFlowsPage          = lazy(() => import("./pages/InteractionDesignPages").then(m => ({ default: m.TaskFlowsPage as unknown as React.ComponentType<unknown> })));

// Strategy
const PrioritizationMatrixPage = lazy(() => import("./pages/StrategyPages").then(m => ({ default: m.PrioritizationMatrixPage as unknown as React.ComponentType<unknown> })));
const SitemapPage            = lazy(() => import("./pages/StrategyPages").then(m => ({ default: m.SitemapPage as unknown as React.ComponentType<unknown> })));
const BusinessModelCanvasPage = lazy(() => import("./pages/BusinessModelCanvasPage").then(m => ({ default: m.default as unknown as React.ComponentType<unknown> })));



// UI
const DesignSystemPage       = lazy(() => import("./pages/UIPages").then(m => ({ default: m.DesignSystemPage as unknown as React.ComponentType<unknown> })));
const TelasPage              = lazy(() => import("./pages/UIPages").then(m => ({ default: m.TelasPage as unknown as React.ComponentType<unknown> })));
const HandoffPage            = lazy(() => import("./pages/UIPages").then(m => ({ default: m.HandoffPage as unknown as React.ComponentType<unknown> })));
const DesignSystemHubPage    = lazy(() => import("./pages/DesignSystemHubPage").then(m => ({ default: m.DesignSystemHubPage as unknown as React.ComponentType<unknown> })));
const VisualCheckerPage      = lazy(() => import("./pages/VisualCheckerPage").then(m => ({ default: m.VisualCheckerPage as unknown as React.ComponentType<unknown> })));
const MotionGalleryPage      = lazy(() => import("./pages/MotionGalleryPage").then(m => ({ default: m.MotionGalleryPage as unknown as React.ComponentType<unknown> })));
const SVGManagerPage         = lazy(() => import("./pages/SVGManagerPage").then(m => ({ default: m.SVGManagerPage as unknown as React.ComponentType<unknown> })));
const WCAGAuditorPage        = lazy(() => import("./pages/WCAGAuditorPage").then(m => ({ default: m.WCAGAuditorPage as unknown as React.ComponentType<unknown> })));

// Analytics & Insights
const AnalyticsHubPage       = lazy(() => import("./pages/AnalyticsHubPage").then(m => ({ default: m.AnalyticsHubPage as unknown as React.ComponentType<unknown> })));
const VoiceOfCustomerPage    = lazy(() => import("./pages/VoiceOfCustomerPage").then(m => ({ default: m.VoiceOfCustomerPage as unknown as React.ComponentType<unknown> })));
const ABTestingPage          = lazy(() => import("./pages/ABTestingPage").then(m => ({ default: m.ABTestingPage as unknown as React.ComponentType<unknown> })));


const ResponsiveAuditPage    = lazy(() => import("./pages/ResponsiveAuditPage").then(m => ({ default: m.ResponsiveAuditPage as unknown as React.ComponentType<unknown> })));
const UXAnalysisPage         = lazy(() => import("./pages/UXAnalysisPage").then(m => ({ default: m.UXAnalysisPage as unknown as React.ComponentType<unknown> })));
const EnhancedReportPage     = lazy(() => import("./pages/EnhancedReportPage").then(m => ({ default: m.EnhancedReportPage as unknown as React.ComponentType<unknown> })));
const GitSyncHubPage         = lazy(() => import("./pages/GitSyncHubPage").then(m => ({ default: m.GitSyncHubPage as unknown as React.ComponentType<unknown> })));
const AIDesignStudioPage     = lazy(() => import("./pages/AIStudioPage").then(m => ({ default: m.AIDesignStudioPage as unknown as React.ComponentType<unknown> })));
const ConfigPage             = lazy(() => import("./pages/ConfigPage").then(m => ({ default: m.ConfigPage as unknown as React.ComponentType<unknown> })));

// Research
const DiaryStudiesPage       = lazy(() => import("./pages/ResearchPages").then(m => ({ default: m.DiaryStudiesPage as unknown as React.ComponentType<unknown> })));
const StakeholderMapPage     = lazy(() => import("./pages/ResearchPages").then(m => ({ default: m.StakeholderMapPage as unknown as React.ComponentType<unknown> })));

// Metrics
const HEARTFrameworkPage     = lazy(() => import("./pages/MetricsPages").then(m => ({ default: m.HEARTFrameworkPage as unknown as React.ComponentType<unknown> })));
const NorthStarPage          = lazy(() => import("./pages/MetricsPages").then(m => ({ default: m.NorthStarPage as unknown as React.ComponentType<unknown> })));
const NPSSurveysPage         = lazy(() => import("./pages/MetricsPages").then(m => ({ default: m.NPSSurveysPage as unknown as React.ComponentType<unknown> })));


// Product Management
const RoadmapPage            = lazy(() => import("./pages/ProductManagementPages").then(m => ({ default: m.RoadmapPage as unknown as React.ComponentType<unknown> })));
const OKRsPage               = lazy(() => import("./pages/ProductManagementPages").then(m => ({ default: m.OKRsPage as unknown as React.ComponentType<unknown> })));

// Dev
const KanbanPage             = lazy(() => import("./pages/DevPages").then(m => ({ default: m.KanbanPage as unknown as React.ComponentType<unknown> })));
const QAPage                 = lazy(() => import("./pages/DevPages").then(m => ({ default: m.QAPage as unknown as React.ComponentType<unknown> })));
const TeamMetricsPage        = lazy(() => import("./pages/DevPages").then(m => ({ default: m.TeamMetricsPage as unknown as React.ComponentType<unknown> })));


// Knowledge
const DesignPrinciplesPage   = lazy(() => import("./pages/KnowledgePages").then(m => ({ default: m.DesignPrinciplesPage as unknown as React.ComponentType<unknown> })));
const DecisionLogPage        = lazy(() => import("./pages/KnowledgePages").then(m => ({ default: m.DecisionLogPage as unknown as React.ComponentType<unknown> })));
const DesignCritiquesPage    = lazy(() => import("./pages/KnowledgePages").then(m => ({ default: m.DesignCritiquesPage as unknown as React.ComponentType<unknown> })));

// Design & Prototyping
const UserFlowEditorPage     = lazy(() => import("./pages/DesignPrototypingPages").then(m => ({ default: m.UserFlowEditorPage as unknown as React.ComponentType<unknown> })));
const MoodboardPage          = lazy(() => import("./pages/DesignPrototypingPages").then(m => ({ default: m.MoodboardPage as unknown as React.ComponentType<unknown> })));
const ImpactEffortPage       = lazy(() => import("./pages/DesignPrototypingPages").then(m => ({ default: m.ImpactEffortPage as unknown as React.ComponentType<unknown> })));

// Testing & Validation (new)
const FeatureFlagsPage       = lazy(() => import("./pages/TestingValidationPages").then(m => ({ default: m.FeatureFlagsPage as unknown as React.ComponentType<unknown> })));
const HeatmapViewerPage      = lazy(() => import("./pages/TestingValidationPages").then(m => ({ default: m.HeatmapViewerPage as unknown as React.ComponentType<unknown> })));
const SessionRecordingPage   = lazy(() => import("./pages/TestingValidationPages").then(m => ({ default: m.SessionRecordingPage as unknown as React.ComponentType<unknown> })));

// Competitive
const CompetitiveLandscapePage = lazy(() => import("./pages/CompetitiveLandscapePage").then(m => ({ default: m.CompetitiveLandscapePage as unknown as React.ComponentType<unknown> })));

// New modules
const CustomerJourneyPage    = lazy(() => import("./pages/CustomerJourneyPage").then(m => ({ default: m.CustomerJourneyPage as unknown as React.ComponentType<unknown> })));
const SprintRetroPage        = lazy(() => import("./pages/SprintRetroPage").then(m => ({ default: m.SprintRetroPage as unknown as React.ComponentType<unknown> })));
const RiskRegisterPage       = lazy(() => import("./pages/RiskRegisterPage").then(m => ({ default: m.RiskRegisterPage as unknown as React.ComponentType<unknown> })));
const DesignHandoffSpecsPage = lazy(() => import("./pages/DesignHandoffPage").then(m => ({ default: m.DesignHandoffPage as unknown as React.ComponentType<unknown> })));
const AccessibilityScorePage = lazy(() => import("./pages/AccessibilityScorePage").then(m => ({ default: m.AccessibilityScorePage as unknown as React.ComponentType<unknown> })));
const ComponentAnalyticsPage = lazy(() => import("./pages/ComponentAnalyticsPage").then(m => ({ default: m.ComponentAnalyticsPage as unknown as React.ComponentType<unknown> })));
const ProductPipelinePage    = lazy(() => import("./pages/ProductPipelinePage").then(m => ({ default: m.ProductPipelinePage as unknown as React.ComponentType<unknown> })));
const StrategicContextPage   = lazy(() => import("./pages/StrategicContextPage").then(m => ({ default: m.StrategicContextPage as unknown as React.ComponentType<unknown> })));

// New modules (etapa 2)
const ResearchRepositoryPage  = lazy(() => import("./pages/ResearchRepositoryPage").then(m => ({ default: m.ResearchRepositoryPage as unknown as React.ComponentType<unknown> })));
const AcceptanceCriteriaPage  = lazy(() => import("./pages/AcceptanceCriteriaPage").then(m => ({ default: m.AcceptanceCriteriaPage as unknown as React.ComponentType<unknown> })));
const ReleaseNotesPage        = lazy(() => import("./pages/ReleaseNotesPage").then(m => ({ default: m.ReleaseNotesPage as unknown as React.ComponentType<unknown> })));

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
                <Route path="/knowledge/competitive-landscape" element={<CompetitiveLandscapePage />} />
                <Route path="/design/user-flows" element={<UserFlowEditorPage />} />
                <Route path="/design/moodboard" element={<MoodboardPage />} />
                <Route path="/strategy/impact-effort" element={<ImpactEffortPage />} />
                <Route path="/testing/feature-flags" element={<FeatureFlagsPage />} />
                <Route path="/testing/heatmap" element={<HeatmapViewerPage />} />
                <Route path="/testing/session-recording" element={<SessionRecordingPage />} />
                <Route path="/product/customer-journey" element={<CustomerJourneyPage />} />
                <Route path="/product/sprint-retro" element={<SprintRetroPage />} />
                <Route path="/product/risk-register" element={<RiskRegisterPage />} />
                <Route path="/product/design-handoff" element={<DesignHandoffSpecsPage />} />
                <Route path="/testing/accessibility-score" element={<AccessibilityScorePage />} />
                <Route path="/testing/component-analytics" element={<ComponentAnalyticsPage />} />
                <Route path="/pipeline" element={<ProductPipelinePage />} />
                <Route path="/strategy/strategic-context" element={<Navigate to="/pipeline" replace />} />
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
