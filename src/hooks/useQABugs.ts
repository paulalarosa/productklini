import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface QABug {
  id: string;
  project_id: string;
  bug_title: string;
  steps_to_reproduce: string;
  severity: "Baixa" | "Média" | "Alta" | "Crítica";
  status: "Aberto" | "Em Análise" | "Resolvido";
  created_at: string;
}

export const useQABugs = (projectId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["qa_bugs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("qa_bugs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as QABug[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`qa_bugs_changes_${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qa_bugs", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["qa_bugs", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useUpdateBugStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QABug["status"] }) => {
      const { error } = await supabase.from("qa_bugs").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa_bugs"] });
      toast.success("Status atualizado");
    },
  });
};

export const useDeleteBug = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("qa_bugs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qa_bugs"] });
      toast.success("Bug removido");
    },
  });
};
