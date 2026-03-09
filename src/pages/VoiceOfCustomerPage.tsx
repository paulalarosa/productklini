import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, Smartphone, Apple, Filter, RefreshCw, Wand2, Loader2,
  MessageSquare, CheckCircle2, Clock, Tag, ChevronDown, Sparkles,
  AlertTriangle, ThumbsUp, Bug, Zap, Lock, LayoutGrid, X,
  Send, GitBranch, Figma, PlusCircle, TrendingUp, Upload, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAppReviews, analyzeReviewsWithAI, updateReviewTags,
  insertAppReviews, scrapeStoreReviews, DbAppReview,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authHeaders";

// ─── Constants ───────────────────────────────────────────────────────────────

const TAG_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  bug:           { label: "Bug UI/UX",        color: "bg-red-500/15 text-red-400 border-red-500/30",      icon: Bug },
  crash:         { label: "Crash",            color: "bg-red-600/15 text-red-300 border-red-600/30",      icon: AlertTriangle },
  performance:   { label: "Performance",      color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: Zap },
  praise:        { label: "Elogio",           color: "bg-green-500/15 text-green-400 border-green-500/30", icon: ThumbsUp },
  ux:            { label: "Experiência UX",   color: "bg-blue-500/15 text-blue-400 border-blue-500/30",   icon: LayoutGrid },
  feature:       { label: "Feature Request",  color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: PlusCircle },
  security:      { label: "Segurança",        color: "bg-red-700/15 text-red-300 border-red-700/30",      icon: Lock },
  accessibility: { label: "Acessibilidade",  color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Sparkles },
};

const MOCK_REVIEWS: Omit<DbAppReview, "id" | "project_id" | "created_at">[] = [
  { stars: 2, text: "O app fecha sozinho quando tento confirmar meu agendamento. Já tentei 3 vezes e nada. Por favor corrijam!", author: "maria_k", platform: "android", ai_tag: "crash", ai_tag_type: "crash" },
  { stars: 5, text: "App excelente! Muito fácil de agendar e as notificações funcionam perfeitamente. Recomendo a todos!", author: "carlos_m", platform: "ios", ai_tag: "praise", ai_tag_type: "praise" },
  { stars: 1, text: "Não consigo fazer login de jeito nenhum. Fica carregando e depois diz erro de servidor. Péssimo.", author: "juliana_r", platform: "android", ai_tag: "bug", ai_tag_type: "bug" },
  { stars: 3, text: "O app é bom mas poderia ter dark mode e opção de filtrar os agendamentos por especialidade.", author: "pedro_h", platform: "ios", ai_tag: "feature", ai_tag_type: "feature" },
  { stars: 2, text: "Interface muito confusa. Os botões são pequenos demais e não dá pra entender quais telas levam pra onde.", author: "ana_c", platform: "android", ai_tag: "ux", ai_tag_type: "ux" },
  { stars: 4, text: "Ótimo aplicativo! Só precisa melhorar um pouco a velocidade na hora de carregar o histórico.", author: "rodrigo_s", platform: "ios", ai_tag: "performance", ai_tag_type: "performance" },
  { stars: 5, text: "Muito bom! Fácil de usar e me ajuda a organizar tudo. A equipe de suporte também é ágil.", author: "fernanda_l", platform: "android", ai_tag: "praise", ai_tag_type: "praise" },
  { stars: 1, text: "Dados pessoais aparecendo na tela de outro usuário. Isso é um sério problema de segurança!", author: "thiago_b", platform: "ios", ai_tag: "security", ai_tag_type: "security" },
];

const SENTIMENT_META = {
  positive: { label: "Positivo", color: "text-green-400" },
  neutral:  { label: "Neutro",   color: "text-yellow-400" },
  negative: { label: "Crítico",  color: "text-red-400" },
};

