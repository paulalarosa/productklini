
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trash2, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Benchmark } from "@/hooks/useBenchmark";

interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  url?: string;
}

interface FeatureComparison {
  feature: string;
  competitors: Record<string, string>;
}

interface BenchmarkCardProps {
  benchmark: Benchmark;
  onDelete?: (id: string) => void;
}

export function BenchmarkCard({ benchmark, onDelete }: BenchmarkCardProps) {
  const competitors = (benchmark.competitors as unknown) as Competitor[] || [];
  const features = (benchmark.features as unknown) as FeatureComparison[] || [];
  const insights = (benchmark.insights as unknown) as string[] || [];

  return (
    <Card className="overflow-hidden border-border/40 hover:border-primary/20 transition-all group">
      <CardHeader className="pb-2 bg-secondary/30">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{benchmark.name || "Benchmark sem Nome"}</CardTitle>
              <p className="text-[10px] text-muted-foreground">Análise Competitiva • IA Gerado</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            onClick={() => onDelete?.(benchmark.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Competitors List */}
        <div className="mb-4 space-y-3">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Principais Concorrentes</h4>
          <div className="flex flex-wrap gap-2">
            {competitors.map((comp, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 flex items-center gap-1 bg-accent/30">
                {comp.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Feature Comparison Mini Table */}
        <div className="space-y-3 mb-4">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Comparativo de Funcionalidades</h4>
          <div className="rounded border border-border/40 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-1.5 font-bold border-b border-border/40">Feature</th>
                  {competitors.slice(0, 2).map((comp, i) => (
                    <th key={i} className="text-center p-1.5 font-bold border-b border-border/40 border-l">
                      {comp.name.slice(0, 8)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.slice(0, 3).map((f, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-accent/10" : ""}>
                    <td className="p-1.5 border-b border-border/40">{f.feature}</td>
                    {competitors.slice(0, 2).map((comp, j) => (
                      <td key={j} className="text-center p-1.5 border-b border-border/40 border-l font-medium">
                        {f.competitors?.[comp.name] === "Yes" ? "✓" : "×"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-primary" />
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-primary">Key Insights</h4>
          </div>
          <div className="space-y-1">
            {insights.slice(0, 2).map((insight, i) => (
              <p key={i} className="text-[11px] leading-tight text-foreground/80 italic">
                "{insight}"
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
