import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

type AchievementDefinition = Tables<"achievement_definitions">;
type UserProgress = Tables<"user_progress">;
type UserAchievement = Tables<"user_achievements">;
type UserPoints = Tables<"user_points">;

export function useAchievementDefinitions() {
  return useQuery({
    queryKey: ["achievement-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievement_definitions")
        .select("*")
        .order("points", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUserProgress(projectId?: string) {
  return useQuery({
    queryKey: ["user-progress", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("project_id", projectId)
        .order("last_activity", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUserAchievements(projectId?: string) {
  return useQuery({
    queryKey: ["user-achievements", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement_definitions:achievement_id (*)
        `)
        .eq("project_id", projectId)
        .order("earned_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUserPoints(projectId?: string) {
  return useQuery({
    queryKey: ["user-points", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      moduleName, 
      completionPercentage, 
      pointsEarned 
    }: {
      projectId: string;
      moduleName: string;
      completionPercentage: number;
      pointsEarned?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upsert progress
      const { data: progress, error: progressError } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          project_id: projectId,
          module_name: moduleName,
          completion_percentage: completionPercentage,
          points_earned: pointsEarned || 0,
          last_activity: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (progressError) throw progressError;

      // Update total points
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .maybeSingle();

      const newTotalPoints = (existingPoints?.total_points || 0) + (pointsEarned || 0);
      const newLevel = Math.floor(newTotalPoints / 1000) + 1;

      await supabase
        .from("user_points")
        .upsert({
          user_id: user.id,
          project_id: projectId,
          total_points: newTotalPoints,
          level: newLevel,
        });

      return progress;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-progress", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["user-points", variables.projectId] });
      
      if ((variables.pointsEarned || 0) > 0) {
        toast.success(`+${variables.pointsEarned} pontos!`, {
          description: `Módulo ${variables.moduleName} progrediu`,
        });
      }
    },
  });
}

export function useAwardAchievement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      projectId,
      achievementId,
      pointsAwarded
    }: {
      projectId: string;
      achievementId: string;
      pointsAwarded: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if achievement already exists
      const { data: existing } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .eq("achievement_id", achievementId)
        .maybeSingle();

      if (existing) {
        return existing; // Achievement already earned
      }

      // Award achievement
      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          project_id: projectId,
          achievement_id: achievementId,
          points_awarded: pointsAwarded,
        })
        .select(`
          *,
          achievement_definitions:achievement_id (*)
        `)
        .maybeSingle();

      if (error) throw error;

      // Update total points
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .maybeSingle();

      const newTotalPoints = (existingPoints?.total_points || 0) + pointsAwarded;
      const newLevel = Math.floor(newTotalPoints / 1000) + 1;

      await supabase
        .from("user_points")
        .upsert({
          user_id: user.id,
          project_id: projectId,
          total_points: newTotalPoints,
          level: newLevel,
        });

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["user-points", variables.projectId] });
      
      if (data && 'achievement_definitions' in data && data.achievement_definitions) {
        const achievement = data.achievement_definitions as AchievementDefinition;
        toast.success(`🏆 Conquista desbloqueada!`, {
          description: `${achievement.name} - +${variables.pointsAwarded} pontos`,
        });
      }
    },
  });
}

// Helper function to check for achievements
export const checkAndAwardAchievements = async (
  projectId: string,
  moduleName: string,
  completionPercentage: number
) => {
  // This would be implemented based on specific achievement criteria
  const achievements = [];
  
  // Example: First module completion
  if (completionPercentage >= 100) {
    achievements.push({
      achievementId: "first-module", // This would be the actual ID from the database
      pointsAwarded: 100,
    });
  }
  
  return achievements;
};