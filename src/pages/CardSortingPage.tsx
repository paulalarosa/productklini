import { LayoutGrid, Sparkles, Loader2 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useCardSorting, useDeleteCardSorting } from "@/hooks/useCardSorting";
import { CardSortingBoard } from "@/components/dashboard/CardSortingBoard";
import { getProjectId } from "@/lib/api";
import { useEffect, useState } from "react";

export function CardSortingPage() {
  const [projectId, setProjectId] = useState<string>();
  const { data: categories, isLoading } = useCardSorting(projectId);
  const deleteMutation = useDeleteCardSorting();

  useEffect(() => {
    getProjectId().then(setProjectId);
  }, []);

  return (
    <ModulePage title="Card Sorting" subtitle="Agrupamento semântico de itens de navegação" icon={<LayoutGrid className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-orange-600">Exercício de IA</h4>
            <p className="text-sm text-foreground/70">
              O Mentor IA pode sugerir o agrupamento ideal para suas funcionalidades. Peça: "Faça o card sorting das funcionalidades do projeto".
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
            <p className="text-sm font-medium">Carregando categorias...</p>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Grupos & Categorias</h3>
               <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">{categories.length} grupos</span>
             </div>
            <CardSortingBoard categories={(categories as any[]) || []} onDelete={(id) => deleteMutation.mutate({ id })} />
          </div>
        ) : (
          <div className="text-center py-20 glass-card bg-card/10 border-dashed border-2 border-orange-500/20">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Sem Grupos definidos</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Esta aba exibe os resultados do exercício de card sorting gerado pela IA para otimizar a arquitetura de informação.
            </p>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
