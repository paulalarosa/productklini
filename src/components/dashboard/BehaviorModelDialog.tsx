import { useState, useEffect } from "react";
import { BehaviorModel } from "@/hooks/useBehaviorModels";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

interface BehaviorModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: BehaviorModel | null;
  onSave: (data: Partial<BehaviorModel>) => void;
  projectId?: string;
}

export function BehaviorModelDialog({ open, onOpenChange, model, onSave, projectId }: BehaviorModelDialogProps) {
  const [formData, setFormData] = useState<Partial<BehaviorModel>>({
    behavior: "",
    description: "",
    motivation_score: 5,
    ability_score: 5,
    prompt_score: 5,
    prompt_type: "signal",
  });

  useEffect(() => {
    if (model) {
      setFormData({
        ...model,
      });
    } else {
      setFormData({
        behavior: "",
        description: "",
        motivation_score: 5,
        ability_score: 5,
        prompt_score: 5,
        prompt_type: "signal",
        project_id: projectId
      });
    }
  }, [model, projectId, open]);

  const handleChange = (field: keyof BehaviorModel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? "Editar Modelo de Comportamento" : "Novo Modelo de Comportamento"}</DialogTitle>
          <DialogDescription>
            Use o framework B=MAP (Behavior = Motivation × Ability × Prompt) para mapear este comportamento.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Geral</TabsTrigger>
            <TabsTrigger value="motivation">Motivação</TabsTrigger>
            <TabsTrigger value="ability">Habilidade</TabsTrigger>
            <TabsTrigger value="prompt">Gatilho</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Comportamento Alvo (Behavior)</Label>
              <Input 
                placeholder="Ex: Usuário completa o perfil" 
                value={formData.behavior || ""}
                onChange={(e) => handleChange("behavior", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição / Contexto</Label>
              <Textarea 
                placeholder="Detalhes sobre quando e por que este comportamento deve acontecer..." 
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="motivation" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="flex justify-between mb-2">
                  <span>Nível de Motivação</span>
                  <span className="text-primary font-bold">{formData.motivation_score}/10</span>
                </Label>
                <Slider 
                  value={[formData.motivation_score || 5]} 
                  max={10} min={1} step={1}
                  onValueChange={(val) => handleChange("motivation_score", val[0])}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  1 = Nenhuma motivação natural (requer muitos incentivos). 10 = Altamente motivado (quer fazer isso).
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ability" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="flex justify-between mb-2">
                  <span>Nível de Habilidade (Facilidade)</span>
                  <span className="text-primary font-bold">{formData.ability_score}/10</span>
                </Label>
                <Slider 
                  value={[formData.ability_score || 5]} 
                  max={10} min={1} step={1}
                  onValueChange={(val) => handleChange("ability_score", val[0])}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  1 = Muito difícil, demorado ou caro. 10 = Extremamente fácil, rápido e sem custo.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="flex justify-between mb-2">
                  <span>Efetividade do Gatilho (Prompt)</span>
                  <span className="text-primary font-bold">{formData.prompt_score}/10</span>
                </Label>
                <Slider 
                  value={[formData.prompt_score || 5]} 
                  max={10} min={1} step={1}
                  onValueChange={(val) => handleChange("prompt_score", val[0])}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  1 = Gatilho fraco, invisível ou mal posicionado. 10 = Gatilho claro, inevitável e no momento certo.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gradient-primary">Salvar Modelo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
