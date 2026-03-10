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
  Grid, ChevronRight, X
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
        animate={{ x: "calc(100% - 48px)" }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:block"
      >
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-l-xl rounded-r-none bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Trophy className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onToggle}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed right-0 top-0 h-[100dvh] w-full max-w-[320px] bg-background border-l shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-3 md:p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Progresso</h2>
          </div>
          <Button onClick={onToggle} variant="ghost" size="sm" className="w-8 h-8 p-0">
            <X className="w-4 h-4 md:hidden" />
            <ChevronRight className="w-4 h-4 hidden md:block" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-3 md:p-4">
          <div className="space-y-3">
            {/* Level and Points */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Level {userPoints?.level || 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="flex justify-between text-xs">
                  <span>{userPoints?.total_points || 0} pts</span>
                  <span>{getNextLevelPoints()} próx.</span>
                </div>
                <Progress value={getCurrentLevelProgress()} className="h-2" />
                <div className="text-[10px] text-muted-foreground text-center">
                  Progresso geral: {calculateOverallProgress()}%
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="achievements" className="w-full">
              <TabsList className="grid w-full grid-cols-3 text-[10px] h-8">
                <TabsTrigger value="achievements" className="text-[10px] px-1">Conquistas</TabsTrigger>
                <TabsTrigger value="progress" className="text-[10px] px-1">Progresso</TabsTrigger>
                <TabsTrigger value="available" className="text-[10px] px-1">Disponíveis</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements" className="space-y-2 mt-3">
                {userAchievements && userAchievements.length > 0 ? (
                  userAchievements.map((achievement) => {
                    const def = achievement.achievement_definitions as unknown as AchievementDefinition;
                    const IconComponent = getIconComponent(def?.icon || 'trophy');
                    
                    return (
                      <Card key={achievement.id} className="border-l-4" style={{ borderLeftColor: def?.badge_color || '#FFD700' }}>
                        <CardContent className="p-2.5">
                          <div className="flex items-start gap-2.5">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${def?.badge_color || '#FFD700'}20` }}
                            >
                              <IconComponent className="w-4 h-4" style={{ color: def?.badge_color || '#FFD700' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs">{def?.name}</h4>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{def?.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                  +{achievement.points_awarded} pts
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Nenhuma conquista ainda</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-2 mt-3">
                {userProgress && userProgress.length > 0 ? (
                  userProgress.map((progress) => (
                    <Card key={progress.id}>
                      <CardContent className="p-2.5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-xs capitalize">
                              {progress.module_name.replace('_', ' ')}
                            </h4>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {progress.completion_percentage}%
                            </Badge>
                          </div>
                          <Progress value={progress.completion_percentage} className="h-1.5" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{progress.points_earned} pts</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Nenhum progresso ainda</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="available" className="space-y-2 mt-3">
                {getAvailableAchievements().map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  
                  return (
                    <Card key={achievement.id} className="opacity-75">
                      <CardContent className="p-2.5">
                        <div className="flex items-start gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed shrink-0"
                            style={{ borderColor: achievement.badge_color }}
                          >
                            <IconComponent className="w-4 h-4 opacity-50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs">{achievement.name}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{achievement.description}</p>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5">
                              {achievement.points} pts
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
    </>
  );
}
