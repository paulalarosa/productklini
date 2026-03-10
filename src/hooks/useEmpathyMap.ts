
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EmpathyMap = any;
export type EmpathyMapInsert = any;
export type EmpathyMapUpdate = any;

export function useEmpathyMaps(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["empathy-maps", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase
        .from("empathy_maps" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      return data as EmpathyMap[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel("empathy-maps-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "empathy_maps", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["empathy-maps", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, projectId]);

  return query;
}

export function useCreateEmpathyMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (map: EmpathyMapInsert) => {
      const { data, error } = await (supabase
        .from("empathy_maps" as any)
        .insert(map)
        .select()
        .single() as any);

      if (error) throw error;
      return data as EmpathyMap;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["empathy-maps", data.project_id] });
    },
  });
}

export function useUpdateEmpathyMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EmpathyMapUpdate }) => {
      const { data, error } = await (supabase
        .from("empathy_maps" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single() as any);

      if (error) throw error;
      return data as EmpathyMap;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["empathy-maps", data.project_id] });
    },
  });
}

export function useDeleteEmpathyMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await (supabase
        .from("empathy_maps" as any)
        .delete()
        .eq("id", id) as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empathy-maps", variables.projectId] });
    },
  });
}
