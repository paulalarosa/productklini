import { useState, useRef, useCallback, useEffect } from "react";
import {
  Square, Circle, Type, MousePointer, Trash2, Minus, Download, Undo2, Redo2,
  Layers, Sparkles, Loader2, Save, FolderOpen, Plus, Smartphone, Monitor,
  Image, ToggleLeft, Menu as MenuIcon, CreditCard, Layout,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---- Types ----
type ElementType = "rect" | "circle" | "text" | "line";
type ToolType = "select" | ElementType;

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  rotation: number;
  locked?: boolean;
  visible?: boolean;
  name?: string;
}

interface CanvasDesign {
  id: string;
  name: string;
  elements: CanvasElement[];
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

// ---- Constants ----
const TOOLS: { type: ToolType; icon: React.ElementType; label: string }[] = [
  { type: "select", icon: MousePointer, label: "Selecionar (V)" },
  { type: "rect", icon: Square, label: "Retângulo (R)" },
  { type: "circle", icon: Circle, label: "Círculo (O)" },
  { type: "text", icon: Type, label: "Texto (T)" },
  { type: "line", icon: Minus, label: "Linha (L)" },
];

const WIREFRAME_COMPONENTS = [
  { label: "Navbar", icon: MenuIcon, elements: [
    { type: "rect" as const, x: 0, y: 0, width: 375, height: 56, fill: "hsl(0, 0%, 95%)", name: "Navbar" },
    { type: "text" as const, x: 150, y: 10, width: 80, height: 30, fill: "hsl(0, 0%, 20%)", text: "App Title", fontSize: 16, name: "Nav Title" },
    { type: "circle" as const, x: 16, y: 16, width: 24, height: 24, fill: "hsl(0, 0%, 70%)", name: "Nav Icon" },
  ]},
  { label: "Card", icon: CreditCard, elements: [
    { type: "rect" as const, x: 16, y: 80, width: 343, height: 180, fill: "hsl(0, 0%, 97%)", stroke: "hsl(0, 0%, 85%)", strokeWidth: 1, name: "Card" },
    { type: "rect" as const, x: 32, y: 96, width: 311, height: 100, fill: "hsl(0, 0%, 90%)", name: "Card Image" },
    { type: "text" as const, x: 32, y: 206, width: 200, height: 20, fill: "hsl(0, 0%, 20%)", text: "Card Title", fontSize: 14, name: "Card Title" },
    { type: "text" as const, x: 32, y: 230, width: 280, height: 16, fill: "hsl(0, 0%, 50%)", text: "Description text goes here...", fontSize: 11, name: "Card Desc" },
  ]},
  { label: "Botão", icon: ToggleLeft, elements: [
    { type: "rect" as const, x: 48, y: 300, width: 280, height: 44, fill: "hsl(214, 90%, 60%)", name: "Button" },
    { type: "text" as const, x: 130, y: 305, width: 120, height: 30, fill: "hsl(0, 0%, 100%)", text: "Continuar", fontSize: 14, name: "Button Label" },
  ]},
  { label: "Input", icon: Type, elements: [
    { type: "rect" as const, x: 16, y: 360, width: 343, height: 44, fill: "hsl(0, 0%, 100%)", stroke: "hsl(0, 0%, 80%)", strokeWidth: 1, name: "Input" },
    { type: "text" as const, x: 28, y: 370, width: 200, height: 20, fill: "hsl(0, 0%, 60%)", text: "Placeholder...", fontSize: 13, name: "Input Placeholder" },
  ]},
  { label: "Tab Bar", icon: Layout, elements: [
    { type: "rect" as const, x: 0, y: 756, width: 375, height: 56, fill: "hsl(0, 0%, 97%)", stroke: "hsl(0, 0%, 90%)", strokeWidth: 1, name: "Tab Bar" },
    { type: "circle" as const, x: 36, y: 768, width: 28, height: 28, fill: "hsl(0, 0%, 70%)", name: "Tab 1" },
    { type: "circle" as const, x: 120, y: 768, width: 28, height: 28, fill: "hsl(0, 0%, 70%)", name: "Tab 2" },
    { type: "circle" as const, x: 174, y: 768, width: 28, height: 28, fill: "hsl(214, 90%, 60%)", name: "Tab Active" },
    { type: "circle" as const, x: 228, y: 768, width: 28, height: 28, fill: "hsl(0, 0%, 70%)", name: "Tab 3" },
    { type: "circle" as const, x: 312, y: 768, width: 28, height: 28, fill: "hsl(0, 0%, 70%)", name: "Tab 4" },
  ]},
  { label: "Image", icon: Image, elements: [
    { type: "rect" as const, x: 16, y: 420, width: 343, height: 200, fill: "hsl(0, 0%, 92%)", name: "Image Placeholder" },
    { type: "line" as const, x: 16, y: 420, width: 343, height: 200, fill: "hsl(0, 0%, 80%)", name: "Img Diag 1" },
  ]},
];

const PALETTE = [
  "hsl(0, 0%, 95%)", "hsl(0, 0%, 85%)", "hsl(0, 0%, 70%)", "hsl(0, 0%, 40%)", "hsl(0, 0%, 20%)",
  "hsl(214, 90%, 60%)", "hsl(270, 70%, 60%)", "hsl(160, 70%, 50%)", "hsl(40, 90%, 60%)", "hsl(0, 72%, 55%)",
];

const SCREEN_PRESETS = [
  { label: "iPhone", icon: Smartphone, w: 375, h: 812 },
  { label: "Desktop", icon: Monitor, w: 1440, h: 900 },
];

const PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

// ---- Undo/Redo Hook ----
function useHistory<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setPresent((prev) => {
      const next = typeof val === "function" ? (val as (prev: T) => T)(prev) : val;
      setPast((p) => [...p.slice(-30), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  return { value: present, set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}

// ---- Component ----
export function DesignCanvas() {
  const { value: elements, set: setElements, undo, redo, canUndo, canRedo } = useHistory<CanvasElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PALETTE[5]);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: ResizeHandle; startX: number; startY: number; startEl: CanvasElement } | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [screenPreset, setScreenPreset] = useState(SCREEN_PRESETS[0]);
  const [designs, setDesigns] = useState<CanvasDesign[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("Sem título");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Load designs on mount
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    const { data } = await supabase
      .from("canvas_designs")
      .select("id, name, elements")
      .eq("project_id", PROJECT_ID)
      .order("updated_at", { ascending: false });
    if (data) setDesigns(data.map(d => ({ ...d, elements: (d.elements as unknown as CanvasElement[]) ?? [] })));
  };

  const saveDesign = async () => {
    setSaving(true);
    if (currentDesignId) {
      await supabase.from("canvas_designs").update({ name: designName, elements: elements as unknown as Record<string, unknown>[] }).eq("id", currentDesignId);
    } else {
      const { data } = await supabase.from("canvas_designs").insert({ project_id: PROJECT_ID, name: designName, elements: elements as unknown as Record<string, unknown>[] }).select("id").single();
      if (data) setCurrentDesignId(data.id);
    }
    toast.success("Design salvo!");
    setSaving(false);
    loadDesigns();
  };

  const loadDesign = (d: CanvasDesign) => {
    setCurrentDesignId(d.id);
    setDesignName(d.name);
    setElements(d.elements);
    setSelectedId(null);
  };

  const newDesign = () => {
    setCurrentDesignId(null);
    setDesignName("Sem título");
    setElements([]);
    setSelectedId(null);
  };

  // Canvas point helper
  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Add element
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (selectedTool === "select") { setSelectedId(null); return; }
    const pt = getCanvasPoint(e);
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type: selectedTool,
      x: pt.x - 40, y: pt.y - 25,
      width: selectedTool === "circle" ? 60 : selectedTool === "line" ? 150 : 120,
      height: selectedTool === "circle" ? 60 : selectedTool === "line" ? 3 : 70,
      fill: selectedColor, rotation: 0, visible: true, name: selectedTool,
      ...(selectedTool === "text" ? { text: "Texto", fontSize: 16 } : {}),
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setSelectedTool("select");
  }, [selectedTool, selectedColor, getCanvasPoint, setElements]);

  // Drag
  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find(el => el.id === id);
    if (!el || el.locked) return;
    if (selectedTool !== "select") return;
    setSelectedId(id);
    const pt = getCanvasPoint(e);
    setDragging({ id, offsetX: pt.x - el.x, offsetY: pt.y - el.y });
  };

