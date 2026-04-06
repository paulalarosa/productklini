import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProject,
  fetchTasks,
  fetchTeamMembers,
  fetchPersonas,
  fetchUxMetrics,
  fetchDocuments,
  fetchAllDocuments,
  fetchAppReviews,
  fetchAnalyticsSnapshots,
  fetchFunnelSteps,
  fetchDesignTokens,
  fetchTokenHistory,
  fetchAiMessages,
  fetchNotifications,
} from "@/lib/api";

export type { Persona } from "@/lib/api";

// ─── Configurações de cache por tipo de dado ──────────────────────────────────
// Dados que mudam pouco → cache longo. Dados em tempo real → sem stale.
const STALE = {
  static:   10 * 60 * 1000,  // 10 min — projeto, personas, membros
  realtime:  0,              //  0 min — tasks, métricas (invalidadas via Supabase)
  documents: 2 * 60 * 1000,  //  2 min — documentos
} as const;

// ─── Hook genérico de realtime ────────────────────────────────────────────────
// Exportado para uso em componentes externos (ex: NotificationsPanel)
// que precisam de realtime mas vivem fora deste arquivo.
export function useRealtimeInvalidation(
  table: string,
  channelName: string,
  queryKey: unknown[],
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // channelName e table são strings estáticas nos nossos hooks públicos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);
}

// ─── Hooks públicos ───────────────────────────────────────────────────────────

export function useProject() {
  return useQuery({
    queryKey: ["project"],
    queryFn: fetchProject,
    staleTime: STALE.static,
  });
}

export function useTasks() {
  useRealtimeInvalidation("tasks", "tasks-realtime", ["tasks"]);

  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: STALE.realtime,
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: fetchTeamMembers,
    staleTime: STALE.static,
  });
}

export function usePersonas() {
  return useQuery({
    queryKey: ["personas"],
    queryFn: fetchPersonas,
    staleTime: STALE.static,
  });
}

export function useUxMetrics() {
  useRealtimeInvalidation("ux_metrics", "ux-metrics-realtime", ["ux-metrics"]);

  return useQuery({
    queryKey: ["ux-metrics"],
    queryFn: fetchUxMetrics,
    staleTime: STALE.realtime,
  });
}

export function useDocuments(docType?: string) {
  useRealtimeInvalidation("project_documents", "docs-realtime", ["documents"]);

  const queryKey = docType ? ["documents", docType] : ["documents"];

  return useQuery({
    queryKey,
    queryFn: () => (docType ? fetchDocuments(docType) : fetchAllDocuments()),
    staleTime: STALE.documents,
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────
// Realtime útil: reviews chegam via scraping/import e devem aparecer
// imediatamente para todos os membros do time que têm a página aberta.

export function useAppReviews() {
  useRealtimeInvalidation("app_reviews", "reviews-realtime", ["app-reviews"]);

  return useQuery({
    queryKey: ["app-reviews"],
    queryFn: fetchAppReviews,
    staleTime: STALE.realtime,
  });
}

export function useAnalyticsSnapshots() {
  useRealtimeInvalidation("analytics_snapshots", "analytics-realtime", ["analytics-snapshots"]);

  return useQuery({
    queryKey: ["analytics-snapshots"],
    queryFn: fetchAnalyticsSnapshots,
    staleTime: STALE.realtime,
  });
}

export function useFunnelSteps() {
  return useQuery({
    queryKey: ["funnel-steps"],
    queryFn: fetchFunnelSteps,
    staleTime: STALE.static, // funil muda raramente — sem realtime necessário
  });
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Realtime crítico: quando um designer atualiza um token no DS Hub,
// todos os outros membros do time precisam ver a mudança na hora.

export function useDesignTokens() {
  useRealtimeInvalidation("design_tokens", "tokens-realtime", ["design-tokens"]);

  return useQuery({
    queryKey: ["design-tokens"],
    queryFn: fetchDesignTokens,
    staleTime: STALE.realtime,
  });
}

export function useTokenHistory() {
  useRealtimeInvalidation("design_token_history", "token-history-realtime", ["token-history"]);

  return useQuery({
    queryKey: ["token-history"],
    queryFn: fetchTokenHistory,
    staleTime: STALE.realtime,
  });
}

// ─── Personas ─────────────────────────────────────────────────────────────────
// Realtime útil: personas são editadas colaborativamente durante workshops.

export function usePersonasRealtime() {
  useRealtimeInvalidation("personas", "personas-realtime", ["personas"]);

  return useQuery({
    queryKey: ["personas"],
    queryFn: fetchPersonas,
    staleTime: STALE.realtime,
  });
}

// ─── AI Messages ──────────────────────────────────────────────────────────────
// Realtime essencial: o painel de AI Mentor precisa mostrar respostas
// assim que chegam, sem o usuário precisar recarregar.

export function useAiMessages() {
  useRealtimeInvalidation("ai_messages", "ai-messages-realtime", ["ai-messages"]);

  return useQuery({
    queryKey: ["ai-messages"],
    queryFn: fetchAiMessages,
    staleTime: STALE.realtime,
  });
}

export function useNotifications() {
  useRealtimeInvalidation("notifications", "notifications-realtime", ["notifications"]);

  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: STALE.realtime,
  });
}
