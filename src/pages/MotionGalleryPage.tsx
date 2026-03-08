import { useState } from "react";
import { Play, Copy, Check, Zap } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MotionItem {
  name: string;
  category: "entrance" | "exit" | "micro" | "transition" | "loading";
  description: string;
  framerCode: string;
  cssCode: string;
  framerProps: Record<string, any>;
}

const MOTION_LIBRARY: MotionItem[] = [
  {
    name: "Fade In Up",
    category: "entrance",
    description: "Entrada suave de baixo para cima",
    framerCode: `<motion.div\n  initial={{ opacity: 0, y: 20 }}\n  animate={{ opacity: 1, y: 0 }}\n  transition={{ duration: 0.4, ease: "easeOut" }}\n/>`,
    cssCode: `@keyframes fadeInUp {\n  from { opacity: 0; transform: translateY(20px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n.fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }`,
    framerProps: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" } },
  },
  {
    name: "Scale In",
    category: "entrance",
    description: "Entrada com escala crescente",
    framerCode: `<motion.div\n  initial={{ opacity: 0, scale: 0.9 }}\n  animate={{ opacity: 1, scale: 1 }}\n  transition={{ duration: 0.3, ease: "easeOut" }}\n/>`,
    cssCode: `@keyframes scaleIn {\n  from { opacity: 0; transform: scale(0.9); }\n  to { opacity: 1; transform: scale(1); }\n}\n.scale-in { animation: scaleIn 0.3s ease-out forwards; }`,
    framerProps: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3, ease: "easeOut" } },
  },
  {
    name: "Slide In Left",
    category: "entrance",
    description: "Desliza da esquerda",
    framerCode: `<motion.div\n  initial={{ opacity: 0, x: -40 }}\n  animate={{ opacity: 1, x: 0 }}\n  transition={{ duration: 0.4, type: "spring", stiffness: 100 }}\n/>`,
    cssCode: `@keyframes slideInLeft {\n  from { opacity: 0; transform: translateX(-40px); }\n  to { opacity: 1; transform: translateX(0); }\n}\n.slide-in-left { animation: slideInLeft 0.4s ease-out forwards; }`,
    framerProps: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.4, type: "spring", stiffness: 100 } },
  },
  {
    name: "Fade Out Down",
    category: "exit",
    description: "Saída suave para baixo",
    framerCode: `<motion.div\n  exit={{ opacity: 0, y: 20 }}\n  transition={{ duration: 0.3 }}\n/>`,
    cssCode: `@keyframes fadeOutDown {\n  from { opacity: 1; transform: translateY(0); }\n  to { opacity: 0; transform: translateY(20px); }\n}\n.fade-out-down { animation: fadeOutDown 0.3s ease-in forwards; }`,
    framerProps: { initial: { opacity: 1, y: 0 }, animate: { opacity: 0, y: 20 }, transition: { duration: 0.3 } },
  },
  {
    name: "Scale Out",
    category: "exit",
    description: "Saída com escala decrescente",
    framerCode: `<motion.div\n  exit={{ opacity: 0, scale: 0.9 }}\n  transition={{ duration: 0.2 }}\n/>`,
    cssCode: `@keyframes scaleOut {\n  from { opacity: 1; transform: scale(1); }\n  to { opacity: 0; transform: scale(0.9); }\n}\n.scale-out { animation: scaleOut 0.2s ease-in forwards; }`,
    framerProps: { initial: { opacity: 1, scale: 1 }, animate: { opacity: 0, scale: 0.9 }, transition: { duration: 0.2 } },
  },
  {
    name: "Hover Lift",
    category: "micro",
    description: "Elevação sutil no hover",
    framerCode: `<motion.div\n  whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}\n  transition={{ duration: 0.2 }}\n/>`,
    cssCode: `.hover-lift {\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n.hover-lift:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);\n}`,
    framerProps: { whileHover: { y: -4 }, transition: { duration: 0.2 } },
  },
  {
    name: "Press Scale",
    category: "micro",
    description: "Feedback de pressão (tap/click)",
    framerCode: `<motion.button\n  whileTap={{ scale: 0.95 }}\n  transition={{ duration: 0.1 }}\n/>`,
    cssCode: `.press-scale:active {\n  transform: scale(0.95);\n  transition: transform 0.1s ease;\n}`,
    framerProps: { whileTap: { scale: 0.95 }, transition: { duration: 0.1 } },
  },
  {
    name: "Pulse Glow",
    category: "micro",
    description: "Pulsação suave para chamar atenção",
    framerCode: `<motion.div\n  animate={{ boxShadow: ["0 0 0 0 rgba(99,102,241,0.4)", "0 0 0 12px rgba(99,102,241,0)", "0 0 0 0 rgba(99,102,241,0)"] }}\n  transition={{ duration: 2, repeat: Infinity }}\n/>`,
    cssCode: `@keyframes pulseGlow {\n  0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }\n  50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }\n  100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }\n}\n.pulse-glow { animation: pulseGlow 2s infinite; }`,
    framerProps: { animate: { opacity: [1, 0.7, 1] }, transition: { duration: 2, repeat: Infinity } },
  },
  {
    name: "Page Slide",
    category: "transition",
    description: "Transição de página com slide lateral",
    framerCode: `<motion.div\n  initial={{ x: "100%", opacity: 0 }}\n  animate={{ x: 0, opacity: 1 }}\n  exit={{ x: "-100%", opacity: 0 }}\n  transition={{ type: "spring", stiffness: 300, damping: 30 }}\n/>`,
    cssCode: `@keyframes pageSlideIn {\n  from { transform: translateX(100%); opacity: 0; }\n  to { transform: translateX(0); opacity: 1; }\n}\n.page-slide-in { animation: pageSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards; }`,
    framerProps: { initial: { x: 60, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: "spring", stiffness: 300, damping: 30 } },
  },
  {
    name: "Skeleton Shimmer",
    category: "loading",
    description: "Efeito shimmer para loading states",
    framerCode: `<motion.div\n  className="bg-secondary rounded"\n  animate={{ opacity: [0.5, 1, 0.5] }}\n  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}\n/>`,
    cssCode: `@keyframes shimmer {\n  0% { background-position: -200% 0; }\n  100% { background-position: 200% 0; }\n}\n.skeleton-shimmer {\n  background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%);\n  background-size: 200% 100%;\n  animation: shimmer 1.5s infinite;\n}`,
    framerProps: { animate: { opacity: [0.5, 1, 0.5] }, transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
  },
  {
    name: "Spinner Rotate",
    category: "loading",
    description: "Rotação contínua para loaders",
    framerCode: `<motion.div\n  animate={{ rotate: 360 }}\n  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}\n/>`,
    cssCode: `@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n.spinner { animation: spin 1s linear infinite; }`,
    framerProps: { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: "linear" } },
  },
  {
    name: "Stagger Children",
    category: "entrance",
    description: "Filhos aparecem em sequência",
    framerCode: `// Parent\n<motion.div\n  variants={{ show: { transition: { staggerChildren: 0.08 } } }}\n  initial="hidden"\n  animate="show"\n>\n  {/* Children */}\n  <motion.div\n    variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}\n  />\n</motion.div>`,
    cssCode: `.stagger-child:nth-child(1) { animation-delay: 0s; }\n.stagger-child:nth-child(2) { animation-delay: 0.08s; }\n.stagger-child:nth-child(3) { animation-delay: 0.16s; }\n.stagger-child:nth-child(4) { animation-delay: 0.24s; }\n.stagger-child { animation: fadeInUp 0.3s ease-out both; }`,
    framerProps: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } },
  },
];

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "entrance", label: "Entrada" },
  { id: "exit", label: "Saída" },
  { id: "micro", label: "Micro-interações" },
  { id: "transition", label: "Transições" },
  { id: "loading", label: "Loading" },
];

