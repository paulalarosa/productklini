import { useState, useRef, useCallback, useEffect } from "react";
import {
  Square, Circle, Type, MousePointer, Trash2, Minus, Download, Undo2, Redo2,
  Layers, Sparkles, Loader2, Save, FolderOpen, Plus, Smartphone, Monitor,
  Image, ToggleLeft, Menu as MenuIcon, CreditCard, Layout, History, Maximize2,
  BookTemplate, ZoomIn, ZoomOut, Maximize, Map, Play, MousePointer2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/authHeaders";
import { WireframeTemplatePanel } from "./WireframeTemplates";
import { PresentationMode, PresentationButton } from "./PresentationMode";
import { PrototypePlayer, HotspotEditor } from "./PrototypePlayer";
import { AnimatePresence } from "framer-motion";

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

interface CanvasDesign { id: string; name: string; elements: CanvasElement[]; }
interface CanvasVersion { id: string; version_number: number; name: string; elements: CanvasElement[]; created_at: string; }
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
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

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

// ---- Minimap ----
function Minimap({ elements, canvasW, canvasH, zoom, panX, panY, viewportW, viewportH, onNavigate }: {
  elements: CanvasElement[]; canvasW: number; canvasH: number;
  zoom: number; panX: number; panY: number;
  viewportW: number; viewportH: number;
  onNavigate: (x: number, y: number) => void;
}) {
  const mmW = 160;
  const mmH = (canvasH / canvasW) * mmW;
  const scale = mmW / canvasW;

  const vpW = (viewportW / zoom) * scale;
  const vpH = (viewportH / zoom) * scale;
  const vpX = (-panX / zoom) * scale;
  const vpY = (-panY / zoom) * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const canvasX = mx / scale;
    const canvasY = my / scale;
    onNavigate(
      -(canvasX - viewportW / (2 * zoom)) * zoom,
      -(canvasY - viewportH / (2 * zoom)) * zoom
    );
  };

  return (
    <div className="absolute bottom-3 right-3 glass-card rounded-lg overflow-hidden border border-border/50 shadow-lg z-20">
      <div className="px-2 py-1 border-b border-border/50 flex items-center gap-1">
        <Map className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-[8px] text-muted-foreground font-semibold">MINIMAP</span>
      </div>
      <svg width={mmW} height={mmH} onClick={handleClick} className="cursor-crosshair" style={{ background: "hsl(228, 14%, 8%)" }}>
        {elements.filter(el => el.visible !== false).map((el) => (
          <g key={el.id}>
            {el.type === "rect" && <rect x={el.x * scale} y={el.y * scale} width={el.width * scale} height={el.height * scale} fill={el.fill} opacity={0.7} rx={1} />}
            {el.type === "circle" && <ellipse cx={(el.x + el.width / 2) * scale} cy={(el.y + el.height / 2) * scale} rx={(el.width / 2) * scale} ry={(el.height / 2) * scale} fill={el.fill} opacity={0.7} />}
            {el.type === "text" && <rect x={el.x * scale} y={el.y * scale} width={Math.max(el.width, 20) * scale} height={(el.fontSize || 16) * scale} fill={el.fill} opacity={0.5} rx={0.5} />}
            {el.type === "line" && <line x1={el.x * scale} y1={el.y * scale} x2={(el.x + el.width) * scale} y2={(el.y + el.height) * scale} stroke={el.fill} strokeWidth={1} opacity={0.7} />}
          </g>
        ))}
        {/* Viewport indicator */}
        <rect x={Math.max(0, vpX)} y={Math.max(0, vpY)} width={Math.min(vpW, mmW)} height={Math.min(vpH, mmH)}
          fill="hsl(252, 80%, 65%)" fillOpacity={0.1} stroke="hsl(252, 80%, 65%)" strokeWidth={1.5} rx={1} />
      </svg>
    </div>
  );
}

