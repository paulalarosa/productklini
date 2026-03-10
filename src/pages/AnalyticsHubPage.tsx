import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Smartphone, Apple, Star,
  Sparkles, CheckCircle2, Loader2, Download, Globe, FileUp, X, Wand2, FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAnalyticsSnapshots, fetchFunnelSteps, fetchAppReviews,
  seedAnalyticsData, insertAppReviews, scrapeStoreReviews,
  analyzeReviewsWithAI, updateReviewTags,
  DbAnalyticsSnapshot, DbFunnelStep, DbAppReview,
} from "@/lib/api";

const SENTIMENT_COLORS = {
  positive: "hsl(160, 70%, 50%)",
  neutral: "hsl(215, 12%, 50%)",
  negative: "hsl(0, 72%, 55%)",
};

const TAG_STYLES: Record<string, string> = {
  bug: "bg-destructive/15 text-destructive border-destructive/30",
  performance: "bg-status-deliver/15 text-status-deliver border-status-deliver/30",
  praise: "bg-status-develop/15 text-status-develop border-status-develop/30",
  ux: "bg-status-discovery/15 text-status-discovery border-status-discovery/30",
  crash: "bg-destructive/15 text-destructive border-destructive/30",
  feature: "bg-primary/15 text-primary border-primary/30",
  security: "bg-destructive/15 text-destructive border-destructive/30",
  accessibility: "bg-status-define/15 text-status-define border-status-define/30",
};

const TOOLTIP_STYLE = {
  background: "hsl(228, 12%, 11%)",
  border: "1px solid hsl(228, 10%, 18%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 20%, 92%)",
};

type Platform = "all" | "ios" | "android";

