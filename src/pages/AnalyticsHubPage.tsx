import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Smartphone, Apple, Star, StarHalf,
  Bug, Sparkles, ThumbsUp, MessageSquare, AlertTriangle, CheckCircle2,
  ChevronDown, ExternalLink, ArrowRight, Zap, Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ---- Mock Data ----
const RETENTION_DATA = [
  { day: "Sem 1", dau: 12400, mau: 38200 },
  { day: "Sem 2", dau: 13100, mau: 39800 },
  { day: "Sem 3", dau: 11800, mau: 40100 },
  { day: "Sem 4", dau: 14200, mau: 41500 },
  { day: "Sem 5", dau: 15600, mau: 43200 },
  { day: "Sem 6", dau: 14900, mau: 44800 },
  { day: "Sem 7", dau: 16300, mau: 46100 },
];

const FUNNEL_DATA = [
  { step: "App Aberto", value: 100, users: 46100 },
  { step: "Login", value: 72, users: 33192 },
  { step: "Add Carrinho", value: 38, users: 17518 },
  { step: "Compra", value: 12, users: 5532 },
];

const SENTIMENT_DATA = [
  { name: "Positivas", value: 64, color: "hsl(160, 70%, 50%)" },
  { name: "Neutras", value: 22, color: "hsl(215, 12%, 50%)" },
  { name: "Negativas", value: 14, color: "hsl(0, 72%, 55%)" },
];

interface Review {
  id: string;
  stars: number;
  text: string;
  author: string;
  platform: "ios" | "android";
  date: string;
  aiTag: string;
  aiTagType: "bug" | "performance" | "praise" | "ux";
}

const REVIEWS: Review[] = [
  { id: "1", stars: 5, text: "App incrível! A interface é super fluida e bonita. Parabéns ao time!", author: "Maria S.", platform: "ios", date: "2 dias atrás", aiTag: "Elogio", aiTagType: "praise" },
  { id: "2", stars: 2, text: "Desde a última atualização o app trava na tela de checkout. Já tentei reinstalar e nada resolve.", author: "João P.", platform: "android", date: "1 dia atrás", aiTag: "Bug de UI", aiTagType: "bug" },
  { id: "3", stars: 3, text: "Funciona bem mas demora muito pra carregar as imagens dos produtos. Podia ser mais rápido.", author: "Ana L.", platform: "android", date: "3 dias atrás", aiTag: "Performance", aiTagType: "performance" },
  { id: "4", stars: 1, text: "Impossível completar o cadastro. O botão de 'Próximo' some quando o teclado aparece.", author: "Carlos R.", platform: "ios", date: "5 horas atrás", aiTag: "Bug de UI", aiTagType: "bug" },
  { id: "5", stars: 4, text: "Muito bom! Só sinto falta de um modo escuro. Fora isso, 10/10.", author: "Fernanda M.", platform: "ios", date: "4 dias atrás", aiTag: "UX Sugestão", aiTagType: "ux" },
  { id: "6", stars: 2, text: "O app consome muita bateria. Depois de 30 min de uso já drena 20%.", author: "Ricardo T.", platform: "android", date: "6 horas atrás", aiTag: "Performance", aiTagType: "performance" },
];

const TAG_STYLES: Record<string, string> = {
  bug: "bg-destructive/15 text-destructive border-destructive/30",
  performance: "bg-status-deliver/15 text-status-deliver border-status-deliver/30",
  praise: "bg-status-develop/15 text-status-develop border-status-develop/30",
  ux: "bg-status-discovery/15 text-status-discovery border-status-discovery/30",
};

const TOOLTIP_STYLE = {
  background: "hsl(228, 12%, 11%)",
  border: "1px solid hsl(228, 10%, 18%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 20%, 92%)",
};

type Period = "7d" | "30d" | "all";
type Platform = "all" | "ios" | "android";

