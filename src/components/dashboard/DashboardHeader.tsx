import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LogOut, User, ChevronDown, X } from "lucide-react";
import { useProject, useTeamMembers } from "@/hooks/useProjectData";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProjectSelector } from "./ProjectSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  onToggleAI: () => void;
  onCreateProject: () => void;
  aiOpen?: boolean; // estado do painel — para feedback visual no botão
}

// ─── Avatar do usuário com iniciais ──────────────────────────────────────────
function getUserInitials(email?: string, fullName?: string): string {
  if (fullName) {
    const parts = fullName.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? "??";
}

// ─── Menu de perfil do usuário ────────────────────────────────────────────────
function UserMenu({ user, signOut }: { user: ReturnType<typeof useAuth>["user"]; signOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email    = user?.email;
  const initials = getUserInitials(email, fullName);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-accent transition-colors shrink-0"
        aria-label="Menu do usuário"
      >
        {/* Avatar com iniciais */}
        <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary select-none">
          {initials}
        </div>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-150 hidden sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border border-border bg-popover shadow-md z-50 overflow-hidden"
          >
            {/* Info do usuário */}
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-xs font-medium text-foreground truncate">
                {fullName ?? "Usuário"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {email}
              </p>
            </div>

            {/* Ações */}
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Meu perfil
              </button>
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Barra de progresso com tooltip da fase ───────────────────────────────────
function ProjectProgress({ progress, phase }: { progress: number; phase?: string }) {
  const phaseLabel: Record<string, string> = {
    discovery: "Fase: Discovery",
    define:    "Fase: Define",
    develop:   "Fase: Develop",
    deliver:   "Fase: Deliver",
  };

  const label = (phase && phaseLabel[phase]) ?? `${progress}% concluído`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 mt-0.5 cursor-default">
          <div className="w-16 md:w-40 h-1.5 rounded-full bg-secondary overflow-hidden shrink-0">
            {/* CSS transition — sem Framer Motion */}
            <div
              className="h-full rounded-full gradient-primary progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
            {progress}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// motion ainda usado apenas no UserMenu (AnimatePresence + exit)
// Se não houver mais uso direto de motion.div aqui, pode remover `motion` do import
export function DashboardHeader({
  onToggleAI,
  onCreateProject,
  aiOpen = false,
}: DashboardHeaderProps) {
  const { data: project }     = useProject();
  const { data: teamMembers } = useTeamMembers();
  const { user, signOut }     = useAuth();

  const progress = project?.progress ?? 0;
  const phase    = project?.current_phase;
  const members  = teamMembers ?? [];

  return (
    <header className="flex items-center justify-between px-3 md:px-6 py-2.5 md:py-4 border-b border-border shrink-0 gap-2 min-w-0">

      {/* Lado esquerdo — projeto e progresso */}
      <div className="flex items-center gap-3 ml-10 md:ml-0 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <ProjectSelector
            currentProject={project ?? null}
            onCreateNew={onCreateProject}
          />
          <ProjectProgress progress={progress} phase={phase} />
        </div>
      </div>

      {/* Lado direito — ações */}
      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">

        {/* Avatares do time — só desktop */}
        <div className="hidden md:flex -space-x-2">
          {members.slice(0, 4).map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <div
                  className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-semibold text-secondary-foreground cursor-default select-none"
                >
                  {member.avatar}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {member.name} — {member.role}
              </TooltipContent>
            </Tooltip>
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground select-none">
              +{members.length - 4}
            </div>
          )}
        </div>

        <NotificationsPanel />

        {/* Botão AI — estado visual quando o painel está aberto */}
        <button
          onClick={onToggleAI}
          className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
            aiOpen
              ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20"
              : "gradient-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {aiOpen ? (
            <X className="w-3.5 h-3.5" />
          ) : (
            <Bot className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {aiOpen ? "Fechar" : "Mentor IA"}
          </span>
        </button>

        {/* Avatar do usuário com menu */}
        <UserMenu user={user} signOut={signOut} />
      </div>
    </header>
  );
}
