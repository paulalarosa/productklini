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
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Trash2, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Journey {
  id: string;
  journey_name: string;
  persona: string;
  description: string;
  stages: { name: string; actions: string; thoughts: string; emotions: string }[];
  pain_points: string[];
  opportunities: string[];
  status: string;
}

export function CustomerJourneyPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ journey_name: "", persona: "", description: "", stages: "" as string, pain_points: "", opportunities: "" });

  const { data: journeys = [], isLoading } = useQuery({
    queryKey: ["customer-journeys", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("customer_journeys").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return (data ?? []) as Journey[];
    },
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("No project");
      const stages = form.stages.split("\n").filter(Boolean).map((s, i) => ({ name: s.trim(), actions: "", thoughts: "", emotions: i < 2 ? "positive" : "neutral" }));
      const { error } = await supabase.from("customer_journeys").insert({
        project_id: projectId,
        journey_name: form.journey_name,
        persona: form.persona,
        description: form.description,
        stages,
        pain_points: form.pain_points.split("\n").filter(Boolean),
        opportunities: form.opportunities.split("\n").filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer-journeys"] }); setOpen(false); setForm({ journey_name: "", persona: "", description: "", stages: "", pain_points: "", opportunities: "" }); toast.success("Jornada criada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("customer_journeys").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer-journeys"] }); toast.success("Removida!"); },
  });

  const emotionColors: Record<string, string> = { positive: "text-green-500", neutral: "text-muted-foreground", negative: "text-destructive" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Journey Map</h1>
          <p className="text-sm text-muted-foreground">Mapeie a jornada completa do usuário com touchpoints e emoções</p>
        </div>
        <div className="flex gap-2">
          <AIGenerateButton prompt="Crie um Customer Journey Map completo baseado nas personas existentes do projeto. Inclua pelo menos 5 estágios com ações, pensamentos e emoções para cada um. Identifique pain points e oportunidades de melhoria." label="Gerar com IA" invalidateKeys={[["customer-journeys"]]} variant="outline" size="sm" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Jornada</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Customer Journey</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome da Jornada</Label><Input value={form.journey_name} onChange={e => setForm(f => ({ ...f, journey_name: e.target.value }))} placeholder="Ex: Onboarding do novo usuário" /></div>
                <div><Label>Persona</Label><Input value={form.persona} onChange={e => setForm(f => ({ ...f, persona: e.target.value }))} placeholder="Ex: Ana, Designer Jr." /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Contexto da jornada..." /></div>
                <div><Label>Etapas (uma por linha)</Label><Textarea value={form.stages} onChange={e => setForm(f => ({ ...f, stages: e.target.value }))} placeholder="Descoberta\nCadastro\nPrimeiro uso\nRetenção" /></div>
                <div><Label>Pain Points (um por linha)</Label><Textarea value={form.pain_points} onChange={e => setForm(f => ({ ...f, pain_points: e.target.value }))} /></div>
                <div><Label>Oportunidades (uma por linha)</Label><Textarea value={form.opportunities} onChange={e => setForm(f => ({ ...f, opportunities: e.target.value }))} /></div>
                <Button onClick={() => createMut.mutate()} disabled={!form.journey_name || createMut.isPending} className="w-full">{createMut.isPending ? "Criando..." : "Criar Jornada"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : journeys.length === 0 ? (
        <EmptyState icon={MapPin} title="Nenhuma jornada mapeada" description="Crie uma Customer Journey Map para visualizar a experiência do usuário" />
      ) : (
        <div className="space-y-6">
          {journeys.map(j => (
            <Card key={j.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{j.journey_name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Persona: {j.persona || "N/A"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(j.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {j.description && <p className="text-sm text-muted-foreground">{j.description}</p>}
                {/* Stages timeline */}
                {Array.isArray(j.stages) && j.stages.length > 0 && (
                  <div className="flex items-start gap-2 overflow-x-auto pb-2">
                    {j.stages.map((s: { name: string; emotions?: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-center gap-1 min-w-[100px]">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{idx + 1}</div>
                          <span className="text-xs text-center font-medium">{s.name}</span>
                          <span className={`text-[10px] ${emotionColors[s.emotions || "neutral"] || "text-muted-foreground"}`}>{s.emotions || "neutral"}</span>
                        </div>
                        {idx < j.stages.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {j.pain_points.length > 0 && (
                    <div><span className="text-xs font-semibold text-destructive">Pain Points</span><div className="flex flex-wrap gap-1 mt-1">{j.pain_points.map((p, i) => <Badge key={i} variant="destructive" className="text-[10px]">{p}</Badge>)}</div></div>
                  )}
                  {j.opportunities.length > 0 && (
                    <div><span className="text-xs font-semibold text-primary">Oportunidades</span><div className="flex flex-wrap gap-1 mt-1">{j.opportunities.map((o, i) => <Badge key={i} variant="secondary" className="text-[10px]">{o}</Badge>)}</div></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
