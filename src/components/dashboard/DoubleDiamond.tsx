import { motion } from "framer-motion";
import { useProject } from "@/hooks/useProjectData";

type Phase = "discovery" | "define" | "develop" | "deliver";

const phases: { key: Phase; label: string; sublabel: string }[] = [
  { key: "discovery", label: "Descobrir", sublabel: "Pesquisa" },
  { key: "define", label: "Definir", sublabel: "Síntese" },
  { key: "develop", label: "Desenvolver", sublabel: "Ideação" },
  { key: "deliver", label: "Entregar", sublabel: "Implementar" },
];

const phaseColorClasses: Record<Phase, string> = {
  discovery: "bg-status-discovery",
  define: "bg-status-define",
  develop: "bg-status-develop",
  deliver: "bg-status-deliver",
};

const phaseTextClasses: Record<Phase, string> = {
  discovery: "status-discovery",
  define: "status-define",
  develop: "status-develop",
  deliver: "status-deliver",
};

export function DoubleDiamond() {
  const { data: project } = useProject();

  const currentPhase = (project?.current_phase ?? "discovery") as Phase;
  const pp = (project?.phase_progress ?? { discovery: 0, define: 0, develop: 0, deliver: 0 }) as Record<Phase, number>;

  return (
    <div className="glass-card p-4 md:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 md:mb-5">
        Trilha Double Diamond
      </h3>
      <div className="grid grid-cols-2 md:flex md:items-center gap-3">
        {phases.map((phase, i) => {
          const progress = pp[phase.key] ?? 0;
          const isCurrent = phase.key === currentPhase;
          return (
            <motion.div
              key={phase.key}
              className="flex-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs md:text-sm font-medium ${isCurrent ? phaseTextClasses[phase.key] : "text-muted-foreground"}`}>
                  {phase.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${phaseColorClasses[phase.key]} ${isCurrent ? "animate-pulse-glow" : ""}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">{phase.sublabel}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
