import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";

export type Microcopy = Tables<"microcopy_inventory">;

export function useMicrocopy(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["microcopy_inventory", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("microcopy_inventory")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel("microcopy-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "microcopy_inventory", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["microcopy_inventory", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useDeleteMicrocopy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("microcopy_inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["microcopy_inventory"] });
    },
  });
}
