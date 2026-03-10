
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import type { Tables } from "@/integrations/supabase/types";

export type HMW = Tables<"hmw_questions">;

export function useHMW(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["hmw", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("hmw_questions")
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
      .channel("hmw-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hmw_questions", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hmw", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, projectId]);

  return query;
}

export function useDeleteHMW() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("hmw_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
  });
}
