import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, Code, Lightbulb, TrendingUp, Users, Copy, ExternalLink,
  Brain, Target, CheckCircle, Star, Clock 
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type UXPattern = Tables<"ux_patterns">;

interface UXPatternCardProps {
  pattern: UXPattern;
}

export function UXPatternCard({ pattern }: UXPatternCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-800 border-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "component": return <Code className="w-4 h-4" />;
      case "flow": return <Target className="w-4 h-4" />;
      case "principle": return <Lightbulb className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatMetric = (key: string, value: string) => {
    const labels: Record<string, string> = {
      conversion_lift: "Aumento de Conversão",
      conversion_increase: "Melhoria de Conversão", 
      trust_increase: "Aumento de Confiança",
      bounce_rate_reduction: "Redução de Bounce Rate",
      completion_rate: "Taxa de Conclusão",
      user_satisfaction: "Satisfação do Usuário",
      urgency_effectiveness: "Eficácia da Urgência"
    };
    
    return {
      label: labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    };
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => setIsDetailOpen(true)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
                {pattern.name}
              </CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                {getTypeIcon(pattern.pattern_type)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {pattern.description}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className={getDifficultyColor(pattern.difficulty_level)}>
                  {pattern.difficulty_level === "beginner" && "Iniciante"}
                  {pattern.difficulty_level === "intermediate" && "Intermediário"}
                  {pattern.difficulty_level === "advanced" && "Avançado"}
                </Badge>
                <Badge variant="outline">
                  {pattern.category.charAt(0).toUpperCase() + pattern.category.slice(1)}
                </Badge>
              </div>
              
              {pattern.tags && pattern.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pattern.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {pattern.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{pattern.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {pattern.psychology_principles && pattern.psychology_principles.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Brain className="w-3 h-3" />
                  <span>{pattern.psychology_principles.slice(0, 2).join(", ")}</span>
                  {pattern.psychology_principles.length > 2 && <span>+{pattern.psychology_principles.length - 2}</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {getTypeIcon(pattern.pattern_type)}
              {pattern.name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <div className="space-y-6 pr-4">
              {/* Description & Badges */}
              <div className="space-y-3">
                <p className="text-muted-foreground">{pattern.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getDifficultyColor(pattern.difficulty_level)}>
                    {pattern.difficulty_level === "beginner" && "Iniciante"}
                    {pattern.difficulty_level === "intermediate" && "Intermediário"}
                    {pattern.difficulty_level === "advanced" && "Avançado"}
                  </Badge>
                  <Badge variant="outline">{pattern.category}</Badge>
                  {pattern.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="psychology">Psicologia</TabsTrigger>
                  <TabsTrigger value="code">Código</TabsTrigger>
                  <TabsTrigger value="examples">Exemplos</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Use Cases */}
                  {pattern.use_cases && pattern.use_cases.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Casos de Uso
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {pattern.use_cases.map((useCase, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-muted/30 rounded-md p-2">
                            <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                            {useCase}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Practices */}
                  {pattern.best_practices && pattern.best_practices.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Melhores Práticas
                      </h4>
                      <ul className="space-y-2">
                        {pattern.best_practices.map((practice, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            {practice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="psychology" className="space-y-4">
                  {pattern.psychology_principles && pattern.psychology_principles.length > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Princípios Psicológicos
                      </h4>
                      <div className="space-y-3">
                        {pattern.psychology_principles.map((principle, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <h5 className="font-medium text-primary">{principle}</h5>
                              <p className="text-sm text-muted-foreground mt-1">
                                {/* Add principle descriptions here if needed */}
                                Princípio fundamental de design persuasivo que influencia comportamento do usuário.
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum princípio psicológico documentado</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  {pattern.code_examples && Object.keys(pattern.code_examples as object).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(pattern.code_examples as Record<string, string>).map(([lang, code]) => (
                        <div key={lang}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold capitalize flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              {lang.toUpperCase()}
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyCodeToClipboard(code)}
                              className="gap-2"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar
                            </Button>
                          </div>
                          <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto">
                            <code>{code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum exemplo de código disponível</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="examples" className="space-y-4">
                  {pattern.examples && Array.isArray(pattern.examples) && pattern.examples.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Exemplos Reais
                      </h4>
                      <div className="grid gap-4">
                        {pattern.examples.map((example: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <h5 className="font-medium text-primary">{example.company}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{example.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum exemplo real documentado</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  {pattern.metrics && Object.keys(pattern.metrics as object).length > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Métricas de Performance
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(pattern.metrics as Record<string, string>).map(([key, value]) => {
                          const metric = formatMetric(key, value);
                          return (
                            <Card key={key}>
                              <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-primary">{metric.value}</div>
                                <div className="text-sm text-muted-foreground">{metric.label}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhuma métrica de performance disponível</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}