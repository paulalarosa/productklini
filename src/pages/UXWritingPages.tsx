import { useState } from "react";
import { MessageSquare, BookOpen, ClipboardList, Sparkles, Loader2, Plus, Check } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useToneOfVoice, useDeleteToneOfVoice } from "@/hooks/useToneOfVoice";
import { useMicrocopy, useDeleteMicrocopy } from "@/hooks/useMicrocopy";
import { ToneOfVoiceCard } from "@/components/dashboard/ToneOfVoiceCard";
import { MicrocopyInventory } from "@/components/dashboard/MicrocopyInventory";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ToneOfVoicePage() {
  const projectId = useCurrentProjectId();
  const { data: tones, isLoading } = useToneOfVoice(projectId);
  const deleteMutation = useDeleteToneOfVoice();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ archetype: "", traits: "", doSay: "", dontSay: "" });

  const handleAdd = async () => {
    if (!projectId || !form.traits.trim()) return;
    const { error } = await supabase.from("tone_of_voice").insert({
      project_id: projectId,
      brand_archetype: form.archetype.trim() || null,
      personality_traits: form.traits.split(",").map(t => t.trim()).filter(Boolean),
      do_say: form.doSay.split(",").map(t => t.trim()).filter(Boolean),
      dont_say: form.dontSay.split(",").map(t => t.trim()).filter(Boolean),
    });
    if (error) { toast.error("Erro ao criar"); return; }
    queryClient.invalidateQueries({ queryKey: ["tone-of-voice"] });
    setForm({ archetype: "", traits: "", doSay: "", dontSay: "" });
    setAdding(false);
    toast.success("Tom de voz adicionado");
  };

  return (
    <ModulePage
      title="Tom de Voz"
      subtitle="Guia de linguagem e personalidade do produto"
      icon={<MessageSquare className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Manual
          </button>
          <AIGenerateButton
            prompt="Crie um guia completo de Tom de Voz para o projeto. Use a ferramenta create_tone_of_voice. Defina arquétipo de marca, traços de personalidade, o que dizer e não dizer, baseado no contexto do projeto e personas."
            label="Gerar Tom de Voz"
            invalidateKeys={[["tone-of-voice"]]}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground">Novo Tom de Voz</h4>
            <input value={form.archetype} onChange={e => setForm(f => ({ ...f, archetype: e.target.value }))} placeholder="Arquétipo da Marca (ex: Herói, Sábio)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.traits} onChange={e => setForm(f => ({ ...f, traits: e.target.value }))} placeholder="Traços de personalidade (separados por vírgula) *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.doSay} onChange={e => setForm(f => ({ ...f, doSay: e.target.value }))} placeholder="O que dizer (separado por vírgula)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.dontSay} onChange={e => setForm(f => ({ ...f, dontSay: e.target.value }))} placeholder="O que NÃO dizer (separado por vírgula)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
          </div>
        ) : tones && tones.length > 0 ? (
          <div className="space-y-4">
            {tones.map((tone) => (
              <ToneOfVoiceCard key={tone.id} tone={tone} onDelete={(id) => deleteMutation.mutate({ id })} />
            ))}
          </div>
        ) : !adding ? (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Sem Guia de Tom</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Defina como seu produto deve se comunicar.</p>
          </div>
        ) : null}
      </div>
    </ModulePage>
  );
}

export function MicrocopyLibraryPage() {
  const projectId = useCurrentProjectId();
  const { data: items, isLoading } = useMicrocopy(projectId);
  const deleteMutation = useDeleteMicrocopy();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ component_type: "", context: "", original_text: "", suggested_copy: "", tone_applied: "" });

  const handleAdd = async () => {
    if (!projectId || !form.component_type.trim() || !form.suggested_copy.trim()) return;
    const { error } = await supabase.from("microcopy_inventory").insert({
      project_id: projectId,
      component_type: form.component_type.trim(),
      context: form.context.trim() || null,
      original_text: form.original_text.trim() || null,
      suggested_copy: form.suggested_copy.trim(),
      tone_applied: form.tone_applied.trim() || null,
    });
    if (error) { toast.error("Erro ao criar"); return; }
    queryClient.invalidateQueries({ queryKey: ["microcopy"] });
    setForm({ component_type: "", context: "", original_text: "", suggested_copy: "", tone_applied: "" });
    setAdding(false);
    toast.success("Microcopy adicionado");
  };

  return (
    <ModulePage
      title="Biblioteca de Microcopy"
      subtitle="Textos padrão de erro, sucesso, CTAs e tooltips"
      icon={<BookOpen className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Manual
          </button>
          <AIGenerateButton
            prompt="Crie um inventário de microcopy para o projeto. Use a ferramenta create_microcopy várias vezes para diferentes componentes: botões, formulários, erros, success messages, tooltips, empty states. Aplique o tom de voz do projeto."
            label="Gerar Microcopy"
            invalidateKeys={[["microcopy"]]}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20">
            <h4 className="text-sm font-semibold text-foreground">Novo Microcopy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.component_type} onChange={e => setForm(f => ({ ...f, component_type: e.target.value }))} placeholder="Tipo de componente (ex: Button, Error) *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
              <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Contexto (ex: Tela de Login)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <input value={form.original_text} onChange={e => setForm(f => ({ ...f, original_text: e.target.value }))} placeholder="Texto original (se houver)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.suggested_copy} onChange={e => setForm(f => ({ ...f, suggested_copy: e.target.value }))} placeholder="Texto sugerido *" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.tone_applied} onChange={e => setForm(f => ({ ...f, tone_applied: e.target.value }))} placeholder="Tom aplicado (ex: Amigável, Formal)" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium"><Check className="w-3 h-3 inline mr-1" />Criar</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
          </div>
        ) : items && items.length > 0 ? (
          <MicrocopyInventory items={items || []} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : !adding ? (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Biblioteca Vazia</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Documente e padronize os textos da interface.</p>
          </div>
        ) : null}
      </div>
    </ModulePage>
  );
}

export function ContentAuditPage() {
  const projectId = useCurrentProjectId();
  const { data: items, isLoading } = useMicrocopy(projectId);
  const deleteMutation = useDeleteMicrocopy();

  return (
    <ModulePage
      title="Inventário de Conteúdo"
      subtitle="Auditoria completa dos textos da interface"
      icon={<ClipboardList className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Faça uma auditoria de conteúdo para o projeto. Use create_document com doc_type='content_audit'. Analise os textos existentes e sugira melhorias de UX Writing."
          label="Gerar Auditoria"
          invalidateKeys={[["documents"], ["microcopy"]]}
          size="sm"
        />
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
          </div>
        ) : items && items.length > 0 ? (
          <MicrocopyInventory items={items || []} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhum item auditado</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Utilize esta aba para auditar e sugerir melhorias nos textos existentes.</p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
