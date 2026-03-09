import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Bookmark, Wrench, Trash2 } from "lucide-react";
import { WCAGAudit } from "@/hooks/useWCAG";

interface WCAGAuditListProps {
  audits: WCAGAudit[];
  onDelete?: (id: string) => void;
}

const getStatusConfig = (status: WCAGAudit["compliance_status"]) => {
  switch (status) {
    case "Pass": return { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: "Aprovado", color: "text-emerald-500 bg-emerald-500/10" };
    case "Fail": return { icon: <XCircle className="w-4 h-4 text-red-500" />, label: "Falhou", color: "text-red-500 bg-red-500/10" };
    default: return { icon: <AlertCircle className="w-4 h-4 text-yellow-500" />, label: "Aviso", color: "text-yellow-500 bg-yellow-500/10" };
  }
};

export function WCAGAuditList({ audits, onDelete }: WCAGAuditListProps) {
  return (
    <div className="space-y-3">
      {audits.map((audit, index) => {
        const config = getStatusConfig(audit.compliance_status);
        return (
          <motion.div
            key={audit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="glass-card p-4 border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {config.icon}
              </div>
              
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Bookmark className="w-3 h-3" /> Referência WCAG
                  </h4>
                  <p className="text-xs font-bold text-foreground">{audit.guideline_reference}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Descrição do Problema</h4>
                    <p className="text-xs text-foreground/80 leading-relaxed">{audit.issue_description || "Nenhum problema relatado."}</p>
                  </div>

                  {audit.fix_suggestion && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="text-[10px] font-bold uppercase text-primary/70 mb-1 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3" /> Sugestão de Correção
                      </h4>
                      <p className="text-xs text-foreground/90 font-medium">{audit.fix_suggestion}</p>
                    </div>
                  )}
                </div>
              </div>

              {onDelete && (
                <button
                  onClick={() => onDelete(audit.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
