import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type ABExperiment = Tables<"ab_experiments">;

export function useABExperiments(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ab-experiments", projectId],
    queryFn: async () => {
      let q = supabase
        .from("ab_experiments")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        q = q.eq("project_id", projectId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ab-experiments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ab_experiments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ab-experiments"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useABResults(experimentId?: string) {
  return useQuery({
    queryKey: ["ab-results", experimentId],
    queryFn: async () => {
      if (!experimentId) return [];
      const { data, error } = await supabase
        .from("ab_results")
        .select("*")
        .eq("experiment_id", experimentId)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!experimentId,
  });
}

export function useCreateABExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (experiment: {
      name: string;
      description: string;
      hypothesis: string;
      traffic_allocation: number;
      variants: Record<string, unknown>[];
      success_metrics: Record<string, unknown>[];
      targeting_rules?: Record<string, unknown>;
    }) => {
      const { data: project } = await supabase.from("projects").select("id").limit(1).single();
      if (!project) throw new Error("Nenhum projeto encontrado");

      const { data, error } = await supabase
        .from("ab_experiments")
        .insert({
          ...experiment,
          variants: experiment.variants as unknown as Json,
          success_metrics: experiment.success_metrics as unknown as Json,
          targeting_rules: experiment.targeting_rules as unknown as Json,
          project_id: project.id,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ab-experiments"] }),
  });
}

export function useUpdateABExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"ab_experiments"> }) => {
      const { data, error } = await supabase
        .from("ab_experiments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ab-experiments"] }),
  });
}

export function useRecordABResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (result: {
      experiment_id: string;
      variant_id: string;
      event_type: string;
      event_value?: number;
      user_session: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("ab_results")
        .insert({
          ...result,
          metadata: result.metadata as unknown as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ab-results", vars.experiment_id] });
    },
  });
}

export function useDeleteABExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ab_experiments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ab-experiments"] }),
  });
}
