import { useState } from "react";
import { Palette, Sparkles, Loader2, Copy, Check, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authHeaders";

interface ColorPair {
  fg: string;
  bg: string;
  label: string;
}

interface ContrastResult {
  pair: ColorPair;
  ratio: number;
  aa_normal: boolean;
  aa_large: boolean;
  aaa_normal: boolean;
  aaa_large: boolean;
}

interface AIAnalysis {
  harmony_score: number;
  harmony_type: string;
  issues: string[];
  suggestions: string[];
  brand_alignment: string;
  mood: string;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function RatioBar({ ratio }: { ratio: number }) {
  const pct = Math.min((ratio / 21) * 100, 100);
  const color = ratio >= 7 ? "bg-emerald-500" : ratio >= 4.5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-2 rounded-full bg-secondary">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
      pass ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
    }`}>
      {pass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export function VisualCheckerPage() {
  const [colors, setColors] = useState<string[]>(["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#FFFFFF", "#0F172A"]);
  const [newColor, setNewColor] = useState("#8B5CF6");
  const [results, setResults] = useState<ContrastResult[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const addColor = () => {
    if (colors.length >= 10) return toast.error("Máximo 10 cores");
    if (colors.includes(newColor)) return toast.error("Cor já existe");
    setColors([...colors, newColor]);
  };

  const removeColor = (i: number) => setColors(colors.filter((_, idx) => idx !== i));

  const runContrastCheck = () => {
    const pairs: ContrastResult[] = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const ratio = contrastRatio(colors[i], colors[j]);
        pairs.push({
          pair: { fg: colors[i], bg: colors[j], label: `${colors[i]} / ${colors[j]}` },
          ratio: Math.round(ratio * 100) / 100,
          aa_normal: ratio >= 4.5,
          aa_large: ratio >= 3,
          aaa_normal: ratio >= 7,
          aaa_large: ratio >= 4.5,
        });
      }
    }
    pairs.sort((a, b) => b.ratio - a.ratio);
    setResults(pairs);
  };

  const runAIAnalysis = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "visual-check",
          content: JSON.stringify({ colors }),
        }),
      });
      if (!res.ok) throw new Error("Erro na análise");
      const data = await res.json();
      setAIAnalysis(data.result);
      toast.success("Análise visual concluída!");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  const copyColor = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopied(c);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <ModulePage title="Verificador Visual" subtitle="Contraste, harmonia e acessibilidade de cores" icon={<Palette className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        {/* Palette Input */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Paleta de Cores</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {colors.map((c, i) => (
              <div key={i} className="group relative">
                <button
                  onClick={() => copyColor(c)}
                  className="w-14 h-14 rounded-lg border border-border shadow-sm hover:scale-105 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
                <button onClick={() => removeColor(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                <p className="text-[9px] text-muted-foreground text-center mt-1 font-mono">
                  {copied === c ? <Check className="w-3 h-3 mx-auto text-emerald-400" /> : c}
                </p>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-14 h-14 rounded-lg cursor-pointer border border-border" />
              <button onClick={addColor} className="text-[9px] text-primary hover:underline">+ Adicionar</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={runContrastCheck} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Verificar Contraste
            </button>
            <button onClick={runAIAnalysis} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Análise IA (Harmonia + Marca)
            </button>
          </div>
        </div>

        {/* Contrast Results */}
        {results.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Resultados de Contraste WCAG</h3>
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        <div className="w-6 h-6 rounded-l border border-border" style={{ backgroundColor: r.pair.fg }} />
                        <div className="w-6 h-6 rounded-r border border-border" style={{ backgroundColor: r.pair.bg }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{r.pair.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{r.ratio}:1</span>
                  </div>
                  <RatioBar ratio={r.ratio} />
                  <div className="flex flex-wrap gap-1.5">
                    <Badge pass={r.aa_normal} label="AA Normal" />
                    <Badge pass={r.aa_large} label="AA Large" />
                    <Badge pass={r.aaa_normal} label="AAA Normal" />
                    <Badge pass={r.aaa_large} label="AAA Large" />
                  </div>
                  {/* Preview */}
                  <div className="flex gap-2 mt-1">
                    <div className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: r.pair.bg, color: r.pair.fg }}>
                      Texto exemplo Aa
                    </div>
                    <div className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: r.pair.fg, color: r.pair.bg }}>
                      Texto exemplo Aa
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Análise IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Harmonia</p>
                <p className="text-lg font-bold text-foreground">{aiAnalysis.harmony_score}/10</p>
                <p className="text-xs text-muted-foreground">{aiAnalysis.harmony_type}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mood / Clima</p>
                <p className="text-sm font-medium text-foreground">{aiAnalysis.mood}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Alinhamento com Marca</p>
              <p className="text-xs text-foreground">{aiAnalysis.brand_alignment}</p>
            </div>
            {aiAnalysis.issues.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-red-400 mb-1">⚠ Problemas</p>
                <ul className="space-y-1">
                  {aiAnalysis.issues.map((iss, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" /> {iss}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiAnalysis.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-1">💡 Sugestões</p>
                <ul className="space-y-1">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
