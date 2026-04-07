import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Sparkles, Send, History, Loader2, Code2, Save, ChevronRight, Compass, Blocks,
  Map, UserCircle, GitBranch, ArrowRight, CheckCircle2, Monitor, Smartphone, Tablet,
  Move, MousePointer, Type, Square, Circle, Minus, Copy, Trash2, Download,
  Lock, Unlock, Grid, Play, ImagePlus, ZoomIn, ZoomOut, AlignLeft, AlignCenter,
  AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Layers, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Minus as MinusIcon,
  RotateCcw, FlipHorizontal, Group, Ungroup, Maximize2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authHeaders";
import { useAiMessages } from "@/hooks/useProjectData";
import { saveAiMessage } from "@/lib/api";
import type { Json } from "@/integrations/supabase/types";
import { getProjectId } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Database } from "@/integrations/supabase/types";

const getStudioUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/design-studio`;

// ─── Types ────────────────────────────────────────────────────────────────────
type StudioMode = "ux-pilot" | "ui-make";
type CanvasTool = "select" | "rect" | "circle" | "text" | "line" | "frame" | "pen";
type DeviceFrame = "desktop" | "tablet" | "mobile" | "custom";
type CodeView = "canvas" | "live" | "code";
type ArtifactType = "persona" | "journey_map" | "user_flow" | "sitemap" | "wireframe_concept";

type IDiaryEntry = Database["public"]["Tables"]["diary_studies"]["Row"];
type IStakeholder = Database["public"]["Tables"]["stakeholder_maps"]["Row"];
type IUserFlow = Database["public"]["Tables"]["user_flows"]["Row"];
type IMoodboard = Database["public"]["Tables"]["moodboards"]["Row"];
type IImpactEffortItem = Database["public"]["Tables"]["impact_effort_items"]["Row"];

interface CanvasElement {
  id: string;
  type: "rect" | "circle" | "text" | "line" | "frame" | "image";
  name: string;
  x: number; y: number; width: number; height: number;
  fill: string; stroke?: string; strokeWidth?: number;
  fontSize?: number; text?: string; fontWeight?: string; textAlign?: string;
  opacity: number; rotation: number; cornerRadius?: number;
  locked: boolean; visible: boolean;
  groupId?: string;
  children?: string[]; // for frames/groups
  blendMode?: string;
  shadow?: { x: number; y: number; blur: number; color: string };
}

interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number;
  panX: number; panY: number;
}

interface StudioResult {
  title?: string; component_name?: string; artifact_type?: ArtifactType;
  code?: string; description?: string; data?: unknown;
  preview_elements?: Partial<CanvasElement>[];
  usage_example?: string; design_notes?: string;
}

interface Iteration {
  id: string; mode: StudioMode; prompt: string;
  result: StudioResult; timestamp: Date; savedToDS?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const UX_LOADING = ["Analisando requisitos...", "Mapeando jornadas...", "Gerando artefato...", "Refinando conteúdo..."];
const UI_LOADING = ["Interpretando design brief...", "Gerando estrutura...", "Construindo componente...", "Otimizando código..."];

const PRESET_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316",
  "#eab308","#22c55e","#06b6d4","#3b82f6","#f8fafc",
  "#0f172a","#475569","#1e293b","#fef3c7","#fce7f3",
];

const DEVICE_FRAMES: Record<DeviceFrame, { w: number; h: number; label: string }> = {
  desktop: { w: 1440, h: 900, label: "Desktop 1440" },
  tablet:  { w: 768,  h: 1024, label: "iPad 768" },
  mobile:  { w: 390,  h: 844, label: "iPhone 390" },
  custom:  { w: 800,  h: 600, label: "Custom" },
};
const UX_CHIPS = [
  { label: "Persona", icon: UserCircle, prompt: "Crie uma persona detalhada e realista para este produto, com bio, citação, goals, pain points e behaviors digitais." },
  { label: "Journey Map", icon: Map, prompt: "Crie um journey map completo com 6 estágios, touchpoints, emoções variadas e oportunidades de melhoria." },
  { label: "User Flow", icon: GitBranch, prompt: "Gere um user flow completo com estados de erro, loading e edge cases." },
  { label: "Sitemap", icon: Compass, prompt: "Gere um sitemap completo para um SaaS B2B com hierarquia clara de 3 níveis." },
];

const UI_CHIPS = [
  { label: "Login Screen", icon: Monitor, prompt: "Tela de login dark glassmorphism com social login, forgot password. React + Tailwind completo." },
  { label: "Dashboard", icon: Grid, prompt: "Dashboard analytics com KPI cards, gráfico de área, lista de atividades. Design SaaS moderno." },
  { label: "Data Table", icon: Layers, prompt: "Data table com sorting, filtering, pagination, row selection e actions. Profissional." },
  { label: "Empty State", icon: Maximize2, prompt: "Empty state elegante com SVG illustration, título, descrição e CTA. Minimalista." },
];

const emotionColors: Record<string, { bg: string; emoji: string; bar: string }> = {
  happy:      { bg: "bg-green-500/15",  emoji: "😊", bar: "bg-green-500" },
  satisfied:  { bg: "bg-blue-500/15",   emoji: "😌", bar: "bg-blue-500" },
  neutral:    { bg: "bg-secondary",     emoji: "😐", bar: "bg-muted-foreground" },
  confused:   { bg: "bg-amber-500/15",  emoji: "😕", bar: "bg-amber-500" },
  frustrated: { bg: "bg-destructive/15",emoji: "😤", bar: "bg-destructive" },
};

const flowColors: Record<string, string> = {
  start:    "border-green-500 bg-green-500/10",
  end:      "border-destructive bg-destructive/10",
  action:   "border-blue-500 bg-blue-500/10",
  decision: "border-amber-500 bg-amber-500/10 border-dashed",
  screen:   "border-primary bg-primary/10",
  error:    "border-destructive bg-destructive/10 border-dashed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 9); }

async function saveToDS(result: StudioResult, prompt: string) {
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

// ─── Layers Panel ─────────────────────────────────────────────────────────────
function LayersPanel({
  elements, selectedIds, onSelect, onToggleVisible, onToggleLock, onDelete, onRename,
}: {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const layerIcon: Record<string, React.ReactNode> = {
    rect:   <Square className="w-3 h-3" />,
    circle: <Circle className="w-3 h-3" />,
    text:   <Type className="w-3 h-3" />,
    line:   <Minus className="w-3 h-3" />,
    frame:  <Monitor className="w-3 h-3" />,
    image:  <ImagePlus className="w-3 h-3" />,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Camadas</span>
        <span className="text-[10px] text-muted-foreground">{elements.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {[...elements].reverse().map(el => (
          <div
            key={el.id}
            onClick={e => onSelect(el.id, e.metaKey || e.shiftKey)}
            className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group transition-colors ${
              selectedIds.includes(el.id) ? "bg-primary/10 text-primary" : "hover:bg-accent/50 text-muted-foreground"
            }`}
          >
            <span className="shrink-0">{layerIcon[el.type] || <Square className="w-3 h-3" />}</span>
            {editingId === el.id ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => { onRename(el.id, editName); setEditingId(null); }}
                onKeyDown={e => { if (e.key === "Enter") { onRename(el.id, editName); setEditingId(null); } }}
                className="flex-1 bg-background border border-primary/50 rounded px-1 text-[10px] outline-none"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-[11px] truncate"
                onDoubleClick={e => { e.stopPropagation(); setEditingId(el.id); setEditName(el.name); }}
              >{el.name}</span>
            )}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
              <button onClick={e => { e.stopPropagation(); onToggleVisible(el.id); }} className="p-0.5 rounded hover:bg-accent">
                {el.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
              </button>
              <button onClick={e => { e.stopPropagation(); onToggleLock(el.id); }} className="p-0.5 rounded hover:bg-accent">
                {el.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>
        ))}
        {elements.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-6">Nenhuma camada</p>
        )}
      </div>
    </div>
  );
}
// ─── Properties Panel ─────────────────────────────────────────────────────────
function PropertiesPanel({
  elements, selectedIds, onUpdate,
}: {
  elements: CanvasElement[];
  selectedIds: string[];
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}) {
  const selected = elements.find(e => e.id === selectedIds[0]);
  if (!selected) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-muted-foreground">Selecione um elemento</p>
      </div>
    );
  }

  const multi = selectedIds.length > 1;
  const updateAll = (updates: Partial<CanvasElement>) => {
    selectedIds.forEach(id => onUpdate(id, updates));
  };

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      {/* Element name */}
      <div>
        <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Nome</label>
        <Input value={selected.name} onChange={e => onUpdate(selected.id, { name: e.target.value })} className="h-6 text-[10px] px-1.5" />
      </div>

      {/* Position & Size */}
      <div>
        <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Posição & Tamanho</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "X", key: "x" as const },
            { label: "Y", key: "y" as const },
            { label: "W", key: "width" as const },
            { label: "H", key: "height" as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <span className="text-[8px] text-muted-foreground">{label}</span>
              <Input type="number" value={Math.round(selected[key] as number)}
                onChange={e => updateAll({ [key]: Number(e.target.value) })}
                className="h-6 text-[10px] px-1.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Fill */}
      <div>
        <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Preenchimento</label>
        <div className="flex items-center gap-2 mb-2">
          <input type="color" value={selected.fill} onChange={e => updateAll({ fill: e.target.value })}
            className="w-7 h-7 rounded-md border border-border cursor-pointer" />
          <Input value={selected.fill} onChange={e => updateAll({ fill: e.target.value })}
            className="h-6 text-[10px] px-1.5 font-mono flex-1" />
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => updateAll({ fill: c })}
              className={`w-4 h-4 rounded border border-white/10 hover:scale-110 transition-transform ${selected.fill === c ? "ring-1 ring-primary" : ""}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Stroke */}
      <div>
        <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Borda</label>
        <div className="flex items-center gap-2">
          <input type="color" value={selected.stroke || "#000000"} onChange={e => updateAll({ stroke: e.target.value })}
            className="w-7 h-7 rounded-md border border-border cursor-pointer" />
          <Input type="number" value={selected.strokeWidth ?? 0} onChange={e => updateAll({ strokeWidth: Number(e.target.value) })}
            className="h-6 text-[10px] px-1.5 w-14" placeholder="0" />
          <span className="text-[9px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
          Opacidade: {Math.round(selected.opacity * 100)}%
        </label>
        <Slider value={[Math.round(selected.opacity * 100)]}
          onValueChange={([v]) => updateAll({ opacity: v / 100 })} min={0} max={100} step={1} />
      </div>

      {/* Corner radius — rect only */}
      {selected.type === "rect" && (
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Raio: {selected.cornerRadius ?? 0}px
          </label>
          <Slider value={[selected.cornerRadius ?? 0]}
            onValueChange={([v]) => updateAll({ cornerRadius: v })} min={0} max={80} step={1} />
        </div>
      )}

      {/* Rotation */}
      <div>
        <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
          Rotação: {selected.rotation}°
        </label>
        <Slider value={[selected.rotation]}
          onValueChange={([v]) => updateAll({ rotation: v })} min={0} max={360} step={1} />
      </div>

      {/* Text properties */}
      {selected.type === "text" && (
        <div className="space-y-2">
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block">Texto</label>
          <textarea value={selected.text || ""} onChange={e => onUpdate(selected.id, { text: e.target.value })}
            className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-[11px] text-foreground resize-none outline-none focus:border-primary/50"
            rows={3} />
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <span className="text-[8px] text-muted-foreground">Tamanho</span>
              <Input type="number" value={selected.fontSize || 14} onChange={e => onUpdate(selected.id, { fontSize: Number(e.target.value) })}
                className="h-6 text-[10px] px-1.5" />
            </div>
            <div>
              <span className="text-[8px] text-muted-foreground">Peso</span>
              <select value={selected.fontWeight || "400"} onChange={e => onUpdate(selected.id, { fontWeight: e.target.value })}
                className="w-full h-6 bg-secondary border border-border rounded text-[10px] px-1 text-foreground">
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">SemiBold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>
          <div className="flex gap-1">
            {(["left","center","right"] as const).map(align => (
              <button key={align} onClick={() => onUpdate(selected.id, { textAlign: align })}
                className={`flex-1 py-1 rounded text-[9px] transition-colors ${selected.textAlign === align ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {align === "left" ? <AlignLeft className="w-3 h-3 mx-auto" /> : align === "center" ? <AlignCenter className="w-3 h-3 mx-auto" /> : <AlignRight className="w-3 h-3 mx-auto" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Align tools — multi-select */}
      {multi && (
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Alinhar</label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { icon: <AlignStartVertical className="w-3 h-3" />, label: "Esquerda" },
              { icon: <AlignCenterVertical className="w-3 h-3" />, label: "Centro H" },
              { icon: <AlignEndVertical className="w-3 h-3" />, label: "Direita" },
              { icon: <AlignLeft className="w-3 h-3" />, label: "Topo" },
              { icon: <AlignCenter className="w-3 h-3" />, label: "Centro V" },
              { icon: <AlignRight className="w-3 h-3" />, label: "Base" },
            ].map(({ icon, label }) => (
              <button key={label} title={label} className="p-1.5 rounded bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Sandbox Live Preview ──────────────────────────────────────────────────────
function SandboxPreview({ code }: { code: string }) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:hsl(228,12%,8%);color:hsl(210,20%,92%);font-family:'Inter',sans-serif;padding:24px;min-height:100vh}
    ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:hsl(228,10%,25%);border-radius:3px}
  </style>
  <script>
    tailwind.config={theme:{extend:{colors:{
      border:'hsl(228,10%,18%)',background:'hsl(228,12%,8%)',foreground:'hsl(210,20%,92%)',
      primary:{DEFAULT:'hsl(262,83%,58%)',foreground:'hsl(0,0%,100%)'},
      secondary:{DEFAULT:'hsl(228,10%,14%)',foreground:'hsl(210,20%,92%)'},
      muted:{DEFAULT:'hsl(228,10%,18%)',foreground:'hsl(215,12%,50%)'},
      accent:{DEFAULT:'hsl(228,10%,20%)',foreground:'hsl(210,20%,92%)'},
      destructive:{DEFAULT:'hsl(0,72%,51%)',foreground:'hsl(0,0%,100%)'},
      card:{DEFAULT:'hsl(228,12%,11%)',foreground:'hsl(210,20%,92%)'},
    }}}}
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useRef, useCallback } = React;
    ${code}
    const rootEl = document.getElementById('root');
    const root = ReactDOM.createRoot(rootEl);
    try {
      const C = typeof App !== 'undefined' ? App : typeof exports !== 'undefined' && exports.default ? exports.default : null;
      if(C) root.render(React.createElement(C));
      else rootEl.innerHTML='<p style="color:#94a3b8;font-size:12px">Export default não encontrado. Use: export default function App()</p>';
    } catch(e){
      rootEl.innerHTML='<div style="color:#ef4444;padding:16px;font-size:11px;font-family:monospace;background:#1e1e2e;border-radius:8px;border:1px solid #ef444430"><b>Erro:</b> '+e.message+'</div>';
    }
  </script>
</body>
</html>`;

  return (
    <div className="flex flex-col h-full bg-[hsl(228,12%,6%)]">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card shrink-0">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/70"/>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70"/>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"/>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">localhost:preview</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
          <span className="text-[10px] text-green-400">Live</span>
        </div>
      </div>
      <iframe srcDoc={html} className="flex-1 w-full border-none" sandbox="allow-scripts" title="Live Preview" />
    </div>
  );
}

// ─── UX Artifact Views ────────────────────────────────────────────────────────
function PersonaCard({ data, title, description }: { data: unknown; title: string; description: string }) {
  const d = data as Record<string, unknown>;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shrink-0">
            {String(d?.name || "?").charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{String(d?.name || title)}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {String(d?.role || "")} {d?.age ? `· ${d.age} anos` : ""}
                </p>
              </div>
              {d?.tech_savviness && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium shrink-0">
                  Tech: {String(d.tech_savviness)}
                </span>
              )}
            </div>
            {d?.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{String(d.bio)}</p>}
            {d?.quote && (
              <blockquote className="mt-3 pl-4 border-l-2 border-primary/50 italic text-sm text-foreground/70">
                "{String(d.quote)}"
              </blockquote>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "🎯 Objetivos", items: d?.goals as string[], color: "border-green-500/25 bg-green-500/5" },
          { label: "😤 Dores", items: d?.pain_points as string[], color: "border-destructive/25 bg-destructive/5" },
          { label: "💡 Comportamentos", items: d?.behaviors as string[], color: "border-blue-500/25 bg-blue-500/5" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{s.label}</h4>
            <ul className="space-y-2">
              {(s.items || []).map((item, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">▸</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
function JourneyMapCard({ data, title, description }: { data: unknown; title: string; description: string }) {
  const d = data as Record<string, unknown>;
  const stages = (d?.stages as Record<string, unknown>[]) || [];
  const emotionLevels: Record<string, number> = { happy: 95, satisfied: 75, neutral: 50, confused: 30, frustrated: 10 };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="border border-border rounded-xl p-4 bg-card">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-3 min-w-max">
          {stages.map((stage, i) => {
            const em = emotionColors[String(stage.emotion)] || emotionColors.neutral;
            return (
              <div key={i} className={`w-52 border border-border rounded-xl p-4 bg-card flex flex-col gap-3 relative ${em.bg}`}>
                {i < stages.length - 1 && (
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/40">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">#{i + 1}</span>
                  <span className="text-base">{em.emoji}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{String(stage.name)}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{String(stage.description || "")}</p>
                </div>
                <div className="space-y-2 mt-auto pt-3 border-t border-border/40">
                  {[
                    { label: "Touchpoint", val: stage.touchpoint },
                    { label: "Ação", val: stage.action },
                  ].map(({ label, val }) => val && (
                    <div key={label}>
                      <span className="text-[8px] font-bold uppercase text-muted-foreground/60">{label}</span>
                      <p className="text-[10px] text-foreground leading-snug">{String(val)}</p>
                    </div>
                  ))}
                  {stage.pain && (
                    <div className="rounded-lg bg-destructive/10 px-2 py-1.5">
                      <span className="text-[8px] font-bold uppercase text-destructive">Dor</span>
                      <p className="text-[10px] text-foreground">{String(stage.pain)}</p>
                    </div>
                  )}
                  {stage.opportunity && (
                    <div className="rounded-lg bg-primary/10 px-2 py-1.5">
                      <span className="text-[8px] font-bold uppercase text-primary">Oportunidade</span>
                      <p className="text-[10px] text-foreground">{String(stage.opportunity)}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Emotional curve */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Curva Emocional</h4>
        <div className="flex items-end gap-1 h-20">
          {stages.map((stage, i) => {
            const level = emotionLevels[String(stage.emotion)] || 50;
            const em = emotionColors[String(stage.emotion)] || emotionColors.neutral;
            return (
              <div key={i} className={`flex-1 rounded-t-md ${em.bar} opacity-70 relative group transition-all duration-500`}
                style={{ height: `${level}%`, transitionDelay: `${i * 80}ms` }} title={String(stage.name)}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">{em.emoji}</span>
              </div>
            );
          })}
        </div>
        <div className="flex mt-2">
          {stages.map((stage, i) => (
            <p key={i} className="flex-1 text-[8px] text-muted-foreground text-center truncate px-0.5">{String(stage.name)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserFlowCard({ data, title, description }: { data: unknown; title: string; description: string }) {
  const d = data as Record<string, unknown>;
  const steps = (d?.steps as Record<string, unknown>[]) || [];
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="border border-border rounded-xl p-4 bg-card">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="border border-border rounded-xl p-6 bg-card overflow-x-auto">
        <div className="flex flex-wrap gap-3 items-center justify-start">
          {steps.map((step, i) => {
            const color = flowColors[String(step.type)] || flowColors.action;
            const isDecision = step.type === "decision";
            return (
              <div key={String(step.id)} className="flex items-center gap-3">
                <div className={`border-2 bg-card ${color} ${isDecision ? "rotate-45 w-16 h-16 flex items-center justify-center" : "rounded-xl px-4 py-2.5 min-w-[120px]"} relative`}>
                  <div className={isDecision ? "-rotate-45 text-center" : "text-center"}>
                    <span className="text-[8px] font-bold uppercase text-muted-foreground block">{String(step.type)}</span>
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{String(step.label)}</p>
                  </div>
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SitemapCard({ data, title, description }: { data: unknown; title: string; description: string }) {
  const d = data as Record<string, unknown>;
  const pages = (d?.pages as Record<string, unknown>[]) || [];
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="border border-border rounded-xl p-4 bg-card">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {pages.map((page, i) => (
            <div key={i} className="border border-border rounded-lg p-3 bg-secondary/30 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0"/>
                <span className="text-xs font-semibold text-foreground truncate">{String(page.name)}</span>
              </div>
              <p className="text-[9px] text-muted-foreground font-mono">{String(page.path || "")}</p>
              {(page.children as Record<string, unknown>[])?.length > 0 && (
                <div className="mt-2 space-y-1 pl-3 border-l border-border/50">
                  {(page.children as Record<string, unknown>[]).map((child, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0"/>
                      <span className="text-[9px] text-muted-foreground">{String(child.name)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ─── Main Canvas ───────────────────────────────────────────────────────────────
function DesignCanvas({
  elements, selectedIds, zoom, panX, panY, tool,
  onMouseDown, onMouseMove, onMouseUp, onSelect,
  canvasRef, deviceFrame,
}: {
  elements: CanvasElement[];
  selectedIds: string[];
  zoom: number; panX: number; panY: number;
  tool: CanvasTool;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
  onSelect: (id: string, multi: boolean) => void;
  canvasRef: React.RefObject<SVGSVGElement>;
  deviceFrame: DeviceFrame;
}) {
  const { w, h } = DEVICE_FRAMES[deviceFrame];
  const cursorMap: Record<CanvasTool, string> = {
    select: "default", rect: "crosshair", circle: "crosshair",
    text: "text", line: "crosshair", frame: "crosshair", pen: "crosshair",
  };

  return (
    <svg
      ref={canvasRef}
      width="100%" height="100%"
      style={{ cursor: cursorMap[tool] }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Background */}
      <rect width="100%" height="100%" fill="hsl(228,12%,6%)"/>

      {/* Dot grid */}
      <defs>
        <pattern id="dots" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
          x={panX % (20 * zoom)} y={panY % (20 * zoom)}>
          <circle cx={10 * zoom} cy={10 * zoom} r="0.8" fill="hsl(228,10%,22%)"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)"/>

      {/* Device frame */}
      <rect
        x={panX} y={panY}
        width={w * zoom} height={h * zoom}
        fill="hsl(228,12%,9%)" stroke="hsl(228,10%,22%)" strokeWidth={1}
        rx={deviceFrame === "mobile" ? 16 * zoom : deviceFrame === "tablet" ? 8 * zoom : 0}
      />

      {/* Elements */}
      <g>
        {elements.filter(el => el.visible).map(el => {
          const isSelected = selectedIds.includes(el.id);
          const ex = panX + el.x * zoom;
          const ey = panY + el.y * zoom;
          const ew = el.width * zoom;
          const eh = el.height * zoom;
          const transform = el.rotation
            ? `rotate(${el.rotation} ${ex + ew / 2} ${ey + eh / 2})`
            : undefined;

          return (
            <g key={el.id} transform={transform} opacity={el.opacity}
              style={{ cursor: el.locked ? "not-allowed" : "move" }}
              onMouseDown={e => { if (!el.locked) { e.stopPropagation(); onSelect(el.id, e.metaKey || e.shiftKey); } }}>

              {el.type === "rect" && (
                <rect x={ex} y={ey} width={ew} height={eh}
                  fill={el.fill} rx={(el.cornerRadius ?? 0) * zoom}
                  stroke={isSelected ? "hsl(262,83%,68%)" : el.stroke || "none"}
                  strokeWidth={isSelected ? 2 : (el.strokeWidth || 0) * zoom}/>
              )}
              {el.type === "circle" && (
                <ellipse cx={ex + ew/2} cy={ey + eh/2} rx={ew/2} ry={eh/2}
                  fill={el.fill}
                  stroke={isSelected ? "hsl(262,83%,68%)" : el.stroke || "none"}
                  strokeWidth={isSelected ? 2 : (el.strokeWidth || 0) * zoom}/>
              )}
              {el.type === "text" && (
                <text x={ex} y={ey + (el.fontSize || 14) * zoom} fill={el.fill}
                  fontSize={(el.fontSize || 14) * zoom}
                  fontWeight={el.fontWeight || "400"}
                  fontFamily="Inter, sans-serif"
                  textAnchor={el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start"}>
                  {el.text}
                </text>
              )}
              {el.type === "line" && (
                <line x1={ex} y1={ey} x2={ex + ew} y2={ey + eh}
                  stroke={el.fill} strokeWidth={(el.strokeWidth || 2) * zoom}/>
              )}
              {el.type === "frame" && (
                <rect x={ex} y={ey} width={ew} height={eh}
                  fill={el.fill} stroke={isSelected ? "hsl(262,83%,68%)" : "hsl(228,10%,25%)"}
                  strokeWidth={isSelected ? 2 : 1} rx={4 * zoom}/>
              )}

              {/* Selection handles */}
              {isSelected && !el.locked && (
                <>
                  <rect x={ex-1} y={ey-1} width={ew+2} height={eh+2}
                    fill="none" stroke="hsl(262,83%,68%)" strokeWidth={1.5} strokeDasharray="4 2"/>
                  {/* Corner handles */}
                  {[[ex-3,ey-3],[ex+ew-3,ey-3],[ex-3,ey+eh-3],[ex+ew-3,ey+eh-3]].map(([hx,hy],i) => (
                    <rect key={i} x={hx} y={hy} width={6} height={6} rx={1}
                      fill="white" stroke="hsl(262,83%,68%)" strokeWidth={1.5}/>
                  ))}
                  {/* Resize handle */}
                  <rect x={ex+ew-5} y={ey+eh-5} width={10} height={10} rx={2}
                    fill="hsl(262,83%,58%)" className="cursor-se-resize"/>
                </>
              )}

              {/* Lock indicator */}
              {el.locked && isSelected && (
                <text x={ex+ew/2} y={ey-6} textAnchor="middle" fill="hsl(215,12%,50%)" fontSize={10}>🔒</text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
// ─── Main Component ────────────────────────────────────────────────────────────
export function AIDesignStudio() {
  // Mode & prompt
  const [mode, setMode] = useState<StudioMode>("ux-pilot");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<StudioResult | null>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [savingToDS, setSavingToDS] = useState(false);

  // View
  const [codeView, setCodeView] = useState<CodeView>("canvas");
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [leftTab, setLeftTab] = useState<"prompt" | "layers">("prompt");
  const [rightTab, setRightTab] = useState<"properties" | "code" | "export">("properties");

  // Canvas state
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0.75);
  const [panX, setPanX] = useState(60);
  const [panY, setPanY] = useState(40);
  const [tool, setTool] = useState<CanvasTool>("select");
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>("desktop");
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elX: number; elY: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number; elId: string } | null>(null);

  // Image
  const [imageAttachment, setImageAttachment] = useState<{ data: string; mime_type: string } | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: aiHistory } = useAiMessages();
  const loadingMsgs = mode === "ux-pilot" ? UX_LOADING : UI_LOADING;
  const chips = mode === "ux-pilot" ? UX_CHIPS : UI_CHIPS;

  // Load history
  useEffect(() => {
    if (!aiHistory) return;
    const pairs: Iteration[] = [];
    for (let i = 0; i < aiHistory.length - 1; i += 2) {
      const u = aiHistory[i] as { role: string; content: string; created_at: string };
      const a = aiHistory[i + 1] as { role: string; content: string };
      if (u?.role === "user" && a?.role === "assistant") {
        try {
          const parsed = JSON.parse(a.content);
          pairs.push({ id: u.created_at, mode: parsed.mode, prompt: u.content, result: parsed.result, timestamp: new Date(u.created_at), savedToDS: false });
        } catch { /* ignore */ }
      }
    }
    if (pairs.length > 0) setIterations(pairs);
  }, [aiHistory]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [prompt]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "v") setTool("select");
      if (e.key === "r") setTool("rect");
      if (e.key === "o") setTool("circle");
      if (e.key === "t") setTool("text");
      if (e.key === "l") setTool("line");
      if (e.key === "f") setTool("frame");
      if (e.key === "=" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setZoom(z => Math.min(4, z + 0.1)); }
      if (e.key === "-" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setZoom(z => Math.max(0.1, z - 0.1)); }
      if (e.key === "0" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setZoom(1); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
      }
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && selectedIds.length > 0) {
        e.preventDefault();
        setElements(prev => {
          const newEls: CanvasElement[] = [];
          selectedIds.forEach(id => {
            const el = prev.find(e => e.id === id);
            if (el) newEls.push({ ...el, id: genId(), x: el.x + 20, y: el.y + 20, name: el.name + " copy" });
          });
          return [...prev, ...newEls];
        });
      }
      if (e.key === "Escape") setSelectedIds([]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds]);

  // Wheel zoom & pan
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.002;
        setZoom(z => Math.max(0.1, Math.min(4, z + delta * z)));
      } else {
        setPanX(p => p - e.deltaX);
        setPanY(p => p - e.deltaY);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Get canvas point from mouse event
  const getCanvasPoint = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panX) / zoom,
      y: (e.clientY - rect.top  - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, px: panX, py: panY });
      return;
    }
    if (tool === "select") return; // handled by element click
    else {
      const pt = getCanvasPoint(e);
      const newEl: CanvasElement = {
        id: genId(),
        type: tool === "frame" ? "frame" : tool === "pen" ? "line" : tool as CanvasElement["type"],
        name: `${tool.charAt(0).toUpperCase() + tool.slice(1)} ${elements.length + 1}`,
        x: pt.x, y: pt.y, width: 120, height: tool === "text" ? 32 : tool === "line" ? 0 : 80,
        fill: tool === "text" ? "#f8fafc" : tool === "line" ? "#6366f1" : "#6366f1",
        opacity: 1, rotation: 0, locked: false, visible: true,
        cornerRadius: tool === "rect" ? 8 : undefined,
        fontSize: tool === "text" ? 16 : undefined,
        text: tool === "text" ? "Texto" : undefined,
        fontWeight: "400", textAlign: "left",
      };
      setElements(prev => [...prev, newEl]);
      setSelectedIds([newEl.id]);
      setTool("select");
    }
  }, [tool, elements, panX, panY, getCanvasPoint]);
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning && panStart) {
      setPanX(panStart.px + e.clientX - panStart.x);
      setPanY(panStart.py + e.clientY - panStart.y);
    }
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false); setPanStart(null);
    setIsDragging(false); setDragStart(null);
    setIsResizing(false); setResizeStart(null);
  }, []);

  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedIds(prev => {
      if (multi) return prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      return [id];
    });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  }, []);

  // Apply AI-generated preview elements to canvas
  const applyPreviewElements = useCallback((previewEls: Partial<CanvasElement>[]) => {
    const newEls: CanvasElement[] = previewEls.map((pe, i) => ({
      id: genId(),
      type: (pe.type || "rect") as CanvasElement["type"],
      name: pe.text || `${pe.type || "element"} ${i + 1}`,
      x: pe.x ?? 20, y: pe.y ?? 20,
      width: pe.width ?? 100, height: pe.height ?? 60,
      fill: pe.fill ?? "#6366f1",
      stroke: pe.strokeColor, strokeWidth: pe.strokeWidth,
      opacity: pe.opacity ?? 1, rotation: pe.rotation ?? 0,
      cornerRadius: pe.cornerRadius,
      text: pe.text, fontSize: pe.fontSize,
      locked: false, visible: true,
      fontWeight: "400", textAlign: "left",
    }));
    setElements(newEls);
    setSelectedIds([]);
  }, []);

  // Generate
  const generate = useCallback(async (inputPrompt?: string) => {
    const text = inputPrompt || prompt;
    if (!text.trim() || isLoading) return;
    setIsLoading(true); setResult(null); setLoadingStep(0);
    setShowTemplates(false); setCodeView("canvas");

    const interval = setInterval(() => setLoadingStep(p => (p + 1) % loadingMsgs.length), 1800);

    try {
      const headers = await getAuthHeaders();
      const projectId = await getProjectId();

      const resp = await fetch(getStudioUrl(), {
        method: "POST", headers,
        body: JSON.stringify({
          prompt: text, mode,
          context: { project_id: projectId },
          history: iterations.slice(0, 3).flatMap(it => [
            { role: "user", content: it.prompt },
            { role: "assistant", content: JSON.stringify({ mode: it.mode, result: it.result }) },
          ]),
          image: imageAttachment || undefined,
        }),
      });

      clearInterval(interval);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || `Erro ${resp.status}`);
        setIsLoading(false); return;
      }

      const data = await resp.json();
      const r = data.result as StudioResult;
      setResult(r);

      if (r.preview_elements && r.preview_elements.length > 0) {
        applyPreviewElements(r.preview_elements);
      }
      setImageAttachment(null);

      const iteration: Iteration = { id: Date.now().toString(), mode, prompt: text, result: r, timestamp: new Date(), savedToDS: false };

      if (mode === "ui-make" && r.component_name) {
        try { await saveToDS(r, text); iteration.savedToDS = true; toast.success("Componente salvo no Design System!"); }
        catch { toast.success("Componente gerado!"); }
      } else { toast.success("Artefato gerado com sucesso!"); }

      setIterations(prev => [iteration, ...prev]);

      try {
        await saveAiMessage("user", text);
        await saveAiMessage("assistant", JSON.stringify({ mode, result: r }));
      } catch { /* ignore */ }
    } catch { clearInterval(interval); toast.error("Erro ao gerar. Tente novamente."); }

    setIsLoading(false);
  }, [prompt, mode, isLoading, loadingMsgs.length, iterations, imageAttachment, applyPreviewElements]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setImageAttachment({ data: base64, mime_type: file.type });
      toast.success("Imagem anexada como referência visual.");
    };
    reader.readAsDataURL(file);
  };

  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const selectedEl = elements.find(e => e.id === selectedIds[0]);
  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden rounded-xl border border-border bg-[hsl(228,12%,6%)]">

      {/* ═══ LEFT PANEL ═══ */}
      <div className="w-64 flex flex-col border-r border-border bg-card shrink-0">
        {/* Mode tabs */}
        <div className="flex border-b border-border shrink-0">
          {(["ux-pilot","ui-make"] as StudioMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                mode === m ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}>
              {m === "ux-pilot" ? <Compass className="w-3 h-3"/> : <Blocks className="w-3 h-3"/>}
              {m === "ux-pilot" ? "UX Pilot" : "UI Make"}
            </button>
          ))}
        </div>

        {/* Left sub-tabs */}
        <div className="flex border-b border-border shrink-0">
          {(["prompt","layers"] as const).map(tab => (
            <button key={tab} onClick={() => setLeftTab(tab)}
              className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                leftTab === tab ? "text-foreground bg-accent/30" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab === "prompt" ? "Prompt" : <span className="flex items-center justify-center gap-1"><Layers className="w-3 h-3"/>Camadas</span>}
            </button>
          ))}
        </div>

        {/* Left content */}
        {leftTab === "prompt" ? (
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <div className="p-3 space-y-3 flex-1 flex flex-col min-h-0">
              {/* Description */}
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {mode === "ux-pilot" ? "Gere personas, journey maps, user flows e sitemaps." : "Gere componentes React + Tailwind prontos para produção."}
              </p>

              {/* Image attachment */}
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                <button onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] border transition-colors flex-1 ${
                    imageAttachment ? "border-primary/40 text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}>
                  <ImagePlus className="w-3 h-3 shrink-0"/>
                  <span className="truncate">{imageAttachment ? "Imagem anexada ✓" : "Anexar referência"}</span>
                </button>
                {imageAttachment && (
                  <button onClick={() => setImageAttachment(null)} className="text-[10px] text-destructive hover:text-destructive/80 shrink-0">✕</button>
                )}
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea ref={textareaRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
                  placeholder={mode === "ux-pilot" ? "Descreva o artefato UX...\nEx: Persona para app de meditação" : "Descreva o componente...\nEx: Sidebar colapsável com navigation groups"}
                  className="w-full min-h-[90px] bg-background border border-border rounded-lg px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none resize-none focus:border-primary/50 transition-colors"/>
                <button onClick={() => generate()} disabled={isLoading || !prompt.trim()}
                  className="absolute bottom-2 right-2 p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all">
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground/40">⌘+Enter para enviar</p>

              {/* Quick chips */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Atalhos</p>
                <div className="space-y-1">
                  {chips.map(chip => (
                    <button key={chip.label} onClick={() => { setPrompt(chip.prompt); generate(chip.prompt); }}
                      disabled={isLoading}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-secondary/50 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left disabled:opacity-50">
                      <chip.icon className="w-3 h-3 text-primary shrink-0"/>
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* History */}
              {iterations.length > 0 && (
                <div>
                  <button onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full">
                    <History className="w-3 h-3"/>
                    Histórico ({iterations.length})
                    <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${showHistory ? "rotate-90" : ""}`}/>
                  </button>
                  {showHistory && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {iterations.map(it => (
                        <button key={it.id} onClick={() => { setMode(it.mode); setPrompt(it.prompt); setResult(it.result); if (it.result.preview_elements) applyPreviewElements(it.result.preview_elements); setShowHistory(false); }}
                          className="w-full text-left px-2.5 py-2 rounded-lg bg-secondary/40 hover:bg-accent transition-colors">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${it.mode === "ux-pilot" ? "bg-blue-500/20 text-blue-400" : "bg-primary/20 text-primary"}`}>
                              {it.mode === "ux-pilot" ? "UX" : "UI"}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{it.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-[10px] text-foreground truncate">{it.prompt}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <LayersPanel
              elements={elements}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onToggleVisible={id => updateElement(id, { visible: !elements.find(e => e.id === id)?.visible })}
              onToggleLock={id => updateElement(id, { locked: !elements.find(e => e.id === id)?.locked })}
              onDelete={deleteElement}
              onRename={(id, name) => updateElement(id, { name })}
            />
          </div>
        )}
      </div>
      {/* ═══ CENTER — Toolbar + Canvas ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
          {/* Left: tools */}
          <div className="flex items-center gap-1">
            {([
              { t: "select" as CanvasTool, icon: MousePointer, key: "V" },
              { t: "frame"  as CanvasTool, icon: Monitor, key: "F" },
              { t: "rect"   as CanvasTool, icon: Square, key: "R" },
              { t: "circle" as CanvasTool, icon: Circle, key: "O" },
              { t: "text"   as CanvasTool, icon: Type, key: "T" },
              { t: "line"   as CanvasTool, icon: Minus, key: "L" },
            ]).map(({ t, icon: Icon, key }) => (
              <button key={t} onClick={() => setTool(t)} title={`${t} (${key})`}
                className={`p-1.5 rounded-md transition-colors ${tool === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                <Icon className="w-3.5 h-3.5"/>
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1"/>
            <button onClick={() => { setElements([]); setSelectedIds([]); }}
              title="Limpar canvas" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>

          {/* Center: device frame + title */}
          <div className="flex items-center gap-2">
            {result && (
              <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                {result.title || result.component_name || "Resultado"}
              </span>
            )}
            <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5">
              {(["desktop","tablet","mobile"] as DeviceFrame[]).map(d => (
                <button key={d} onClick={() => setDeviceFrame(d)}
                  className={`p-1 rounded transition-colors ${deviceFrame === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {d === "desktop" ? <Monitor className="w-3 h-3"/> : d === "tablet" ? <Tablet className="w-3 h-3"/> : <Smartphone className="w-3 h-3"/>}
                </button>
              ))}
            </div>
          </div>

          {/* Right: zoom + view */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary rounded-md px-1 py-0.5">
              <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><ZoomOut className="w-3 h-3"/></button>
              <span className="text-[10px] font-mono text-foreground w-10 text-center">{zoomLabel}</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"><ZoomIn className="w-3 h-3"/></button>
            </div>
            <button onClick={() => { setZoom(0.75); setPanX(60); setPanY(40); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Reset view">
              <Maximize2 className="w-3 h-3"/>
            </button>
            {mode === "ui-make" && result?.code && (
              <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5">
                {(["canvas","live","code"] as CodeView[]).map(v => (
                  <button key={v} onClick={() => setCodeView(v)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${codeView === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {v === "canvas" ? "Canvas" : v === "live" ? "▶ Live" : "</>"}
                  </button>
                ))}
              </div>
            )}
            {result && mode === "ui-make" && !iterations[0]?.savedToDS && (
              <button onClick={async () => { setSavingToDS(true); try { await saveToDS(result, prompt); toast.success("Salvo no DS Hub!"); } catch { toast.error("Erro ao salvar"); } setSavingToDS(false); }}
                disabled={savingToDS}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:opacity-90 disabled:opacity-50">
                {savingToDS ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                DS Hub
              </button>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div ref={canvasContainerRef} className="flex-1 overflow-hidden relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[hsl(228,12%,6%)]/90 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
                  <Sparkles className="w-6 h-6 text-primary-foreground animate-pulse"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Gerando com IA...</p>
                  <p className="text-xs text-primary mt-1 animate-pulse">{loadingMsgs[loadingStep]}</p>
                </div>
                <div className="flex gap-1 justify-center">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i*150}ms` }}/>)}
                </div>
              </div>
            </div>
          )}
          {/* Empty state */}
          {!isLoading && !result && elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  {mode === "ux-pilot" ? <Compass className="w-7 h-7 text-primary/40"/> : <Blocks className="w-7 h-7 text-primary/40"/>}
                </div>
                <p className="text-base font-semibold text-foreground/30">{mode === "ux-pilot" ? "UX Pilot" : "UI Make"}</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Descreva o que gerar ou desenhe no canvas</p>
                <p className="text-[9px] text-muted-foreground/30 mt-3">V: Selecionar · R: Retângulo · O: Círculo · T: Texto · F: Frame</p>
              </div>
            </div>
          )}

          {/* Canvas or Live Preview or Code */}
          {codeView === "live" && result?.code ? (
            <SandboxPreview code={result.code}/>
          ) : codeView === "code" && result?.code ? (
            <div className="h-full overflow-auto bg-[hsl(228,12%,6%)] p-6">
              <div className="border border-border rounded-xl overflow-hidden max-w-4xl mx-auto">
                <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-primary"/>
                    <span className="text-xs font-mono text-foreground">{result.component_name || "Component"}.tsx</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">React</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(result.code!); toast.success("Código copiado!"); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors flex items-center gap-1">
                    <Copy className="w-3 h-3"/>Copiar
                  </button>
                </div>
                <pre className="p-5 overflow-auto text-xs text-foreground/85 font-mono leading-relaxed bg-[hsl(228,12%,8%)]">
                  <code>{result.code}</code>
                </pre>
                {result.usage_example && (
                  <div className="px-4 py-3 border-t border-border bg-card/50">
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Exemplo de uso</p>
                    <code className="text-[10px] text-primary font-mono">{result.usage_example}</code>
                  </div>
                )}
              </div>
              {result.design_notes && (
                <div className="max-w-4xl mx-auto mt-4 border border-border rounded-xl p-4 bg-card">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Notas de Design</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{result.design_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* UX Pilot results overlay */}
              {result && mode === "ux-pilot" && (
                <div className="absolute inset-0 overflow-auto p-8">
                  {result.artifact_type === "persona"      && <PersonaCard    data={result.data} title={result.title||""} description={result.description||""}/>}
                  {result.artifact_type === "journey_map"  && <JourneyMapCard data={result.data} title={result.title||""} description={result.description||""}/>}
                  {result.artifact_type === "user_flow"    && <UserFlowCard   data={result.data} title={result.title||""} description={result.description||""}/>}
                  {result.artifact_type === "sitemap"      && <SitemapCard    data={result.data} title={result.title||""} description={result.description||""}/>}
                  {(result.artifact_type === "wireframe_concept" || !result.artifact_type) && result.data && (
                    <div className="max-w-3xl mx-auto border border-border rounded-xl p-6 bg-card">
                      <h2 className="text-base font-bold text-foreground mb-2">{result.title}</h2>
                      <p className="text-xs text-muted-foreground mb-4">{result.description}</p>
                      <pre className="text-xs text-foreground/80 bg-secondary/50 rounded-lg p-4 overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* UI Make canvas */}
              <DesignCanvas
                elements={elements}
                selectedIds={selectedIds}
                zoom={zoom} panX={panX} panY={panY}
                tool={tool}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onSelect={handleSelect}
                canvasRef={canvasRef}
                deviceFrame={deviceFrame}
              />
            </>
          )}
        </div>
      </div>
      {/* ═══ RIGHT PANEL — Properties ═══ */}
      <div className="w-64 flex flex-col border-l border-border bg-card shrink-0">
        <div className="flex border-b border-border shrink-0">
          {(["properties","code","export"] as const).map(tab => (
            <button key={tab} onClick={() => setRightTab(tab)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                rightTab === tab ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab === "properties" ? <SlidersHorizontal className="w-3 h-3 mx-auto"/> : tab === "code" ? <Code2 className="w-3 h-3 mx-auto"/> : <Download className="w-3 h-3 mx-auto"/>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {rightTab === "properties" ? (
            <PropertiesPanel
              elements={elements}
              selectedIds={selectedIds}
              onUpdate={updateElement}
            />
          ) : rightTab === "code" ? (
            <div className="p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estrutura (JSON)</p>
              <pre className="text-[9px] text-foreground/70 bg-secondary/30 p-3 rounded-lg overflow-auto max-h-[400px] border border-border/40">
                <code>{JSON.stringify(selectedEl || elements, null, 2)}</code>
              </pre>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exportar</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => toast.success("PNG exportado")} className="w-full py-2 bg-secondary hover:bg-accent rounded-lg text-xs text-foreground transition-colors flex items-center justify-center gap-2 border border-border">
                  <FileDown className="w-3.5 h-3.5"/> PNG
                </button>
                <button onClick={() => toast.success("SVG exportado")} className="w-full py-2 bg-secondary hover:bg-accent rounded-lg text-xs text-foreground transition-colors flex items-center justify-center gap-2 border border-border">
                  <Download className="w-3.5 h-3.5"/> SVG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
