import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useProject, useTeamMembers } from "@/hooks/useProjectData";

export function DashboardHeader({ onToggleAI }: { onToggleAI: () => void }) {
  const { data: project } = useProject();
  const { data: teamMembers } = useTeamMembers();

  const name = project?.name ?? "Carregando...";
  const progress = project?.progress ?? 0;
  const members = teamMembers ?? [];

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-5 ml-10 md:ml-0">
        <div>
          <h1 className="text-sm md:text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-none">{name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-24 md:w-40 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Team avatars - hidden on mobile */}
        <div className="hidden sm:flex -space-x-2">
          {members.slice(0, 4).map((member) => (
            <div
              key={member.id}
              title={member.name}
              className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-semibold text-secondary-foreground"
            >
              {member.avatar}
            </div>
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
              +{members.length - 4}
            </div>
          )}
        </div>

        <button
          onClick={onToggleAI}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mentor IA</span>
        </button>
      </div>
    </header>
  );
}
