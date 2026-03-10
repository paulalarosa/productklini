import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Trash2, Eye, CheckCircle, Clock, FlaskConical, Users, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";
import { useUpdateABExperiment, useDeleteABExperiment } from "@/hooks/useABExperiments";
import { toast } from "sonner";

type ABExperiment = Tables<"ab_experiments">;

interface ABVariant {
  id: string;
  name: string;
  is_control: boolean;
  description?: string;
}

interface ABMetric {
  name: string;
  target_value?: number;
}

interface ABTestingDashboardProps {
  experiments: ABExperiment[];
  isLoading: boolean;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: <Clock className="w-3 h-3" /> },
  running: { label: "Ativo", color: "bg-green-100 text-green-800", icon: <Play className="w-3 h-3" /> },
  paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-800", icon: <Pause className="w-3 h-3" /> },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
};

export function ABTestingDashboard({ experiments, isLoading, onSelect, selectedId }: ABTestingDashboardProps) {
  const { mutate: updateExperiment } = useUpdateABExperiment();
  const { mutate: deleteExperiment } = useDeleteABExperiment();

  const handleStatusChange = (id: string, newStatus: string) => {
    const updates: Partial<ABExperiment> = { status: newStatus as ABExperiment["status"] };
    if (newStatus === "running" && !experiments.find(e => e.id === id)?.start_date) {
      updates.start_date = new Date().toISOString();
    }
    if (newStatus === "completed") {
      updates.end_date = new Date().toISOString();
    }
    updateExperiment({ id, updates }, {
      onSuccess: () => toast.success(`Experimento ${newStatus === "running" ? "iniciado" : newStatus === "paused" ? "pausado" : "concluído"}!`),
      onError: () => toast.error("Erro ao atualizar experimento"),
    });
  };

  const handleDelete = (id: string) => {
    deleteExperiment(id, {
      onSuccess: () => toast.success("Experimento excluído"),
      onError: () => toast.error("Erro ao excluir"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <FlaskConical className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum experimento ainda</h3>
          <p className="text-muted-foreground text-sm">Crie seu primeiro experimento A/B para validar designs com dados reais.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((exp) => {
        const status = statusConfig[exp.status as keyof typeof statusConfig] ?? statusConfig.draft;
        const variants = (exp.variants as unknown as ABVariant[]) ?? [];
        const metrics = (exp.success_metrics as unknown as ABMetric[]) ?? [];
        const isSelected = selectedId === exp.id;

        return (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
              onClick={() => onSelect(isSelected ? null : exp.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${status.color} text-xs flex items-center gap-1 border-0`}>
                        {status.icon} {status.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(exp.traffic_allocation * 100)}% tráfego
                      </Badge>
                    </div>
                    <CardTitle className="text-base text-foreground truncate">{exp.name}</CardTitle>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {exp.status === "draft" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatusChange(exp.id, "running")}>
                        <Play className="w-3 h-3 mr-1" /> Iniciar
                      </Button>
                    )}
                    {exp.status === "running" && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatusChange(exp.id, "paused")}>
                          <Pause className="w-3 h-3 mr-1" /> Pausar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatusChange(exp.id, "completed")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Concluir
                        </Button>
                      </>
                    )}
                    {exp.status === "paused" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatusChange(exp.id, "running")}>
                        <Play className="w-3 h-3 mr-1" /> Retomar
                      </Button>
                    )}
                    {exp.status === "draft" && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(exp.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Hypothesis */}
                {exp.hypothesis && (
                  <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Hipótese: </span>
                    {exp.hypothesis}
                  </div>
                )}

                {/* Variants */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {variants.map((v, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/20 text-center">
                      <div className="text-xs font-semibold text-foreground">{v.name}</div>
                      {v.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{v.description}</div>}
                      {v.is_control && <Badge variant="secondary" className="text-[10px] mt-1">Controle</Badge>}
                    </div>
                  ))}
                </div>

                {/* Metrics */}
                {metrics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {metrics.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <BarChart2 className="w-3 h-3 mr-1" />
                        {m.name}
                        {m.target_value ? ` (meta: ${m.target_value}%)` : ""}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Dates */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {exp.start_date && (
                    <span>Início: {new Date(exp.start_date).toLocaleDateString("pt-BR")}</span>
                  )}
                  {exp.end_date && (
                    <span>Fim: {new Date(exp.end_date).toLocaleDateString("pt-BR")}</span>
                  )}
                  {exp.statistical_significance && (
                    <span>Sig. estatística: {Math.round(exp.statistical_significance * 100)}%</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
