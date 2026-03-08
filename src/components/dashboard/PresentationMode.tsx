import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectId } from "@/lib/api";

interface CanvasElement {
  id: string;
  type: string;
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
  visible?: boolean;
}

interface Design {
  id: string;
  name: string;
  elements: CanvasElement[];
  canvas_width: number;
  canvas_height: number;
}

export function PresentationMode({ onClose }: { onClose: () => void }) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("canvas_designs")
        .select("*")
        .eq("project_id", PROJECT_ID)
        .order("updated_at", { ascending: true });
      if (data) {
        setDesigns(data.map((d: any) => ({
          ...d,
          elements: (d.elements as CanvasElement[]) ?? [],
        })));
      }
    })();
  }, []);

  const goNext = useCallback(() => setCurrentIndex((i) => Math.min(i + 1, designs.length - 1)), [designs.length]);
  const goPrev = useCallback(() => setCurrentIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  const design = designs[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-sm z-10">
        <span className="text-xs text-muted-foreground">
          {design ? design.name : "Carregando..."} — {currentIndex + 1} / {designs.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">← → para navegar · ESC para sair</span>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      {design ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={design.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <svg
              width={design.canvas_width}
              height={design.canvas_height}
              viewBox={`0 0 ${design.canvas_width} ${design.canvas_height}`}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                background: "hsl(228, 14%, 10%)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px hsl(0 0% 0% / 0.5)",
              }}
            >
              {design.elements.filter((el) => el.visible !== false).map((el) => (
                <g key={el.id}>
                  {el.type === "rect" && <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={4} stroke={el.stroke} strokeWidth={el.strokeWidth} />}
                  {el.type === "circle" && <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} />}
                  {el.type === "text" && <text x={el.x} y={el.y + (el.fontSize || 16)} fill={el.fill} fontSize={el.fontSize || 16} fontFamily="Inter, sans-serif" fontWeight={500}>{el.text}</text>}
                  {el.type === "line" && <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y + el.height} stroke={el.fill} strokeWidth={3} strokeLinecap="round" />}
                </g>
              ))}
            </svg>
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum design salvo para apresentar.</p>
      )}

      {/* Navigation */}
      {designs.length > 1 && (
        <div className="absolute bottom-6 flex items-center gap-4">
          <button onClick={goPrev} disabled={currentIndex === 0} className="p-2 rounded-full bg-secondary hover:bg-accent disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-1.5">
            {designs.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30"}`} />
            ))}
          </div>
          <button onClick={goNext} disabled={currentIndex === designs.length - 1} className="p-2 rounded-full bg-secondary hover:bg-accent disabled:opacity-30 transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function PresentationButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} title="Modo Apresentação" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
      <Maximize2 className="w-4 h-4" />
    </button>
  );
}
