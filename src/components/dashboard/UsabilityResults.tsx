import { motion } from "framer-motion";
import { Users, Target, MessageSquare, Trash2, TrendingUp } from "lucide-react";
import { UsabilityTest } from "@/hooks/useUsabilityTest";

interface UsabilityResultsProps {
  tests: UsabilityTest[];
  onDelete?: (id: string) => void;
}

export function UsabilityResults({ tests, onDelete }: UsabilityResultsProps) {
  return (
    <div className="space-y-4">
      {tests.map((test, index) => (
        <motion.div
          key={test.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card p-5 relative group border border-white/5"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {test.task_description}
              </h3>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Taxa de Sucesso: {test.success_rate_percentage}%
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  ID: {test.id.slice(0, 8)}
                </span>
              </div>
            </div>

            <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4 border-l border-white/5 pl-0 md:pl-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-primary/60 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Feedback do Usuário
                </span>
                <p className="text-xs text-foreground/80 italic leading-relaxed">
                  "{test.user_feedback}"
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-500/60 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Observações Chave
                </span>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {test.key_observations}
                </p>
              </div>
            </div>

            {onDelete && (
              <button
                onClick={() => onDelete(test.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