export function AnalyticsHubPage() {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<Platform>("all");
  const [seeding, setSeeding] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: snapshots, isLoading: loadingSnapshots } = useQuery({
    queryKey: ["analytics-snapshots"],
    queryFn: fetchAnalyticsSnapshots,
  });
  const { data: funnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ["analytics-funnel"],
    queryFn: fetchFunnelSteps,
  });
  const { data: reviews, isLoading: loadingReviews, refetch: refetchReviews } = useQuery({
    queryKey: ["app-reviews"],
    queryFn: fetchAppReviews,
  });

  const isEmpty = !loadingSnapshots && (!snapshots || snapshots.length === 0);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedAnalyticsData();
      toast.success("Dados de exemplo inseridos!");
      window.location.reload();
    } catch (e) {
      toast.error("Erro ao inserir dados");
    }
    setSeeding(false);
  };

  const latestSnapshot = snapshots?.[snapshots.length - 1];
  const prevSnapshot = snapshots?.[snapshots.length - 2];
  const crashFreePercent = latestSnapshot ? Number(latestSnapshot.crash_free_percent) : 99.8;

  const dauChange = latestSnapshot && prevSnapshot
    ? (((latestSnapshot.dau - prevSnapshot.dau) / prevSnapshot.dau) * 100).toFixed(1)
    : "0";
  const mauChange = latestSnapshot && prevSnapshot
    ? (((latestSnapshot.mau - prevSnapshot.mau) / prevSnapshot.mau) * 100).toFixed(1)
    : "0";

  const conversionRate = funnel && funnel.length > 0
    ? Number(funnel[funnel.length - 1].percent_value)
    : 0;

  const avgStars = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const sentimentData = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    const pos = reviews.filter(r => r.stars >= 4).length;
    const neg = reviews.filter(r => r.stars <= 2).length;
    const neu = reviews.length - pos - neg;
    const total = reviews.length;
    return [
      { name: "Positivas", value: Math.round((pos / total) * 100), color: SENTIMENT_COLORS.positive },
      { name: "Neutras", value: Math.round((neu / total) * 100), color: SENTIMENT_COLORS.neutral },
      { name: "Negativas", value: Math.round((neg / total) * 100), color: SENTIMENT_COLORS.negative },
    ];
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let result = reviews ?? [];
    if (platform !== "all") result = result.filter(r => r.platform === platform);
    if (tagFilter !== "all") result = result.filter(r => r.ai_tag_type === tagFilter);
    return result;
  }, [reviews, platform, tagFilter]);

  // Compute tag counts for filter chips
  const tagCounts = useMemo(() => {
    const base = platform === "all" ? (reviews ?? []) : (reviews ?? []).filter(r => r.platform === platform);
    const counts: Record<string, number> = {};
    base.forEach(r => { counts[r.ai_tag_type] = (counts[r.ai_tag_type] || 0) + 1; });
    return counts;
  }, [reviews, platform]);

  // AI Insights summary panel data
  const aiInsightsSummary = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.length;
    const grouped: Record<string, DbAppReview[]> = {};
    reviews.forEach(r => {
      if (!grouped[r.ai_tag_type]) grouped[r.ai_tag_type] = [];
      grouped[r.ai_tag_type].push(r);
    });

    const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
    const topIssues = sorted.filter(([type]) => type !== "praise").slice(0, 3);
    const praiseCount = grouped["praise"]?.length || 0;
    const bugCount = grouped["bug"]?.length || 0;
    const crashCount = grouped["crash"]?.length || 0;
    const perfCount = grouped["performance"]?.length || 0;
    const negativeCount = reviews.filter(r => r.stars <= 2).length;
    const positiveCount = reviews.filter(r => r.stars >= 4).length;

    const recommendations: string[] = [];
    if (bugCount + crashCount > 0) recommendations.push(`Priorizar correção de ${bugCount + crashCount} problemas técnicos (bugs + crashes) reportados pelos usuários.`);
    if (perfCount > 0) recommendations.push(`Investigar ${perfCount} reclamações de performance — possível impacto na retenção.`);
    if (negativeCount > total * 0.3) recommendations.push("Mais de 30% das reviews são negativas. Considere um sprint dedicado à qualidade.");
    if (positiveCount > total * 0.6) recommendations.push("Sentimento majoritariamente positivo! Aproveite para solicitar reviews e melhorar o ranking na loja.");
    if (recommendations.length === 0) recommendations.push("Métricas equilibradas. Continue monitorando tendências semanalmente.");

    return { total, sorted, topIssues, praiseCount, negativeCount, positiveCount, recommendations };
  }, [reviews]);

  const handleExportPDF = () => {
    if (!aiInsightsSummary) {
      toast.error("Sem dados para exportar");
      return;
    }
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Insights — Analytics & Feedback", margin, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} • ${aiInsightsSummary.total} reviews analisadas`, margin, y);
    y += 14;

    // KPIs
    doc.setTextColor(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo de KPIs", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const kpis = [
      `DAU: ${latestSnapshot ? `${(latestSnapshot.dau / 1000).toFixed(1)}K` : "—"}`,
      `MAU: ${latestSnapshot ? `${(latestSnapshot.mau / 1000).toFixed(1)}K` : "—"}`,
      `Conversão: ${conversionRate}%`,
      `Nota Média: ${avgStars}★ (${reviews?.length ?? 0} reviews)`,
      `Crash-Free: ${crashFreePercent}%`,
    ];
    kpis.forEach((k) => { doc.text(`• ${k}`, margin + 4, y); y += 6; });
    y += 6;

    // Tag Distribution
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Categoria (IA)", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    aiInsightsSummary.sorted.forEach(([type, items]) => {
      const label = TAG_LABELS[type] || type;
      doc.text(`• ${label}: ${items.length} reviews (${Math.round((items.length / aiInsightsSummary.total) * 100)}%)`, margin + 4, y);
      y += 6;
    });
    y += 6;

    // Sentiment
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Sentimento", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Positivas (4-5★): ${aiInsightsSummary.positiveCount}`, margin + 4, y); y += 6;
    doc.text(`Negativas (1-2★): ${aiInsightsSummary.negativeCount}`, margin + 4, y); y += 10;

    // Recommendations
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recomendações da IA", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    aiInsightsSummary.recommendations.forEach((rec, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 170);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5 + 3;
    });

    doc.save("insights-analytics-report.pdf");
    toast.success("PDF exportado com sucesso!");
  };

  const handleCreateCard = (review: DbAppReview, type: "ux" | "dev") => {
    toast.success(
      type === "dev"
        ? `Bug enviado para a fila de Dev: "${review.text.slice(0, 40)}..."`
        : `Card de UX criado: "${review.text.slice(0, 40)}..."`
    );
  };

  const runAIAnalysis = async (reviewsToAnalyze: DbAppReview[]) => {
    if (reviewsToAnalyze.length === 0) return;
    setAnalyzing(true);
    try {
      const input = reviewsToAnalyze.map(r => ({ id: r.id, text: r.text, stars: r.stars }));
      const results = await analyzeReviewsWithAI(input);
      // Update each review in DB
      for (const r of results) {
        await updateReviewTags(r.id, r.ai_tag, r.ai_tag_type);
      }
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success(`${results.length} reviews analisadas por IA!`);
    } catch (e) {
      const err = e as Error;
      if (err.message?.includes("429") || err.message?.includes("Rate limit")) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
      } else if (err.message?.includes("402") || err.message?.includes("Créditos")) {
        toast.error("Créditos insuficientes para IA. Adicione créditos no workspace.");
      } else {
        toast.error(err.message || "Erro na análise de IA");
      }
    }
    setAnalyzing(false);
  };

  const handleReanalyzeAll = async () => {
    if (!reviews || reviews.length === 0) return;
    await runAIAnalysis(reviews);
  };

  const handleScrapeStore = async () => {
    if (!storeUrl.trim()) return;
    setScraping(true);
    try {
      const result = await scrapeStoreReviews(storeUrl);
      if (result.reviews.length === 0) {
        toast.warning("Nenhuma review encontrada na página. Tente outra URL.");
        setScraping(false);
        return;
      }
      const reviewsToInsert = result.reviews.map(r => ({
        stars: r.stars,
        text: r.text,
        author: r.author,
        platform: r.platform,
        ai_tag: "Pendente",
        ai_tag_type: "ux",
      }));
      await insertAppReviews(reviewsToInsert);
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success(`${result.reviews.length} reviews importadas! Analisando com IA...`);
      setStoreUrl("");
      setShowImport(false);
      // Auto-analyze after import - refetch to get IDs
      const freshReviews = await fetchAppReviews();
      const pendingReviews = freshReviews.filter(r => r.ai_tag === "Pendente");
      if (pendingReviews.length > 0) {
        await runAIAnalysis(pendingReviews);
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Erro ao extrair reviews");
    }
    setScraping(false);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: Record<string, unknown>[];
      if (file.name.endsWith(".json")) {
        parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) parsed = [parsed];
      } else {
        // CSV parsing
        const lines = text.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        parsed = lines.slice(1).map(line => {
          const values = line.split(",");
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => obj[h] = (values[i] || "").trim());
          return obj;
        });
      }
      const reviewsToInsert = parsed.map((r: Record<string, unknown>) => {
        const textValue = (r.text || r.review || r.content || "") as string;
        const authorValue = (r.author || r.user || r.name || "Anônimo") as string;
        const platformValue = (r.platform || "android") as string;
        
        return {
          stars: parseInt((r.stars || r.rating || "3") as string) || 3,
          text: textValue,
          author: authorValue,
          platform: platformValue.toLowerCase(),
          ai_tag: "Pendente",
          ai_tag_type: "ux",
        };
      }).filter(r => r.text.length > 0);

      if (reviewsToInsert.length === 0) {
        toast.warning("Nenhuma review válida encontrada no arquivo.");
        setImporting(false);
        return;
      }
      await insertAppReviews(reviewsToInsert);
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success(`${reviewsToInsert.length} reviews importadas! Analisando com IA...`);
      setShowImport(false);
      // Auto-analyze
      const freshReviews = await fetchAppReviews();
      const pendingReviews = freshReviews.filter(r => r.ai_tag === "Pendente");
      if (pendingReviews.length > 0) {
        await runAIAnalysis(pendingReviews);
      }
    } catch (e) {
      toast.error("Erro ao processar arquivo. Verifique o formato.");
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const TAG_LABELS: Record<string, string> = {
    bug: "🐛 Bug", performance: "⚡ Performance", praise: "👏 Elogio", ux: "🎯 UX",
    crash: "💥 Crash", feature: "✨ Feature", security: "🔒 Segurança", accessibility: "♿ Acessibilidade",
  };

  if (isEmpty) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] gap-4">
        <Sparkles className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="text-lg font-semibold text-foreground">Sem dados de analytics</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Insira dados de exemplo para visualizar métricas de retenção, funil de conversão e reviews de usuários.
        </p>
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {seeding ? "Inserindo..." : "Inserir dados de exemplo"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Analytics & Continuous Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas de uso + voz do usuário, interpretados por IA</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
            {([
              { key: "all" as Platform, label: "Ambos", icon: null },
              { key: "ios" as Platform, label: "iOS", icon: Apple },
              { key: "android" as Platform, label: "Android", icon: Smartphone },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setPlatform(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  platform === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon && <Icon size={12} />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsightsSummary && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 md:p-5 border-l-4 border-l-status-deliver">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-status-deliver/15 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-status-deliver" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-status-deliver">Painel de Insights IA</span>
                <span className="text-[10px] text-muted-foreground">({aiInsightsSummary.total} reviews analisadas)</span>
                <button
                  onClick={handleExportPDF}
                  className="ml-auto flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <FileText size={10} />
                  Exportar PDF
                </button>
              </div>

              {/* Tag distribution */}
              <div className="flex flex-wrap gap-2">
                {aiInsightsSummary.sorted.map(([type, items]) => (
                  <div key={type} className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${TAG_STYLES[type] || "bg-muted/30 text-muted-foreground border-border/50"}`}>
                    {TAG_LABELS[type] || type} · {items.length}
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recomendações</span>
                {aiInsightsSummary.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-status-deliver shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/90 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "DAU", value: latestSnapshot ? `${(latestSnapshot.dau / 1000).toFixed(1)}K` : "—", change: `${Number(dauChange) >= 0 ? "+" : ""}${dauChange}%`, up: Number(dauChange) >= 0 },
          { label: "MAU", value: latestSnapshot ? `${(latestSnapshot.mau / 1000).toFixed(1)}K` : "—", change: `${Number(mauChange) >= 0 ? "+" : ""}${mauChange}%`, up: Number(mauChange) >= 0 },
          { label: "Conversão", value: `${conversionRate}%`, change: "", up: conversionRate > 10 },
          { label: "Nota Média", value: `${avgStars}★`, change: `${(reviews?.length ?? 0)} reviews`, up: Number(avgStars) >= 3.5 },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
            <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
            {kpi.change && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? "text-status-develop" : "text-destructive"}`}>
                {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Retention Chart */}
        <motion.div className="glass-card p-4 md:p-5 lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Retenção de Usuários (DAU / MAU)</h3>
          {loadingSnapshots ? (
            <div className="flex items-center justify-center h-[220px]"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={snapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
                <XAxis dataKey="period_label" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="dau" name="DAU" stroke="hsl(214, 90%, 60%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="mau" name="MAU" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Crash-Free Gauge */}
        <motion.div className="glass-card p-4 md:p-5 flex flex-col items-center justify-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Crash-Free Sessions</h3>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(228, 10%, 18%)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(160, 70%, 50%)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(crashFreePercent / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-status-develop">{crashFreePercent}%</span>
              <span className="text-[10px] text-muted-foreground">sem falhas</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-status-develop">
            <CheckCircle2 size={12} />
            <span>{crashFreePercent >= 99.5 ? "Excelente estabilidade" : "Necessita atenção"}</span>
          </div>
        </motion.div>
      </div>

      {/* Funnel + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div className="glass-card p-4 md:p-5 lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Funil de Conversão</h3>
          {loadingFunnel ? (
            <div className="flex items-center justify-center h-[140px]"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {(funnel ?? []).map((step, i) => (
                <div key={step.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">{step.step_name}</span>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                    <motion.div className="absolute inset-y-0 left-0 rounded-lg"
                      style={{ background: "linear-gradient(90deg, hsl(214, 90%, 60%), hsl(270, 70%, 60%))" }}
                      initial={{ width: 0 }} animate={{ width: `${step.percent_value}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }} />
                    <div className="absolute inset-0 flex items-center px-3 justify-between">
                      <span className="text-xs font-semibold text-foreground z-10">{Number(step.percent_value)}%</span>
                      <span className="text-[10px] text-muted-foreground z-10">{step.user_count.toLocaleString()} usuários</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sentiment Donut */}
        <motion.div className="glass-card p-4 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sentimento Geral</h3>
          {sentimentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value"
                    label={({ value }) => `${value}%`}>
                    {sentimentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem reviews para análise</p>
          )}
        </motion.div>
      </div>

      {/* Import Panel */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Importar Reviews</h3>
                <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>

              {/* Scrape from Store */}
              <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">Extrair da Play Store / App Store</span>
                </div>
                <p className="text-xs text-muted-foreground">Cole a URL da página do app na loja para extrair reviews automaticamente via Firecrawl.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={e => setStoreUrl(e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleScrapeStore}
                    disabled={scraping || !storeUrl.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
                  >
                    {scraping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {scraping ? "Extraindo..." : "Extrair"}
                  </button>
                </div>
              </div>

              {/* Manual Import */}
              <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <FileUp size={14} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">Importar CSV / JSON</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formato esperado: colunas <code className="text-[10px] bg-muted px-1 rounded">stars, text, author, platform</code> (CSV) ou array de objetos (JSON).
                </p>
                <input ref={fileInputRef} type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 border border-border/50 disabled:opacity-50"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                  {importing ? "Importando..." : "Escolher arquivo"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews Feed */}
      <motion.div className="glass-card p-4 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avaliações Analisadas por IA</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReanalyzeAll}
              disabled={analyzing || !reviews || reviews.length === 0}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-status-deliver/10 text-status-deliver border border-status-deliver/20 hover:bg-status-deliver/20 transition-colors disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
              {analyzing ? "Analisando..." : "Re-analisar com IA"}
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Download size={10} />
              Importar Reviews
            </button>
            <span className="text-[10px] text-muted-foreground">{filteredReviews.length} reviews</span>
          </div>
        </div>

        {/* Tag Filter Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setTagFilter("all")}
            className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
              tagFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
            }`}
          >
            Todas ({reviews?.length ?? 0})
          </button>
          {Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <button
              key={type}
              onClick={() => setTagFilter(tagFilter === type ? "all" : type)}
              className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
                tagFilter === type
                  ? `${TAG_STYLES[type] || ""} ring-1 ring-offset-1 ring-offset-background ring-primary/30`
                  : `${TAG_STYLES[type] || "bg-muted/30 text-muted-foreground border-border/50"} opacity-70 hover:opacity-100`
              }`}
            >
              {TAG_LABELS[type] || type} ({count})
            </button>
          ))}
        </div>
        {loadingReviews ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-3 md:p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.stars ? "text-status-deliver fill-status-deliver" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{review.author}</span>
                      <span className="text-[10px] text-muted-foreground">· {new Date(review.created_at).toLocaleDateString("pt-BR")}</span>
                      {review.platform === "ios" ? <Apple size={10} className="text-muted-foreground" /> : <Smartphone size={10} className="text-muted-foreground" />}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TAG_STYLES[review.ai_tag_type] || ""}`}>{review.ai_tag}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{review.text}</p>
                  </div>
                  {review.stars <= 3 && (
                    <div className="flex flex-row sm:flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                      <button onClick={() => handleCreateCard(review, "ux")}
                        className="flex-1 sm:flex-none text-[10px] px-2.5 py-1.5 rounded-lg bg-status-discovery/10 text-status-discovery border border-status-discovery/20 hover:bg-status-discovery/20 transition-colors whitespace-nowrap">
                        Criar Card UX
                      </button>
                      <button onClick={() => handleCreateCard(review, "dev")}
                        className="flex-1 sm:flex-none text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors whitespace-nowrap">
                        Criar Bug Dev
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