// ---- Component ----
export function DesignCanvas() {
  const { value: elements, set: setElements, undo, redo, canUndo, canRedo } = useHistory<CanvasElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PALETTE[5]);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: ResizeHandle; startX: number; startY: number; startEl: CanvasElement } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showPrototype, setShowPrototype] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [screenPreset, setScreenPreset] = useState(SCREEN_PRESETS[0]);
  const [designs, setDesigns] = useState<CanvasDesign[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("Sem título");
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<CanvasVersion[]>([]);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDesigns(); }, []);

  const loadDesigns = async () => {
    const { data } = await supabase.from("canvas_designs").select("id, name, elements").eq("project_id", PROJECT_ID).order("updated_at", { ascending: false });
    if (data) setDesigns(data.map(d => ({ ...d, elements: (d.elements as unknown as CanvasElement[]) ?? [] })));
  };

  const loadVersions = async (designId: string) => {
    const { data } = await supabase.from("canvas_versions").select("*").eq("design_id", designId).order("version_number", { ascending: false });
    if (data) setVersions(data.map(v => ({ ...v, elements: (v.elements as unknown as CanvasElement[]) ?? [] })));
  };

  const saveVersion = async (designId: string) => {
    const nextNum = versions.length > 0 ? versions[0].version_number + 1 : 1;
    await supabase.from("canvas_versions").insert([{ design_id: designId, version_number: nextNum, name: `v${nextNum} - ${designName}`, elements: JSON.parse(JSON.stringify(elements)) }]);
    loadVersions(designId);
  };

  const restoreVersion = (v: CanvasVersion) => { setElements(v.elements); toast.success(`Restaurado: ${v.name}`); };

  const saveDesign = async () => {
    setSaving(true);
    const elementsJson = JSON.parse(JSON.stringify(elements));
    if (currentDesignId) {
      await supabase.from("canvas_designs").update({ name: designName, elements: elementsJson }).eq("id", currentDesignId);
      await saveVersion(currentDesignId);
    } else {
      const { data } = await supabase.from("canvas_designs").insert([{ project_id: PROJECT_ID, name: designName, elements: elementsJson }]).select("id").single();
      if (data) { setCurrentDesignId(data.id); await saveVersion(data.id); }
    }
    toast.success("Design salvo!");
    setSaving(false);
    loadDesigns();
  };

  const loadDesign = (d: CanvasDesign) => { setCurrentDesignId(d.id); setDesignName(d.name); setElements(d.elements); setSelectedId(null); loadVersions(d.id); };
  const newDesign = () => { setCurrentDesignId(null); setDesignName("Sem título"); setElements([]); setSelectedId(null); setVersions([]); };

  // Zoom helpers
  const zoomIn = useCallback(() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP)), []);
  const zoomFit = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const fitZoom = Math.min(cw / screenPreset.w, ch / screenPreset.h) * 0.9;
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom)));
    setPanX((cw - screenPreset.w * fitZoom) / 2);
    setPanY((ch - screenPreset.h * fitZoom) / 2);
  }, [screenPreset]);

  const zoomPercent = Math.round(zoom * 100);

  // Convert screen coords to canvas coords accounting for zoom+pan
  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: (screenX - panX) / zoom,
      y: (screenY - panY) / zoom,
    };
  }, [zoom, panX, panY]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom towards cursor
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
      const scale = newZoom / zoom;
      setPanX(mx - (mx - panX) * scale);
      setPanY(my - (my - panY) * scale);
      setZoom(newZoom);
    } else {
      // Pan
      setPanX(px => px - e.deltaX);
      setPanY(py => py - e.deltaY);
    }
  }, [zoom, panX, panY]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (selectedTool === "select") { setSelectedId(null); return; }
    const pt = getCanvasPoint(e);
    const newEl: CanvasElement = {
      id: Date.now().toString(), type: selectedTool,
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

  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find(el => el.id === id);
    if (!el || el.locked) return;
    if (selectedTool !== "select") return;
    setSelectedId(id);
    const pt = getCanvasPoint(e);
    setDragging({ id, offsetX: pt.x - el.x, offsetY: pt.y - el.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const pt = getCanvasPoint(e);
    setResizing({ id, handle, startX: pt.x, startY: pt.y, startEl: { ...el } });
  };

  // Middle-click or space+drag to pan
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // middle click
      e.preventDefault();
      setPanning({ startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY });
    }
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (panning) {
      setPanX(panning.startPanX + (e.clientX - panning.startX));
      setPanY(panning.startPanY + (e.clientY - panning.startY));
      return;
    }
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
  }, [panning, dragging, resizing, getCanvasPoint, setElements]);

  const handleMouseUp = () => { setDragging(null); setResizing(null); setPanning(null); };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setElements]);

  const updateSelected = (updates: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...updates } : e)));
  };

  const addComponent = (comp: typeof WIREFRAME_COMPONENTS[0]) => {
    const newEls = comp.elements.map((el, i) => ({
      ...el, id: `${Date.now()}-${i}`, rotation: 0, visible: true,
      stroke: (el as any).stroke, strokeWidth: (el as any).strokeWidth, fontSize: (el as any).fontSize,
    }));
    setElements((prev) => [...prev, ...newEls as CanvasElement[]]);
  };

  const applyTemplate = (templateElements: Omit<CanvasElement, "id">[]) => {
    const newEls: CanvasElement[] = templateElements.map((el, i) => ({ ...el, id: `tmpl-${Date.now()}-${i}` }));
    setElements(newEls);
    setShowTemplates(false);
    toast.success("Template aplicado!");
  };

  const generateWireframe = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-wireframe`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: aiPrompt, screenType: screenPreset.label, existingElements: elements.length > 0 ? elements : undefined }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); toast.error(err.error || `Erro ${resp.status}`); setAiLoading(false); return; }
      const data = await resp.json();
      if (data.elements) {
        const newEls: CanvasElement[] = data.elements.map((el: Partial<CanvasElement>, i: number) => ({
          id: `ai-${Date.now()}-${i}`, type: el.type || "rect",
          x: el.x || 0, y: el.y || 0, width: el.width || 100, height: el.height || 50,
          fill: el.fill || "hsl(0, 0%, 90%)", text: el.text, fontSize: el.fontSize || 14,
          rotation: 0, visible: true, name: el.name || `AI ${i}`,
        }));
        setElements((prev) => [...prev, ...newEls]);
        toast.success(`${newEls.length} elementos gerados!`);
        if (data.description) toast.info(data.description);
      }
    } catch { toast.error("Erro ao gerar wireframe"); }
    setAiLoading(false);
  };

  const exportPNG = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    // Clone SVG without transform for clean export
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("style");
    clone.setAttribute("width", String(screenPreset.w));
    clone.setAttribute("height", String(screenPreset.h));
    clone.setAttribute("viewBox", `0 0 ${screenPreset.w} ${screenPreset.h}`);
    const g = clone.querySelector("g[data-canvas-content]");
    if (g) g.removeAttribute("transform");
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    canvas.width = screenPreset.w; canvas.height = screenPreset.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => { ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); const a = document.createElement("a"); a.download = `${designName}.png`; a.href = canvas.toDataURL("image/png"); a.click(); };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") { e.preventDefault(); zoomFit(); }
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if (e.key === "v") setSelectedTool("select");
      if (e.key === "r") setSelectedTool("rect");
      if (e.key === "o") setSelectedTool("circle");
      if (e.key === "t") setSelectedTool("text");
      if (e.key === "l") setSelectedTool("line");
      if (e.key === "=" || e.key === "+") { e.preventDefault(); zoomIn(); }
      if (e.key === "-") { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, deleteSelected, zoomIn, zoomOut, zoomFit]);

  const selectedEl = elements.find((e) => e.id === selectedId);

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
    <>
      <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 180px)" }}>
        {/* Top Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
            {TOOLS.map((tool) => (
              <button key={tool.type} onClick={() => setSelectedTool(tool.type)} title={tool.label}
                className={`p-1.5 rounded-md transition-colors ${selectedTool === tool.type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
            {WIREFRAME_COMPONENTS.map((comp) => (
              <button key={comp.label} onClick={() => addComponent(comp)} title={comp.label}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <comp.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
            {PALETTE.map((color) => (
              <button key={color} onClick={() => { setSelectedColor(color); if (selectedId) updateSelected({ fill: color }); }}
                className={`w-5 h-5 rounded border-2 transition-all ${selectedColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: color }} />
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
            <button onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"><Undo2 className="w-4 h-4" /></button>
            <button onClick={redo} disabled={!canRedo} title="Refazer" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"><Redo2 className="w-4 h-4" /></button>
            <button onClick={deleteSelected} disabled={!selectedId} title="Excluir" className="p-1.5 rounded-md text-muted-foreground hover:text-status-urgent hover:bg-destructive/10 disabled:opacity-30 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
            <button onClick={zoomOut} title="Zoom Out (-)" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[10px] text-muted-foreground font-mono w-10 text-center select-none">{zoomPercent}%</span>
            <button onClick={zoomIn} title="Zoom In (+)" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={zoomFit} title="Fit to Screen (Ctrl+0)" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Maximize className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-1">
            {SCREEN_PRESETS.map((preset) => (
              <button key={preset.label} onClick={() => setScreenPreset(preset)} title={`${preset.label} (${preset.w}×${preset.h})`}
                className={`p-1.5 rounded-md transition-colors ${screenPreset.label === preset.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                <preset.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setShowMinimap(!showMinimap)} title="Minimap"
              className={`p-1.5 rounded-md transition-colors ${showMinimap ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              <Map className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowTemplates(!showTemplates); setShowAI(false); }} title="Templates"
              className={`p-1.5 rounded-md transition-colors ${showTemplates ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              <BookTemplate className="w-4 h-4" />
            </button>
            <button onClick={() => setShowLayers(!showLayers)} title="Layers" className={`p-1.5 rounded-md transition-colors ${showLayers ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              <Layers className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowAI(!showAI); setShowTemplates(false); }} title="AI Wireframe" className={`p-1.5 rounded-md transition-colors ${showAI ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              <Sparkles className="w-4 h-4" />
            </button>
            {currentDesignId && (
              <button onClick={() => { setShowVersions(!showVersions); if (!showVersions && currentDesignId) loadVersions(currentDesignId); }} title="Versões"
                className={`p-1.5 rounded-md transition-colors ${showVersions ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                <History className="w-4 h-4" />
              </button>
            )}
            <PresentationButton onClick={() => setShowPresentation(true)} />
            <button onClick={() => setShowPrototype(true)} title="Modo Protótipo"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Play className="w-4 h-4" />
            </button>
            {currentDesignId && (
              <button onClick={() => { setShowHotspots(!showHotspots); }} title="Hotspots"
                className={`p-1.5 rounded-md transition-colors ${showHotspots ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                <MousePointer2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={exportPNG} title="Exportar PNG" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Download className="w-4 h-4" /></button>
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
          {/* Templates Panel */}
          {showTemplates && (
            <div className="w-64 glass-card p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
              <WireframeTemplatePanel onApply={applyTemplate} />
            </div>
          )}

          {/* AI Panel */}
          {showAI && (
            <div className="w-64 glass-card p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Wireframe Generator
              </h4>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Descreva a tela que quer criar..." rows={4}
                className="bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none" />
              <button onClick={generateWireframe} disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiLoading ? "Gerando..." : "Gerar Wireframe"}
              </button>
              <div className="text-[10px] text-muted-foreground space-y-1">
                <p className="font-semibold">Exemplos:</p>
                {["Tela de login com email e senha", "Feed tipo Instagram", "Dashboard analytics", "Checkout e-commerce", "Chat com mensagens"].map((ex) => (
                  <button key={ex} onClick={() => setAiPrompt(ex)} className="block w-full text-left hover:text-foreground transition-colors p-1 rounded hover:bg-accent/50">→ {ex}</button>
                ))}
              </div>
            </div>
          )}

          {/* Canvas with zoom/pan */}
          <div
            ref={containerRef}
            className="flex-1 glass-card overflow-hidden rounded-lg relative"
            onWheel={handleWheel}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: panning ? "grabbing" : selectedTool !== "select" ? "crosshair" : dragging ? "grabbing" : "default" }}
          >
            <svg
              ref={canvasRef}
              width="100%"
              height="100%"
              style={{ background: "hsl(228, 14%, 10%)" }}
              onClick={handleCanvasClick}
            >
              <defs>
                <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                  x={panX % (20 * zoom)} y={panY % (20 * zoom)}>
                  <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="hsl(228, 10%, 14%)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <g transform={`translate(${panX}, ${panY}) scale(${zoom})`} data-canvas-content>
                {screenPreset.label === "iPhone" && (
                  <rect x={0} y={0} width={375} height={812} fill="none" stroke="hsl(228, 10%, 25%)" strokeWidth={1} strokeDasharray="8 4" rx={20} />
                )}
                {elements.filter(el => el.visible !== false).map((el) => {
                  const isSelected = el.id === selectedId;
                  return (
                    <g key={el.id} onMouseDown={(e) => handleElementMouseDown(e, el.id)} style={{ cursor: selectedTool === "select" && !el.locked ? "move" : "default" }} opacity={el.locked ? 0.5 : 1}>
                      {el.type === "rect" && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={4} stroke={el.stroke} strokeWidth={el.strokeWidth} />}
                      {el.type === "circle" && <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} />}
                      {el.type === "text" && <text x={el.x} y={el.y + (el.fontSize || 16)} fill={el.fill} fontSize={el.fontSize || 16} fontFamily="Inter, sans-serif" fontWeight={500}>{el.text}</text>}
                      {el.type === "line" && <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={el.fill} strokeWidth={3} strokeLinecap="round" />}
                      {isSelected && (
                        <>
                          <rect x={el.x - 1} y={el.y - 1} width={el.width + 2} height={el.height + 2} fill="none" stroke="hsl(252, 80%, 65%)" strokeWidth={1.5 / zoom} strokeDasharray="4 2" rx={2} />
                          {getHandles(el).map(({ handle, cx, cy }) => (
                            <rect key={handle} x={cx - 4 / zoom} y={cy - 4 / zoom} width={8 / zoom} height={8 / zoom} fill="hsl(252, 80%, 65%)" rx={1}
                              style={{ cursor: handleCursors[handle] }}
                              onMouseDown={(e) => handleResizeMouseDown(e, el.id, handle)} />
                          ))}
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Minimap */}
            {showMinimap && (
              <Minimap
                elements={elements}
                canvasW={screenPreset.w}
                canvasH={screenPreset.h}
                zoom={zoom}
                panX={panX}
                panY={panY}
                viewportW={containerRef.current?.clientWidth || 800}
                viewportH={containerRef.current?.clientHeight || 600}
                onNavigate={(x, y) => { setPanX(x); setPanY(y); }}
              />
            )}
          </div>

          {/* Layers Panel */}
          {showLayers && (
            <div className="w-52 glass-card p-3 flex flex-col gap-2 shrink-0 overflow-y-auto">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Layers ({elements.length})</h4>
              <div className="space-y-0.5">
                {[...elements].reverse().map((el) => (
                  <div key={el.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] cursor-pointer transition-colors ${selectedId === el.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
                    onClick={() => setSelectedId(el.id)}>
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: el.fill }} />
                    <span className="flex-1 truncate">{el.name || el.type}</span>
                    <button onClick={(e) => { e.stopPropagation(); setElements(prev => prev.map(p => p.id === el.id ? { ...p, visible: !p.visible } : p)); }}
                      className={`text-[8px] ${el.visible !== false ? "text-foreground" : "text-muted-foreground/30"}`}>👁</button>
                    <button onClick={(e) => { e.stopPropagation(); setElements(prev => prev.map(p => p.id === el.id ? { ...p, locked: !p.locked } : p)); }}
                      className={`text-[8px] ${el.locked ? "text-status-urgent" : "text-muted-foreground/30"}`}>🔒</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version History Panel */}
          {showVersions && (
            <div className="w-52 glass-card p-3 flex flex-col gap-2 shrink-0 overflow-y-auto">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Versões</h4>
              {versions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">Salve para criar versões</p>
              ) : (
                <div className="space-y-1">
                  {versions.map((v) => (
                    <button key={v.id} onClick={() => restoreVersion(v)} className="w-full text-left p-2 rounded-md bg-secondary/50 hover:bg-accent/50 transition-colors">
                      <p className="text-[10px] font-medium text-foreground">{v.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(v.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{(v.elements as CanvasElement[]).length} elementos
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Hotspot Editor Panel */}
          {showHotspots && currentDesignId && (
            <div className="w-56 glass-card p-3 flex flex-col gap-2 shrink-0 overflow-y-auto">
              <HotspotEditor
                designId={currentDesignId}
                designs={designs}
                canvasWidth={screenPreset.w}
                canvasHeight={screenPreset.h}
                zoom={zoom}
                panX={panX}
                panY={panY}
              />
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
            <span className="ml-auto text-[9px] text-muted-foreground/50">Zoom: {zoomPercent}%</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPresentation && <PresentationMode onClose={() => setShowPresentation(false)} />}
        {showPrototype && <PrototypePlayer onClose={() => setShowPrototype(false)} />}
      </AnimatePresence>
    </>
  );
}
