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
import { Progress } from "@/components/ui/progress";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CompAnalytic {
  id: string;
  component_name: string;
  usage_count: number;
  screens_used: string[];
  consistency_score: number;
  notes: string;
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
      if (!projectId) throw new Error("No project");
      const { error } = await supabase.from("component_usage_analytics").insert({
        project_id: projectId, component_name: form.component_name,
        usage_count: parseInt(form.usage_count) || 0,
        screens_used: form.screens_used.split("\n").filter(Boolean),
        consistency_score: parseFloat(form.consistency_score) || 100,
        notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["component-analytics"] }); setOpen(false); toast.success("Componente registrado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("component_usage_analytics").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["component-analytics"] }); toast.success("Removido!"); },
  });

  const avgConsistency = analytics.length > 0 ? Math.round(analytics.reduce((sum, a) => sum + Number(a.consistency_score), 0) / analytics.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Component Usage Analytics</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o uso e consistência dos componentes do Design System</p>
        </div>
        <div className="flex gap-2">
          <AIGenerateButton prompt="Analise o Design System do projeto e gere um relatório de uso dos componentes. Liste os componentes mais usados, em quais telas aparecem, e o score de consistência de cada um." label="Analisar com IA" invalidateKeys={[["component-analytics"]]} variant="outline" size="sm" />
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
                <div><Label>Telas onde é usado (uma por linha)</Label><Textarea value={form.screens_used} onChange={e => setForm(f => ({ ...f, screens_used: e.target.value }))} placeholder="Home\nLogin\nDashboard" /></div>
                <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={() => createMut.mutate()} disabled={!form.component_name || createMut.isPending} className="w-full">{createMut.isPending ? "Criando..." : "Registrar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {analytics.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Consistência Média do DS</span>
              <span className="text-sm font-bold">{avgConsistency}%</span>
            </div>
            <Progress value={avgConsistency} className="h-2" />
          </CardContent>
        </Card>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : analytics.length === 0 ? (
        <EmptyState icon={BarChart3} title="Nenhum componente registrado" description="Acompanhe o uso dos componentes do seu Design System" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.map(a => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm">{a.component_name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Usos: <strong className="text-foreground">{a.usage_count}</strong></span>
                  <Badge variant={Number(a.consistency_score) >= 80 ? "default" : "destructive"} className="text-[10px]">{Number(a.consistency_score)}% consistente</Badge>
                </div>
                <Progress value={Number(a.consistency_score)} className="h-1.5" />
                {a.screens_used.length > 0 && (
                  <div className="flex flex-wrap gap-1">{a.screens_used.map((s, i) => <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>)}</div>
                )}
                {a.notes && <p className="text-[10px] text-muted-foreground">{a.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
