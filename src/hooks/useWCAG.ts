import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface WCAGAudit {
  id: string;
  project_id: string;
  guideline_reference: string;
  compliance_status: "Pass" | "Fail" | "Warning";
  issue_description: string;
  fix_suggestion: string;
  created_at: string;
}

export const useWCAG = (projectId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wcag_audits", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("wcag_audits")
        .select("*")
        .eq("project_id", projectId)
        .order("compliance_status", { ascending: true }); // Fails first? Depends on sorting logic

      if (error) throw error;
      return data as WCAGAudit[];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`wcag_audits_changes_${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wcag_audits", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wcag_audits", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
};

export const useDeleteWCAG = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("wcag_audits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wcag_audits"] });
      toast.success("Item de auditoria removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });
};
