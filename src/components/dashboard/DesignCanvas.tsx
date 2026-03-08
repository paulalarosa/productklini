import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Square, Circle, Type, MousePointer, Trash2, Move, Minus } from "lucide-react";

type ElementType = "rect" | "circle" | "text" | "line";

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  text?: string;
  rotation: number;
}

const TOOLS = [
  { type: "select" as const, icon: MousePointer, label: "Selecionar" },
  { type: "rect" as const, icon: Square, label: "Retângulo" },
  { type: "circle" as const, icon: Circle, label: "Círculo" },
  { type: "text" as const, icon: Type, label: "Texto" },
  { type: "line" as const, icon: Minus, label: "Linha" },
];

const PALETTE = [
  "hsl(214, 90%, 60%)", "hsl(270, 70%, 60%)", "hsl(160, 70%, 50%)",
  "hsl(40, 90%, 60%)", "hsl(0, 72%, 55%)", "hsl(228, 12%, 30%)",
  "hsl(0, 0%, 100%)", "hsl(0, 0%, 50%)",
];

export function DesignCanvas() {
  const [elements, setElements] = useState<CanvasElement[]>([
    { id: "1", type: "rect", x: 60, y: 60, width: 200, height: 120, fill: "hsl(214, 90%, 60%)", rotation: 0 },
    { id: "2", type: "circle", x: 350, y: 100, width: 80, height: 80, fill: "hsl(270, 70%, 60%)", rotation: 0 },
    { id: "3", type: "text", x: 100, y: 250, width: 200, height: 40, fill: "hsl(0, 0%, 100%)", text: "Título da Tela", rotation: 0 },
  ]);
  const [selectedTool, setSelectedTool] = useState<"select" | ElementType>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (selectedTool === "select") {
      setSelectedId(null);
      return;
    }
    const pt = getCanvasPoint(e);
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type: selectedTool,
      x: pt.x - 40,
      y: pt.y - 25,
      width: selectedTool === "circle" ? 60 : selectedTool === "line" ? 150 : 120,
      height: selectedTool === "circle" ? 60 : selectedTool === "line" ? 4 : 70,
      fill: selectedColor,
      text: selectedTool === "text" ? "Texto" : undefined,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setSelectedTool("select");
  }, [selectedTool, selectedColor, getCanvasPoint]);

  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedTool !== "select") return;
    setSelectedId(id);
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const pt = getCanvasPoint(e);
    setDragging({ id, offsetX: pt.x - el.x, offsetY: pt.y - el.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pt = getCanvasPoint(e);
    setElements((prev) =>
      prev.map((el) =>
        el.id === dragging.id ? { ...el, x: pt.x - dragging.offsetX, y: pt.y - dragging.offsetY } : el
      )
    );
  }, [dragging, getCanvasPoint]);

  const handleMouseUp = () => setDragging(null);

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelected = (updates: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...updates } : e)));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "INPUT") return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const selectedEl = elements.find((e) => e.id === selectedId);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setSelectedTool(tool.type)}
              title={tool.label}
              className={`p-2 rounded-md transition-colors ${
                selectedTool === tool.type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                if (selectedId) updateSelected({ fill: color });
              }}
              className={`w-6 h-6 rounded-md border-2 transition-all ${
                selectedColor === color ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {selectedId && (
          <button onClick={deleteSelected} className="p-2 rounded-md bg-destructive/10 text-status-urgent hover:bg-destructive/20 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {selectedEl && (
          <div className="flex items-center gap-2 ml-auto text-[10px] text-muted-foreground">
            <span>W:</span>
            <input type="number" value={Math.round(selectedEl.width)} onChange={(e) => updateSelected({ width: Number(e.target.value) })} className="w-12 bg-secondary rounded px-1 py-0.5 text-foreground outline-none" />
            <span>H:</span>
            <input type="number" value={Math.round(selectedEl.height)} onChange={(e) => updateSelected({ height: Number(e.target.value) })} className="w-12 bg-secondary rounded px-1 py-0.5 text-foreground outline-none" />
            {selectedEl.type === "text" && (
              <input value={selectedEl.text ?? ""} onChange={(e) => updateSelected({ text: e.target.value })} className="w-32 bg-secondary rounded px-2 py-0.5 text-foreground outline-none" placeholder="Texto" />
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 glass-card overflow-hidden rounded-lg" style={{ minHeight: 400 }}>
        <svg
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: selectedTool !== "select" ? "crosshair" : dragging ? "grabbing" : "default", background: "hsl(228, 14%, 10%)" }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(228, 10%, 14%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {elements.map((el) => {
            const isSelected = el.id === selectedId;
            return (
              <g key={el.id} onMouseDown={(e) => handleElementMouseDown(e, el.id)} style={{ cursor: selectedTool === "select" ? "move" : "default" }}>
                {el.type === "rect" && (
                  <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} rx={4} opacity={0.9} />
                )}
                {el.type === "circle" && (
                  <ellipse cx={el.x + el.width / 2} cy={el.y + el.height / 2} rx={el.width / 2} ry={el.height / 2} fill={el.fill} opacity={0.9} />
                )}
                {el.type === "text" && (
                  <text x={el.x} y={el.y + 20} fill={el.fill} fontSize={18} fontFamily="Inter, sans-serif" fontWeight={600}>
                    {el.text}
                  </text>
                )}
                {el.type === "line" && (
                  <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y} stroke={el.fill} strokeWidth={el.height} strokeLinecap="round" />
                )}
                {isSelected && (
                  <rect
                    x={el.x - 2} y={el.y - 2} width={el.width + 4} height={el.height + 4}
                    fill="none" stroke="hsl(252, 80%, 65%)" strokeWidth={1.5} strokeDasharray="4 2" rx={4}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
