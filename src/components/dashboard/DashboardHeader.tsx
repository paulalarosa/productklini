import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, LogOut, Pencil, Check, X } from "lucide-react";
import { useProject, useTeamMembers } from "@/hooks/useProjectData";
import { NotificationsPanel } from "./NotificationsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function DashboardHeader({ onToggleAI }: { onToggleAI: () => void }) {
  const { data: project } = useProject();
  const { data: teamMembers } = useTeamMembers();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const name = project?.name ?? "Carregando...";
  const progress = project?.progress ?? 0;
  const members = teamMembers ?? [];

  const startEdit = () => {
    setEditName(project?.name ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editName.trim() || !project) return;
    const { error } = await supabase.from("projects").update({ name: editName.trim() }).eq("id", project.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    queryClient.invalidateQueries({ queryKey: ["project"] });
    setEditing(false);
    toast.success("Nome atualizado");
  };

  return (
    <header className="flex items-center justify-between px-3 md:px-6 py-2.5 md:py-4 border-b border-border shrink-0 gap-2 min-w-0">
      {/* Left side - Project info */}
      <div className="flex items-center gap-3 ml-10 md:ml-0 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-sm font-bold text-foreground bg-secondary border border-border rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full max-w-[200px]"
                autoFocus
                maxLength={100}
                onKeyDown={e => e.key === "Enter" && saveEdit()}
              />
              <button onClick={saveEdit} className="p-1 rounded hover:bg-accent shrink-0"><Check className="w-3.5 h-3.5 text-primary" /></button>
              <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-accent shrink-0"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-foreground truncate">{name}</h1>
              <button onClick={startEdit} className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-16 md:w-40 h-1.5 rounded-full bg-secondary overflow-hidden shrink-0">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium shrink-0">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        {/* Team avatars - hidden on mobile */}
        <div className="hidden md:flex -space-x-2">
          {members.slice(0, 4).map((member) => (
            <div key={member.id} title={member.name}
              className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-semibold text-secondary-foreground">
              {member.avatar}
            </div>
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
              +{members.length - 4}
            </div>
          )}
        </div>

        <NotificationsPanel />

        <button onClick={onToggleAI}
          className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shrink-0">
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mentor IA</span>
        </button>

        <button onClick={signOut} title="Sair" className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0">
          <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