export function MotionGalleryPage() {
  const [filter, setFilter] = useState("all");
  const [codeView, setCodeView] = useState<Record<string, "framer" | "css">>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState<Record<string, number>>({});

  const filtered = filter === "all" ? MOTION_LIBRARY : MOTION_LIBRARY.filter((m) => m.category === filter);

  const copyCode = (name: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(name);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(null), 1500);
  };

  const replay = (name: string) => {
    setPlayKey((prev) => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };

  return (
    <ModulePage title="Galeria de Motion" subtitle="Animações prontas com código copiável (Framer Motion & CSS)" icon={<Zap className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const view = codeView[item.name] || "framer";
            const code = view === "framer" ? item.framerCode : item.cssCode;
            const key = playKey[item.name] || 0;
            return (
              <div key={item.name} className="glass-card overflow-hidden">
                {/* Preview */}
                <div className="h-32 bg-secondary/20 flex items-center justify-center relative">
                  <motion.div
                    key={key}
                    {...item.framerProps}
                    className="w-16 h-16 rounded-lg bg-primary/80"
                  />
                  <button
                    onClick={() => replay(item.name)}
                    className="absolute top-2 right-2 p-1 rounded bg-background/60 hover:bg-background/80 transition-colors"
                    title="Replay"
                  >
                    <Play className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-foreground">{item.name}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{item.category}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">{item.description}</p>

                  {/* Code Toggle */}
                  <div className="flex gap-1 mb-2">
                    <button
                      onClick={() => setCodeView((p) => ({ ...p, [item.name]: "framer" }))}
                      className={`text-[9px] px-2 py-0.5 rounded ${view === "framer" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      Framer Motion
                    </button>
                    <button
                      onClick={() => setCodeView((p) => ({ ...p, [item.name]: "css" }))}
                      className={`text-[9px] px-2 py-0.5 rounded ${view === "css" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      CSS
                    </button>
                  </div>

                  {/* Code Block */}
                  <div className="relative">
                    <pre className="text-[10px] bg-background/80 rounded p-2.5 overflow-x-auto font-mono text-muted-foreground max-h-32 leading-relaxed">
                      {code}
                    </pre>
                    <button
                      onClick={() => copyCode(item.name, code)}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-secondary/80 hover:bg-secondary transition-colors"
                    >
                      {copied === item.name ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModulePage>
  );
}
