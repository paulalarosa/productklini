import { useProject, useTasks, usePersonas, useUxMetrics, useDocuments, useTeamMembers } from "@/hooks/useProjectData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, FileText, Users, BarChart3, CheckSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  review: "bg-[hsl(var(--status-define))]/20 text-[hsl(var(--status-define))]",
  done: "bg-[hsl(var(--status-develop))]/20 text-[hsl(var(--status-develop))]",
  blocked: "bg-destructive/20 text-destructive",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const phaseLabels: Record<string, string> = {
  discovery: "Discovery",
  define: "Define",
  develop: "Develop",
  deliver: "Deliver",
};

export function ReportPage() {
  const { data: project } = useProject();
  const { data: tasks } = useTasks();
  const { data: personas } = usePersonas();
  const { data: metrics } = useUxMetrics();
  const { data: docs } = useDocuments();
  const { data: team } = useTeamMembers();

  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });

  const tasksByStatus = {
    todo: tasks?.filter((t) => t.status === "todo") ?? [],
    in_progress: tasks?.filter((t) => t.status === "in_progress") ?? [],
    review: tasks?.filter((t) => t.status === "review") ?? [],
    done: tasks?.filter((t) => t.status === "done") ?? [],
    blocked: tasks?.filter((t) => t.status === "blocked") ?? [],
  };

  const phaseProgress = (project?.phase_progress as Record<string, number>) ?? {};

  const handlePrint = () => window.print();

  const handleExportMarkdown = () => {
    let md = `# Relatório do Projeto: ${project?.name ?? "Sem nome"}\n`;
    md += `> Gerado em ${now}\n\n`;
    if (project?.description) md += `${project.description}\n\n`;

    md += `## Fase Atual: ${phaseLabels[project?.current_phase ?? "discovery"] ?? project?.current_phase}\n`;
    md += `Progresso geral: ${project?.progress ?? 0}%\n\n`;
    Object.entries(phaseProgress).forEach(([phase, pct]) => {
      md += `- ${phaseLabels[phase] ?? phase}: ${pct}%\n`;
    });

    if (team?.length) {
      md += `\n## Equipe (${team.length})\n`;
      team.forEach((m) => (md += `- **${m.name}** — ${m.role}\n`));
    }

    if (tasks?.length) {
      md += `\n## Tarefas (${tasks.length})\n`;
      md += `| Título | Módulo | Fase | Status | Prioridade |\n|---|---|---|---|---|\n`;
      tasks.forEach((t) => {
        md += `| ${t.title} | ${t.module} | ${phaseLabels[t.phase] ?? t.phase} | ${t.status} | ${priorityLabels[t.priority] ?? t.priority} |\n`;
      });
    }

    if (personas?.length) {
      md += `\n## Personas (${personas.length})\n`;
      personas.forEach((p) => {
        md += `### ${p.name} — ${p.role}\n`;
        if (p.goals?.length) md += `**Objetivos:** ${p.goals.join(", ")}\n`;
        if (p.pain_points?.length) md += `**Dores:** ${p.pain_points.join(", ")}\n\n`;
      });
    }

    if (metrics?.length) {
      md += `\n## Métricas UX\n`;
      md += `| Métrica | Score | Anterior |\n|---|---|---|\n`;
      metrics.forEach((m) => {
        md += `| ${m.metric_name} | ${m.score} | ${m.previous_score ?? "—"} |\n`;
      });
    }

    if (docs?.length) {
      md += `\n## Documentos (${docs.length})\n`;
      docs.forEach((d) => {
        md += `### ${d.title}\n*Tipo: ${d.doc_type} | ${d.ai_generated ? "Gerado por IA" : "Manual"}*\n\n${d.content}\n\n---\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${project?.name?.toLowerCase().replace(/\s+/g, "-") ?? "projeto"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header - hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório do Projeto</h1>
          <p className="text-sm text-muted-foreground">Consolidação completa dos dados — {now}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
            <Download className="w-4 h-4 mr-1.5" /> Exportar .md
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold">{project?.name}</h1>
        <p className="text-sm text-muted-foreground">{now}</p>
        {project?.description && <p className="mt-2">{project.description}</p>}
      </div>

      {/* Project Overview */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-4 h-4 text-primary" /> Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Projeto</p>
              <p className="font-semibold text-foreground">{project?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fase Atual</p>
              <Badge variant="secondary">{phaseLabels[project?.current_phase ?? "discovery"]}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progresso Geral</p>
              <p className="font-semibold text-foreground">{project?.progress ?? 0}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Tarefas</p>
              <p className="font-semibold text-foreground">{tasks?.length ?? 0}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(phaseProgress).map(([phase, pct]) => (
              <div key={phase}>
                <p className="text-xs text-muted-foreground mb-1">{phaseLabels[phase] ?? phase}</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{pct}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      {team && team.length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-4 h-4 text-primary" /> Equipe ({team.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {team.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {tasks && tasks.length > 0 && (
        <Card className="print:shadow-none print:border print:break-inside-avoid">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="w-4 h-4 text-primary" /> Tarefas ({tasks.length})
            </CardTitle>
            <div className="flex gap-2 flex-wrap mt-2">
              {Object.entries(tasksByStatus).map(([status, list]) =>
                list.length > 0 ? (
                  <Badge key={status} variant="outline" className="text-xs">
                    {status.replace("_", " ")}: {list.length}
                  </Badge>
                ) : null
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs uppercase">{t.module}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{phaseLabels[t.phase] ?? t.phase}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status] ?? ""}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs ${t.priority === "urgent" ? "text-destructive font-semibold" : t.priority === "high" ? "text-[hsl(var(--status-blocked))]" : "text-muted-foreground"}`}>
                        {priorityLabels[t.priority] ?? t.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{t.days_in_phase}/{t.estimated_days}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Personas */}
      {personas && personas.length > 0 && (
        <Card className="print:shadow-none print:border print:break-inside-avoid">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-4 h-4 text-primary" /> Personas ({personas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personas.map((p) => (
              <div key={p.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div>
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
                {p.goals?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Objetivos</p>
                    <div className="flex flex-wrap gap-1">
                      {p.goals.map((g, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {p.pain_points?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Dores</p>
                    <div className="flex flex-wrap gap-1">
                      {p.pain_points.map((pp, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">{pp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* UX Metrics */}
      {metrics && metrics.length > 0 && (
        <Card className="print:shadow-none print:border print:break-inside-avoid">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-4 h-4 text-primary" /> Métricas UX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead className="text-right">Score Atual</TableHead>
                  <TableHead className="text-right">Score Anterior</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => {
                  const diff = m.previous_score != null ? m.score - m.previous_score : null;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.metric_name}</TableCell>
                      <TableCell className="text-right">{m.score}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{m.previous_score ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {diff != null ? (
                          <span className={diff > 0 ? "text-[hsl(var(--status-develop))]" : diff < 0 ? "text-destructive" : "text-muted-foreground"}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {docs && docs.length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-4 h-4 text-primary" /> Documentos ({docs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {docs.map((d) => (
              <div key={d.id} className="p-3 rounded-lg bg-muted/50 print:break-inside-avoid">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-foreground text-sm">{d.title}</p>
                  <Badge variant="outline" className="text-xs">{d.doc_type}</Badge>
                  {d.ai_generated && <Badge variant="secondary" className="text-xs">IA</Badge>}
                </div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto print:max-h-none print:overflow-visible">
                  {d.content.length > 500 ? d.content.slice(0, 500) + "..." : d.content}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          nav, aside, header, [data-radix-popper-content-wrapper] { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
