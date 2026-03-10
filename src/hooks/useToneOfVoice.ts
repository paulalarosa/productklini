import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";

export type ToneOfVoice = Tables<"tone_of_voice">;

export function useToneOfVoice(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tone_of_voice", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("tone_of_voice")
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
      .channel("tone_of_voice-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tone_of_voice", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tone_of_voice", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useDeleteToneOfVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("tone_of_voice")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tone_of_voice"] });
    },
  });
}
