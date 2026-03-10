
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type EmpathyMap = Tables<"empathy_maps">;
export type EmpathyMapInsert = TablesInsert<"empathy_maps">;
export type EmpathyMapUpdate = TablesUpdate<"empathy_maps">;

export function useEmpathyMaps(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["empathy-maps", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("empathy_maps")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

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
      const { data, error } = await supabase
        .from("empathy_maps")
        .insert(map)
        .select()
        .single();

      if (error) throw error;
      return data as EmpathyMap;
    },
    onSuccess: (data: EmpathyMap) => {
      queryClient.invalidateQueries({ queryKey: ["empathy-maps", data.project_id] });
    },
  });
}

export function useUpdateEmpathyMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EmpathyMapUpdate }) => {
      const { data, error } = await supabase
        .from("empathy_maps")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EmpathyMap;
    },
    onSuccess: (data: EmpathyMap) => {
      queryClient.invalidateQueries({ queryKey: ["empathy-maps", data.project_id] });
    },
  });
}

export function useDeleteEmpathyMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("empathy_maps")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empathy-maps", variables.projectId] });
    },
  });
}
