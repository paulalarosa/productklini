import { useState, useEffect } from "react";
import { Settings, Plus, Trash2, Check, X, Sliders } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useProject, useTeamMembers } from "@/hooks/useProjectData";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const phases = [
  { key: "discovery", label: "Descobrir", color: "bg-status-discovery" },
  { key: "define", label: "Definir", color: "bg-status-define" },
  { key: "develop", label: "Desenvolver", color: "bg-status-develop" },
  { key: "deliver", label: "Entregar", color: "bg-status-deliver" },
];

export function ConfigPage() {
  const { data: project } = useProject();
  const { data: members } = useTeamMembers();
  const queryClient = useQueryClient();
  const [editDesc, setEditDesc] = useState(false);
  const [desc, setDesc] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  // Phase & progress state
  const [currentPhase, setCurrentPhase] = useState("discovery");
  const [phaseProgress, setPhaseProgress] = useState<Record<string, number>>({
    discovery: 0, define: 0, develop: 0, deliver: 0,
  });
  const [progressDirty, setProgressDirty] = useState(false);

  useEffect(() => {
    if (project) {
      setCurrentPhase(project.current_phase);
      const pp = project.phase_progress as Record<string, number>;
      setPhaseProgress({
        discovery: pp?.discovery ?? 0,
        define: pp?.define ?? 0,
        develop: pp?.develop ?? 0,
        deliver: pp?.deliver ?? 0,
      });
    }
  }, [project]);

  const saveDesc = async () => {
    if (!project) return;
    const { error } = await supabase.from("projects").update({ description: desc.trim() || null }).eq("id", project.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    queryClient.invalidateQueries({ queryKey: ["project"] });
    setEditDesc(false);
    toast.success("Descrição atualizada");
  };

  const savePhaseAndProgress = async () => {
    if (!project) return;
    const totalProgress = Math.round(
      (phaseProgress.discovery + phaseProgress.define + phaseProgress.develop + phaseProgress.deliver) / 4
    );
    const { error } = await supabase.from("projects").update({
      current_phase: currentPhase,
      phase_progress: phaseProgress,
      progress: totalProgress,
    }).eq("id", project.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    queryClient.invalidateQueries({ queryKey: ["project"] });
    setProgressDirty(false);
    toast.success("Fase e progresso atualizados");
  };

  const handlePhaseChange = (key: string) => {
    setCurrentPhase(key);
    setProgressDirty(true);
  };

  const handleProgressChange = (key: string, value: number) => {
    setPhaseProgress(prev => ({ ...prev, [key]: value }));
    setProgressDirty(true);
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
          </div>
        </div>

        {/* Phase & Progress */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" /> Fase & Progresso do Double Diamond
            </h3>
            {progressDirty && (
              <button onClick={savePhaseAndProgress}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
                <Check className="w-3 h-3" /> Salvar
              </button>
            )}
          </div>

          {/* Phase selector */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground mb-2 block">Fase Atual</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {phases.map(p => (
                <button key={p.key} onClick={() => handlePhaseChange(p.key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    currentPhase === p.key
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                    <span className="text-xs font-medium text-foreground">{p.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{phaseProgress[p.key]}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress sliders */}
          <div className="space-y-4">
            <label className="text-xs text-muted-foreground block">Progresso por Fase</label>
            {phases.map(p => (
              <div key={p.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.color}`} />
                    <span className="text-xs font-medium text-foreground">{p.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-10 text-right">{phaseProgress[p.key]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={100} step={5}
                    value={phaseProgress[p.key]}
                    onChange={e => handleProgressChange(p.key, parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none bg-secondary cursor-pointer accent-primary
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-card"
                  />
                </div>
                {/* Visual progress bar */}
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${p.color} transition-all duration-200`} style={{ width: `${phaseProgress[p.key]}%` }} />
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Progresso Geral</span>
                <span className="text-sm font-bold text-primary">
                  {Math.round((phaseProgress.discovery + phaseProgress.define + phaseProgress.develop + phaseProgress.deliver) / 4)}%
                </span>
              </div>
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
