import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageHeader } from "@/components/ui/responsive-layout";
import { Plus, Trash2, ShieldAlert, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Risk {
  id: string;
  risk_title: string;
  description: string;
  category: string;
  probability: string;
  impact: string;
  mitigation_plan: string;
  owner: string;
  status: string;
}

const LEVEL_COLORS: Record<string, string> = { 
  low: "bg-green-500/10 text-green-700", 
  medium: "bg-amber-500/10 text-amber-700", 
  high: "bg-red-500/10 text-red-700", 
  critical: "bg-destructive/10 text-destructive" 
};

export function RiskRegisterPage() {
  const projectId = useCurrentProjectId();
  const qc = useQueryClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({ risk_title: "", description: "", category: "technical", probability: "medium", impact: "medium", mitigation_plan: "", owner: "" });

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ["risk-register", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase.from("risk_register").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return (data ?? []) as Risk[];
    },
    enabled: !!projectId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("No project");
      const { error } = await supabase.from("risk_register").insert({ project_id: projectId, ...form });
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["risk-register"] });
      setOpen(false);
      toast.success("Risco registrado!");

      if (form.impact === "high" || form.impact === "critical") {
        await notify.warning(
          "⚠️ Risco Crítico Registrado",
          `Um novo risco de alto impacto foi identificado: "${form.risk_title}".`
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("risk_register").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["risk-register"] }); toast.success("Risco removido"); },
    onError: () => toast.error("Erro ao remover risco"),
  });

  const handleExportPdf = async () => {
    if (!reportRef.current || risks.length === 0) return;
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

      pdf.save(`risk-register-${projectId}.pdf`);
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
        title="Risk Register"
        description="Identifique e gerencie riscos do produto"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || risks.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-1.5" />
              )}
              PDF
            </Button>
            <AIGenerateButton
              prompt="Analise o projeto atual e identifique os principais riscos nas categorias: técnico, design, negócio e operacional. Para cada risco, defina probabilidade, impacto e plano de mitigação."
              label="Gerar com IA"
              invalidateKeys={[["risk-register"]]}
              variant="outline"
              size="sm"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Novo Risco</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Risco</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Título do Risco</Label>
                    <Input value={form.risk_title} onChange={e => setForm(f => ({ ...f, risk_title: e.target.value }))} placeholder="Ex: Dependência de API externa instável" />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Técnico</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="business">Negócio</SelectItem>
                          <SelectItem value="operational">Operacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Probabilidade</Label>
                      <Select value={form.probability} onValueChange={v => setForm(f => ({ ...f, probability: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Impacto</Label>
                      <Select value={form.impact} onValueChange={v => setForm(f => ({ ...f, impact: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="critical">Crítico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Plano de Mitigação</Label>
                    <Textarea value={form.mitigation_plan} onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
                  </div>
                  <Button onClick={() => createMut.mutate()} disabled={!form.risk_title || createMut.isPending} className="w-full">
                    {createMut.isPending ? "Criando..." : "Registrar Risco"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <ErrorBoundary level="section">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : risks.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Nenhum risco registrado"
            description="Identifique riscos antes que se tornem problemas"
          />
        ) : (
          <div ref={reportRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risks.map(r => (
              <Card key={r.id} className="animate-fade-in break-inside-avoid">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-sm">{r.risk_title}</CardTitle>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => deleteMut.mutate(r.id)}
                    disabled={deleteMut.isPending}
                    className="print:hidden"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                    <Badge className={`text-[10px] border-0 ${LEVEL_COLORS[r.probability]}`}>
                      Prob: {r.probability}
                    </Badge>
                    <Badge className={`text-[10px] border-0 ${LEVEL_COLORS[r.impact]}`}>
                      Impacto: {r.impact}
                    </Badge>
                    {r.status && <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>}
                  </div>
                  {r.mitigation_plan && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Mitigação:</span> {r.mitigation_plan}
                    </p>
                  )}
                  {r.owner && <p className="text-[10px] text-muted-foreground">Responsável: {r.owner}</p>}
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
