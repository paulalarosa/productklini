import { useState } from "react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { CheckSquare, Plus, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Criterion {
  id: string;
  feature: string;
  criteria: { text: string; status: "pending" | "passed" | "failed" }[];
  status: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AcceptanceSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-8 rounded-md bg-muted/60 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AcceptanceCriteriaPage() {
  const projectId   = useCurrentProjectId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ feature: "", criteria: "" });

  const { data: items = [], isLoading } = useQuery({
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
          id:       d.id,
          feature:  d.title,
          criteria: (meta.criteria as Criterion["criteria"]) ?? [],
          status:   (meta.status as string) ?? "pending",
        } as Criterion;
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const criteria = form.criteria
        .split("\n")
        .filter(Boolean)
        .map(t => ({ text: t.trim(), status: "pending" as const }));

      const { error } = await supabase.from("project_documents").insert({
        project_id: projectId!,
        title:      form.feature,
        content:    form.criteria,
        doc_type:   "acceptance_criteria",
        metadata:   { criteria, status: "pending" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acceptance-criteria"] });
      setOpen(false);
      setForm({ feature: "", criteria: "" });
      toast.success("Critérios de aceite registrados");
    },
    onError: () => toast.error("Erro ao salvar critérios"),
  });

  const toggleCriterion = async (docId: string, idx: number) => {
    const item = items.find(i => i.id === docId);
    if (!item) return;

    const updated = item.criteria.map((c, i) =>
      i === idx
        ? { ...c, status: c.status === "passed" ? "pending" as const : "passed" as const }
        : c,
    );
    const allPassed = updated.every(c => c.status === "passed");

    const { error } = await supabase
      .from("project_documents")
      .update({ metadata: { criteria: updated, status: allPassed ? "passed" : "pending" } })
      .eq("id", docId);

    if (error) { toast.error("Erro ao atualizar critério"); return; }
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
            label="Gerar com IA"
            size="sm"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />Nova Feature
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Critérios de Aceite</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Nome da feature"
                  value={form.feature}
                  onChange={e => setForm(p => ({ ...p, feature: e.target.value }))}
                />
                <Textarea
                  placeholder={`Um critério por linha\nEx: Given user is logged in, When they click profile, Then they see their data`}
                  rows={6}
                  value={form.criteria}
                  onChange={e => setForm(p => ({ ...p, criteria: e.target.value }))}
                />
                <Button
                  className="w-full"
                  onClick={() => addMutation.mutate()}
                  disabled={!form.feature || !form.criteria || addMutation.isPending}
                >
                  {addMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <ErrorBoundary level="section">
        {isLoading ? (
          <AcceptanceSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Nenhum critério de aceite registrado"
            description="Adicione manualmente ou use a IA para gerar critérios no formato Given/When/Then."
            action={{
              label: "Adicionar feature",
              onClick: () => setOpen(true),
            }}
          />
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const passed = item.criteria.filter(c => c.status === "passed").length;
              const total  = item.criteria.length;
              const pct    = total > 0 ? Math.round((passed / total) * 100) : 0;

              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm truncate">{item.feature}</CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Mini progress bar */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 progress-bar"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                        <Badge
                          variant={item.status === "passed" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {passed}/{total} aprovados
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {item.criteria.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => toggleCriterion(item.id, i)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-left ${
                            c.status === "passed"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-muted/50 hover:bg-muted text-foreground"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              c.status === "passed"
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-border"
                            }`}
                          >
                            {c.status === "passed" && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={c.status === "passed" ? "line-through" : ""}>
                            {c.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ErrorBoundary>
    </ModulePage>
  );
}

export default AcceptanceCriteriaPage;
