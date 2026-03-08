import { Settings } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useProject, useTeamMembers } from "@/hooks/useProjectData";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Check, X } from "lucide-react";

export function ConfigPage() {
  const { data: project } = useProject();
  const { data: members } = useTeamMembers();
  const queryClient = useQueryClient();
  const [editDesc, setEditDesc] = useState(false);
  const [desc, setDesc] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  const saveDesc = async () => {
    if (!project) return;
    const { error } = await supabase.from("projects").update({ description: desc.trim() || null }).eq("id", project.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    queryClient.invalidateQueries({ queryKey: ["project"] });
    setEditDesc(false);
    toast.success("Descrição atualizada");
  };

  const addMember = async () => {
    if (!memberName.trim()) return;
    const projectId = await getProjectId();
    const { error } = await supabase.from("team_members").insert({
      project_id: projectId,
      name: memberName.trim(),
      role: memberRole.trim() || "Membro",
      avatar: memberName.trim().charAt(0).toUpperCase(),
    });
    if (error) { toast.error("Erro ao adicionar"); return; }
    queryClient.invalidateQueries({ queryKey: ["team-members"] });
    setMemberName(""); setMemberRole(""); setAddingMember(false);
    toast.success("Membro adicionado");
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    queryClient.invalidateQueries({ queryKey: ["team-members"] });
    toast.success("Membro removido");
  };

  return (
    <ModulePage title="Configurações" subtitle="Preferências do projeto" icon={<Settings className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6 max-w-2xl">
        {/* Project info */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Informações do Projeto</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <p className="text-sm text-foreground font-medium">{project?.name ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descrição</label>
              {editDesc ? (
                <div className="mt-1 space-y-2">
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditDesc(false)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                    <button onClick={saveDesc} className="px-3 py-1 text-xs gradient-primary text-primary-foreground rounded-lg">Salvar</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => { setDesc(project?.description ?? ""); setEditDesc(true); }}>
                  {project?.description || "Clique para adicionar descrição"}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fase Atual</label>
              <p className="text-sm text-foreground font-medium capitalize">{project?.current_phase ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Team members */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Equipe</h3>
            <button onClick={() => setAddingMember(true)} className="p-1 rounded hover:bg-accent">
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          {addingMember && (
            <div className="mb-3 flex gap-2 items-center">
              <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Nome"
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" autoFocus />
              <input value={memberRole} onChange={e => setMemberRole(e.target.value)} placeholder="Cargo"
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
              <button onClick={addMember} className="p-1.5 rounded hover:bg-accent"><Check className="w-3.5 h-3.5 text-primary" /></button>
              <button onClick={() => setAddingMember(false)} className="p-1.5 rounded hover:bg-accent"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          )}
          <div className="space-y-2">
            {(members ?? []).map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{m.avatar}</div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <button onClick={() => removeMember(m.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}
            {(members ?? []).length === 0 && !addingMember && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro na equipe</p>
            )}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
