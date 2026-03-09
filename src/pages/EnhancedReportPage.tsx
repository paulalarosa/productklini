import { useRef, useMemo, useState } from "react";
import { useProject, useTasks, usePersonas, useUxMetrics, useDocuments, useTeamMembers } from "@/hooks/useProjectData";
import { useABExperiments } from "@/hooks/useABExperiments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, FileText, Users, BarChart3, CheckSquare, Calendar, FileDown, Loader2, FlaskConical, TrendingUp, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/authHeaders";
import { getProjectId } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const statusLabels: Record<string, string> = { todo: "A Fazer", in_progress: "Em Andamento", review: "Revisão", done: "Concluído", blocked: "Bloqueado" };
const statusColors: Record<string, string> = { todo: "bg-muted text-muted-foreground", in_progress: "bg-primary/20 text-primary", review: "bg-[hsl(var(--status-define))]/20 text-[hsl(var(--status-define))]", done: "bg-[hsl(var(--status-develop))]/20 text-[hsl(var(--status-develop))]", blocked: "bg-destructive/20 text-destructive" };
const priorityLabels: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };
const phaseLabels: Record<string, string> = { discovery: "Discovery", define: "Define", develop: "Develop", deliver: "Deliver" };
const COLORS = ["hsl(214, 90%, 60%)", "hsl(160, 70%, 50%)", "hsl(270, 70%, 60%)", "hsl(40, 90%, 55%)", "hsl(0, 72%, 55%)"];
const tooltipStyle = { background: "hsl(228, 12%, 11%)", border: "1px solid hsl(228, 10%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 20%, 92%)" };

