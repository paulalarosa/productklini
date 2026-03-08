import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { projectName, projectProgress, teamMembers } from "@/data/mockData";

export function DashboardHeader({ onToggleAI }: { onToggleAI: () => void }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">{projectName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-40 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${projectProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{projectProgress}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Team avatars */}
        <div className="flex -space-x-2">
          {teamMembers.slice(0, 4).map(member => (
            <div
              key={member.name}
              title={member.name}
              className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-semibold text-secondary-foreground"
            >
              {member.avatar}
            </div>
          ))}
          {teamMembers.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
              +{teamMembers.length - 4}
            </div>
          )}
        </div>

        {/* AI Toggle */}
        <button
          onClick={onToggleAI}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Bot className="w-3.5 h-3.5" />
          Mentor IA
        </button>
      </div>
    </header>
  );
}
