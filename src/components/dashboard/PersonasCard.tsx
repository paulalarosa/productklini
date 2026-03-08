import { motion } from "framer-motion";
import { User } from "lucide-react";
import { usePersonas } from "@/hooks/useProjectData";

export function PersonasCard() {
  const { data: personas } = usePersonas();

  return (
    <div className="glass-card p-4 md:p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Personas
      </h3>
      <div className="space-y-3">
        {(personas ?? []).map((p, i) => (
          <motion.div
            key={p.id}
            className="p-3 rounded-lg bg-secondary/50 hover:bg-accent/50 transition-colors cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {p.goals.map((g) => (
                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-develop/10 text-status-develop">
                  {g}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