export function EnhancedReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: project } = useProject();
  const { data: tasks } = useTasks();
  const { data: personas } = usePersonas();
  const { data: metrics } = useUxMetrics();
  const { data: docs } = useDocuments();
  const { data: team } = useTeamMembers();
  const { data: experiments } = useABExperiments();

  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  const phaseProgress = (project?.phase_progress as Record<string, number>) ?? {};

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    (tasks ?? []).forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: statusLabels[key] || key, value, key }));
  }, [tasks]);

  const phaseChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    (tasks ?? []).forEach((t) => { counts[t.phase] = (counts[t.phase] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: phaseLabels[key] || key, value }));
  }, [tasks]);

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#0d0e12" });
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
      pdf.save(`relatorio-completo-${project?.name?.toLowerCase().replace(/\s+/g, "-") ?? "projeto"}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (e) {
      console.error("PDF export failed:", e);
      toast.error("Erro ao exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    let md = `# Relatório Completo: ${project?.name ?? "Projeto"}\n> Gerado em ${now}\n\n`;
    if (project?.description) md += `${project.description}\n\n`;
    md += `## Progresso\n- Fase: ${phaseLabels[project?.current_phase ?? "discovery"]}\n- Progresso: ${project?.progress ?? 0}%\n\n`;

    if (personas?.length) {
      md += `## Personas (${personas.length})\n`;
      personas.forEach((p) => { md += `### ${p.name} — ${p.role}\n- Objetivos: ${p.goals?.join(", ")}\n- Dores: ${p.pain_points?.join(", ")}\n\n`; });
    }
    if (metrics?.length) {
      md += `## Métricas UX\n| Métrica | Score | Anterior |\n|---|---|---|\n`;
      metrics.forEach((m) => { md += `| ${m.metric_name} | ${m.score} | ${m.previous_score ?? "—"} |\n`; });
      md += "\n";
    }
    if (experiments?.length) {
      md += `## A/B Tests (${experiments.length})\n`;
      experiments.forEach((e) => { md += `- **${e.name}** (${e.status}) — ${e.hypothesis}\n`; });
      md += "\n";
    }
    if (aiSummary) md += `## Resumo IA\n${aiSummary}\n`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-completo-${project?.name?.toLowerCase().replace(/\s+/g, "-") ?? "projeto"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();
      const context = {
        project: { name: project?.name, phase: project?.current_phase, progress: project?.progress },
        personas: personas?.map((p) => ({ name: p.name, role: p.role })) ?? [],
        metrics: metrics?.map((m) => ({ name: m.metric_name, score: m.score })) ?? [],
        tasks: { total: tasks?.length ?? 0, done: tasks?.filter((t) => t.status === "done").length ?? 0 },
        experiments: experiments?.map((e) => ({ name: e.name, status: e.status, hypothesis: e.hypothesis })) ?? [],
      };

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "ai_ux_report_summary", content: JSON.stringify(context), project_id: projectId }),
      });
      if (!resp.ok) throw new Error("Erro na análise");
      const data = await resp.json();
      setAiSummary(data.result);
      toast.success("Resumo gerado!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const renderLabel = ({ name, percent }: { name: string; percent: number }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : "";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Completo</h1>
          <p className="text-sm text-muted-foreground">Métricas UX, A/B Tests, Personas e Progresso — {now}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateAISummary} disabled={aiLoading} className="gap-1.5">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Resumo IA
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}><Download className="w-4 h-4 mr-1.5" /> .md</Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />} PDF
          </Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" /> Imprimir</Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Overview */}
        <Card className="print:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><Calendar className="w-4 h-4 text-primary" /> Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><p className="text-xs text-muted-foreground">Projeto</p><p className="font-semibold text-foreground">{project?.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Fase</p><Badge variant="secondary">{phaseLabels[project?.current_phase ?? "discovery"]}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Progresso</p><p className="font-semibold text-foreground">{project?.progress ?? 0}%</p></div>
              <div><p className="text-xs text-muted-foreground">Tarefas</p><p className="font-semibold text-foreground">{tasks?.length ?? 0}</p></div>
              <div><p className="text-xs text-muted-foreground">A/B Tests</p><p className="font-semibold text-foreground">{experiments?.length ?? 0}</p></div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(phaseProgress).map(([phase, pct]) => (
                <div key={phase}>
                  <p className="text-xs text-muted-foreground mb-1">{phaseLabels[phase] ?? phase}</p>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{pct}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        {tasks && tasks.length > 0 && (
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="w-4 h-4 text-primary" /> Distribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">Por Status</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={renderLabel} labelLine={false}>
                        {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">Por Fase</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={phaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {phaseChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personas */}
        {personas && personas.length > 0 && (
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="w-4 h-4 text-primary" /> Personas ({personas.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {personas.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div><p className="font-semibold text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{p.role}</p></div>
                  {p.goals?.length > 0 && <div className="flex flex-wrap gap-1">{p.goals.map((g, i) => <Badge key={i} variant="secondary" className="text-xs">{g}</Badge>)}</div>}
                  {p.pain_points?.length > 0 && <div className="flex flex-wrap gap-1">{p.pain_points.map((pp, i) => <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">{pp}</Badge>)}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* UX Metrics */}
        {metrics && metrics.length > 0 && (
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="w-4 h-4 text-primary" /> Métricas UX</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Métrica</TableHead><TableHead className="text-right">Score</TableHead><TableHead className="text-right">Anterior</TableHead><TableHead className="text-right">Variação</TableHead></TableRow></TableHeader>
                <TableBody>
                  {metrics.map((m) => {
                    const diff = m.previous_score != null ? m.score - m.previous_score : null;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.metric_name}</TableCell>
                        <TableCell className="text-right">{m.score}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{m.previous_score ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {diff != null ? <span className={diff > 0 ? "text-[hsl(var(--status-develop))]" : diff < 0 ? "text-destructive" : "text-muted-foreground"}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}</span> : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* A/B Tests */}
        {experiments && experiments.length > 0 && (
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><FlaskConical className="w-4 h-4 text-primary" /> A/B Tests ({experiments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {experiments.map((exp) => (
                <div key={exp.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-sm">{exp.name}</p>
                    <Badge variant={exp.status === "running" ? "default" : "secondary"} className="text-xs">{exp.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{exp.hypothesis}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Tráfego: {Math.round(Number(exp.traffic_allocation) * 100)}%</span>
                    <span>Significância: {Math.round(Number(exp.statistical_significance ?? 0.95) * 100)}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
        {aiSummary && (
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="w-4 h-4 text-primary" /> Resumo Executivo (IA)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {docs && docs.length > 0 && (
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><FileText className="w-4 h-4 text-primary" /> Documentos ({docs.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {docs.slice(0, 10).map((d) => (
                <div key={d.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm">{d.title}</p>
                    <Badge variant="outline" className="text-xs">{d.doc_type}</Badge>
                    {d.ai_generated && <Badge variant="secondary" className="text-xs">IA</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{d.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`@media print { body { background: white !important; color: black !important; } .print\\:hidden { display: none !important; } nav, aside, header { display: none !important; } main { padding: 0 !important; } }`}</style>
    </div>
  );
}
