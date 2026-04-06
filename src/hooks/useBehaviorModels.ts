import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export interface BehaviorModel {
  id: string;
  project_id: string;
  behavior: string;
  description: string;
  motivation_level: string;
  motivation_score: number;
  motivation_factors: string[];
  ability_level: string;
  ability_score: number;
  ability_barriers: string[];
  prompt_type: string;
  prompt_timing: string;
  prompt_channel: string;
  prompt_score: number;
  behavior_probability: string;
  success_metrics: string[];
  target_audience: string;
  context: string;
  recommendations: Json;
  status: string;
  created_at: string;
  updated_at: string;
}

const calculateProbability = (motivation: number, ability: number, prompt: number) => {
  const totalScore = motivation + ability + prompt;
  if (totalScore >= 24) return "high";
  if (totalScore >= 15) return "medium";
  return "low";
};

const generateRecommendations = (motivation: number, ability: number, prompt: number) => {
  const recommendations = [];
  if (motivation < 7) {
    recommendations.push("Increase motivation by highlighting benefits or adding gamification.");
  }
  if (ability < 7) {
    recommendations.push("Simplify the task. Reduce required time, money, or physical effort.");
  }
  if (prompt < 7) {
    recommendations.push("Improve the prompt. Make it more visible, timely, or contextual.");
  }
  if (recommendations.length === 0) {
    recommendations.push("The behavior is highly likely to occur. Monitor and optimize.");
  }
  return recommendations;
};

export function useBehaviorModels(projectId?: string) {
  return useQuery({
    queryKey: ["behavior-models", projectId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase.from("behavior_models").select("*").order("created_at", { ascending: false });
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as BehaviorModel[];
    },
  });
}

export function useCreateBehaviorModel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (model: Partial<BehaviorModel>) => {
      // Ensure required fields are present
      if (!model.behavior) throw new Error("Behavior is required");
      
      const prob = calculateProbability(
        model.motivation_score || 5, 
        model.ability_score || 5, 
        model.prompt_score || 5
      );
      
      const recs = generateRecommendations(
        model.motivation_score || 5, 
        model.ability_score || 5, 
        model.prompt_score || 5
      );

      const { data, error } = await supabase
        .from("behavior_models")
        .insert({ 
          ...model,
          project_id: model.project_id as string,
          behavior: model.behavior,
          behavior_probability: prob, 
          recommendations: recs as unknown as Json
        })
        .select()
        .single();

      if (error) throw error;
      return data as BehaviorModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behavior-models"] });
      toast({ title: "Modelo criado", description: "O modelo de comportamento foi criado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateBehaviorModel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...model }: Partial<BehaviorModel> & { id: string }) => {
      const prob = calculateProbability(
        model.motivation_score || 5, 
        model.ability_score || 5, 
        model.prompt_score || 5
      );
      
      const recs = generateRecommendations(
        model.motivation_score || 5, 
        model.ability_score || 5, 
        model.prompt_score || 5
      );

      const { data, error } = await supabase
        .from("behavior_models")
        .update({
          ...model,
          behavior_probability: prob,
          recommendations: recs,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BehaviorModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behavior-models"] });
      toast({ title: "Modelo atualizado", description: "O modelo de comportamento foi atualizado." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteBehaviorModel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("behavior_models").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behavior-models"] });
      toast({ title: "Modelo excluído", description: "O modelo de comportamento foi excluído." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
