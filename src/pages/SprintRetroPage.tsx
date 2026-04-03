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
import { Plus, Trash2, RotateCcw, ThumbsUp, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Retro {
  id: string;
  sprint_name: string;
  sprint_number: number;
  went_well: string[];
  to_improve: string[];
  action_items: { item: string; owner: string; done: boolean }[];
  team_mood: string;
  date: string;
}

const moodEmojis: Record<string, string> = { great: "🚀", good: "😊", neutral: "😐", bad: "😕", terrible: "😞" };

export function SprintRetroPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sprint_name: "", sprint_number: "1", went_well: "", to_improve: "", action_items: "", team_mood: "good" });

  const { data: retros = [], isLoading } = useQuery({
    queryKey: ["sprint-retros", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("sprint_retrospectives").select("*").eq("project_id", projectId).order("sprint_number", { ascending: false });
      return (data ?? []) as Retro[];
    },
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("No project");
      const { error } = await supabase.from("sprint_retrospectives").insert({
        project_id: projectId,
        sprint_name: form.sprint_name,
        sprint_number: parseInt(form.sprint_number) || 1,
        went_well: form.went_well.split("\n").filter(Boolean),
        to_improve: form.to_improve.split("\n").filter(Boolean),
        action_items: form.action_items.split("\n").filter(Boolean).map(item => ({ item, owner: "", done: false })),
        team_mood: form.team_mood,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sprint-retros"] }); setOpen(false); toast.success("Retrospectiva criada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sprint_retrospectives").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sprint-retros"] }); toast.success("Removida!"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sprint Retrospective</h1>
          <p className="text-sm text-muted-foreground">Registre aprendizados e action items de cada sprint</p>
        </div>
        <div className="flex gap-2">
          <AIGenerateButton prompt="Analise o estado atual do projeto, as tarefas concluídas e pendentes, e gere uma Sprint Retrospective completa com: o que foi bem, o que melhorar, e action items concretos com donos." label="Gerar com IA" invalidateKeys={[["sprint-retros"]]} variant="outline" size="sm" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Retro</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Retrospectiva</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Sprint</Label><Input value={form.sprint_name} onChange={e => setForm(f => ({ ...f, sprint_name: e.target.value }))} placeholder="Sprint 5" /></div>
                  <div><Label>Número</Label><Input type="number" value={form.sprint_number} onChange={e => setForm(f => ({ ...f, sprint_number: e.target.value }))} /></div>
                </div>
                <div><Label>Humor do time</Label>
                  <div className="flex gap-2 mt-1">{Object.entries(moodEmojis).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(f => ({ ...f, team_mood: k }))} className={`text-xl p-1 rounded ${form.team_mood === k ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-accent"}`}>{v}</button>
                  ))}</div>
                </div>
                <div><Label>O que foi bem (um por linha)</Label><Textarea value={form.went_well} onChange={e => setForm(f => ({ ...f, went_well: e.target.value }))} placeholder="Entrega no prazo\nBoa comunicação" /></div>
                <div><Label>O que melhorar (um por linha)</Label><Textarea value={form.to_improve} onChange={e => setForm(f => ({ ...f, to_improve: e.target.value }))} placeholder="Documentação atrasada\nReviews demoradas" /></div>
                <div><Label>Action Items (um por linha)</Label><Textarea value={form.action_items} onChange={e => setForm(f => ({ ...f, action_items: e.target.value }))} placeholder="Implementar daily de 15min\nCriar template de PR" /></div>
                <Button onClick={() => createMut.mutate()} disabled={!form.sprint_name || createMut.isPending} className="w-full">{createMut.isPending ? "Criando..." : "Criar Retrospectiva"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : retros.length === 0 ? (
        <EmptyState icon={RotateCcw} title="Nenhuma retrospectiva" description="Registre aprendizados das suas sprints" />
      ) : (
        <div className="space-y-4">
          {retros.map(r => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{moodEmojis[r.team_mood] || "😐"}</span>
                  <div>
                    <CardTitle className="text-base">{r.sprint_name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Sprint #{r.sprint_number}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-600"><ThumbsUp className="w-3.5 h-3.5" />O que foi bem</div>
                    {r.went_well.map((w, i) => <p key={i} className="text-xs text-muted-foreground pl-5">• {w}</p>)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600"><AlertTriangle className="w-3.5 h-3.5" />Melhorar</div>
                    {r.to_improve.map((t, i) => <p key={i} className="text-xs text-muted-foreground pl-5">• {t}</p>)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary"><Zap className="w-3.5 h-3.5" />Action Items</div>
                    {Array.isArray(r.action_items) && r.action_items.map((a: { item: string }, i: number) => <p key={i} className="text-xs text-muted-foreground pl-5">• {typeof a === "string" ? a : a.item}</p>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
