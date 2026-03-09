import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Monitor, Tablet, Smartphone, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/authHeaders";
import { getProjectId } from "@/lib/api";

type Breakpoint = { label: string; minWidth: number; maxWidth: number; icon: "mobile" | "tablet" | "desktop" };

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { label: "Mobile", minWidth: 320, maxWidth: 767, icon: "mobile" },
  { label: "Tablet", minWidth: 768, maxWidth: 1023, icon: "tablet" },
  { label: "Desktop", minWidth: 1024, maxWidth: 1920, icon: "desktop" },
];

type CheckItem = {
  id: string;
  category: string;
  description: string;
  breakpoints: Record<string, "pass" | "fail" | "warning" | "unchecked">;
};

const DEFAULT_CHECKS: Omit<CheckItem, "breakpoints">[] = [
  { id: "nav", category: "Navegação", description: "Menu adapta para hamburger em telas menores" },
  { id: "text", category: "Tipografia", description: "Tamanho de fonte legível (min 14px mobile)" },
  { id: "touch", category: "Interação", description: "Alvos de toque mínimo 44x44px no mobile" },
  { id: "images", category: "Mídia", description: "Imagens responsivas com srcset ou object-fit" },
  { id: "scroll", category: "Layout", description: "Sem scroll horizontal indesejado" },
  { id: "spacing", category: "Espaçamento", description: "Padding/margin adequado por breakpoint" },
  { id: "grid", category: "Layout", description: "Grid colapsa corretamente (multi-col → single-col)" },
  { id: "forms", category: "Formulários", description: "Inputs ocupam largura adequada no mobile" },
  { id: "modals", category: "Componentes", description: "Modais/Dialogs adaptam ao viewport" },
  { id: "tables", category: "Componentes", description: "Tabelas possuem scroll horizontal ou layout alternativo" },
  { id: "cta", category: "Interação", description: "CTAs visíveis sem scroll (above the fold)" },
  { id: "contrast", category: "Acessibilidade", description: "Contraste de cores mantido em todos breakpoints" },
];

const iconMap = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

const statusIcon = {
  pass: <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-develop))]" />,
  fail: <XCircle className="w-4 h-4 text-destructive" />,
  warning: <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-deliver))]" />,
  unchecked: <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />,
};

const statusCycle: Array<"unchecked" | "pass" | "warning" | "fail"> = ["unchecked", "pass", "warning", "fail"];

