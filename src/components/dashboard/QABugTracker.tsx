import { motion } from "framer-motion";
import { Bug, AlertCircle, CheckCircle2, PlayCircle, Trash2, MoreVertical } from "lucide-react";
import { QABug } from "@/hooks/useQABugs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface QABugTrackerProps {
  bugs: QABug[];
  onUpdateStatus?: (id: string, status: QABug["status"]) => void;
  onDelete?: (id: string) => void;
}

const getSeverityColor = (severity: QABug["severity"]) => {
  switch (severity) {
    case "Crítica": return "text-red-500 bg-red-500/10";
    case "Alta": return "text-orange-500 bg-orange-500/10";
    case "Média": return "text-yellow-500 bg-yellow-500/10";
    default: return "text-blue-500 bg-blue-500/10";
  }
};

const getStatusIcon = (status: QABug["status"]) => {
  switch (status) {
    case "Resolvido": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "Em Análise": return <PlayCircle className="w-4 h-4 text-primary animate-pulse" />;
    default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

export function QABugTracker({ bugs, onUpdateStatus, onDelete }: QABugTrackerProps) {
  return (
    <div className="space-y-3">
      {bugs.map((bug, index) => (
        <motion.div
           key={bug.id}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: index * 0.03 }}
           className="glass-card p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-all group"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className={`p-2 rounded-lg ${getSeverityColor(bug.severity)}`}>
              <Bug className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">{bug.bug_title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityColor(bug.severity)}`}>
                  {bug.severity}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl line-clamp-1">
                <span className="font-bold text-muted-foreground/60 uppercase text-[9px] mr-1">Passos:</span>
                {bug.steps_to_reproduce || "Sem passos descritos."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(bug.status)}
                <span className="text-[11px] font-bold text-foreground">{bug.status}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10">
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(bug.id, "Aberto")} className="text-xs">Mover para Aberto</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(bug.id, "Em Análise")} className="text-xs">Mover para Em Análise</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(bug.id, "Resolvido")} className="text-xs">Mover para Resolvido</DropdownMenuItem>
                  <div className="h-px bg-white/5 my-1" />
                  <DropdownMenuItem onClick={() => onDelete?.(bug.id)} className="text-xs text-red-500 focus:text-red-500">
                    <Trash2 className="w-3 h-3 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
