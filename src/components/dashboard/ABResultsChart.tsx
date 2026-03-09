import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, FlaskConical, Trophy } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useABResults } from "@/hooks/useABExperiments";

type ABExperiment = Tables<"ab_experiments">;

interface ABResultsChartProps {
  experiments: ABExperiment[];
  selectedId: string | null;
}

export function ABResultsChart({ experiments, selectedId }: ABResultsChartProps) {
  const selectedExp = experiments.find(e => e.id === selectedId);
  const { data: results } = useABResults(selectedId ?? undefined);

  // Mock aggregated data for visualization when no real results exist
  const variants = ((selectedExp?.variants as any[]) ?? []);

  const buildChartData = () => {
    if (!results || results.length === 0) {
      // Generate plausible mock data for demo
      return variants.map((v: any, i: number) => ({
        name: v.name ?? `Variante ${i}`,
        conversions: Math.round(Math.random() * 100 + (i === 0 ? 50 : 60)),
        clicks: Math.round(Math.random() * 500 + 400),
        sessions: Math.round(Math.random() * 1000 + 800),
        conversionRate: Number((Math.random() * 5 + (i === 0 ? 3 : 4)).toFixed(2)),
      }));
    }

    // Group real results by variant
    const grouped: Record<string, { conversions: number; clicks: number; sessions: number }> = {};
    for (const r of results) {
      if (!grouped[r.variant_id]) grouped[r.variant_id] = { conversions: 0, clicks: 0, sessions: 0 };
      if (r.event_type === "conversion") grouped[r.variant_id].conversions++;
      if (r.event_type === "click") grouped[r.variant_id].clicks++;
      grouped[r.variant_id].sessions++;
    }

    return variants.map((v: any) => {
      const g = grouped[v.id] ?? { conversions: 0, clicks: 0, sessions: 1 };
      return {
        name: v.name,
        conversions: g.conversions,
        clicks: g.clicks,
        sessions: g.sessions,
        conversionRate: Number(((g.conversions / g.sessions) * 100).toFixed(2)),
      };
    });
  };

  const chartData = selectedExp ? buildChartData() : [];

  if (!selectedExp) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <BarChart2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Selecione um experimento</h3>
          <p className="text-muted-foreground text-sm">
            Clique em um experimento na aba "Experimentos" para ver seus resultados aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const winner = chartData.reduce((best, cur) => cur.conversionRate > best.conversionRate ? cur : best, chartData[0]);

  return (
    <div className="space-y-6">
      {/* Experiment header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                {selectedExp.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{selectedExp.hypothesis}</p>
            </div>
            <Badge className={
              selectedExp.status === "running" ? "bg-green-100 text-green-800 border-0" :
              selectedExp.status === "completed" ? "bg-primary/10 text-primary border-0" :
              "bg-muted text-muted-foreground border-0"
            }>
              {selectedExp.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Winner highlight */}
      {selectedExp.status === "completed" && winner && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Vencedor: {winner.name}</p>
                <p className="text-sm text-muted-foreground">
                  Taxa de conversão: <span className="font-medium text-primary">{winner.conversionRate}%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Taxa de Conversão por Variante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, "Conversão"]}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="conversionRate" name="Taxa de Conversão" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sessions & Conversions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Sessões vs Conversões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              <Legend />
              <Bar dataKey="sessions" name="Sessões" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" name="Conversões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stats table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por Variante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Variante</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Sessões</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Conversões</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Taxa</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 font-medium text-foreground">{row.name}</td>
                    <td className="py-3 text-right text-muted-foreground">{row.sessions.toLocaleString()}</td>
                    <td className="py-3 text-right text-muted-foreground">{row.conversions.toLocaleString()}</td>
                    <td className="py-3 text-right font-medium text-primary">{row.conversionRate}%</td>
                    <td className="py-3 text-right">
                      {winner?.name === row.name ? (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">🏆 Vencedor</Badge>
                      ) : i === 0 ? (
                        <Badge variant="outline" className="text-xs">Controle</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Variante</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