export function AnalyticsHubPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [platform, setPlatform] = useState<Platform>("all");

  const crashFreePercent = 99.8;
  const crashFreeAngle = (crashFreePercent / 100) * 360;

  const handleCreateCard = (review: Review, type: "ux" | "dev") => {
    toast.success(
      type === "dev"
        ? `Bug enviado para a fila de Dev: "${review.text.slice(0, 40)}..."`
        : `Card de UX criado: "${review.text.slice(0, 40)}..."`
    );
  };

  const filteredReviews = platform === "all"
    ? REVIEWS
    : REVIEWS.filter((r) => r.platform === platform);

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Analytics & Continuous Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Métricas de uso + voz do usuário, interpretados por IA</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
            {(["7d", "30d", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "Todos"}
              </button>
            ))}
          </div>
          {/* Platform selector */}
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

      {/* AI Insight Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 md:p-5 border-l-4 border-l-status-deliver"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-status-deliver/15 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-status-deliver" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-status-deliver">Insight IA do Dia</span>
              <span className="text-[10px] text-muted-foreground">· Atualizado há 2h</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Notamos uma <strong className="text-status-deliver">queda de 12%</strong> na conversão da tela de checkout no Android nas últimas 24h. 
              O tempo de carregamento da API de pagamento aumentou de 800ms para 2.3s. Recomendamos investigar o endpoint <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded">/api/payment/process</code>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "DAU", value: "16.3K", change: "+9.4%", up: true },
          { label: "MAU", value: "46.1K", change: "+5.2%", up: true },
          { label: "Conversão", value: "12%", change: "-2.1%", up: false },
          { label: "Nota Média", value: "4.2★", change: "+0.1", up: true },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
            <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? "text-status-develop" : "text-destructive"}`}>
              {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {kpi.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Retention */}
        <motion.div className="glass-card p-4 md:p-5 lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Retenção de Usuários (DAU / MAU)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={RETENTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 10%, 18%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line type="monotone" dataKey="dau" name="DAU" stroke="hsl(214, 90%, 60%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="mau" name="MAU" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Crash-Free Gauge */}
        <motion.div className="glass-card p-4 md:p-5 flex flex-col items-center justify-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Crash-Free Sessions</h3>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(228, 10%, 18%)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="hsl(160, 70%, 50%)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(crashFreePercent / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-status-develop">{crashFreePercent}%</span>
              <span className="text-[10px] text-muted-foreground">sem falhas</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-status-develop">
            <CheckCircle2 size={12} />
            <span>Excelente estabilidade</span>
          </div>
        </motion.div>
      </div>

      {/* Funnel + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Conversion Funnel */}
        <motion.div className="glass-card p-4 md:p-5 lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Funil de Conversão</h3>
          <div className="space-y-3">
            {FUNNEL_DATA.map((step, i) => (
              <div key={step.step} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">{step.step}</span>
                <div className="flex-1 relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-lg"
                    style={{
                      background: `linear-gradient(90deg, hsl(214, 90%, 60%), hsl(270, 70%, 60%))`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.value}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 justify-between">
                    <span className="text-xs font-semibold text-foreground z-10">{step.value}%</span>
                    <span className="text-[10px] text-muted-foreground z-10">{step.users.toLocaleString()} usuários</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sentiment Donut */}
        <motion.div className="glass-card p-4 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sentimento Geral</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={SENTIMENT_DATA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
                label={({ name, value }) => `${value}%`}
              >
                {SENTIMENT_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {SENTIMENT_DATA.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reviews Feed */}
      <motion.div className="glass-card p-4 md:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avaliações Analisadas por IA</h3>
          <span className="text-[10px] text-muted-foreground">{filteredReviews.length} reviews</span>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-3 md:p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < review.stars ? "text-status-deliver fill-status-deliver" : "text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{review.author}</span>
                    <span className="text-[10px] text-muted-foreground">· {review.date}</span>
                    {review.platform === "ios" ? (
                      <Apple size={10} className="text-muted-foreground" />
                    ) : (
                      <Smartphone size={10} className="text-muted-foreground" />
                    )}
                    {/* AI Tag */}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TAG_STYLES[review.aiTagType]}`}>
                      {review.aiTag}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{review.text}</p>
                </div>
                {/* Action buttons for negative reviews */}
                {review.stars <= 3 && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCreateCard(review, "ux")}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg bg-status-discovery/10 text-status-discovery border border-status-discovery/20 hover:bg-status-discovery/20 transition-colors whitespace-nowrap"
                    >
                      Criar Card UX
                    </button>
                    <button
                      onClick={() => handleCreateCard(review, "dev")}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors whitespace-nowrap"
                    >
                      Criar Bug Dev
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
