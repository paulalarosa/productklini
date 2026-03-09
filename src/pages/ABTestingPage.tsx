import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FlaskConical, Plus, TrendingUp, Users, BarChart2, Play, Pause, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ABTestingDashboard } from "@/components/dashboard/ABTestingDashboard";
import { ABExperimentForm } from "@/components/dashboard/ABExperimentForm";
import { ABResultsChart } from "@/components/dashboard/ABResultsChart";
import { useABExperiments } from "@/hooks/useABExperiments";

export function ABTestingPage() {
  const navigate = useNavigate();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  const { data: experiments, isLoading } = useABExperiments();

  const stats = {
    total: experiments?.length ?? 0,
    running: experiments?.filter(e => e.status === "running").length ?? 0,
    completed: experiments?.filter(e => e.status === "completed").length ?? 0,
    draft: experiments?.filter(e => e.status === "draft").length ?? 0,
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">A/B Testing</h2>
              <p className="text-xs text-muted-foreground">Valide designs com experimentos controlados</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Experimento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <FlaskConical className="w-3 h-3" /> Experimentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Play className="w-3 h-3" /> Em execução
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.completed}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> Com resultado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Aguardando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      {showNewForm ? (
        <ABExperimentForm onClose={() => setShowNewForm(false)} />
      ) : (
        <Tabs defaultValue="experiments" className="w-full">
          <TabsList>
            <TabsTrigger value="experiments">Experimentos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="guide">Guia de Uso</TabsTrigger>
          </TabsList>

          <TabsContent value="experiments" className="mt-6">
            <ABTestingDashboard
              experiments={experiments ?? []}
              isLoading={isLoading}
              onSelect={setSelectedExperiment}
              selectedId={selectedExperiment}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ABResultsChart experiments={experiments ?? []} selectedId={selectedExperiment} />
          </TabsContent>

          <TabsContent value="guide" className="mt-6">
            <ABTestingGuide />
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}

function ABTestingGuide() {
  const steps = [
    {
      icon: <AlertCircle className="w-5 h-5 text-primary" />,
      title: "1. Defina a Hipótese",
      desc: "Formule uma hipótese clara: 'Se mudarmos X, então Y aumentará porque Z.'"
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "2. Segmente o Público",
      desc: "Divida usuários aleatoriamente entre variante A (controle) e B (teste). Mínimo 1.000 usuários por variante."
    },
    {
      icon: <Play className="w-5 h-5 text-primary" />,
      title: "3. Execute o Experimento",
      desc: "Rode por pelo menos 2 semanas para capturar variações de comportamento semanais."
    },
    {
      icon: <BarChart2 className="w-5 h-5 text-primary" />,
      title: "4. Analise os Resultados",
      desc: "Busque significância estatística de 95%+ antes de concluir. Evite 'peeking problem'."
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      title: "5. Implemente o Vencedor",
      desc: "Documente os aprendizados e implemente a variante vencedora para 100% dos usuários."
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Como fazer um bom A/B Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                <div className="shrink-0 mt-0.5">{step.icon}</div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-green-700">✅ Boas práticas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Teste apenas uma variável por vez</li>
              <li>• Defina métricas de sucesso antes de iniciar</li>
              <li>• Calcule o tamanho de amostra necessário</li>
              <li>• Documente todos os resultados, inclusive negativos</li>
              <li>• Use segmentação consistente (cookie/user ID)</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-700">❌ Erros comuns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Parar o teste assim que ver diferença</li>
              <li>• Testar em períodos com eventos especiais</li>
              <li>• Ignorar segmentos de usuários</li>
              <li>• Mudar o experimento no meio</li>
              <li>• Confundir correlação com causalidade</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