export function ResponsiveAuditPage() {
  const [breakpoints] = useState<Breakpoint[]>(DEFAULT_BREAKPOINTS);
  const [checks, setChecks] = useState<CheckItem[]>(() =>
    DEFAULT_CHECKS.map((c) => ({
      ...c,
      breakpoints: Object.fromEntries(breakpoints.map((b) => [b.label, "unchecked" as const])),
    }))
  );
  const [customCheck, setCustomCheck] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const toggleStatus = (checkId: string, bpLabel: string) => {
    setChecks((prev) =>
      prev.map((c) => {
        if (c.id !== checkId) return c;
        const current = c.breakpoints[bpLabel] || "unchecked";
        const next = statusCycle[(statusCycle.indexOf(current) + 1) % statusCycle.length];
        return { ...c, breakpoints: { ...c.breakpoints, [bpLabel]: next } };
      })
    );
  };

  const addCustomCheck = () => {
    if (!customCheck.trim()) return;
    const id = `custom-${Date.now()}`;
    setChecks((prev) => [
      ...prev,
      {
        id,
        category: "Custom",
        description: customCheck.trim(),
        breakpoints: Object.fromEntries(breakpoints.map((b) => [b.label, "unchecked" as const])),
      },
    ]);
    setCustomCheck("");
  };

  const removeCheck = (id: string) => setChecks((prev) => prev.filter((c) => c.id !== id));

  // Stats
  const totalCells = checks.length * breakpoints.length;
  const passCount = checks.reduce((acc, c) => acc + Object.values(c.breakpoints).filter((v) => v === "pass").length, 0);
  const failCount = checks.reduce((acc, c) => acc + Object.values(c.breakpoints).filter((v) => v === "fail").length, 0);
  const warningCount = checks.reduce((acc, c) => acc + Object.values(c.breakpoints).filter((v) => v === "warning").length, 0);
  const checkedCount = passCount + failCount + warningCount;
  const score = totalCells > 0 ? Math.round((passCount / totalCells) * 100) : 0;

  const bpScore = (bpLabel: string) => {
    const total = checks.length;
    const passes = checks.filter((c) => c.breakpoints[bpLabel] === "pass").length;
    return total > 0 ? Math.round((passes / total) * 100) : 0;
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();
      const auditData = checks.map((c) => ({
        item: c.description,
        category: c.category,
        results: c.breakpoints,
      }));

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "responsive_audit",
          content: JSON.stringify({ checks: auditData, breakpoints: breakpoints.map((b) => b.label), score }),
          project_id: projectId,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro na análise");
      }

      const data = await resp.json();
      setAiReport(data.result);
      toast.success("Análise de IA concluída!");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Erro ao analisar com IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit de Design Responsivo</h1>
          <p className="text-sm text-muted-foreground">Verifique se seus designs atendem breakpoints mobile, tablet e desktop</p>
        </div>
        <Button onClick={handleAIAnalysis} disabled={aiLoading || checkedCount === 0} className="gap-2">
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Análise IA
        </Button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-3xl font-bold text-primary">{score}%</p>
            <p className="text-xs text-muted-foreground mt-1">Score Geral</p>
            <Progress value={score} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        {breakpoints.map((bp) => {
          const Icon = iconMap[bp.icon];
          const s = bpScore(bp.label);
          return (
            <Card key={bp.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xl font-bold text-foreground">{s}%</p>
                <p className="text-xs text-muted-foreground">{bp.label}</p>
                <p className="text-[10px] text-muted-foreground">{bp.minWidth}–{bp.maxWidth}px</p>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="pt-4 pb-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--status-develop))]" />
              <span className="text-sm font-semibold text-foreground">{passCount}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--status-deliver))]" />
              <span className="text-sm font-semibold text-foreground">{warningCount}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-sm font-semibold text-foreground">{failCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Checklist Responsivo</CardTitle>
          <p className="text-xs text-muted-foreground">Clique nas células para alternar: ✅ Pass → ⚠️ Warning → ❌ Fail</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Verificação</TableHead>
                  <TableHead className="w-20">Categoria</TableHead>
                  {breakpoints.map((bp) => {
                    const Icon = iconMap[bp.icon];
                    return (
                      <TableHead key={bp.label} className="text-center w-24">
                        <div className="flex flex-col items-center gap-0.5">
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px]">{bp.label}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell className="text-sm">{check.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{check.category}</Badge>
                    </TableCell>
                    {breakpoints.map((bp) => (
                      <TableCell key={bp.label} className="text-center">
                        <button
                          onClick={() => toggleStatus(check.id, bp.label)}
                          className="p-1.5 rounded-md hover:bg-accent transition-colors mx-auto"
                        >
                          {statusIcon[check.breakpoints[bp.label] || "unchecked"]}
                        </button>
                      </TableCell>
                    ))}
                    <TableCell>
                      {check.id.startsWith("custom-") && (
                        <button onClick={() => removeCheck(check.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Add custom */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Adicionar verificação personalizada..."
              value={customCheck}
              onChange={(e) => setCustomCheck(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomCheck()}
              className="text-sm"
            />
            <Button variant="outline" size="sm" onClick={addCustomCheck} disabled={!customCheck.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Report */}
      {aiReport && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-4 h-4 text-primary" /> Relatório de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm text-foreground/90">
              {aiReport}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
