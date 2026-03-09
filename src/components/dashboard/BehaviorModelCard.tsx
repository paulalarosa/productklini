import { BehaviorModel } from "@/hooks/useBehaviorModels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Edit, Trash2, ArrowRight } from "lucide-react";

interface BehaviorModelCardProps {
  model: BehaviorModel;
  onEdit: (model: BehaviorModel) => void;
  onDelete: (id: string) => void;
}

export function BehaviorModelCard({ model, onEdit, onDelete }: BehaviorModelCardProps) {
  const getProbabilityColor = (prob: string) => {
    switch (prob) {
      case "high": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const probabilityLabel = {
    high: "Alta",
    medium: "Média",
    low: "Baixa"
  }[model.behavior_probability] || model.behavior_probability;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{model.behavior || "Comportamento não definido"}</CardTitle>
            <Badge variant="outline" className={getProbabilityColor(model.behavior_probability)}>
              Probabilidade {probabilityLabel}
            </Badge>
          </div>
          <CardDescription>{model.description || "Nenhuma descrição fornecida."}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(model)}>
            <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(model.id)}>
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border/50">
            <span className="text-xs text-muted-foreground block mb-1 font-medium">Motivação</span>
            <span className="text-2xl font-bold text-primary">{model.motivation_score}/10</span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border/50">
            <span className="text-xs text-muted-foreground block mb-1 font-medium">Habilidade</span>
            <span className="text-2xl font-bold text-primary">{model.ability_score}/10</span>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border/50">
            <span className="text-xs text-muted-foreground block mb-1 font-medium">Gatilho (Prompt)</span>
            <span className="text-2xl font-bold text-primary">{model.prompt_score}/10</span>
          </div>
        </div>

        {Array.isArray(model.recommendations) && model.recommendations.length > 0 && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Insights do Modelo
            </h4>
            <ul className="space-y-2">
              {model.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
