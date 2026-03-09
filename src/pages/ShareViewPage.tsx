import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Layers, TrendingUp, CheckCircle2, Clock, AlertTriangle, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SHARE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-view`;

const phaseLabels: Record<string, string> = {
  discovery: "Discovery",
  define: "Define",
  develop: "Develop",
  deliver: "Deliver",
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
  blocked: "Bloqueado",
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <Clock className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
  review: <Eye className="w-4 h-4 text-[hsl(270,70%,60%)]" />,
  done: <CheckCircle2 className="w-4 h-4 text-[hsl(160,70%,50%)]" />,
  blocked: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const phaseColors: Record<string, string> = {
  discovery: "bg-primary",
  define: "bg-[hsl(270,70%,60%)]",
  develop: "bg-[hsl(160,70%,50%)]",
  deliver: "bg-[hsl(40,90%,55%)]",
};

interface ProjectData {
  project: {
    name: string;
    description: string | null;
    current_phase: string;
    progress: number;
    phase_progress: Record<string, number>;
  };
  taskSummary: {
    total: number;
    byStatus: Record<string, number>;
    byModule: Record<string, number>;
    byPhase: Record<string, number>;
  };
  metrics: { metric_name: string; score: number; previous_score: number | null }[];
}

export function ShareViewPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProjectData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !token) return;
    setLoading(true);
    setError("");

    try {
      const resp = await fetch(SHARE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: "view", token, password }),
      });
      const result = await resp.json();
      if (!resp.ok) {
        setError(result.error || "Erro ao acessar");
        setLoading(false);
        return;
      }
      setData(result);
    } catch {
      setError("Erro de conexão");
    }
    setLoading(false);
  };

  // Password gate
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Visão do Projeto</h1>
            <p className="text-sm text-muted-foreground mt-1">Insira a senha para acessar o painel executivo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Acessar
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const { project, taskSummary } = data;
  const phaseProgress = project.phase_progress ?? {};
  const doneCount = taskSummary.byStatus["done"] || 0;
  const totalTasks = taskSummary.total;
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">{project.name}</h1>
              {project.description && (
                <p className="text-xs text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {phaseLabels[project.current_phase] || project.current_phase}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{project.progress}%</p>
            <p className="text-xs text-muted-foreground mt-1">Progresso Geral</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">Tarefas Totais</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(160,70%,50%)]">{doneCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Taxa de Conclusão</p>
          </motion.div>
        </div>

        {/* Double Diamond Progress */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Progresso Double Diamond</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["discovery", "define", "develop", "deliver"].map((phase) => {
                  const pct = (phaseProgress as Record<string, number>)[phase] ?? 0;
                  const isCurrent = project.current_phase === phase;
                  return (
                    <div key={phase} className={`p-3 rounded-xl border transition-colors ${isCurrent ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground">{phaseLabels[phase]}</span>
                        {isCurrent && <Badge variant="default" className="text-[10px] px-1.5 py-0">Atual</Badge>}
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${phaseColors[phase]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Summary by Status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Resumo de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(taskSummary.byStatus).map(([status, count]) => {
                  const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-5">{statusIcons[status] || null}</div>
                      <span className="text-xs text-foreground w-28">{statusLabels[status] || status}</span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-12 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks by Phase */}
        {Object.keys(taskSummary.byPhase).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Tarefas por Fase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["discovery", "define", "develop", "deliver"].map((phase) => {
                    const count = taskSummary.byPhase[phase] || 0;
                    return (
                      <div key={phase} className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{phaseLabels[phase]}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">
            Visão executiva gerada por <span className="font-semibold text-foreground">ProductOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}
