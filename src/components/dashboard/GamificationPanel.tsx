import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, Star, Target, TrendingUp, Award, Crown, 
  Users, Search, Lightbulb, Code, Rocket, BarChart,
  Grid, ChevronRight
} from "lucide-react";
import { useUserPoints, useUserAchievements, useUserProgress, useAchievementDefinitions } from "@/hooks/useGamification";
import { useProject } from "@/hooks/useProjectData";

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  crown: Crown,
  users: Users,
  search: Search,
  lightbulb: Lightbulb,
  code: Code,
  rocket: Rocket,
  'bar-chart': BarChart,
  grid: Grid,
  compass: Search,
};

interface GamificationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function GamificationPanel({ isOpen, onToggle }: GamificationPanelProps) {
  const { data: project } = useProject();
  const { data: userPoints } = useUserPoints(project?.id);
  const { data: userAchievements } = useUserAchievements(project?.id);
  const { data: userProgress } = useUserProgress(project?.id);
  const { data: achievementDefinitions } = useAchievementDefinitions();

  const calculateOverallProgress = () => {
    if (!userProgress || userProgress.length === 0) return 0;
    const totalCompletion = userProgress.reduce((acc, prog) => acc + prog.completion_percentage, 0);
    return Math.round(totalCompletion / userProgress.length);
  };

  const getNextLevelPoints = () => {
    const currentLevel = userPoints?.level || 1;
    return currentLevel * 1000;
  };

  const getCurrentLevelProgress = () => {
    const totalPoints = userPoints?.total_points || 0;
    const currentLevel = userPoints?.level || 1;
    const pointsInCurrentLevel = totalPoints - ((currentLevel - 1) * 1000);
    return Math.max(0, Math.min(100, (pointsInCurrentLevel / 1000) * 100));
  };

  const getAvailableAchievements = () => {
    if (!achievementDefinitions || !userAchievements) return [];
    
    const earnedIds = userAchievements.map(ua => ua.achievement_id);
    return achievementDefinitions.filter(def => !earnedIds.includes(def.id));
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Trophy;
    return IconComponent;
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "calc(100% - 60px)" }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
      >
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="h-12 w-12 rounded-l-xl rounded-r-none bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Trophy className="w-5 h-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-2xl z-50 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Progresso</h2>
        </div>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Level and Points */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Level {userPoints?.level || 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{userPoints?.total_points || 0} pontos</span>
                <span>{getNextLevelPoints()} para próximo nível</span>
              </div>
              <Progress value={getCurrentLevelProgress()} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                Progresso geral: {calculateOverallProgress()}%
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="achievements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs">
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
              <TabsTrigger value="progress">Progresso</TabsTrigger>
              <TabsTrigger value="available">Disponíveis</TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="space-y-3 mt-4">
              {userAchievements && userAchievements.length > 0 ? (
                userAchievements.map((achievement) => {
                  const def = achievement.achievement_definitions as any;
                  const IconComponent = getIconComponent(def?.icon || 'trophy');
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-l-4" style={{ borderLeftColor: def?.badge_color || '#FFD700' }}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${def?.badge_color || '#FFD700'}20` }}
                            >
                              <IconComponent className="w-5 h-5" style={{ color: def?.badge_color || '#FFD700' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{def?.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{def?.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  +{achievement.points_awarded} pts
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(achievement.earned_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma conquista ainda</p>
                  <p className="text-xs">Complete módulos para desbloquear!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="progress" className="space-y-3 mt-4">
              {userProgress && userProgress.length > 0 ? (
                userProgress.map((progress) => (
                  <Card key={progress.id}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm capitalize">
                            {progress.module_name.replace('_', ' ')}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {progress.completion_percentage}%
                          </Badge>
                        </div>
                        <Progress value={progress.completion_percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.points_earned} pontos</span>
                          <span>
                            {new Date(progress.last_activity).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum progresso ainda</p>
                  <p className="text-xs">Comece um módulo para ver aqui!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-3 mt-4">
              {getAvailableAchievements().map((achievement) => {
                const IconComponent = getIconComponent(achievement.icon);
                
                return (
                  <Card key={achievement.id} className="opacity-75">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed"
                          style={{ borderColor: achievement.badge_color }}
                        >
                          <IconComponent className="w-5 h-5 opacity-50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {achievement.points} pontos
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </motion.div>
  );
}