import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface UsabilityTest {
  id: string;
  project_id: string;
  task_description: string;
  success_rate_percentage: number;
  user_feedback: string;
  key_observations: string;
  created_at: string;
}

export const useUsabilityTest = (projectId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["usability_tests", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("usability_tests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UsabilityTest[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`usability_tests_changes_${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usability_tests", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["usability_tests", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useDeleteUsabilityTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("usability_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usability_tests"] });
      toast.success("Resultado removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });
};
