import { useState, useRef } from "react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { FolderSearch, Plus, Tag, Quote, Filter, Search, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notify } from "@/lib/notifications";

interface Insight {
  id: string;
  title: string;
  quote: string;
  source: string;
  tags: string[];
  category: string;
  created_at: string;
}

const CATEGORIES = ["Comportamento", "Pain Point", "Necessidade", "Oportunidade", "Padrão", "Citação"];

function InsightSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted/60 animate-pulse" />
          <div className="flex gap-1.5">
            <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResearchRepositoryPage() {
  const projectId = useCurrentProjectId();
  const queryClient = useQueryClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", quote: "", source: "", tags: "", category: "Comportamento" });

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["research-repository", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId!)
        .eq("doc_type", "research_insight")
        .order("created_at", { ascending: false });
      return (data ?? []).map((d) => {
        const meta = (d.metadata ?? {}) as Record<string, unknown>;
        return {
          id: d.id,
          title: d.title,
          quote: d.content,
          source: (meta.source as string) ?? "",
          tags: (meta.tags as string[]) ?? [],
          category: (meta.category as string) ?? "Comportamento",
          created_at: d.created_at,
        } as Insight;
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("project_documents").insert({
        project_id: projectId!,
        title: form.title,
        content: form.quote,
        doc_type: "research_insight",
        metadata: {
          source: form.source,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          category: form.category,
        },
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["research-repository"] });
      setOpen(false);
      setForm({ title: "", quote: "", source: "", tags: "", category: "Comportamento" });
      toast.success("Insight registrado com sucesso");
      await notify.info(
        "🧠 Novo Insight",
        `O insight "${form.title}" foi adicionado ao repositório de pesquisa.`
      );
    },
    onError: () => toast.error("Erro ao registrar insight"),
  });

  const handleExportPdf = async () => {
    if (!reportRef.current || filtered.length === 0) return;
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

      pdf.save(`research-repository-${projectId}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  const filtered = insights.filter(i => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.quote.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ModulePage
      title="Research Repository"
      subtitle="Repositório centralizado de insights de pesquisa"
      icon={<FolderSearch className="w-5 h-5 text-primary-foreground" />}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting || filtered.length === 0}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1.5" />
            )}
            PDF
          </Button>
          <AIGenerateButton
            prompt="Analise as pesquisas, entrevistas e personas do projeto e gere insights de pesquisa categorizados (comportamentos, pain points, necessidades, oportunidades e padrões encontrados). Para cada insight inclua uma citação representativa, fonte e tags."
            invalidateKeys={[["research-repository"]]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Novo Insight</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Insight</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Título do insight" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                <Textarea placeholder="Citação ou observação..." value={form.quote} onChange={e => setForm(p => ({ ...p, quote: e.target.value }))} />
                <Input placeholder="Fonte (ex: Entrevista Maria, Survey Q2)" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} />
                <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!form.title || addMutation.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar insights..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[180px]"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <ErrorBoundary level="section">
        {isLoading ? (
          <InsightSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderSearch}
            title={search || filterCat !== "all" ? "Nenhum insight encontrado" : "Nenhum insight registrado"}
            description={
              search || filterCat !== "all"
                ? "Tente ajustar os filtros ou a busca."
                : "Adicione manualmente ou use a IA para extrair insights das suas pesquisas."
            }
            action={
              !search && filterCat === "all"
                ? { label: "Adicionar primeiro insight", onClick: () => setOpen(true) }
                : undefined
            }
          />
        ) : (
          <div ref={reportRef} className="grid gap-3 md:grid-cols-2">
            {filtered.map(insight => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow animate-fade-in break-inside-avoid shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{insight.title}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{insight.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2 items-start text-xs text-muted-foreground">
                    <Quote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <p className="italic">{insight.quote}</p>
                  </div>
                  {insight.source && <p className="text-[10px] text-muted-foreground">Fonte: {insight.source}</p>}
                  {insight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insight.tags.map(t => (
                        <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
                          <Tag className="w-2.5 h-2.5 mr-0.5" />{t}
                        </Badge>
                      ))}
                    </div>
                  )}
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
    </ModulePage>
  );
}

export default ResearchRepositoryPage;