  // Resize
  const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const pt = getCanvasPoint(e);
    setResizing({ id, handle, startX: pt.x, startY: pt.y, startEl: { ...el } });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = getCanvasPoint(e);
    if (dragging) {
      setElements((prev) => prev.map((el) =>
        el.id === dragging.id ? { ...el, x: pt.x - dragging.offsetX, y: pt.y - dragging.offsetY } : el
      ));
    } else if (resizing) {
      const { handle, startX, startY, startEl } = resizing;
      const dx = pt.x - startX;
      const dy = pt.y - startY;
      setElements((prev) => prev.map((el) => {
        if (el.id !== resizing.id) return el;
        const u = { ...el };
        if (handle.includes("e")) { u.width = Math.max(10, startEl.width + dx); }
        if (handle.includes("w")) { u.x = startEl.x + dx; u.width = Math.max(10, startEl.width - dx); }
        if (handle.includes("s")) { u.height = Math.max(10, startEl.height + dy); }
        if (handle.includes("n")) { u.y = startEl.y + dy; u.height = Math.max(10, startEl.height - dy); }
        return u;
      }));
    }
  }, [dragging, resizing, getCanvasPoint, setElements]);

  const handleMouseUp = () => { setDragging(null); setResizing(null); };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setElements]);

  const updateSelected = (updates: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...updates } : e)));
  };

  // Add wireframe component
  const addComponent = (comp: typeof WIREFRAME_COMPONENTS[0]) => {
    const newEls = comp.elements.map((el, i) => ({
      ...el,
      id: `${Date.now()}-${i}`,
      rotation: 0,
      visible: true,
      stroke: (el as { stroke?: string }).stroke,
      strokeWidth: (el as { strokeWidth?: number }).strokeWidth,
      fontSize: (el as { fontSize?: number }).fontSize,
    }));
    setElements((prev) => [...prev, ...newEls as CanvasElement[]]);
  };

  // AI Wireframe generation
  const generateWireframe = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-wireframe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          screenType: screenPreset.label,
          existingElements: elements.length > 0 ? elements : undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || `Erro ${resp.status}`);
        setAiLoading(false);
        return;
      }
      const data = await resp.json();
      if (data.elements) {
        const newEls: CanvasElement[] = data.elements.map((el: Partial<CanvasElement>, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          type: el.type || "rect",
          x: el.x || 0,
          y: el.y || 0,
          width: el.width || 100,
          height: el.height || 50,
          fill: el.fill || "hsl(0, 0%, 90%)",
          text: el.text,
          fontSize: el.fontSize || 14,
          rotation: 0,
          visible: true,
          name: el.name || `AI ${i}`,
        }));
        setElements((prev) => [...prev, ...newEls]);
        toast.success(`${newEls.length} elementos gerados!`);
        if (data.description) toast.info(data.description);
      }
    } catch {
      toast.error("Erro ao gerar wireframe");
    }
    setAiLoading(false);
  };

  // Export PNG
  const exportPNG = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = screenPreset.w;
    canvas.height = screenPreset.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `${designName}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if (e.key === "v") setSelectedTool("select");
      if (e.key === "r") setSelectedTool("rect");
      if (e.key === "o") setSelectedTool("circle");
      if (e.key === "t") setSelectedTool("text");
      if (e.key === "l") setSelectedTool("line");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, deleteSelected]);

  const selectedEl = elements.find((e) => e.id === selectedId);

  // Resize handles positions
  const getHandles = (el: CanvasElement): { handle: ResizeHandle; cx: number; cy: number }[] => [
    { handle: "nw", cx: el.x, cy: el.y },
    { handle: "n", cx: el.x + el.width / 2, cy: el.y },
    { handle: "ne", cx: el.x + el.width, cy: el.y },
    { handle: "e", cx: el.x + el.width, cy: el.y + el.height / 2 },
    { handle: "se", cx: el.x + el.width, cy: el.y + el.height },
    { handle: "s", cx: el.x + el.width / 2, cy: el.y + el.height },
    { handle: "sw", cx: el.x, cy: el.y + el.height },
    { handle: "w", cx: el.x, cy: el.y + el.height / 2 },
  ];

  const handleCursors: Record<ResizeHandle, string> = {
    nw: "nw-resize", n: "n-resize", ne: "ne-resize", e: "e-resize",
    se: "se-resize", s: "s-resize", sw: "sw-resize", w: "w-resize",
  };

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 180px)" }}>
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
          {TOOLS.map((tool) => (
            <button key={tool.type} onClick={() => setSelectedTool(tool.type)} title={tool.label}
              className={`p-1.5 rounded-md transition-colors ${selectedTool === tool.type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Wireframe components */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
          {WIREFRAME_COMPONENTS.map((comp) => (
            <button key={comp.label} onClick={() => addComponent(comp)} title={comp.label}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <comp.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
          {PALETTE.map((color) => (
            <button key={color} onClick={() => { setSelectedColor(color); if (selectedId) updateSelected({ fill: color }); }}
              className={`w-5 h-5 rounded border-2 transition-all ${selectedColor === color ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: color }} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
          <button onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Shift+Z)" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors">
            <Redo2 className="w-4 h-4" />
          </button>
          <button onClick={deleteSelected} disabled={!selectedId} title="Excluir" className="p-1.5 rounded-md text-muted-foreground hover:text-status-urgent hover:bg-destructive/10 disabled:opacity-30 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Screen preset */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
          {SCREEN_PRESETS.map((preset) => (
            <button key={preset.label} onClick={() => setScreenPreset(preset)} title={`${preset.label} (${preset.w}×${preset.h})`}
              className={`p-1.5 rounded-md transition-colors ${screenPreset.label === preset.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
              <preset.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setShowLayers(!showLayers)} title="Layers" className={`p-1.5 rounded-md transition-colors ${showLayers ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            <Layers className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAI(!showAI)} title="AI Wireframe" className={`p-1.5 rounded-md transition-colors ${showAI ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            <Sparkles className="w-4 h-4" />
          </button>
          <button onClick={exportPNG} title="Exportar PNG" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={saveDesign} disabled={saving} title="Salvar" className="p-1.5 rounded-md text-muted-foreground hover:text-status-develop hover:bg-status-develop/10 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Design name + saved designs */}
      <div className="flex items-center gap-2">
        <input value={designName} onChange={(e) => setDesignName(e.target.value)} className="bg-secondary rounded-md px-2 py-1 text-xs text-foreground outline-none w-40" />
        <button onClick={newDesign} title="Novo design" className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"><Plus className="w-3.5 h-3.5" /></button>
        {designs.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {designs.slice(0, 5).map((d) => (
              <button key={d.id} onClick={() => loadDesign(d)}
                className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 transition-colors ${currentDesignId === d.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* AI Panel */}
        {showAI && (
          <div className="w-64 glass-card p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Wireframe Generator
            </h4>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Descreva a tela que quer criar... Ex: 'Tela de login com email, senha, botão de entrar e opção de cadastro'" rows={4}
              className="bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none" />
            <button onClick={generateWireframe} disabled={aiLoading || !aiPrompt.trim()}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {aiLoading ? "Gerando..." : "Gerar Wireframe"}
            </button>
            <div className="text-[10px] text-muted-foreground space-y-1">
              <p className="font-semibold">Exemplos de prompts:</p>
              {[
                "Tela de login com email e senha",
                "Feed de notícias tipo Instagram",
                "Dashboard de analytics",
                "Tela de checkout e-commerce",
                "Tela de chat com lista de mensagens",
              ].map((ex) => (
                <button key={ex} onClick={() => setAiPrompt(ex)} className="block w-full text-left hover:text-foreground transition-colors p-1 rounded hover:bg-accent/50">
                  → {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 glass-card overflow-auto rounded-lg">
          <svg ref={canvasRef} width={screenPreset.w} height={screenPreset.h}
            style={{ cursor: selectedTool !== "select" ? "crosshair" : dragging ? "grabbing" : "default", background: "hsl(228, 14%, 10%)", minWidth: screenPreset.w, minHeight: screenPreset.h }}
            onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(228, 10%, 14%)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={screenPreset.w} height={screenPreset.h} fill="url(#grid)" />

            {/* Device frame */}
            {screenPreset.label === "iPhone" && (
              <rect x={0} y={0} width={375} height={812} fill="none" stroke="hsl(228, 10%, 25%)" strokeWidth={1} strokeDasharray="8 4" rx={20} />
            )}

            {elements.filter(el => el.visible !== false).map((el) => {
              const isSelected = el.id === selectedId;
              return (
                <g key={el.id} onMouseDown={(e) => handleElementMouseDown(e, el.id)} style={{ cursor: selectedTool === "select" && !el.locked ? "move" : "default" }} opacity={el.locked ? 0.5 : 1}>
                  {el.type === "rect" && (
                    <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={4} stroke={el.stroke} strokeWidth={el.strokeWidth} />
                  )}
                  {el.type === "circle" && (
                    <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} />
                  )}
                  {el.type === "text" && (
                    <text x={el.x} y={el.y + (el.fontSize || 16)} fill={el.fill} fontSize={el.fontSize || 16} fontFamily="Inter, sans-serif" fontWeight={500}>
                      {el.text}
                    </text>
                  )}
                  {el.type === "line" && (
                    <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={el.fill} strokeWidth={3} strokeLinecap="round" />
                  )}
                  {/* Selection + resize handles */}
                  {isSelected && (
                    <>
                      <rect x={el.x - 1} y={el.y - 1} width={el.width + 2} height={el.height + 2} fill="none" stroke="hsl(252, 80%, 65%)" strokeWidth={1.5} strokeDasharray="4 2" rx={2} />
                      {getHandles(el).map(({ handle, cx, cy }) => (
                        <rect key={handle} x={cx - 4} y={cy - 4} width={8} height={8} fill="hsl(252, 80%, 65%)" rx={1}
                          style={{ cursor: handleCursors[handle] }}
                          onMouseDown={(e) => handleResizeMouseDown(e, el.id, handle)} />
                      ))}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Layers Panel */}
        {showLayers && (
          <div className="w-52 glass-card p-3 flex flex-col gap-2 shrink-0 overflow-y-auto">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Layers ({elements.length})
            </h4>
            <div className="space-y-0.5">
              {[...elements].reverse().map((el) => (
                <div key={el.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] cursor-pointer transition-colors ${selectedId === el.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
                  onClick={() => setSelectedId(el.id)}>
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: el.fill }} />
                  <span className="flex-1 truncate">{el.name || el.type}</span>
                  <button onClick={(e) => { e.stopPropagation(); updateSelected({ ...el, visible: !el.visible }); setElements(prev => prev.map(p => p.id === el.id ? { ...p, visible: !p.visible } : p)); }}
                    className={`text-[8px] ${el.visible !== false ? "text-foreground" : "text-muted-foreground/30"}`}>
                    👁
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setElements(prev => prev.map(p => p.id === el.id ? { ...p, locked: !p.locked } : p)); }}
                    className={`text-[8px] ${el.locked ? "text-status-urgent" : "text-muted-foreground/30"}`}>
                    🔒
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Properties bar */}
      {selectedEl && (
        <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2 text-[10px] text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground">{selectedEl.name || selectedEl.type}</span>
          <span>X: <input type="number" value={Math.round(selectedEl.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} className="w-12 bg-accent rounded px-1 py-0.5 text-foreground outline-none inline" /></span>
          <span>Y: <input type="number" value={Math.round(selectedEl.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} className="w-12 bg-accent rounded px-1 py-0.5 text-foreground outline-none inline" /></span>
          <span>W: <input type="number" value={Math.round(selectedEl.width)} onChange={(e) => updateSelected({ width: Number(e.target.value) })} className="w-12 bg-accent rounded px-1 py-0.5 text-foreground outline-none inline" /></span>
          <span>H: <input type="number" value={Math.round(selectedEl.height)} onChange={(e) => updateSelected({ height: Number(e.target.value) })} className="w-12 bg-accent rounded px-1 py-0.5 text-foreground outline-none inline" /></span>
          {selectedEl.type === "text" && (
            <>
              <input value={selectedEl.text ?? ""} onChange={(e) => updateSelected({ text: e.target.value })} className="w-32 bg-accent rounded px-2 py-0.5 text-foreground outline-none" placeholder="Texto" />
              <input type="number" value={selectedEl.fontSize || 16} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="w-10 bg-accent rounded px-1 py-0.5 text-foreground outline-none" title="Font size" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