// ─── Helper components ───────────────────────────────────────────────────────

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const meta = TAG_META[tag] ?? { label: tag, color: "bg-muted text-muted-foreground border-border", icon: Tag };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function VoiceOfCustomerPage() {
  const queryClient = useQueryClient();

  // filters
  const [platformFilter, setPlatformFilter] = useState<"all" | "ios" | "android">("all");
  const [starsFilter, setStarsFilter] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  // selection & right panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState("");
  const [generatingReply, setGeneratingReply] = useState(false);
  const [replyMode, setReplyMode] = useState<"empathic" | "technical" | null>(null);

  // actions
  const [seeding, setSeeding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [showImportBar, setShowImportBar] = useState(false);
  const [importMode, setImportMode] = useState<"url" | "csv">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["app-reviews"],
    queryFn: fetchAppReviews,
  });

  // Filtered list
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (platformFilter !== "all" && r.platform !== platformFilter) return false;
      if (starsFilter !== null && r.stars !== starsFilter) return false;
      if (tagFilter !== "all" && r.ai_tag !== tagFilter) return false;
      if (sentimentFilter !== "all") {
        const s = sentimentFilter;
        if (s === "positive" && r.stars < 4) return false;
        if (s === "neutral" && (r.stars < 3 || r.stars > 3)) return false;
        if (s === "negative" && r.stars > 2) return false;
      }
      return true;
    });
  }, [reviews, platformFilter, starsFilter, tagFilter, sentimentFilter]);

  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  // ── Seed mock data ──
  const handleSeedMock = async () => {
    setSeeding(true);
    try {
      await insertAppReviews(MOCK_REVIEWS);
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success("8 reviews de exemplo inseridos!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao inserir dados");
    } finally {
      setSeeding(false);
    }
  };

  // ── Analyze with AI ──
  const handleAnalyze = async () => {
    const untagged = reviews.filter((r) => !r.ai_tag || r.ai_tag === "other");
    if (untagged.length === 0) { toast.info("Todos os reviews já foram analisados."); return; }
    setAnalyzing(true);
    try {
      const input = untagged.map((r) => ({ id: r.id, text: r.text, stars: r.stars }));
      const results = await analyzeReviewsWithAI(input);
      for (const res of results) {
        await updateReviewTags(res.id, res.ai_tag, res.ai_tag_type);
      }
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success(`${results.length} reviews analisados pela IA!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na análise");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Scrape store ──
  const handleScrape = async () => {
    if (!storeUrl.trim()) return;
    setScraping(true);
    try {
      const { reviews: scraped } = await scrapeStoreReviews(storeUrl.trim());
      const toInsert = scraped.map((r) => ({
        stars: r.stars, text: r.text, author: r.author, platform: r.platform, ai_tag: "", ai_tag_type: "",
      }));
      await insertAppReviews(toInsert);
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success(`${toInsert.length} reviews importados da loja!`);
      setStoreUrl("");
      setShowImportBar(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao importar";
      if (msg.toLowerCase().includes("firecrawl") || msg.toLowerCase().includes("not configured")) {
        toast.error("Importação via URL requer FIRECRAWL_API_KEY nos secrets do Supabase. Use a importação por CSV como alternativa.");
      } else {
        toast.error(msg);
      }
    } finally {
      setScraping(false);
    }
  };

  // ── Import CSV ──
  // Formato esperado: platform,stars,author,text  (primeira linha = header)
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScraping(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      // skip header
      const dataLines = lines[0].toLowerCase().includes("platform") ? lines.slice(1) : lines;
      const toInsert = dataLines.map((line) => {
        const [platform, stars, author, ...rest] = line.split(",");
        return {
          platform: (platform?.trim() || "android").toLowerCase(),
          stars: Math.min(5, Math.max(1, parseInt(stars?.trim() || "3", 10))),
          author: author?.trim() || "Anônimo",
          text: rest.join(",").replace(/^"|"$/g, "").trim() || "Sem texto",
          ai_tag: "",
          ai_tag_type: "",
        };
      }).filter((r) => r.text.length > 3);
      if (toInsert.length === 0) { toast.error("Nenhum review válido encontrado no CSV."); return; }
      await insertAppReviews(toInsert);
      queryClient.invalidateQueries({ queryKey: ["app-reviews"] });
      toast.success(`${toInsert.length} reviews importados do CSV!`);
      setShowImportBar(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar CSV");
    } finally {
      setScraping(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Generate reply with AI ──
  const handleGenerateReply = async (mode: "empathic" | "technical") => {
    if (!selected) return;
    setReplyMode(mode);
    setGeneratingReply(true);
    setDraftReply("");
    try {
      const headers = await getAuthHeaders();
      const systemPrompt = mode === "empathic"
        ? "Você é um especialista em Customer Success. Escreva uma resposta empática, acolhedora e humanizada para o review de um usuário. Seja compreensivo, peça desculpas se necessário, e mostre que o problema será resolvido. Máximo 4 frases."
        : "Você é um Tech Lead respondendo ao review de um usuário. Seja técnico, claro e objetivo. Explique o que causou o problema e qual a solução ou workaround disponível. Máximo 4 frases.";

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Review do usuário "${selected.author}" (${selected.stars}⭐ - ${selected.platform}):\n"${selected.text}"\n\nGere uma resposta para publicar na loja.`,
              },
            ],
            projectContext: { mode: "reply-generation", replyStyle: mode },
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Erro ao gerar resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const chunk = parsed.choices?.[0]?.delta?.content ?? "";
            if (chunk) { fullText += chunk; setDraftReply(fullText); }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar resposta");
    } finally {
      setGeneratingReply(false);
    }
  };

  // ── Create UX/Dev card ──
  const handleCreateCard = (type: "ux" | "dev") => {
    if (!selected) return;
    toast.success(`Card criado para o time de ${type === "ux" ? "UX/Design" : "Dev"}: "${selected.text.slice(0, 50)}..."`);
  };

  // ── Stats ──
  const stats = useMemo(() => ({
    total: reviews.length,
    avg: reviews.length ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : "0",
    critical: reviews.filter((r) => r.stars <= 2).length,
    unread: reviews.filter((r) => !r.ai_tag).length,
  }), [reviews]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Voice of Customer</h1>
            <p className="text-xs text-muted-foreground">Reviews da App Store & Google Play</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stat chips */}
          {[
            { label: `${stats.total} reviews`, color: "text-foreground" },
            { label: `⭐ ${stats.avg}`, color: "text-yellow-400" },
            { label: `${stats.critical} críticos`, color: "text-red-400" },
          ].map((s) => (
            <span key={s.label} className={`text-xs font-medium px-3 py-1 rounded-full bg-muted border border-border ${s.color}`}>
              {s.label}
            </span>
          ))}

          <Button variant="outline" size="sm" onClick={() => setShowImportBar((v) => !v)}>
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Analisar com IA
          </Button>
          {reviews.length === 0 && (
            <Button size="sm" onClick={handleSeedMock} disabled={seeding}>
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <PlusCircle className="w-3.5 h-3.5 mr-1.5" />}
              Carregar exemplos
            </Button>
          )}
        </div>
      </div>

      {/* ── Import bar ── */}
      {showImportBar && (
        <div className="relative border-b border-border bg-muted/40 px-6 py-4 space-y-3">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setImportMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${importMode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Globe className="w-3 h-3" /> URL da loja
            </button>
            <button
              onClick={() => setImportMode("csv")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${importMode === "csv" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Upload className="w-3 h-3" /> Importar CSV
            </button>
          </div>

          {importMode === "url" ? (
            <div className="flex gap-3 items-start">
              <div className="flex-1 space-y-1">
                <input
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://apps.apple.com/br/app/nome/id123456789  ou  play.google.com/store/apps/details?id=com.app"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Funciona com App Store e Google Play sem chave de API adicional.
                </p>
              </div>
              <Button size="sm" onClick={handleScrape} disabled={scraping || !storeUrl.trim()}>
                {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Importar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Formato CSV: <code className="bg-muted px-1 rounded">platform,stars,author,text</code> — primeira linha pode ser header.
              </p>
              <div className="flex gap-3 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:bg-background file:text-foreground file:cursor-pointer cursor-pointer"
                />
                {scraping && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <a
                href="data:text/csv;charset=utf-8,platform%2Cstars%2Cauthor%2Ctext%0Aandroid%2C5%2Cjoao_silva%2C%22App%20excelente%2C%20recomendo!%22%0Aios%2C2%2Cmaria_s%2C%22Trava%20na%20tela%20de%20login%22"
                download="reviews_modelo.csv"
                className="text-xs text-primary hover:underline"
              >
                Baixar CSV modelo
              </a>
            </div>
          )}

          <button
            onClick={() => setShowImportBar(false)}
            className="absolute right-4 top-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Three-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Filters (20%) ── */}
        <aside className="w-56 shrink-0 border-r border-border overflow-y-auto p-4 space-y-5">

          {/* Platform */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Loja</p>
            {(["all", "ios", "android"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                  ${platformFilter === p ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                {p === "all" && <LayoutGrid className="w-3.5 h-3.5" />}
                {p === "ios" && <Apple className="w-3.5 h-3.5" />}
                {p === "android" && <Smartphone className="w-3.5 h-3.5" />}
                {p === "all" ? "Todas as lojas" : p === "ios" ? "App Store" : "Google Play"}
              </button>
            ))}
          </div>

          {/* Stars */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estrelas</p>
            <button
              onClick={() => setStarsFilter(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                ${starsFilter === null ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
            >
              Todas
            </button>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setStarsFilter(starsFilter === s ? null : s)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                  ${starsFilter === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((x) => (
                    <Star key={x} className={`w-3 h-3 ${x <= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Sentiment */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sentimento</p>
            {(["all", "positive", "neutral", "negative"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                  ${sentimentFilter === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                {s === "all" ? "Todos" : SENTIMENT_META[s].label}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tag IA</p>
            <button
              onClick={() => setTagFilter("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                ${tagFilter === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
            >
              Todas
            </button>
            {Object.entries(TAG_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setTagFilter(tagFilter === key ? "all" : key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                  ${tagFilter === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <meta.icon className="w-3.5 h-3.5" />
                {meta.label}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Center: Review feed (45%) ── */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3 min-w-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum review encontrado</p>
              <p className="text-xs mt-1">
                {reviews.length === 0
                  ? "Clique em 'Carregar exemplos' para ver dados de demonstração"
                  : "Tente ajustar los filtros"}
              </p>
            </div>
          ) : (
            filtered.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedId(selectedId === review.id ? null : review.id)}
                className={`rounded-xl border p-4 cursor-pointer transition-all group
                  ${selectedId === review.id
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-border/80 hover:bg-muted/40"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
                      ${review.platform === "ios" ? "bg-blue-500/10" : "bg-green-500/10"}`}>
                      {review.platform === "ios"
                        ? <Apple className="w-3.5 h-3.5 text-blue-400" />
                        : <Smartphone className="w-3.5 h-3.5 text-green-400" />}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">{review.author}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRow stars={review.stars} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{review.text}</p>
                {review.ai_tag && (
                  <div className="mt-2.5">
                    <TagBadge tag={review.ai_tag} />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </main>

        {/* ── Right: Action panel (35%) ── */}
        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto flex flex-col">
          {selected ? (
            <div className="flex-1 flex flex-col p-5 space-y-5">

              {/* Review details */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {selected.platform === "ios"
                    ? <Apple className="w-4 h-4 text-blue-400" />
                    : <Smartphone className="w-4 h-4 text-green-400" />}
                  <span className="text-sm font-semibold text-foreground">{selected.author}</span>
                  <StarRow stars={selected.stars} />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{selected.text}</p>
                {selected.ai_tag && <TagBadge tag={selected.ai_tag} />}
              </div>

              {/* AI Analysis summary */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Análise da IA</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selected.stars <= 2
                    ? `Review crítico de ${selected.stars}⭐. O usuário reporta ${TAG_META[selected.ai_tag]?.label ?? "um problema"} que requer atenção imediata da equipe.`
                    : selected.stars >= 4
                    ? `Review positivo de ${selected.stars}⭐. O usuário destaca aspectos positivos do produto e pode servir como social proof.`
                    : `Review neutro de ${selected.stars}⭐. O usuário tem experiência mista — oportunidade de melhoria identificada.`}
                </p>
              </div>

              {/* Reply generation */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resposta</p>
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline" className="flex-1 text-xs"
                    onClick={() => handleGenerateReply("empathic")}
                    disabled={generatingReply}
                  >
                    {generatingReply && replyMode === "empathic"
                      ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      : <Wand2 className="w-3 h-3 mr-1" />}
                    Empática
                  </Button>
                  <Button
                    size="sm" variant="outline" className="flex-1 text-xs"
                    onClick={() => handleGenerateReply("technical")}
                    disabled={generatingReply}
                  >
                    {generatingReply && replyMode === "technical"
                      ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      : <Zap className="w-3 h-3 mr-1" />}
                    Técnica
                  </Button>
                </div>

                {generatingReply && !draftReply && (
                  <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                  </div>
                )}

                {draftReply && (
                  <div className="space-y-2">
                    <Textarea
                      value={draftReply}
                      onChange={(e) => setDraftReply(e.target.value)}
                      className="text-sm resize-none min-h-[100px] bg-background"
                      placeholder="Resposta gerada pela IA aparece aqui..."
                    />
                    <Button size="sm" className="w-full" onClick={() => toast.success("Resposta publicada! (demo)")}>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Publicar nas lojas
                    </Button>
                  </div>
                )}
              </div>

              {/* Backlog shortcuts */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transformar em tarefa</p>
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline" className="flex-1 text-xs"
                    onClick={() => handleCreateCard("ux")}
                  >
                    <Figma className="w-3 h-3 mr-1" />
                    Card UX
                  </Button>
                  <Button
                    size="sm" variant="outline" className="flex-1 text-xs"
                    onClick={() => handleCreateCard("dev")}
                  >
                    <GitBranch className="w-3 h-3 mr-1" />
                    Card Dev
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <MessageSquare className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">Selecione um review</p>
              <p className="text-xs leading-relaxed opacity-70">
                Clique em qualquer review do feed para ver a análise de IA, gerar uma resposta e criar cards para o backlog.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
