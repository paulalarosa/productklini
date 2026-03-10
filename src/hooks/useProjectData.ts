import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProject, fetchTasks, fetchTeamMembers, fetchPersonas, fetchUxMetrics, fetchDocuments, fetchAllDocuments } from "@/lib/api";
export type { Persona } from "@/lib/api";

export function useProject() {
  return useQuery({ queryKey: ["project"], queryFn: fetchProject });
}

export function useTasks() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });

  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useTeamMembers() {
  return useQuery({ queryKey: ["team-members"], queryFn: fetchTeamMembers });
}

export function usePersonas() {
  return useQuery({ queryKey: ["personas"], queryFn: fetchPersonas });
}

export function useUxMetrics() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["ux-metrics"], queryFn: fetchUxMetrics });

  useEffect(() => {
    const channel = supabase
      .channel("ux-metrics-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ux_metrics" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ux-metrics"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useDocuments(docType?: string) {
  const queryClient = useQueryClient();
  const queryKey = docType ? ["documents", docType] : ["documents"];
  const query = useQuery({
    queryKey,
    queryFn: () => docType ? fetchDocuments(docType) : fetchAllDocuments(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("docs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "project_documents" }, () => {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}
