import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";
import { NielsenHeuristic } from "@/hooks/useNielsen";

interface HeuristicsListProps {
  heuristics: NielsenHeuristic[];
  onDelete?: (id: string) => void;
}

const getSeverityColor = (level: number) => {
  switch (level) {
    case 5: return "text-red-500 bg-red-500/10 border-red-500/20";
    case 4: return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case 3: return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case 2: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    default: return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  }
};

export function HeuristicsList({ heuristics, onDelete }: HeuristicsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {heuristics.map((h, index) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-5 relative group border border-white/5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityColor(h.severity_level)}`}>
              Nível {h.severity_level}
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(h.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
             <AlertTriangle className={`w-4 h-4 ${h.severity_level >= 4 ? "text-red-500" : "text-primary"}`} />
             {h.heuristic_name}
          </h3>

          <p className="text-xs text-foreground/70 leading-relaxed mb-4">
            {h.evaluation_notes}
          </p>

          {h.recommendation && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <span className="text-[10px] font-bold uppercase text-primary/60 tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Recomendação
              </span>
              <p className="text-xs text-foreground/90 font-medium italic">
                "{h.recommendation}"
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
