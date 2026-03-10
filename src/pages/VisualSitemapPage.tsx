import { Network, Sparkles, Loader2, Info } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useSitemap, useDeleteSitemap } from "@/hooks/useSitemap";
import { SitemapTree } from "@/components/dashboard/SitemapTree";
import { getProjectId } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const getGenerateUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docs`;

// Nodes are now handled by the useSitemap hook and rendered by SitemapTree

export function VisualSitemapPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: nodes, isLoading } = useSitemap(projectId);
  const deleteMutation = useDeleteSitemap();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Sitemap Visual" subtitle="Mapa hierárquico interativo de telas e navegação" icon={<Network className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-primary">Sitemap Inteligente</h4>
            <p className="text-sm text-foreground/70 mb-3">
              Peça ao Mentor IA para "criar o sitemap do projeto" e ele aparecerá aqui automaticamente com toda a hierarquia de navegação.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium">Carregando mapa do site...</p>
          </div>
        ) : nodes && nodes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Estrutura de Navegação</h3>
               <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">{nodes.length} páginas</span>
             </div>
             <SitemapTree nodes={nodes || []} onDelete={(id) => deleteMutation.mutate({ id })} />
          </div>
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2">
            <Network className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Sem Sitemap definido</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Use o chat da IA para gerar uma estrutura de navegação completa baseada nos requisitos do seu software.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
