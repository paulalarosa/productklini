import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";

export type CardSorting = Tables<"card_sorting">;

export function useCardSorting(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["card_sorting", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("card_sorting")
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
      .channel("card_sorting-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "card_sorting", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["card_sorting", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useDeleteCardSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("card_sorting")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card_sorting"] });
    },
  });
}
