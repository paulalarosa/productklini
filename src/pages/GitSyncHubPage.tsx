import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, GitPullRequest, Clock, RotateCcw, Check, Square, CheckSquare,
  Loader2, Sparkles, Github, ArrowRight, AlertCircle, ChevronRight, Code2, Figma,
  AlertTriangle, RefreshCw, ArrowLeftRight,
} from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────
interface UIComponent {
  id: string;
  component_name: string;
  figma_node_id: string;
  dart_code: string;
  status: string;
  version: number;
  updated_at: string;
}

interface VersionEntry {
  id: string;
  component_name: string;
  version: number;
  status: string;
  updated_at: string;
  dart_code?: string;
}

interface SyncDivergence {
  id: string;
  component_name: string;
  figma_node_id: string;
  field: string;
  figmaValue: string;
  codeValue: string;
  detectedAt: string;
}

// ── Mock data for staging diff (until MCP is live) ─────
const MOCK_STAGING: {
  id: string;
  name: string;
  oldCode: string;
  newCode: string;
  figmaNode: string;
}[] = [
  {
    id: "mock-1",
    name: "PrimaryButton",
    figmaNode: "12:34",
    oldCode: `ElevatedButton(\n  onPressed: onTap,\n  style: ElevatedButton.styleFrom(\n    backgroundColor: AppColors.primary,\n    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),\n  ),\n  child: Text(label),\n)`,
    newCode: `ElevatedButton(\n  onPressed: onTap,\n  style: ElevatedButton.styleFrom(\n    backgroundColor: AppColors.primary,\n    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 14),\n    shape: RoundedRectangleBorder(\n      borderRadius: BorderRadius.circular(12),\n    ),\n  ),\n  child: Text(label, style: AppTypography.buttonMedium),\n)`,
  },
  {
    id: "mock-2",
    name: "AppBar Custom",
    figmaNode: "56:78",
    oldCode: `AppBar(\n  title: Text(title),\n  backgroundColor: AppColors.surface,\n)`,
    newCode: `AppBar(\n  title: Text(title, style: AppTypography.heading),\n  backgroundColor: AppColors.surface,\n  elevation: 0,\n  centerTitle: true,\n)`,
  },
];

