import { useState, useCallback, useRef, useEffect } from "react";
import {
  Sparkles, Send, History, Wand2, Users, Route, CreditCard, LayoutDashboard,
  Loader2, Code2, Save, FileDown, ChevronRight, Compass, Blocks,
  Map, UserCircle, GitBranch, ArrowRight, CheckCircle2,
  Monitor, Smartphone, Tablet, Move, MousePointer, Type, Square,
  Circle, Minus, Copy, Trash2, Download, Palette, SlidersHorizontal,
  RotateCw, AlignLeft, Bold, Italic, Lock, Unlock, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authHeaders";
import type { Json } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProjectId } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const getStudioUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/design-studio`;

// ---- Types ----
type StudioMode = "ux-pilot" | "ui-make";
type CanvasTool = "select" | "move" | "rect" | "circle" | "text" | "line";
type DeviceFrame = "desktop" | "tablet" | "mobile";

interface PreviewElement {
  type: "rect" | "circle" | "text" | "line";
  x: number; y: number; width: number; height: number;
  fill: string; fontSize?: number; text?: string;
  opacity?: number; rotation?: number; cornerRadius?: number;
  strokeColor?: string; strokeWidth?: number;
  locked?: boolean;
}

interface StudioResult {
  title?: string; component_name?: string; artifact_type?: string;
  code?: string; description?: string; data?: any;
  preview_elements?: PreviewElement[];
  flutter_code?: string;
}

interface Iteration {
  id: string; mode: StudioMode; prompt: string;
  result: StudioResult; timestamp: Date; savedToDS?: boolean;
}

// ---- Loading Messages ----
const UX_LOADING = ["Analisando requisitos de UX...", "Mapeando jornadas...", "Gerando personas...", "Estruturando fluxos..."];
const UI_LOADING = ["Analisando requisitos visuais...", "Gerando layout...", "Renderizando componentes...", "Montando código..."];

// ---- Quick Chips ----
const UX_CHIPS = [
  { label: "Criar Persona", icon: UserCircle, prompt: "Crie uma persona detalhada para um app de delivery de comida, incluindo demographics, goals, pain points e behaviors" },
  { label: "Mapa de Jornada", icon: Map, prompt: "Crie um mapa de jornada do usuário para um e-commerce desde a descoberta até a compra e pós-venda" },
  { label: "User Flow Login", icon: GitBranch, prompt: "Gere um fluxo completo de login/cadastro para um app mobile" },
  { label: "Sitemap SaaS", icon: Compass, prompt: "Gere um sitemap completo para um SaaS de gestão de projetos" },
];

const UI_CHIPS = [
  { label: "Tela de Login", icon: Monitor, prompt: "Gere uma tela de login completa moderna com email, senha, login social (Google, Apple), esqueceu senha e link para cadastro. Estilo glassmorphism dark." },
  { label: "Dashboard", icon: LayoutDashboard, prompt: "Crie um dashboard analytics completo com cards KPI, gráfico de receita, lista de atividades recentes e sidebar de navegação" },
  { label: "Pricing Table", icon: CreditCard, prompt: "Gere um componente de Pricing Table com 3 planos (Free, Pro, Enterprise) com toggle mensal/anual" },
  { label: "Profile Card", icon: Users, prompt: "Gere um card de perfil de usuário com avatar, info, stats e botões de ação" },
];

// ---- Emotion & Flow Colors ----
const emotionColors: Record<string, { bg: string; text: string; emoji: string }> = {
  happy: { bg: "bg-green-500/20", text: "text-green-600", emoji: "😊" },
  satisfied: { bg: "bg-blue-500/20", text: "text-blue-600", emoji: "😌" },
  neutral: { bg: "bg-secondary", text: "text-muted-foreground", emoji: "😐" },
  confused: { bg: "bg-amber-500/20", text: "text-amber-600", emoji: "😕" },
  frustrated: { bg: "bg-destructive/20", text: "text-destructive", emoji: "😤" },
};

const flowNodeColors: Record<string, string> = {
  start: "bg-green-500/10 border-green-500", end: "bg-destructive/10 border-destructive",
  action: "bg-blue-500/10 border-blue-500", decision: "bg-amber-500/10 border-amber-500",
  screen: "bg-primary/10 border-primary",
};

// ---- Preset Colors ----
const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#ffffff",
  "#000000", "#6b7280", "#1e293b", "#0f172a", "#fef3c7",
];

// ---- Save to DS Hub ----
async function saveComponentToDS(result: StudioResult, prompt: string) {
  const projectId = await getProjectId();
  const { error } = await supabase.from("ds_components").insert([{
    project_id: projectId, name: result.component_name || "Componente",
    description: result.description || prompt, category: "components",
    code_react: result.code || "", code_vue: "", code_html: "",
    preview_elements: (result.preview_elements || []) as unknown as Json,
    specs: {} as unknown as Json, status: "draft", source: "ai-studio",
  }]);
  if (error) throw error;
}

// ---- Flutter Code Generator ----
function generateFlutterFromReact(code: string, name: string): string {
  return `import 'package:flutter/material.dart';

