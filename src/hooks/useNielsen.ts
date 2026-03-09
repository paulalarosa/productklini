import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface NielsenHeuristic {
  id: string;
  project_id: string;
  heuristic_name: string;
  evaluation_notes: string;
  severity_level: number;
  recommendation: string;
  created_at: string;
}

export const useNielsen = (projectId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["nielsen_heuristics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("nielsen_heuristics")
        .select("*")
        .eq("project_id", projectId)
        .order("severity_level", { ascending: false });

      if (error) throw error;
      return data as NielsenHeuristic[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`nielsen_heuristics_changes_${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nielsen_heuristics", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["nielsen_heuristics", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useDeleteNielsen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("nielsen_heuristics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nielsen_heuristics"] });
      toast.success("Avaliação removida");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });
};
