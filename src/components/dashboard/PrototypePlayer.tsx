import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, TargetAndTransition } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play, MousePointer2, Maximize2, List, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getProjectId } from "@/lib/api";
import type { Json } from "@/integrations/supabase/types";

interface CanvasDesign {
  id: string;
  name: string;
  elements: Record<string, unknown>[];
  canvas_width: number;
  canvas_height: number;
}

interface Hotspot {
  id: string;
  source_design_id: string;
  target_design_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  transition: string;
  label: string;
}

const TRANSITIONS: Record<string, { initial: Record<string, unknown>; animate: Record<string, unknown>; exit: Record<string, unknown> }> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  "slide-left": { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
  "slide-right": { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "100%" } },
  "slide-up": { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
  "scale": { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 } },
};

export function PrototypePlayer({ onClose }: { onClose: () => void }) {
  const [screens, setScreens] = useState<CanvasDesign[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showScreenList, setShowScreenList] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [transitionKey, setTransitionKey] = useState(0);
  const [currentTransition, setCurrentTransition] = useState("fade");

  const loadData = useCallback(async () => {
    const projectId = await getProjectId();
    const { data: designs } = await supabase
      .from("canvas_designs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at");

    if (designs && designs.length > 0) {
      const mapped = designs.map(d => ({
        id: d.id,
        elements: (d.elements || []) as unknown as Record<string, unknown>[],
        canvas_width: d.canvas_width,
        canvas_height: d.canvas_height,
        name: d.name,
      }));
      setScreens(mapped);
      setCurrentScreenId(mapped[0].id);
      setHistory([mapped[0].id]);
    }

    const { data: spots } = await supabase
      .from("prototype_hotspots")
      .select("*");

    if (spots) {
      setHotspots(spots as unknown as Hotspot[]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentScreen = screens.find(s => s.id === currentScreenId);
  const currentHotspots = hotspots.filter(h => h.source_design_id === currentScreenId);

  const navigateTo = useCallback((targetId: string, transition: string = "fade") => {
    setCurrentTransition(transition);
    setTransitionKey(prev => prev + 1);
    setCurrentScreenId(targetId);
    setHistory(prev => [...prev, targetId]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrentTransition("slide-right");
    setTransitionKey(prev => prev + 1);
    setCurrentScreenId(newHistory[newHistory.length - 1]);
  }, [history]);

  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= screens.length) return;
    navigateTo(screens[index].id);
  }, [screens, navigateTo]);

  const currentIndex = screens.findIndex(s => s.id === currentScreenId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "ArrowRight" && currentIndex < screens.length - 1) goToIndex(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goBack, goToIndex, currentIndex, screens.length]);

  const trans = TRANSITIONS[currentTransition] || TRANSITIONS.fade;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Modo Protótipo</span>
          </div>
          {currentScreen && (
            <span className="text-[10px] text-muted-foreground">
              {currentScreen.name} ({currentIndex + 1}/{screens.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${showHotspots ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}
          >
            <MousePointer2 className="w-3 h-3" />
            Hotspots
          </button>
          <button
            onClick={() => setShowScreenList(!showScreenList)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${showScreenList ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}
          >
            <List className="w-3 h-3" />
            Telas
          </button>
          <button onClick={goBack} disabled={history.length <= 1}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => goToIndex(currentIndex + 1)} disabled={currentIndex >= screens.length - 1}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Screen List */}
        <AnimatePresence>
          {showScreenList && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border bg-card overflow-y-auto shrink-0"
            >
              <div className="p-2 space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Telas do Protótipo</p>
                {screens.map((screen, i) => (
                  <button
                    key={screen.id}
                    onClick={() => navigateTo(screen.id)}
                    className={`w-full text-left p-2 rounded-md text-[10px] transition-colors ${
                      screen.id === currentScreenId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <span className="text-[8px] text-muted-foreground/60 mr-1">{i + 1}.</span>
                    {screen.name}
                    {hotspots.filter(h => h.source_design_id === screen.id).length > 0 && (
                      <span className="ml-1 text-[8px] text-primary">
                        ({hotspots.filter(h => h.source_design_id === screen.id).length} links)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto" style={{
          backgroundImage: "radial-gradient(circle, hsl(228, 10%, 14%) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}>
          {screens.length === 0 ? (
            <div className="text-center">
              <Maximize2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma tela salva no canvas</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Crie e salve telas no Design Canvas primeiro</p>
            </div>
          ) : currentScreen ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentScreenId}-${transitionKey}`}
                initial={trans.initial as TargetAndTransition}
                animate={trans.animate as TargetAndTransition}
                exit={trans.exit as TargetAndTransition}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="relative"
                style={{ boxShadow: "0 20px 60px hsl(0 0% 0% / 0.5)" }}
              >
                <svg
                  width={currentScreen.canvas_width || 375}
                  height={currentScreen.canvas_height || 812}
                  viewBox={`0 0 ${currentScreen.canvas_width || 375} ${currentScreen.canvas_height || 812}`}
                  className="rounded-xl"
                  style={{ background: "hsl(228, 14%, 10%)", maxHeight: "calc(100vh - 120px)" }}
                >
                  {currentScreen.elements.map((el: Record<string, unknown>, i: number) => (
                    <g key={i}>
                      {el.type === "rect" && <rect x={el.x as number} y={el.y as number} width={el.width as number} height={el.height as number} fill={el.fill as string} rx={4} stroke={el.stroke as string} strokeWidth={el.strokeWidth as number} />}
                      {el.type === "circle" && <ellipse cx={(el.x as number) + (el.width as number) / 2} cy={(el.y as number) + (el.height as number) / 2} rx={(el.width as number) / 2} ry={(el.height as number) / 2} fill={el.fill as string} />}
                      {el.type === "text" && <text x={el.x as number} y={(el.y as number) + ((el.fontSize as number) || 16)} fill={el.fill as string} fontSize={(el.fontSize as number) || 16} fontFamily="Inter, sans-serif" fontWeight={500}>{(el.text as string)}</text>}
                      {el.type === "line" && <line x1={el.x as number} y1={el.y as number} x2={(el.x as number) + (el.width as number)} y2={(el.y as number) + (el.height as number)} stroke={el.fill as string} strokeWidth={3} strokeLinecap="round" />}
                    </g>
                  ))}
                </svg>

                {/* Hotspot overlays */}
                {showHotspots && currentHotspots.map((hotspot) => {
                  const targetScreen = screens.find(s => s.id === hotspot.target_design_id);
                  return (
                    <button
                      key={hotspot.id}
                      onClick={() => navigateTo(hotspot.target_design_id, hotspot.transition)}
                      className="absolute border-2 border-primary/50 bg-primary/10 hover:bg-primary/25 rounded-md transition-colors group"
                      style={{
                        left: `${hotspot.x}px`,
                        top: `${hotspot.y}px`,
                        width: `${hotspot.width}px`,
                        height: `${hotspot.height}px`,
                      }}
                      title={`→ ${targetScreen?.name || "Tela desconhecida"}`}
                    >
                      <span className="absolute -top-5 left-0 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        → {targetScreen?.name || hotspot.label}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>

      {/* Navigation dots */}
      {screens.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 bg-card border-t border-border">
          {screens.map((screen, i) => (
            <button
              key={screen.id}
              onClick={() => navigateTo(screen.id)}
              className={`w-2 h-2 rounded-full transition-all ${
                screen.id === currentScreenId ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              title={screen.name}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Hotspot Editor for DesignCanvas integration
export function HotspotEditor({
  designId,
  designs,
  canvasWidth,
  canvasHeight,
  zoom,
  panX,
  panY,
}: {
  designId: string;
  designs: { id: string; name: string }[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
}) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [adding, setAdding] = useState(false);
  const [newHotspot, setNewHotspot] = useState({ x: 50, y: 50, width: 100, height: 60, target_design_id: "", transition: "fade", label: "" });

  const loadHotspots = useCallback(async () => {
    const { data } = await supabase
      .from("prototype_hotspots")
      .select("*")
      .eq("source_design_id", designId);
    if (data) setHotspots(data as Hotspot[]);
  }, [designId]);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  const addHotspot = async () => {
    if (!newHotspot.target_design_id) { toast.error("Selecione uma tela de destino"); return; }
    const { error } = await supabase.from("prototype_hotspots").insert([{
      source_design_id: designId,
      target_design_id: newHotspot.target_design_id,
      x: newHotspot.x,
      y: newHotspot.y,
      width: newHotspot.width,
      height: newHotspot.height,
      transition: newHotspot.transition,
      label: newHotspot.label,
    }]);
    if (error) { toast.error("Erro ao criar hotspot"); return; }
    toast.success("Hotspot criado!");
    setAdding(false);
    setNewHotspot({ x: 50, y: 50, width: 100, height: 60, target_design_id: "", transition: "fade", label: "" });
    loadHotspots();
  };

  const deleteHotspot = async (id: string) => {
    await supabase.from("prototype_hotspots").delete().eq("id", id);
    loadHotspots();
    toast.success("Hotspot removido");
  };

  const otherDesigns = designs.filter(d => d.id !== designId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MousePointer2 className="w-3.5 h-3.5 text-primary" />
          Hotspots ({hotspots.length})
        </h4>
        <button
          onClick={() => setAdding(!adding)}
          className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          {adding ? "Cancelar" : "+ Adicionar"}
        </button>
      </div>

      {adding && (
        <div className="space-y-2 p-2 rounded-lg bg-secondary/50 border border-border">
          <select
            value={newHotspot.target_design_id}
            onChange={(e) => setNewHotspot(prev => ({ ...prev, target_design_id: e.target.value }))}
            className="w-full bg-background rounded px-2 py-1 text-[10px] text-foreground outline-none border border-border"
          >
            <option value="">Selecione a tela destino...</option>
            {otherDesigns.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1">
            <input type="number" value={newHotspot.x} onChange={e => setNewHotspot(p => ({ ...p, x: +e.target.value }))} placeholder="X" className="bg-background rounded px-2 py-1 text-[10px] text-foreground outline-none border border-border" />
            <input type="number" value={newHotspot.y} onChange={e => setNewHotspot(p => ({ ...p, y: +e.target.value }))} placeholder="Y" className="bg-background rounded px-2 py-1 text-[10px] text-foreground outline-none border border-border" />
            <input type="number" value={newHotspot.width} onChange={e => setNewHotspot(p => ({ ...p, width: +e.target.value }))} placeholder="Width" className="bg-background rounded px-2 py-1 text-[10px] text-foreground outline-none border border-border" />
            <input type="number" value={newHotspot.height} onChange={e => setNewHotspot(p => ({ ...p, height: +e.target.value }))} placeholder="Height" className="bg-background rounded px-2 py-1 text-[10px] text-foreground outline-none border border-border" />
          </div>
          <select
            value={newHotspot.transition}
            onChange={(e) => setNewHotspot(prev => ({ ...prev, transition: e.target.value }))}
            className="w-full bg-background rounded px-2 py-1 text-[10px] text-foreground outline-none border border-border"
          >
            <option value="fade">Fade</option>
            <option value="slide-left">Slide Left</option>
            <option value="slide-right">Slide Right</option>
            <option value="slide-up">Slide Up</option>
            <option value="scale">Scale</option>
          </select>
          <button onClick={addHotspot} className="w-full py-1.5 rounded gradient-primary text-primary-foreground text-[10px] font-medium hover:opacity-90 transition-opacity">
            Criar Hotspot
          </button>
        </div>
      )}

      {hotspots.map((h) => {
        const target = designs.find(d => d.id === h.target_design_id);
        return (
          <div key={h.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 text-[10px]">
            <div>
              <span className="text-foreground font-medium">→ {target?.name || "?"}</span>
              <span className="text-muted-foreground ml-1">({h.transition})</span>
            </div>
            <button onClick={() => deleteHotspot(h.id)} className="text-destructive hover:text-destructive/80 text-[9px]">×</button>
          </div>
        );
      })}

      {hotspots.length === 0 && !adding && (
        <p className="text-[9px] text-muted-foreground text-center py-2">Sem hotspots nesta tela</p>
      )}
    </div>
  );
}
