import { MessageSquare, BookOpen, ClipboardList, Sparkles, Loader2 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useToneOfVoice, useDeleteToneOfVoice } from "@/hooks/useToneOfVoice";
import { useMicrocopy, useDeleteMicrocopy } from "@/hooks/useMicrocopy";
import { ToneOfVoiceCard } from "@/components/dashboard/ToneOfVoiceCard";
import { MicrocopyInventory } from "@/components/dashboard/MicrocopyInventory";
import { getProjectId } from "@/lib/api";
import { useEffect, useState } from "react";

export function ToneOfVoicePage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: tones, isLoading } = useToneOfVoice(projectId);
  const deleteMutation = useDeleteToneOfVoice();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Tom de Voz" subtitle="Guia de linguagem e personalidade do produto" icon={<MessageSquare className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-primary">Branding Inteligente</h4>
            <p className="text-sm text-foreground/70">
              O Mentor IA pode definir as diretrizes de voz baseadas no arquétipo da sua marca. Peça: "Crie o guia de tom de voz para este projeto".
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">Carregando diretrizes...</p>
          </div>
        ) : tones && tones.length > 0 ? (
          <div className="space-y-4">
            {tones.map((tone: any) => (
              <ToneOfVoiceCard key={tone.id} tone={tone} onDelete={(id) => deleteMutation.mutate({ id })} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Sem Guia de Tom</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Defina como seu produto deve se comunicar com os usuários gerando um guia de tom de voz estruturado.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function MicrocopyLibraryPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: items, isLoading } = useMicrocopy(projectId);
  const deleteMutation = useDeleteMicrocopy();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Biblioteca de Microcopy" subtitle="Textos padrão de erro, sucesso, CTAs e tooltips" icon={<BookOpen className="w-4 h-4 text-primary-foreground" />}>
       <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-primary">Escrita Estratégica</h4>
            <p className="text-sm text-foreground/70">
              Peça ao Mentor: "Crie microcopies para meus formulários e botões" para aplicar o tom de voz correto em cada componente.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">Carregando inventário...</p>
          </div>
        ) : items && items.length > 0 ? (
          <MicrocopyInventory items={items as any[]} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Biblioteca Vazia</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Documente e padronize os textos da sua interface para garantir consistência em toda a jornada do usuário.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}

export function ContentAuditPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: items, isLoading } = useMicrocopy(projectId);
  const deleteMutation = useDeleteMicrocopy();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Inventário de Conteúdo" subtitle="Auditoria completa dos textos da interface" icon={<ClipboardList className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
          </div>
        ) : items && items.length > 0 ? (
          <MicrocopyInventory items={items as any[]} onDelete={(id) => deleteMutation.mutate({ id })} />
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhum item auditado</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Utilize esta aba para auditar e sugerir melhorias nos textos existentes do seu produto.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