// Mock divergences for bidirectional sync demo
const MOCK_DIVERGENCES: SyncDivergence[] = [
  {
    id: "div-1",
    component_name: "PrimaryButton",
    figma_node_id: "12:34",
    field: "padding",
    figmaValue: "EdgeInsets.symmetric(horizontal: 24, vertical: 12)",
    codeValue: "EdgeInsets.symmetric(horizontal: 24, vertical: 16)",
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "div-2",
    component_name: "CardWidget",
    figma_node_id: "90:12",
    field: "borderRadius",
    figmaValue: "BorderRadius.circular(8)",
    codeValue: "BorderRadius.circular(12)",
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// ── Subcomponents ──────────────────────────────────────

function VersionTimeline({
  versions,
  onRollback,
  rollingBack,
}: {
  versions: VersionEntry[];
  onRollback: (v: VersionEntry) => void;
  rollingBack: string | null;
}) {
  return (
    <div className="space-y-1">
      {versions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum histórico de versão ainda.</p>
      )}
      {versions.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
        >
          <div className="flex flex-col items-center mt-0.5">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              v.status === "Approved" ? "bg-[hsl(160,70%,50%)]" :
              v.status === "Review" ? "bg-[hsl(45,90%,55%)]" :
              "bg-muted-foreground/40"
            }`} />
            {i < versions.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground truncate">
                v{v.version} — {v.component_name}
              </span>
              <button
                onClick={() => onRollback(v)}
                disabled={rollingBack === v.id}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              >
                {rollingBack === v.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                Rollback
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(v.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StagingArea({
  items,
  selected,
  onToggle,
}: {
  items: typeof MOCK_STAGING;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isSelected = selected.has(item.id);
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <button onClick={() => onToggle(item.id)} className="shrink-0">
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground">{item.name}</span>
                <span className="ml-2 text-[10px] text-muted-foreground">
                  <Figma className="w-3 h-3 inline mr-0.5" />node {item.figmaNode}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(45,90%,55%)]/15 text-[hsl(45,90%,55%)]">
                Alterado via MCP
              </span>
            </div>
            <div className="flex flex-col md:grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border text-[11px]">
              <div className="p-3">
                <span className="text-[10px] font-semibold text-destructive/70 uppercase tracking-wider mb-1 block">Antigo</span>
                <pre className="whitespace-pre-wrap text-muted-foreground font-mono leading-relaxed">{item.oldCode}</pre>
              </div>
              <div className="p-3">
                <span className="text-[10px] font-semibold text-[hsl(160,70%,50%)]/70 uppercase tracking-wider mb-1 block">Novo (IA)</span>
                <pre className="whitespace-pre-wrap text-foreground font-mono leading-relaxed">{item.newCode}</pre>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function BidirectionalSyncPanel({
  divergences,
  onUpdateFigma,
  onUpdateCode,
  onDismiss,
}: {
  divergences: SyncDivergence[];
  onUpdateFigma: (d: SyncDivergence) => void;
  onUpdateCode: (d: SyncDivergence) => void;
  onDismiss: (d: SyncDivergence) => void;
}) {
  if (divergences.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 border-l-4 border-l-[hsl(45,90%,55%)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(45,90%,55%)]/15 flex items-center justify-center">
          <ArrowLeftRight size={16} className="text-[hsl(45,90%,55%)]" />
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(45,90%,55%)]">
            Sync Bidirecional — Divergências Detectadas
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {divergences.length} componente(s) alterado(s) no código sem atualização no Figma
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {divergences.map((d) => (
          <div key={d.id} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-[hsl(45,90%,55%)]" />
                <span className="text-xs font-semibold text-foreground">{d.component_name}</span>
                <span className="text-[10px] text-muted-foreground">· {d.field}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(d.detectedAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-md bg-muted/30 border border-border/30">
                <span className="text-[9px] font-semibold uppercase text-primary/70 block mb-0.5">Figma (Design)</span>
                <code className="text-muted-foreground font-mono">{d.figmaValue}</code>
              </div>
              <div className="p-2 rounded-md bg-muted/30 border border-border/30">
                <span className="text-[9px] font-semibold uppercase text-[hsl(160,70%,50%)]/70 block mb-0.5">Código (Repo)</span>
                <code className="text-foreground font-mono">{d.codeValue}</code>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onUpdateFigma(d)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Figma size={10} /> Atualizar Figma
              </button>
              <button
                onClick={() => onUpdateCode(d)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-[hsl(160,70%,50%)]/10 text-[hsl(160,70%,50%)] border border-[hsl(160,70%,50%)]/20 hover:bg-[hsl(160,70%,50%)]/20 transition-colors"
              >
                <Code2 size={10} /> Manter Código
              </button>
              <button
                onClick={() => onDismiss(d)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Ignorar
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────

export function GitSyncHubPage() {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [commitMsg, setCommitMsg] = useState("");
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [divergences, setDivergences] = useState<SyncDivergence[]>(MOCK_DIVERGENCES);
  const [checkingSync, setCheckingSync] = useState(false);

  // Fetch real component versions for timeline
  const fetchVersions = async () => {
    const projectId = await getProjectId();
    const { data } = await supabase
      .from("ui_components")
      .select("id, component_name, version, status, updated_at, dart_code")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });
    if (data) setVersions(data as unknown as VersionEntry[]);
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Rollback handler ────────────────────────────────
  const handleRollback = async (version: VersionEntry) => {
    setRollingBack(version.id);
    try {
      const projectId = await getProjectId();

      // Find current component by name
      const { data: current } = await supabase
        .from("ui_components")
        .select("id, version, dart_code")
        .eq("project_id", projectId)
        .eq("component_name", version.component_name)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!current) {
        toast.error("Componente não encontrado no banco");
        setRollingBack(null);
        return;
      }

      // If the clicked version IS the current, nothing to do
      if ((current as { version: number }).version === version.version) {
        toast.info("Esta já é a versão atual do componente.");
        setRollingBack(null);
        return;
      }

      // Restore dart_code from the selected version
      const rollbackCode = version.dart_code || "";
      const { error } = await supabase
        .from("ui_components")
        .update({
          dart_code: rollbackCode,
          version: version.version,
          status: "Review",
          updated_at: new Date().toISOString(),
        })
        .eq("id", (current as { id: string }).id);

      if (error) throw error;

      // Log the rollback in mcp_sync_logs
      await supabase
        .from("mcp_sync_logs")
        .insert({
          component_id: (current as { id: string }).id,
          ai_insights: {
            action: "rollback",
            from_version: (current as { version: number }).version,
            to_version: version.version,
            timestamp: new Date().toISOString(),
          },
        });

      toast.success(`Rollback para v${version.version} de ${version.component_name} realizado!`, {
        description: "O código Dart foi restaurado. Status alterado para Review.",
      });

      // Refresh timeline
      await fetchVersions();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Erro ao fazer rollback");
    }
    setRollingBack(null);
  };

  // ── Bidirectional sync handlers ─────────────────────
  const handleUpdateFigma = (d: SyncDivergence) => {
    toast.success(`Solicitação enviada para atualizar "${d.component_name}" no Figma`, {
      description: `Campo ${d.field} será sincronizado com o valor do código: ${d.codeValue}`,
    });
    setDivergences((prev) => prev.filter((x) => x.id !== d.id));
  };

  const handleUpdateCode = (d: SyncDivergence) => {
    toast.success(`Código de "${d.component_name}" será mantido`, {
      description: `O valor do Figma (${d.figmaValue}) será ignorado. Divergência resolvida.`,
    });
    setDivergences((prev) => prev.filter((x) => x.id !== d.id));
  };

  const handleDismissDivergence = (d: SyncDivergence) => {
    setDivergences((prev) => prev.filter((x) => x.id !== d.id));
    toast.info("Divergência ignorada.");
  };

  const handleCheckSync = async () => {
    setCheckingSync(true);
    // Simulate checking repo for divergences
    await new Promise((r) => setTimeout(r, 2000));
    setCheckingSync(false);
    if (divergences.length === 0) {
      toast.success("Nenhuma divergência encontrada! Código e Figma estão sincronizados.");
    } else {
      toast.info(`${divergences.length} divergência(s) detectada(s).`);
    }
  };

  const generateCommitMessage = async () => {
    if (selected.size === 0) {
      toast.error("Selecione ao menos um componente");
      return;
    }
    setGeneratingMsg(true);
    await new Promise((r) => setTimeout(r, 1800));
    const names = MOCK_STAGING.filter((s) => selected.has(s.id)).map((s) => s.name);
    setCommitMsg(
      `feat(design-system): update ${names.join(", ")} via Figma MCP sync\n\n- Auto-generated Flutter code from Figma components\n- AI-reviewed for accessibility compliance\n- Design tokens updated`
    );
    setGeneratingMsg(false);
  };

  const handleCreatePR = async () => {
    if (!commitMsg.trim()) {
      toast.error("Adicione uma mensagem de commit");
      return;
    }
    setCreatingPR(true);
    await new Promise((r) => setTimeout(r, 2000));
    setCreatingPR(false);
    toast.success("Pull Request criado com sucesso! 🚀", {
      description: "Os componentes selecionados foram enviados para revisão no GitHub.",
    });
    setSelected(new Set());
    setCommitMsg("");
  };

  const repoConnected = true;

  const mockVersions: VersionEntry[] = [
    { id: "m1", component_name: "PrimaryButton", version: 2.1, status: "Approved", updated_at: new Date(Date.now() - 7200000).toISOString(), dart_code: MOCK_STAGING[0].oldCode },
    { id: "m2", component_name: "Theme.dart", version: 2.0, status: "Approved", updated_at: new Date(Date.now() - 86400000).toISOString(), dart_code: "// Theme v2.0 code" },
    { id: "m3", component_name: "AppBar Custom", version: 1.2, status: "Review", updated_at: new Date(Date.now() - 172800000).toISOString(), dart_code: MOCK_STAGING[1].oldCode },
    { id: "m4", component_name: "BottomNav", version: 1.0, status: "Draft", updated_at: new Date(Date.now() - 432000000).toISOString(), dart_code: "// BottomNav v1.0" },
  ];

  const displayVersions = versions.length > 0 ? versions : mockVersions;

  return (
    <ModulePage
      title="Git Sync Hub"
      subtitle="Versionamento, staging e envio de código Flutter para o repositório"
      icon={<GitBranch className="w-4 h-4 text-primary-foreground" />}
    >
      <div className="space-y-4">
        {/* ── Bidirectional Sync Alerts ──────────────── */}
        <BidirectionalSyncPanel
          divergences={divergences}
          onUpdateFigma={handleUpdateFigma}
          onUpdateCode={handleUpdateCode}
          onDismiss={handleDismissDivergence}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ── Left: Version Timeline ────────────────── */}
          <div className="lg:col-span-3">
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                <Clock className="w-3.5 h-3.5 text-primary" /> Histórico de Versões
              </h3>
              <VersionTimeline
                versions={displayVersions}
                onRollback={handleRollback}
                rollingBack={rollingBack}
              />
            </div>
          </div>

          {/* ── Center: Staging Area ──────────────────── */}
          <div className="lg:col-span-6">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-primary" /> Staging Area
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {selected.size}/{MOCK_STAGING.length} selecionados
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Componentes alterados no Figma (via MCP) que ainda não estão no repositório. Selecione e revise o diff antes de enviar.
              </p>

              <StagingArea items={MOCK_STAGING} selected={selected} onToggle={toggleItem} />
            </div>
          </div>

          {/* ── Right: GitHub Integration ─────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Repo Status */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                <Github className="w-3.5 h-3.5 text-primary" /> Repositório
              </h3>

              {repoConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                    <div className="w-2 h-2 rounded-full bg-[hsl(160,70%,50%)]" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">flutter-app-logistica</p>
                      <p className="text-[10px] text-muted-foreground">main • Último push há 2h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Check className="w-3 h-3 text-[hsl(160,70%,50%)]" />
                    <span>CI/CD passando</span>
                  </div>
                  <button
                    onClick={handleCheckSync}
                    disabled={checkingSync}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-border hover:bg-accent/50 transition-colors disabled:opacity-50 text-foreground"
                  >
                    {checkingSync ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 text-primary" />
                    )}
                    {checkingSync ? "Verificando..." : "Verificar Divergências"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <AlertCircle className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">Nenhum repositório conectado</p>
                  <button className="mt-1 px-3 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground font-medium">
                    Conectar GitHub
                  </button>
                </div>
              )}
            </div>

            {/* Commit & PR */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Commit & Pull Request
              </h3>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Mensagem do Commit</label>
                {generatingMsg ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <textarea
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    rows={5}
                    placeholder="Descreva as alterações ou gere com IA…"
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
                  />
                )}
              </div>

              <button
                onClick={generateCommitMessage}
                disabled={generatingMsg || selected.size === 0}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-border hover:bg-accent/50 transition-colors disabled:opacity-50 text-foreground"
              >
                {generatingMsg ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-primary" />
                )}
                Gerar mensagem com IA
              </button>

              <button
                onClick={handleCreatePR}
                disabled={creatingPR || !commitMsg.trim() || selected.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creatingPR ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <GitPullRequest className="w-3.5 h-3.5" />
                )}
                Criar Pull Request
              </button>

              <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Nenhuma alteração vai direto para produção
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
