
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Benchmark = any;
export type BenchmarkInsert = any;
export type BenchmarkUpdate = any;

export function useBenchmarks(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["benchmarks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase
        .from("benchmarks" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }) as any);

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
      const { data, error } = await (supabase
        .from("benchmarks" as any)
        .insert(benchmark)
        .select()
        .single() as any);

      if (error) throw error;
      return data as Benchmark;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", data.project_id] });
    },
  });
}

export function useUpdateBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BenchmarkUpdate }) => {
      const { data, error } = await (supabase
        .from("benchmarks" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single() as any);

      if (error) throw error;
      return data as Benchmark;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", data.project_id] });
    },
  });
}

export function useDeleteBenchmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await (supabase
        .from("benchmarks" as any)
        .delete()
        .eq("id", id) as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", variables.projectId] });
    },
  });
}
