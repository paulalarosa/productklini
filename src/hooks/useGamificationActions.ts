import { useCallback } from 'react';
import { useUpdateProgress, useAwardAchievement } from './useGamification';
import { useProject } from './useProjectData';
import { toast } from 'sonner';

export function useGamificationActions() {
  const { data: project } = useProject();
  const updateProgress = useUpdateProgress();
  const awardAchievement = useAwardAchievement();

  const trackModuleProgress = useCallback(async (
    moduleName: string,
    completionPercentage: number,
    pointsEarned: number = 10
  ) => {
    if (!project?.id) return;

    try {
      await updateProgress.mutateAsync({
        projectId: project.id,
        moduleName,
        completionPercentage,
        pointsEarned,
      });

      // Check for achievements
      if (completionPercentage >= 100) {
        // First module completion
        if (moduleName === 'primeiro_modulo') {
          await awardAchievement.mutateAsync({
            projectId: project.id,
            achievementId: '1', // This would be the actual ID from the database
            pointsAwarded: 100,
          });
        }
      }
    } catch (error) {
      console.error('Error tracking gamification:', error);
    }
  }, [project?.id, updateProgress, awardAchievement]);

  const trackPersonaCreation = useCallback(async () => {
    if (!project?.id) return;

    try {
      await updateProgress.mutateAsync({
        projectId: project.id,
        moduleName: 'personas',
        completionPercentage: 20,
        pointsEarned: 25,
      });
    } catch (error) {
      console.error('Error tracking persona creation:', error);
    }
  }, [project?.id, updateProgress]);

  const trackPatternApplication = useCallback(async (patternName: string) => {
    if (!project?.id) return;

    try {
      await updateProgress.mutateAsync({
        projectId: project.id,
        moduleName: 'ux_patterns',
        completionPercentage: 10,
        pointsEarned: 15,
      });

      toast.success(`+15 pontos por aplicar "${patternName}"!`);
    } catch (error) {
      console.error('Error tracking pattern application:', error);
    }
  }, [project?.id, updateProgress]);

  const trackCanvasDesignCreation = useCallback(async () => {
    if (!project?.id) return;

    try {
      await updateProgress.mutateAsync({
        projectId: project.id,
        moduleName: 'design_canvas',
        completionPercentage: 15,
        pointsEarned: 20,
      });
    } catch (error) {
      console.error('Error tracking canvas design:', error);
    }
  }, [project?.id, updateProgress]);

  const trackBusinessModelCanvasCompletion = useCallback(async () => {
    if (!project?.id) return;

    try {
      await updateProgress.mutateAsync({
        projectId: project.id,
        moduleName: 'business_model_canvas',
        completionPercentage: 100,
        pointsEarned: 50,
      });
    } catch (error) {
      console.error('Error tracking BMC completion:', error);
    }
  }, [project?.id, updateProgress]);

  const trackBehaviorModelCreation = useCallback(async () => {
    if (!project?.id) return;

    try {
      await updateProgress.mutateAsync({
        projectId: project.id,
        moduleName: 'behavior_models',
        completionPercentage: 25,
        pointsEarned: 30,
      });
    } catch (error) {
      console.error('Error tracking behavior model:', error);
    }
  }, [project?.id, updateProgress]);

  return {
    trackModuleProgress,
    trackPersonaCreation,
    trackPatternApplication,
    trackCanvasDesignCreation,
    trackBusinessModelCanvasCompletion,
    trackBehaviorModelCreation,
  };
}