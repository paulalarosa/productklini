import { useState } from "react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { BrainCircuit, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBehaviorModels, useCreateBehaviorModel, useUpdateBehaviorModel, useDeleteBehaviorModel, BehaviorModel } from "@/hooks/useBehaviorModels";
import { BehaviorModelCard } from "@/components/dashboard/BehaviorModelCard";
import { BehaviorModelDialog } from "@/components/dashboard/BehaviorModelDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BehaviorModelPage() {
  // Try to get a valid project_id first, assuming the user has projects
  const { data: projects } = useQuery({
    queryKey: ["first-project"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id").limit(1);
      return data;
    }
  });
  
  const projectId = projects?.[0]?.id;

  const { data: models, isLoading } = useBehaviorModels(projectId);
  const createModel = useCreateBehaviorModel();
  const updateModel = useUpdateBehaviorModel();
  const deleteModel = useDeleteBehaviorModel();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<BehaviorModel | null>(null);

  const handleOpenNew = () => {
    setEditingModel(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (model: BehaviorModel) => {
    setEditingModel(model);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: Partial<BehaviorModel>) => {
    if (editingModel) {
      await updateModel.mutateAsync({ ...data, id: editingModel.id });
    } else {
      await createModel.mutateAsync({ ...data, project_id: projectId });
    }
  };

  return (
    <ModulePage
      title="Behavior Model (BJ Fogg)"
      subtitle="Analise e projete o comportamento do usuário usando o modelo B=MAP."
      icon={<BrainCircuit className="w-5 h-5 text-primary-foreground" />}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Modelos de Comportamento</h3>
          <p className="text-muted-foreground text-sm">Entenda o que motiva e possibilita a ação dos seus usuários.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2" disabled={!projectId}>
          <Plus className="w-4 h-4" /> Novo Modelo
        </Button>
      </div>

      {!projectId && !isLoading && (
        <div className="p-8 text-center bg-secondary/30 rounded-lg border border-border border-dashed">
          <p className="text-muted-foreground">Você precisa ter um projeto criado para adicionar modelos.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models?.map((model) => (
            <BehaviorModelCard
              key={model.id}
              model={model}
              onEdit={handleOpenEdit}
              onDelete={(id) => deleteModel.mutate(id)}
            />
          ))}
          {models?.length === 0 && projectId && (
            <div className="col-span-full p-12 text-center bg-secondary/30 rounded-lg border border-border border-dashed flex flex-col items-center justify-center">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">Nenhum modelo criado</h4>
              <p className="text-muted-foreground mb-4 max-w-md">
                Crie seu primeiro modelo de comportamento usando o framework BJ Fogg para entender e influenciar seus usuários.
              </p>
              <Button variant="outline" onClick={handleOpenNew}>
                Criar Primeiro Modelo
              </Button>
            </div>
          )}
        </div>
      )}

      <BehaviorModelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        model={editingModel}
        onSave={handleSave}
        projectId={projectId}
      />
    </ModulePage>
  );
}
