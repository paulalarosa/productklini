import { useState } from "react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { CheckSquare, Plus, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Criterion {
  id: string;
  feature: string;
  criteria: { text: string; status: "pending" | "passed" | "failed" }[];
  status: string;
}

const STATUS_MAP = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: AlertCircle },
  passed: { label: "Aprovado", color: "bg-emerald-500/10 text-emerald-600", icon: Check },
  failed: { label: "Reprovado", color: "bg-destructive/10 text-destructive", icon: X },
};

export function AcceptanceCriteriaPage() {
  const projectId = useCurrentProjectId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ feature: "", criteria: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["acceptance-criteria", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId!)
        .eq("doc_type", "acceptance_criteria")
        .order("created_at", { ascending: false });
      return (data ?? []).map(d => {
        const meta = (d.metadata ?? {}) as Record<string, unknown>;
        return {
          id: d.id,
          feature: d.title,
          criteria: (meta.criteria as Criterion["criteria"]) ?? [],
          status: (meta.status as string) ?? "pending",
        } as Criterion;
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const criteria = form.criteria.split("\n").filter(Boolean).map(t => ({ text: t.trim(), status: "pending" as const }));
      await supabase.from("project_documents").insert({
        project_id: projectId!,
        title: form.feature,
        content: form.criteria,
        doc_type: "acceptance_criteria",
        metadata: { criteria, status: "pending" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acceptance-criteria"] });
      setOpen(false);
      setForm({ feature: "", criteria: "" });
      toast({ title: "Critérios de aceite registrados" });
    },
  });

  const toggleCriterion = async (docId: string, idx: number) => {
    const item = items.find(i => i.id === docId);
    if (!item) return;
    const updated = [...item.criteria];
    updated[idx] = { ...updated[idx], status: updated[idx].status === "passed" ? "pending" : "passed" };
    const allPassed = updated.every(c => c.status === "passed");
    await supabase.from("project_documents").update({
      metadata: { criteria: updated, status: allPassed ? "passed" : "pending" },
    }).eq("id", docId);
    queryClient.invalidateQueries({ queryKey: ["acceptance-criteria"] });
  };

  return (
    <ModulePage
      title="Acceptance Criteria"
      subtitle="Critérios de aceite por entrega — valide antes de enviar para dev"
      icon={<CheckSquare className="w-5 h-5 text-primary-foreground" />}
      actions={
        <div className="flex gap-2">
          <AIGenerateButton
            prompt="Com base nas tarefas, user stories e requisitos do projeto, gere critérios de aceite detalhados no formato Given/When/Then para cada feature principal. Inclua cenários positivos, negativos e edge cases."
            invalidateKeys={[["acceptance-criteria"]]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Feature</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Critérios de Aceite</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome da feature" value={form.feature} onChange={e => setForm(p => ({ ...p, feature: e.target.value }))} />
                <Textarea placeholder="Um critério por linha&#10;Ex: Given user is logged in, When they click profile, Then they see their data" rows={6} value={form.criteria} onChange={e => setForm(p => ({ ...p, criteria: e.target.value }))} />
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!form.feature || addMutation.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum critério de aceite registrado. Adicione manualmente ou use a IA.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const passed = item.criteria.filter(c => c.status === "passed").length;
            const total = item.criteria.length;
            return (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{item.feature}</CardTitle>
                    <Badge variant={item.status === "passed" ? "default" : "secondary"} className="text-[10px]">
                      {passed}/{total} aprovados
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {item.criteria.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => toggleCriterion(item.id, i)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-left ${
                          c.status === "passed" ? "bg-emerald-500/10 text-emerald-700 line-through" : "bg-muted/50 hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${c.status === "passed" ? "bg-emerald-500 border-emerald-500" : "border-border"}`}>
                          {c.status === "passed" && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {c.text}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}

export default AcceptanceCriteriaPage;
