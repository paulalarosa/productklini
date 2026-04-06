import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageHeader } from "@/components/ui/responsive-layout";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { notify } from "@/lib/notifications";

interface CompAnalytic {
  id: string; component_name: string; usage_count: number;
  screens_used: string[]; consistency_score: number; notes: string;
}

function ComponentSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
            <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-1.5 rounded-full bg-muted animate-pulse" />
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-4 w-14 rounded-full bg-muted animate-pulse" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComponentAnalyticsPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ component_name: "", usage_count: "0", screens_used: "", consistency_score: "100", notes: "" });

  const { data: analytics = [], isLoading } = useQuery({
    queryKey: ["component-analytics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("component_usage_analytics").select("*").eq("project_id", projectId).order("usage_count", { ascending: false });
      return (data ?? []) as CompAnalytic[];
    },
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Nenhum projeto selecionado");
      const { error } = await supabase.from("component_usage_analytics").insert({
        project_id: projectId, component_name: form.component_name,
        usage_count: parseInt(form.usage_count) || 0,
        screens_used: form.screens_used.split("\n").filter(Boolean),
        consistency_score: parseFloat(form.consistency_score) || 100,
        notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["component-analytics"] });
      setOpen(false);
      setForm({ component_name: "", usage_count: "0", screens_used: "", consistency_score: "100", notes: "" });
      toast.success("Componente registrado!");
      await notify.info(
        "📊 Analytics de Componente",
        `O componente "${form.component_name}" foi registrado para análise de uso e consistência.`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("component_usage_analytics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["component-analytics"] }); toast.success("Removido!"); },
    onError: () => toast.error("Erro ao remover componente"),
  });

  const avgConsistency = analytics.length > 0
    ? Math.round(analytics.reduce((sum, a) => sum + Number(a.consistency_score), 0) / analytics.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Component Usage Analytics"
        description="Acompanhe o uso e consistência dos componentes do Design System"
        actions={
          <>
            <AIGenerateButton
              prompt="Analise o Design System do projeto e gere um relatório de uso dos componentes. Liste os mais usados, em quais telas aparecem e o score de consistência."
              label="Analisar com IA" invalidateKeys={[["component-analytics"]]} variant="outline" size="sm"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Adicionar</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Componente</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome do Componente</Label><Input value={form.component_name} onChange={e => setForm(f => ({ ...f, component_name: e.target.value }))} placeholder="Button, Card, Modal..." /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Qtd. de Usos</Label><Input type="number" value={form.usage_count} onChange={e => setForm(f => ({ ...f, usage_count: e.target.value }))} /></div>
                    <div><Label>Score Consistência (%)</Label><Input type="number" value={form.consistency_score} onChange={e => setForm(f => ({ ...f, consistency_score: e.target.value }))} /></div>
                  </div>
                  <div><Label>Telas (uma por linha)</Label><Textarea value={form.screens_used} onChange={e => setForm(f => ({ ...f, screens_used: e.target.value }))} placeholder="Home&#10;Login&#10;Dashboard" /></div>
                  <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <Button onClick={() => createMut.mutate()} disabled={!form.component_name || createMut.isPending} className="w-full">
                    {createMut.isPending ? "Criando..." : "Registrar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <ErrorBoundary level="section">
        {isLoading ? <ComponentSkeleton /> : analytics.length === 0 ? (
          <EmptyState icon={BarChart3} title="Nenhum componente registrado"
            description="Acompanhe o uso dos componentes do seu Design System."
            action={{ label: "Registrar componente", onClick: () => setOpen(true) }} />
        ) : (
          <>
            {/* Barra de consistência média */}
            <div className="border rounded-lg p-4 bg-card space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Consistência Média do DS</span>
                <span className={`font-bold ${avgConsistency >= 80 ? "text-green-600" : avgConsistency >= 60 ? "text-amber-600" : "text-destructive"}`}>
                  {avgConsistency}%
                </span>
              </div>
              <Progress value={avgConsistency} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.map(a => (
                <Card key={a.id} className="animate-fade-in">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-sm">{a.component_name}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)} disabled={deleteMut.isPending}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Usos: <strong className="text-foreground">{a.usage_count}</strong></span>
                      <Badge variant={Number(a.consistency_score) >= 80 ? "default" : "destructive"} className="text-[10px]">
                        {Number(a.consistency_score)}% consistente
                      </Badge>
                    </div>
                    <Progress value={Number(a.consistency_score)} className="h-1.5" />
                    {a.screens_used.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {a.screens_used.map((s, i) => <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>)}
                      </div>
                    )}
                    {a.notes && <p className="text-[10px] text-muted-foreground">{a.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </ErrorBoundary>
    </div>
  );
}
