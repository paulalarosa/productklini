
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type JTBD = Tables<"jtbd_frameworks">;
export type JTBDInsert = TablesInsert<"jtbd_frameworks">;

export function useJTBD(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["jtbd", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("jtbd_frameworks")
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
      .channel("jtbd-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jtbd_frameworks", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["jtbd", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, projectId]);

  return query;
}

export function useDeleteJTBD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("jtbd_frameworks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidation handled by realtime or manually if needed
    },
  });
}
