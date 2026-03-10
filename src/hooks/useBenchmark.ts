
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Benchmark = Tables<"benchmarks">;
export type BenchmarkInsert = TablesInsert<"benchmarks">;
export type BenchmarkUpdate = TablesUpdate<"benchmarks">;

export function useBenchmarks(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["benchmarks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("benchmarks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Benchmark[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel("benchmarks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "benchmarks", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["benchmarks", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, projectId]);

  return query;
}

export function useCreateBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (benchmark: BenchmarkInsert) => {
      const { data, error } = await supabase
        .from("benchmarks")
        .insert(benchmark)
        .select()
        .single();

      if (error) throw error;
      return data as Benchmark;
    },
    onSuccess: (data: Benchmark) => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", data.project_id] });
    },
  });
}

export function useUpdateBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BenchmarkUpdate }) => {
      const { data, error } = await supabase
        .from("benchmarks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Benchmark;
    },
    onSuccess: (data: Benchmark) => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", data.project_id] });
    },
  });
}

export function useDeleteBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("benchmarks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", variables.projectId] });
    },
  });
}
