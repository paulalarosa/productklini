import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useSitemap(projectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sitemaps", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("sitemaps" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("hierarchy_level", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel("sitemaps-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sitemaps" as any, filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sitemaps", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useDeleteSitemap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("sitemaps" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sitemaps"] });
    },
  });
}