/// Generated from AI Design Studio
/// Component: ${name}

class ${name.replace(/[^a-zA-Z0-9]/g, '')}Widget extends StatelessWidget {
  const ${name.replace(/[^a-zA-Z0-9]/g, '')}Widget({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${name}', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('Flutter adaptation of the generated component.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.7))),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: theme.colorScheme.primaryContainer.withOpacity(0.3), borderRadius: BorderRadius.circular(8)),
            child: const Text('Adapte o código React gerado para este widget Flutter.', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }
}`;
}

// ---- Properties Panel ----
function PropertiesPanel({ element, index, onUpdate, onDelete, onDuplicate }: {
  element: PreviewElement; index: number;
  onUpdate: (idx: number, updates: Partial<PreviewElement>) => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
}) {
  return (
    <div className="w-[200px] border-l border-border bg-card flex flex-col overflow-y-auto">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Propriedades</span>
        <div className="flex gap-0.5">
          <button onClick={() => onDuplicate(index)} title="Duplicar" className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
          <button onClick={() => onUpdate(index, { locked: !element.locked })} title={element.locked ? "Desbloquear" : "Bloquear"} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
            {element.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <button onClick={() => onDelete(index)} title="Excluir" className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="p-3 space-y-3 text-[11px]">
        {/* Position */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Posição</label>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <span className="text-[8px] text-muted-foreground">X</span>
              <Input type="number" value={Math.round(element.x)} onChange={e => onUpdate(index, { x: Number(e.target.value) })} className="h-6 text-[10px] px-1.5" />
            </div>
            <div>
              <span className="text-[8px] text-muted-foreground">Y</span>
              <Input type="number" value={Math.round(element.y)} onChange={e => onUpdate(index, { y: Number(e.target.value) })} className="h-6 text-[10px] px-1.5" />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Tamanho</label>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <span className="text-[8px] text-muted-foreground">W</span>
              <Input type="number" value={Math.round(element.width)} onChange={e => onUpdate(index, { width: Number(e.target.value) })} className="h-6 text-[10px] px-1.5" />
            </div>
            <div>
              <span className="text-[8px] text-muted-foreground">H</span>
              <Input type="number" value={Math.round(element.height)} onChange={e => onUpdate(index, { height: Number(e.target.value) })} className="h-6 text-[10px] px-1.5" />
            </div>
          </div>
        </div>

        {/* Fill Color */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Cor de preenchimento</label>
          <div className="flex items-center gap-1.5 mb-1.5">
            <input type="color" value={element.fill} onChange={e => onUpdate(index, { fill: e.target.value })} className="w-6 h-6 rounded border border-border cursor-pointer" />
            <Input value={element.fill} onChange={e => onUpdate(index, { fill: e.target.value })} className="h-6 text-[10px] px-1.5 font-mono flex-1" />
          </div>
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => onUpdate(index, { fill: c })}
                className={`w-4 h-4 rounded-sm border border-border/50 hover:scale-110 transition-transform ${element.fill === c ? "ring-1 ring-primary ring-offset-1" : ""}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Stroke */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Borda</label>
          <div className="flex items-center gap-1.5">
            <input type="color" value={element.strokeColor || "#000000"} onChange={e => onUpdate(index, { strokeColor: e.target.value })} className="w-6 h-6 rounded border border-border cursor-pointer" />
            <Input type="number" value={element.strokeWidth ?? 0} onChange={e => onUpdate(index, { strokeWidth: Number(e.target.value) })} className="h-6 text-[10px] px-1.5 w-12" placeholder="0" />
            <span className="text-[8px] text-muted-foreground">px</span>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Opacidade: {Math.round((element.opacity ?? 1) * 100)}%</label>
          <Slider value={[Math.round((element.opacity ?? 1) * 100)]} onValueChange={([v]) => onUpdate(index, { opacity: v / 100 })} min={0} max={100} step={1} className="w-full" />
        </div>

        {/* Corner Radius (rect only) */}
        {element.type === "rect" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Raio: {element.cornerRadius ?? 4}px</label>
            <Slider value={[element.cornerRadius ?? 4]} onValueChange={([v]) => onUpdate(index, { cornerRadius: v })} min={0} max={60} step={1} className="w-full" />
          </div>
        )}

        {/* Rotation */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Rotação: {element.rotation ?? 0}°</label>
          <Slider value={[element.rotation ?? 0]} onValueChange={([v]) => onUpdate(index, { rotation: v })} min={0} max={360} step={1} className="w-full" />
        </div>

        {/* Text properties */}
        {element.type === "text" && (
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Texto</label>
            <Input value={element.text || ""} onChange={e => onUpdate(index, { text: e.target.value })} className="h-6 text-[10px] px-1.5 mb-1.5" />
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-muted-foreground">Size</span>
              <Input type="number" value={element.fontSize || 14} onChange={e => onUpdate(index, { fontSize: Number(e.target.value) })} className="h-6 text-[10px] px-1.5 w-12" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main Component ----
export function AIDesignStudio() {
  const [mode, setMode] = useState<StudioMode>("ux-pilot");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<StudioResult | null>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [codeView, setCodeView] = useState<"preview" | "react" | "flutter">("preview");
  const [showHistory, setShowHistory] = useState(false);
  const [savingToDS, setSavingToDS] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>("desktop");
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select");
  const [canvasElements, setCanvasElements] = useState<PreviewElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<number | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elX: number; elY: number } | null>(null);
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // Inline text editing
  const [editingTextIdx, setEditingTextIdx] = useState<number | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const chips = mode === "ux-pilot" ? UX_CHIPS : UI_CHIPS;
  const loadingMsgs = mode === "ux-pilot" ? UX_LOADING : UI_LOADING;
  const currentSaved = iterations.length > 0 && iterations[0]?.savedToDS;

  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const vw = deviceWidths[deviceFrame].w;
    const vh = 500;
    return {
      x: ((e.clientX - rect.left) / rect.width) * vw,
      y: ((e.clientY - rect.top) / rect.height) * vh,
    };
  }, [deviceFrame]);

  const updateElement = useCallback((idx: number, updates: Partial<PreviewElement>) => {
    setCanvasElements(prev => prev.map((el, i) => i === idx ? { ...el, ...updates } : el));
  }, []);

  const duplicateElement = useCallback((idx: number) => {
    setCanvasElements(prev => {
      const el = prev[idx];
      const dup = { ...el, x: el.x + 20, y: el.y + 20 };
      return [...prev, dup];
    });
    setSelectedElement(canvasElements.length);
  }, [canvasElements.length]);

  const deleteElement = useCallback((idx: number) => {
    setCanvasElements(prev => prev.filter((_, i) => i !== idx));
    setSelectedElement(null);
  }, []);

  // Mouse handlers for drag/resize
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getSVGPoint(e);

    if (canvasTool !== "select" && canvasTool !== "move") {
      // Create new element
      const newEl: PreviewElement = {
        type: canvasTool === "circle" ? "circle" : canvasTool === "text" ? "text" : canvasTool === "line" ? "line" : "rect",
        x: pt.x, y: pt.y,
        width: canvasTool === "text" ? 100 : 120,
        height: canvasTool === "line" ? 0 : 60,
        fill: canvasTool === "text" ? "#ffffff" : "#6366f1",
        opacity: 1, rotation: 0, cornerRadius: 4,
        ...(canvasTool === "text" ? { text: "Texto", fontSize: 14 } : {}),
      };
      setCanvasElements(prev => [...prev, newEl]);
      setSelectedElement(canvasElements.length);
      return;
    }

    // Select mode — find element under cursor (reverse order for z-index)
    for (let i = canvasElements.length - 1; i >= 0; i--) {
      const el = canvasElements[i];
      if (el.locked) continue;
      const inX = pt.x >= el.x && pt.x <= el.x + el.width;
      const inY = pt.y >= el.y && pt.y <= el.y + el.height;
      if (inX && inY) {
        setSelectedElement(i);
        setIsDragging(true);
        setDragStart({ x: pt.x, y: pt.y, elX: el.x, elY: el.y });
        return;
      }
    }
    setSelectedElement(null);
  }, [canvasTool, canvasElements, getSVGPoint]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && dragStart && selectedElement !== null) {
      const pt = getSVGPoint(e);
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;
      updateElement(selectedElement, { x: dragStart.elX + dx, y: dragStart.elY + dy });
    }
    if (isResizing && resizeStart && selectedElement !== null) {
      const pt = getSVGPoint(e);
      const dx = pt.x - resizeStart.x;
      const dy = pt.y - resizeStart.y;
      updateElement(selectedElement, {
        width: Math.max(20, resizeStart.w + dx),
        height: Math.max(10, resizeStart.h + dy),
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, selectedElement, getSVGPoint, updateElement]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeStart(null);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);
    const el = canvasElements[idx];
    setSelectedElement(idx);
    setIsResizing(true);
    setResizeStart({ x: pt.x, y: pt.y, w: el.width, h: el.height });
  }, [canvasElements, getSVGPoint]);

  const handleDoubleClick = useCallback((idx: number) => {
    if (canvasElements[idx].type === "text") {
      setEditingTextIdx(idx);
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [canvasElements]);

  // Focus text input when editing
  useEffect(() => {
    if (editingTextIdx !== null) textInputRef.current?.focus();
  }, [editingTextIdx]);

  const generate = useCallback(async (inputPrompt?: string) => {
    const text = inputPrompt || prompt;
    if (!text.trim() || isLoading) return;
    setIsLoading(true); setResult(null); setLoadingStep(0); setCodeView("preview");

    const interval = setInterval(() => setLoadingStep(p => (p + 1) % loadingMsgs.length), 1800);

    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(getStudioUrl(), {
        method: "POST", headers,
        body: JSON.stringify({ prompt: text, mode }),
      });
      clearInterval(interval);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || `Erro ${resp.status}`);
        setIsLoading(false); return;
      }

      const data = await resp.json();
      const r = data.result as StudioResult;

      if (mode === "ui-make" && r.code) {
        r.flutter_code = generateFlutterFromReact(r.code, r.component_name || "Component");
      }

      setResult(r);
      if (r.preview_elements) setCanvasElements(r.preview_elements);

      const iteration: Iteration = {
        id: Date.now().toString(), mode, prompt: text,
        result: r, timestamp: new Date(), savedToDS: false,
      };

      if (mode === "ui-make" && r.component_name) {
        try {
          await saveComponentToDS(r, text);
          iteration.savedToDS = true;
          toast.success("Componente gerado e salvo no Design System!");
        } catch { toast.success("Componente gerado! (Falha ao salvar no DS Hub)"); }
      } else {
        toast.success("Gerado com sucesso!");
      }

      setIterations(prev => [iteration, ...prev]);
    } catch { clearInterval(interval); toast.error("Erro ao gerar artefato"); }
    setIsLoading(false);
  }, [prompt, mode, isLoading, loadingMsgs.length]);

  const manualSaveToDS = useCallback(async () => {
    if (!result || savingToDS) return;
    setSavingToDS(true);
    try {
      await saveComponentToDS(result, prompt);
      setIterations(prev => prev.map((it, i) => i === 0 ? { ...it, savedToDS: true } : it));
      toast.success("Salvo no Design System Hub!");
    } catch { toast.error("Erro ao salvar no DS Hub"); }
    setSavingToDS(false);
  }, [result, prompt, savingToDS]);

  const restoreIteration = (iter: Iteration) => {
    setMode(iter.mode); setPrompt(iter.prompt); setResult(iter.result);
    if (iter.result.preview_elements) setCanvasElements(iter.result.preview_elements);
    setShowHistory(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const exportSVG = () => {
    const svgEl = document.getElementById("studio-canvas-svg");
    if (!svgEl) return;
    const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${result?.component_name || "design"}.svg`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("SVG exportado!");
  };

  const deviceWidths: Record<DeviceFrame, { w: number; label: string }> = {
    desktop: { w: 800, label: "1440px" },
    tablet: { w: 600, label: "768px" },
    mobile: { w: 375, label: "375px" },
  };

  const selectedEl = selectedElement !== null ? canvasElements[selectedElement] : null;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 overflow-hidden rounded-lg border border-border">
      {/* LEFT PANEL */}
      <div className="w-[28%] min-w-[260px] flex flex-col bg-card border-r border-border">
        {/* Mode Tabs */}
        <div className="flex border-b border-border">
          {(["ux-pilot", "ui-make"] as StudioMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === m ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              }`}>
              {m === "ux-pilot" ? <Compass className="w-3.5 h-3.5" /> : <Blocks className="w-3.5 h-3.5" />}
              {m === "ux-pilot" ? "UX Pilot" : "UI Make"}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[11px] text-muted-foreground">
            {mode === "ux-pilot"
              ? "Gere personas, mapas de jornada, fluxos de usuário e wireframes com IA."
              : "Gere telas completas e componentes UI com código React + Tailwind + Flutter."}
          </p>
        </div>

        {/* Prompt */}
        <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
          <div className="relative flex-1 min-h-0">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
              placeholder={mode === "ux-pilot"
                ? "Descreva o artefato UX...\nEx: Crie uma persona para um app de fitness"
                : "Descreva a tela ou componente...\nEx: Uma tela de login completa com social login"}
              className="w-full h-full min-h-[100px] bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none resize-none font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button onClick={() => generate()} disabled={isLoading || !prompt.trim()}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[9px] text-muted-foreground/50">⌘+Enter para enviar</p>

          {/* Quick Chips */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atalhos Rápidos</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map(chip => (
                <button key={chip.label} onClick={() => { setPrompt(chip.prompt); generate(chip.prompt); }}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                  <chip.icon className="w-3 h-3" />{chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Tools (UI Make) */}
          {mode === "ui-make" && (
            <div className="space-y-1.5 border-t border-border pt-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ferramentas</p>
              <div className="flex gap-1 flex-wrap">
                {([
                  { tool: "select" as CanvasTool, icon: MousePointer, label: "Selecionar" },
                  { tool: "move" as CanvasTool, icon: Move, label: "Mover" },
                  { tool: "rect" as CanvasTool, icon: Square, label: "Retângulo" },
                  { tool: "circle" as CanvasTool, icon: Circle, label: "Círculo" },
                  { tool: "text" as CanvasTool, icon: Type, label: "Texto" },
                  { tool: "line" as CanvasTool, icon: Minus, label: "Linha" },
                ]).map(t => (
                  <button key={t.tool} onClick={() => setCanvasTool(t.tool)} title={t.label}
                    className={`p-1.5 rounded-md transition-colors ${canvasTool === t.tool ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    <t.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              {selectedElement !== null && (
                <p className="text-[9px] text-primary">Dica: arraste para mover, clique duplo para editar texto, canto inferior-direito para redimensionar</p>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div className="border-t border-border">
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/30 transition-colors">
            <span className="flex items-center gap-1.5"><History className="w-3 h-3" />Histórico ({iterations.length})</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showHistory ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto", maxHeight: 200 }} exit={{ height: 0 }} className="overflow-y-auto border-t border-border/50">
                {iterations.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma iteração</p>
                ) : iterations.map(iter => (
                  <button key={iter.id} onClick={() => restoreIteration(iter)}
                    className="w-full text-left px-4 py-2 border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${iter.mode === "ux-pilot" ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary"}`}>
                        {iter.mode === "ux-pilot" ? "UX" : "UI"}
                      </span>
                      {iter.savedToDS && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500">DS</span>}
                      <span className="text-[10px] text-muted-foreground">{iter.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[10px] text-foreground mt-0.5 truncate">{iter.prompt}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Canvas Header */}
        {result && (
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{result.title || result.component_name || "Resultado"}</span>
              <span className="text-[9px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                {mode === "ux-pilot" ? result.artifact_type : "component"}
              </span>
              {currentSaved && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> DS Hub
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {mode === "ui-make" && (
                <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5 mr-2">
                  {(["desktop", "tablet", "mobile"] as DeviceFrame[]).map(d => (
                    <button key={d} onClick={() => setDeviceFrame(d)}
                      className={`p-1 rounded transition-colors ${deviceFrame === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {d === "desktop" ? <Monitor className="w-3 h-3" /> : d === "tablet" ? <Tablet className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}

              {mode === "ui-make" && result.code && (
                <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5">
                  <button onClick={() => setCodeView("preview")} className={`px-2 py-1 rounded text-[10px] transition-colors ${codeView === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Preview</button>
                  <button onClick={() => setCodeView("react")} className={`px-2 py-1 rounded text-[10px] transition-colors ${codeView === "react" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>React</button>
                  <button onClick={() => setCodeView("flutter")} className={`px-2 py-1 rounded text-[10px] transition-colors ${codeView === "flutter" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Flutter</button>
                </div>
              )}

              <button onClick={exportSVG} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <Download className="w-3 h-3" />SVG
              </button>

              {mode === "ui-make" && !currentSaved && (
                <button onClick={manualSaveToDS} disabled={savingToDS}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] hover:opacity-90 disabled:opacity-50">
                  {savingToDS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Salvar DS
                </button>
              )}
            </div>
          </div>
        )}

        {/* Canvas Content */}
        <div className="flex-1 overflow-auto relative flex">
          <div className="flex-1 relative">
            <div className="absolute inset-0" style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }} />

            <div className="relative z-10 p-6 min-h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                {/* Loading */}
                {isLoading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Gerando...</p>
                        <motion.p key={loadingStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary">
                          {loadingMsgs[loadingStep]}
                        </motion.p>
                      </div>
                    </div>
                    {[1, 2, 3].map(i => (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                        className="border border-border rounded-lg p-5 bg-card space-y-3">
                        <div className="h-4 bg-secondary rounded w-1/3 animate-pulse" />
                        <div className="h-3 bg-secondary/70 rounded w-2/3 animate-pulse" />
                        <div className="h-3 bg-secondary/50 rounded w-1/2 animate-pulse" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Empty */}
                {!isLoading && !result && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center opacity-40">
                      {mode === "ux-pilot" ? <Compass className="w-8 h-8 text-primary-foreground" /> : <Blocks className="w-8 h-8 text-primary-foreground" />}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/40 mb-1">{mode === "ux-pilot" ? "UX Pilot" : "UI Make"}</h3>
                    <p className="text-sm text-muted-foreground/60">Descreva o que vamos construir hoje</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-2">Use os atalhos rápidos ou escreva seu prompt</p>
                  </motion.div>
                )}

                {/* UX Pilot Result */}
                {!isLoading && result && mode === "ux-pilot" && (
                  <motion.div key="ux" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                    {result.artifact_type === "persona" && <PersonaView data={result.data} title={result.title || ""} description={result.description || ""} />}
                    {result.artifact_type === "journey_map" && <JourneyMapView data={result.data} title={result.title || ""} description={result.description || ""} />}
                    {result.artifact_type === "user_flow" && <UserFlowView data={result.data} title={result.title || ""} description={result.description || ""} />}
                    {result.artifact_type === "sitemap" && <SitemapView data={result.data} title={result.title || ""} description={result.description || ""} />}
                    {result.artifact_type === "wireframe_concept" && <GenericView data={result.data} title={result.title || ""} description={result.description || ""} />}
                  </motion.div>
                )}

                {/* UI Make Result */}
                {!isLoading && result && mode === "ui-make" && (
                  <motion.div key="ui" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                    {codeView === "preview" && (
                      <div className="mx-auto transition-all" style={{ maxWidth: deviceWidths[deviceFrame].w }}>
                        <div className="text-center mb-2">
                          <span className="text-[9px] text-muted-foreground">{deviceWidths[deviceFrame].label}</span>
                        </div>
                        <div className="border border-border rounded-lg bg-card p-2" style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.3)" }}>
                          {/* Inline text edit overlay */}
                          {editingTextIdx !== null && canvasElements[editingTextIdx] && (
                            <div className="absolute z-50" style={{ top: 0, left: 0 }}>
                              <input
                                ref={textInputRef}
                                value={canvasElements[editingTextIdx].text || ""}
                                onChange={e => updateElement(editingTextIdx, { text: e.target.value })}
                                onBlur={() => setEditingTextIdx(null)}
                                onKeyDown={e => { if (e.key === "Enter") setEditingTextIdx(null); }}
                                className="bg-primary text-primary-foreground px-2 py-1 text-xs rounded border-2 border-primary outline-none"
                                style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", minWidth: 200 }}
                              />
                            </div>
                          )}
                          <svg id="studio-canvas-svg" ref={svgRef}
                            width={deviceWidths[deviceFrame].w} height="500"
                            viewBox={`0 0 ${deviceWidths[deviceFrame].w} 500`}
                            className={`w-full ${canvasTool === "select" || canvasTool === "move" ? "cursor-default" : "cursor-crosshair"}`}
                            style={{ background: "hsl(var(--background))", borderRadius: "8px" }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}>
                            <defs>
                              <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
                              </pattern>
                            </defs>
                            <rect width={deviceWidths[deviceFrame].w} height="500" fill="url(#sg)" />
                            {canvasElements.map((el, i) => {
                              const transform = el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined;
                              const opacity = el.opacity ?? 1;
                              const isSelected = selectedElement === i;
                              return (
                                <g key={i}
                                  onDoubleClick={() => handleDoubleClick(i)}
                                  style={{ cursor: el.locked ? "not-allowed" : canvasTool === "select" ? "move" : "pointer" }}
                                  transform={transform} opacity={opacity}>
                                  {el.type === "rect" && (
                                    <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill}
                                      rx={el.cornerRadius ?? 4}
                                      stroke={isSelected ? "hsl(var(--primary))" : el.strokeColor || "none"}
                                      strokeWidth={isSelected ? 2 : el.strokeWidth || 0} />
                                  )}
                                  {el.type === "circle" && (
                                    <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2}
                                      fill={el.fill}
                                      stroke={isSelected ? "hsl(var(--primary))" : el.strokeColor || "none"}
                                      strokeWidth={isSelected ? 2 : el.strokeWidth || 0} />
                                  )}
                                  {el.type === "text" && (
                                    <text x={el.x} y={el.y + (el.fontSize || 14)} fill={el.fill} fontSize={el.fontSize || 14}
                                      fontFamily="Inter, sans-serif"
                                      stroke={isSelected ? "hsl(var(--primary))" : "none"} strokeWidth={0.5}>
                                      {el.text}
                                    </text>
                                  )}
                                  {el.type === "line" && (
                                    <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height}
                                      stroke={el.fill} strokeWidth={isSelected ? 4 : el.strokeWidth || 2} />
                                  )}
                                  {/* Selection handles */}
                                  {isSelected && !el.locked && (
                                    <>
                                      <rect x={el.x - 1} y={el.y - 1} width={el.width + 2} height={el.height + 2}
                                        fill="none" stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="4 2" />
                                      {/* Resize handle bottom-right */}
                                      <rect x={el.x + el.width - 4} y={el.y + el.height - 4} width={8} height={8}
                                        fill="hsl(var(--primary))" rx={1} className="cursor-se-resize"
                                        onMouseDown={(e) => handleResizeStart(e, i)} />
                                      {/* Corner handles */}
                                      <rect x={el.x - 3} y={el.y - 3} width={6} height={6} fill="white" stroke="hsl(var(--primary))" strokeWidth={1} rx={1} />
                                      <rect x={el.x + el.width - 3} y={el.y - 3} width={6} height={6} fill="white" stroke="hsl(var(--primary))" strokeWidth={1} rx={1} />
                                      <rect x={el.x - 3} y={el.y + el.height - 3} width={6} height={6} fill="white" stroke="hsl(var(--primary))" strokeWidth={1} rx={1} />
                                    </>
                                  )}
                                  {el.locked && isSelected && (
                                    <text x={el.x + el.width / 2} y={el.y - 6} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8}>🔒</text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    )}

                    {codeView === "react" && result.code && (
                      <CodePanel code={result.code} name={`${result.component_name || "Component"}.tsx`} lang="react" onCopy={() => copyCode(result.code!)} />
                    )}

                    {codeView === "flutter" && (
                      <CodePanel
                        code={result.flutter_code || generateFlutterFromReact(result.code || "", result.component_name || "Component")}
                        name={`${(result.component_name || "component").toLowerCase()}_widget.dart`}
                        lang="flutter"
                        onCopy={() => copyCode(result.flutter_code || "")}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Properties Panel — right side */}
          {mode === "ui-make" && selectedEl && codeView === "preview" && (
            <PropertiesPanel
              element={selectedEl}
              index={selectedElement!}
              onUpdate={updateElement}
              onDelete={deleteElement}
              onDuplicate={duplicateElement}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-Components ----

function CodePanel({ code, name, lang, onCopy }: { code: string; name: string; lang: string; onCopy: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-foreground">{name}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">{lang}</span>
        </div>
        <button onClick={onCopy} className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors flex items-center gap-1">
          <Copy className="w-3 h-3" />Copiar
        </button>
      </div>
      <pre className="p-4 overflow-auto max-h-[500px] text-xs text-foreground/90 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function PersonaView({ data, title, description }: { data: any; title: string; description: string }) {
  return (
    <div className="border border-border rounded-lg p-6 bg-card space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <UserCircle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{data?.name || title}</h2>
          <p className="text-xs text-muted-foreground">{data?.role} {data?.age ? `· ${data.age} anos` : ""}</p>
          <p className="text-sm text-muted-foreground mt-1">{data?.bio || description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "🎯 Objetivos", items: data?.goals, color: "green" },
          { label: "😤 Dores", items: data?.pain_points, color: "red" },
          { label: "💡 Comportamentos", items: data?.behaviors, color: "blue" },
        ].map(section => (
          <div key={section.label} className="bg-secondary/30 border border-border rounded-lg p-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{section.label}</h4>
            <ul className="space-y-1.5">
              {(section.items || []).map((item: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyMapView({ data, title, description }: { data: any; title: string; description: string }) {
  const stages = data?.stages || [];
  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-card">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4">
        {stages.map((stage: any, i: number) => {
          const em = emotionColors[stage.emotion] || emotionColors.neutral;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="min-w-[200px] border border-border rounded-lg p-4 bg-card flex flex-col gap-2 relative">
              {i < stages.length - 1 && <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20"><ArrowRight className="w-4 h-4 text-muted-foreground/40" /></div>}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fase {i + 1}</span>
                <span className="text-lg">{em.emoji}</span>
              </div>
              <h4 className="text-xs font-semibold text-foreground">{stage.name}</h4>
              <p className="text-[10px] text-muted-foreground">{stage.description}</p>
              <div className="space-y-1.5 mt-auto pt-2 border-t border-border/50">
                <div><span className="text-[8px] font-semibold uppercase text-muted-foreground/60">Touchpoint</span><p className="text-[10px] text-foreground">{stage.touchpoint}</p></div>
                <div><span className="text-[8px] font-semibold uppercase text-muted-foreground/60">Ação</span><p className="text-[10px] text-foreground">{stage.action}</p></div>
                {stage.opportunity && (
                  <div className="bg-primary/5 rounded px-2 py-1"><span className="text-[8px] font-semibold uppercase text-primary">Oportunidade</span><p className="text-[10px] text-foreground">{stage.opportunity}</p></div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="border border-border rounded-lg p-4 bg-card">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Curva Emocional</h4>
        <div className="flex items-end gap-1 h-16">
          {stages.map((stage: any, i: number) => {
            const levels: Record<string, number> = { happy: 100, satisfied: 80, neutral: 50, confused: 30, frustrated: 10 };
            const h = levels[stage.emotion] || 50;
            const em = emotionColors[stage.emotion] || emotionColors.neutral;
            return (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`flex-1 rounded-t ${em.bg} relative group`} title={`${stage.name}: ${stage.emotion}`}>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">{em.emoji}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserFlowView({ data, title, description }: { data: any; title: string; description: string }) {
  const steps = data?.steps || [];
  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-card"><h2 className="text-sm font-bold text-foreground">{title}</h2><p className="text-xs text-muted-foreground mt-0.5">{description}</p></div>
      <div className="border border-border rounded-lg p-6 bg-card overflow-x-auto">
        <div className="flex flex-wrap gap-3 items-start justify-center">
          {steps.map((step: any, i: number) => {
            const color = flowNodeColors[step.type] || flowNodeColors.action;
            return (
              <motion.div key={step.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2">
                <div className={`px-4 py-2.5 rounded-lg border-2 bg-card ${color} min-w-[120px] text-center ${step.type === "decision" ? "border-dashed" : ""}`}>
                  <span className="text-[8px] font-bold uppercase text-muted-foreground">{step.type}</span>
                  <p className="text-[11px] font-medium text-foreground mt-0.5">{step.label}</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SitemapView({ data, title, description }: { data: any; title: string; description: string }) {
  const pages = data?.pages || [];
  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-card"><h2 className="text-sm font-bold text-foreground">{title}</h2><p className="text-xs text-muted-foreground mt-0.5">{description}</p></div>
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {pages.map((page: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="border border-border rounded-lg p-3 bg-card hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-1.5 mb-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-xs font-semibold text-foreground">{page.name}</span></div>
              <p className="text-[9px] text-muted-foreground font-mono">{page.path}</p>
              {page.children?.length > 0 && (
                <div className="mt-2 space-y-1 pl-3 border-l border-border/50">
                  {page.children.map((child: any, j: number) => (
                    <div key={j} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /><span className="text-[9px] text-muted-foreground">{child.name}</span></div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenericView({ data, title, description }: { data: any; title: string; description: string }) {
  return (
    <div className="border border-border rounded-lg p-6 bg-card space-y-4">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="bg-secondary/50 rounded-lg p-4"><pre className="text-xs text-foreground whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre></div>
    </div>
  );
}
