import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageHeader } from "@/components/ui/responsive-layout";
import { Plus, Trash2, RotateCcw, ThumbsUp, AlertTriangle, Zap, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notifications";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Retro {
  id:           string;
  sprint_name:  string;
  sprint_number:number;
  went_well:    string[];
  to_improve:   string[];
  action_items: { item: string; owner: string; done: boolean }[];
  team_mood:    string;
  date:         string;
}

const MOOD_EMOJIS: Record<string, string> = {
  great:   "🚀",
  good:    "😊",
  neutral: "😐",
  bad:     "😕",
  terrible:"😞",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RetroSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                {Array.from({ length: 3 }).map((_, k) => (
                  <div key={k} className="h-3 w-full rounded bg-muted/60 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SprintRetroPage() {
  const projectId = useCurrentProjectId();
  const qc        = useQueryClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({
    sprint_name:   "",
    sprint_number: "1",
    went_well:     "",
    to_improve:    "",
    action_items:  "",
    team_mood:     "good",
  });

  const { data: retros = [], isLoading } = useQuery({
    queryKey: ["sprint-retros", projectId],
    queryFn:  async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("sprint_retrospectives")
        .select("*")
        .eq("project_id", projectId)
        .order("sprint_number", { ascending: false });
      return (data ?? []) as unknown as Retro[];
    },
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Nenhum projeto selecionado");
      const { error } = await supabase.from("sprint_retrospectives").insert({
        project_id:    projectId,
        sprint_name:   form.sprint_name,
        sprint_number: parseInt(form.sprint_number) || 1,
        went_well:     form.went_well.split("\n").filter(Boolean),
        to_improve:    form.to_improve.split("\n").filter(Boolean),
        action_items:  form.action_items.split("\n").filter(Boolean)
          .map(item => ({ item, owner: "", done: false })),
        team_mood:     form.team_mood,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["sprint-retros"] });
      setOpen(false);
      setForm({ sprint_name: "", sprint_number: "1", went_well: "", to_improve: "", action_items: "", team_mood: "good" });
      toast.success("Retrospectiva criada!");
      await notify.info(
        "📝 Nova Retrospectiva",
        `A retrospectiva da ${form.sprint_name} foi registrada com sucesso.`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sprint_retrospectives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprint-retros"] });
      toast.success("Retrospectiva removida");
    },
    onError: () => toast.error("Erro ao remover retrospectiva"),
  });

  const handleExportPdf = async () => {
    if (!reportRef.current || retros.length === 0) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e12",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`sprint-retros-${new Date().getTime()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sprint Retrospective"
        description="Registre aprendizados e action items de cada sprint"
        actions={
          <>
            <AIGenerateButton
              prompt="Analise o estado atual do projeto, as tarefas concluídas e pendentes, e gere uma Sprint Retrospective completa com: o que foi bem, o que melhorar, e action items concretos com donos."
              label="Gerar com IA"
              invalidateKeys={[["sprint-retros"]]}
              variant="outline"
              size="sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || retros.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-1.5" />
              )}
              PDF
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />Nova Retro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Retrospectiva</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Sprint</Label>
                      <Input
                        value={form.sprint_name}
                        onChange={e => setForm(f => ({ ...f, sprint_name: e.target.value }))}
                        placeholder="Sprint 5"
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        type="number"
                        value={form.sprint_number}
                        onChange={e => setForm(f => ({ ...f, sprint_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Seletor de humor */}
                  <div>
                    <Label>Humor do time</Label>
                    <div className="flex gap-2 mt-1">
                      {Object.entries(MOOD_EMOJIS).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => setForm(f => ({ ...f, team_mood: k }))}
                          className={`text-xl p-1.5 rounded transition-colors ${
                            form.team_mood === k
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "hover:bg-accent"
                          }`}
                          title={k}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>O que foi bem (um por linha)</Label>
                    <Textarea
                      value={form.went_well}
                      onChange={e => setForm(f => ({ ...f, went_well: e.target.value }))}
                      placeholder="Entrega no prazo&#10;Boa comunicação"
                    />
                  </div>
                  <div>
                    <Label>O que melhorar (um por linha)</Label>
                    <Textarea
                      value={form.to_improve}
                      onChange={e => setForm(f => ({ ...f, to_improve: e.target.value }))}
                      placeholder="Documentação atrasada&#10;Reviews demoradas"
                    />
                  </div>
                  <div>
                    <Label>Action Items (um por linha)</Label>
                    <Textarea
                      value={form.action_items}
                      onChange={e => setForm(f => ({ ...f, action_items: e.target.value }))}
                      placeholder="Implementar daily de 15min&#10;Criar template de PR"
                    />
                  </div>

                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={!form.sprint_name || createMut.isPending}
                    className="w-full"
                  >
                    {createMut.isPending ? "Criando..." : "Criar Retrospectiva"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <ErrorBoundary level="section">
        {isLoading ? (
          <RetroSkeleton />
        ) : retros.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="Nenhuma retrospectiva registrada"
            description="Registre os aprendizados das suas sprints para evoluir continuamente."
            action={{ label: "Criar primeira retro", onClick: () => setOpen(true) }}
          />
        ) : (
          <div ref={reportRef} className="space-y-4">
            {retros.map(r => (
              <Card key={r.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MOOD_EMOJIS[r.team_mood] ?? "😐"}</span>
                    <div>
                      <CardTitle className="text-base">{r.sprint_name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">Sprint #{r.sprint_number}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMut.mutate(r.id)}
                    disabled={deleteMut.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* O que foi bem */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                        <ThumbsUp className="w-3.5 h-3.5" />O que foi bem
                      </div>
                      {r.went_well.length > 0
                        ? r.went_well.map((w, i) => (
                            <p key={i} className="text-xs text-muted-foreground pl-5">• {w}</p>
                          ))
                        : <p className="text-xs text-muted-foreground/50 italic pl-5">Nada registrado</p>
                      }
                    </div>

                    {/* O que melhorar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />Melhorar
                      </div>
                      {r.to_improve.length > 0
                        ? r.to_improve.map((t, i) => (
                            <p key={i} className="text-xs text-muted-foreground pl-5">• {t}</p>
                          ))
                        : <p className="text-xs text-muted-foreground/50 italic pl-5">Nada registrado</p>
                      }
                    </div>

                    {/* Action items */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <Zap className="w-3.5 h-3.5" />Action Items
                      </div>
                      {Array.isArray(r.action_items) && r.action_items.length > 0
                        ? r.action_items.map((a, i) => (
                            <p key={i} className="text-xs text-muted-foreground pl-5">
                              • {typeof a === "string" ? a : a.item}
                            </p>
                          ))
                        : <p className="text-xs text-muted-foreground/50 italic pl-5">Nenhum item</p>
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ErrorBoundary>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
