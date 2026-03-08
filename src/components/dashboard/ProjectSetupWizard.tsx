import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2, Users, Target, Lightbulb, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SetupData {
  projectName: string;
  projectDescription: string;
  currentPhase: string;
  teamMembers: { name: string; role: string }[];
  personas: { name: string; role: string; goals: string; painPoints: string }[];
  uxMetrics: { name: string; score: string }[];
}

const phases = [
  { key: "discovery", label: "Descobrir", desc: "Pesquisa e exploração do problema" },
  { key: "define", label: "Definir", desc: "Síntese e definição do escopo" },
  { key: "develop", label: "Desenvolver", desc: "Ideação e prototipagem" },
  { key: "deliver", label: "Entregar", desc: "Implementação e lançamento" },
];

export function ProjectSetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [data, setData] = useState<SetupData>({
    projectName: "",
    projectDescription: "",
    currentPhase: "discovery",
    teamMembers: [{ name: "", role: "" }],
    personas: [{ name: "", role: "", goals: "", painPoints: "" }],
    uxMetrics: [
      { name: "NPS", score: "" },
      { name: "Taxa de Sucesso", score: "" },
      { name: "Tempo na Tarefa", score: "" },
      { name: "SUS Score", score: "" },
    ],
  });

  const steps = [
    { title: "Projeto", icon: Layers, desc: "Informações gerais" },
    { title: "Equipe", icon: Users, desc: "Membros do time" },
    { title: "Personas", icon: Target, desc: "Perfis de usuários" },
    { title: "Métricas", icon: Lightbulb, desc: "Métricas UX iniciais" },
  ];

  const canAdvance = () => {
    if (step === 0) return data.projectName.trim().length > 0;
    if (step === 1) return data.teamMembers.some(m => m.name.trim());
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const projectId = await getProjectId();

      // Update project
      await supabase.from("projects").update({
        name: data.projectName.trim(),
        description: data.projectDescription.trim() || null,
        current_phase: data.currentPhase,
        progress: data.currentPhase === "discovery" ? 5 : data.currentPhase === "define" ? 25 : data.currentPhase === "develop" ? 50 : 75,
        phase_progress: {
          discovery: data.currentPhase === "discovery" ? 10 : 100,
          define: data.currentPhase === "define" ? 10 : data.currentPhase === "discovery" ? 0 : 100,
          develop: data.currentPhase === "develop" ? 10 : ["discovery", "define"].includes(data.currentPhase) ? 0 : 100,
          deliver: data.currentPhase === "deliver" ? 10 : 0,
        },
      }).eq("id", projectId);

      // Insert team members
      const validMembers = data.teamMembers.filter(m => m.name.trim());
      if (validMembers.length > 0) {
        await supabase.from("team_members").insert(
          validMembers.map(m => ({
            project_id: projectId,
            name: m.name.trim(),
            role: m.role.trim() || "Membro",
            avatar: m.name.trim().charAt(0).toUpperCase(),
          }))
        );
      }

      // Insert personas
      const validPersonas = data.personas.filter(p => p.name.trim());
      if (validPersonas.length > 0) {
        await supabase.from("personas").insert(
          validPersonas.map(p => ({
            project_id: projectId,
            name: p.name.trim(),
            role: p.role.trim() || "Usuário",
            goals: p.goals.split(",").map(g => g.trim()).filter(Boolean),
            pain_points: p.painPoints.split(",").map(pp => pp.trim()).filter(Boolean),
          }))
        );
      }

      // Insert UX metrics
      const validMetrics = data.uxMetrics.filter(m => m.score.trim());
      if (validMetrics.length > 0) {
        await supabase.from("ux_metrics").insert(
          validMetrics.map(m => ({
            project_id: projectId,
            metric_name: m.name,
            score: parseFloat(m.score) || 0,
          }))
        );
      }

      // Invalidate all queries
      queryClient.invalidateQueries();
      toast.success("Projeto configurado com sucesso!");
      onComplete();
    } catch (e) {
      console.error("Setup error:", e);
      toast.error("Erro ao salvar configuração");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Configurar Projeto</h2>
              <p className="text-xs text-muted-foreground">Preencha as informações iniciais para começar</p>
            </div>
          </div>
          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <button
                key={s.title}
                onClick={() => i <= step && setStep(i)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  i === step ? "bg-primary/10 text-primary font-medium" :
                  i < step ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Nome do Projeto *</label>
                  <input
                    value={data.projectName}
                    onChange={e => setData(d => ({ ...d, projectName: e.target.value }))}
                    placeholder="Ex: App de Delivery, Plataforma SaaS..."
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Descrição</label>
                  <textarea
                    value={data.projectDescription}
                    onChange={e => setData(d => ({ ...d, projectDescription: e.target.value }))}
                    placeholder="Descreva brevemente o objetivo do projeto, público-alvo e principais funcionalidades..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">Fase Atual do Projeto</label>
                  <div className="grid grid-cols-2 gap-2">
                    {phases.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setData(d => ({ ...d, currentPhase: p.key }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          data.currentPhase === p.key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="text-xs font-medium text-foreground">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">Adicione os membros da equipe que trabalham neste projeto.</p>
                {data.teamMembers.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={m.name}
                      onChange={e => {
                        const tm = [...data.teamMembers];
                        tm[i] = { ...tm[i], name: e.target.value };
                        setData(d => ({ ...d, teamMembers: tm }));
                      }}
                      placeholder="Nome"
                      className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={50}
                    />
                    <input
                      value={m.role}
                      onChange={e => {
                        const tm = [...data.teamMembers];
                        tm[i] = { ...tm[i], role: e.target.value };
                        setData(d => ({ ...d, teamMembers: tm }));
                      }}
                      placeholder="Cargo (ex: UX Designer)"
                      className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={50}
                    />
                    {data.teamMembers.length > 1 && (
                      <button onClick={() => setData(d => ({ ...d, teamMembers: d.teamMembers.filter((_, j) => j !== i) }))}
                        className="px-2 text-muted-foreground hover:text-destructive transition-colors">×</button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setData(d => ({ ...d, teamMembers: [...d.teamMembers, { name: "", role: "" }] }))}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >+ Adicionar membro</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-xs text-muted-foreground mb-2">Defina as personas do projeto. Você pode editar depois.</p>
                {data.personas.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={p.name}
                        onChange={e => {
                          const ps = [...data.personas];
                          ps[i] = { ...ps[i], name: e.target.value };
                          setData(d => ({ ...d, personas: ps }));
                        }}
                        placeholder="Nome da Persona"
                        className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        maxLength={50}
                      />
                      <input
                        value={p.role}
                        onChange={e => {
                          const ps = [...data.personas];
                          ps[i] = { ...ps[i], role: e.target.value };
                          setData(d => ({ ...d, personas: ps }));
                        }}
                        placeholder="Perfil (ex: Jovem Profissional)"
                        className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        maxLength={50}
                      />
                    </div>
                    <input
                      value={p.goals}
                      onChange={e => {
                        const ps = [...data.personas];
                        ps[i] = { ...ps[i], goals: e.target.value };
                        setData(d => ({ ...d, personas: ps }));
                      }}
                      placeholder="Objetivos (separados por vírgula)"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={200}
                    />
                    <input
                      value={p.painPoints}
                      onChange={e => {
                        const ps = [...data.personas];
                        ps[i] = { ...ps[i], painPoints: e.target.value };
                        setData(d => ({ ...d, personas: ps }));
                      }}
                      placeholder="Dores (separadas por vírgula)"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={200}
                    />
                    {data.personas.length > 1 && (
                      <button onClick={() => setData(d => ({ ...d, personas: d.personas.filter((_, j) => j !== i) }))}
                        className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Remover persona</button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setData(d => ({ ...d, personas: [...d.personas, { name: "", role: "", goals: "", painPoints: "" }] }))}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >+ Adicionar persona</button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-xs text-muted-foreground mb-2">Defina valores iniciais para as métricas UX (opcional — você pode preencher depois).</p>
                <div className="grid grid-cols-2 gap-3">
                  {data.uxMetrics.map((m, i) => (
                    <div key={m.name} className="space-y-1">
                      <label className="text-xs font-medium text-foreground">{m.name}</label>
                      <input
                        type="number"
                        value={m.score}
                        onChange={e => {
                          const ms = [...data.uxMetrics];
                          ms[i] = { ...ms[i], score: e.target.value };
                          setData(d => ({ ...d, uxMetrics: ms }));
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep(s => s - 1)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
              step === 0 ? "text-muted-foreground cursor-not-allowed" : "text-foreground hover:bg-accent"
            }`}
            disabled={step === 0}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onComplete}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
            >
              Pular configuração
            </button>
            {step < 3 ? (
              <button
                onClick={() => canAdvance() && setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Próximo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? "Salvando..." : "Finalizar"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
