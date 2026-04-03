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
import { Plus, Trash2, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface HandoffSpec {
  id: string;
  screen_name: string;
  component_name: string;
  interactions: string;
  notes: string;
  status: string;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  colors: Record<string, string>;
}

export function DesignHandoffPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ screen_name: "", component_name: "", interactions: "", notes: "", spacing: "", typography: "", colors: "" });

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ["design-handoff", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("design_handoff_specs").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return (data ?? []) as HandoffSpec[];
    },
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("No project");
      const parseKV = (s: string) => Object.fromEntries(s.split("\n").filter(Boolean).map(l => { const [k, ...v] = l.split(":"); return [k?.trim() || "", v.join(":").trim()]; }));
      const { error } = await supabase.from("design_handoff_specs").insert({
        project_id: projectId, screen_name: form.screen_name, component_name: form.component_name,
        interactions: form.interactions, notes: form.notes,
        spacing: parseKV(form.spacing), typography: parseKV(form.typography), colors: parseKV(form.colors),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["design-handoff"] }); setOpen(false); toast.success("Spec criada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("design_handoff_specs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["design-handoff"] }); toast.success("Removida!"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Design Handoff Specs</h1>
          <p className="text-sm text-muted-foreground">Especificações detalhadas para desenvolvedores</p>
        </div>
        <div className="flex gap-2">
          <AIGenerateButton prompt="Gere Design Handoff Specs completas para as principais telas do projeto. Inclua especificações de espaçamento, tipografia, cores, interações e notas de implementação para cada componente." label="Gerar com IA" invalidateKeys={[["design-handoff"]]} variant="outline" size="sm" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Spec</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Handoff Spec</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Tela</Label><Input value={form.screen_name} onChange={e => setForm(f => ({ ...f, screen_name: e.target.value }))} placeholder="Login" /></div>
                  <div><Label>Componente</Label><Input value={form.component_name} onChange={e => setForm(f => ({ ...f, component_name: e.target.value }))} placeholder="LoginForm" /></div>
                </div>
                <div><Label>Espaçamento (chave: valor, um por linha)</Label><Textarea value={form.spacing} onChange={e => setForm(f => ({ ...f, spacing: e.target.value }))} placeholder="padding: 16px\ngap: 8px" /></div>
                <div><Label>Tipografia (chave: valor)</Label><Textarea value={form.typography} onChange={e => setForm(f => ({ ...f, typography: e.target.value }))} placeholder="font-size: 14px\nfont-weight: 600" /></div>
                <div><Label>Cores (chave: valor)</Label><Textarea value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} placeholder="background: #FFFFFF\ntext: #1A1A2E" /></div>
                <div><Label>Interações</Label><Textarea value={form.interactions} onChange={e => setForm(f => ({ ...f, interactions: e.target.value }))} placeholder="Hover: opacity 0.8, transition 200ms" /></div>
                <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={() => createMut.mutate()} disabled={!form.screen_name || createMut.isPending} className="w-full">{createMut.isPending ? "Criando..." : "Criar Spec"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : specs.length === 0 ? (
        <EmptyState icon={Code2} title="Nenhuma spec de handoff" description="Crie especificações detalhadas para o time de desenvolvimento" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specs.map(s => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">{s.screen_name}</CardTitle>
                  <p className="text-[10px] text-muted-foreground">{s.component_name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(s.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {Object.keys(s.spacing || {}).length > 0 && (
                  <div><span className="font-semibold">Spacing:</span> <span className="text-muted-foreground">{Object.entries(s.spacing).map(([k, v]) => `${k}: ${v}`).join(", ")}</span></div>
                )}
                {Object.keys(s.typography || {}).length > 0 && (
                  <div><span className="font-semibold">Typography:</span> <span className="text-muted-foreground">{Object.entries(s.typography).map(([k, v]) => `${k}: ${v}`).join(", ")}</span></div>
                )}
                {Object.keys(s.colors || {}).length > 0 && (
                  <div className="flex flex-wrap gap-1">{Object.entries(s.colors).map(([k, v]) => <Badge key={k} variant="outline" className="text-[10px]">{k}: {v}</Badge>)}</div>
                )}
                {s.interactions && <p className="text-muted-foreground"><strong>Interações:</strong> {s.interactions}</p>}
                {s.notes && <p className="text-muted-foreground"><strong>Notas:</strong> {s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
