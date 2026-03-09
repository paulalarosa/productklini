import { CanvasSection } from "./CanvasSection";
import { useUpdateBusinessModelCanvas } from "@/hooks/useBusinessModelCanvas";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type BusinessModelCanvas = Tables<"business_model_canvas">;

interface BusinessModelCanvasViewProps {
  canvas: BusinessModelCanvas;
}

export function BusinessModelCanvasView({ canvas }: BusinessModelCanvasViewProps) {
  const { mutate: updateCanvas } = useUpdateBusinessModelCanvas();

  const updateSection = (section: keyof BusinessModelCanvas, items: string[]) => {
    updateCanvas({
      id: canvas.id,
      updates: { [section]: items }
    }, {
      onError: (error) => {
        toast.error("Erro ao atualizar canvas");
        console.error(error);
      }
    });
  };

  const addItem = (section: keyof BusinessModelCanvas, item: string) => {
    const currentItems = (canvas[section] as string[]) || [];
    updateSection(section, [...currentItems, item]);
  };

  const removeItem = (section: keyof BusinessModelCanvas, index: number) => {
    const currentItems = (canvas[section] as string[]) || [];
    updateSection(section, currentItems.filter((_, i) => i !== index));
  };

  const updateItem = (section: keyof BusinessModelCanvas, index: number, item: string) => {
    const currentItems = (canvas[section] as string[]) || [];
    const newItems = [...currentItems];
    newItems[index] = item;
    updateSection(section, newItems);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{canvas.name}</h2>
        {canvas.description && (
          <p className="text-muted-foreground text-sm">{canvas.description}</p>
        )}
      </div>

      {/* Canvas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 auto-rows-fr">
        {/* Row 1 */}
        <div className="md:col-span-1">
          <CanvasSection
            title="Parceiros Principais"
            items={(canvas.key_partners as string[]) || []}
            onAddItem={(item) => addItem("key_partners", item)}
            onRemoveItem={(index) => removeItem("key_partners", index)}
            onUpdateItem={(index, item) => updateItem("key_partners", index, item)}
            color="border-l-4 border-l-blue-500"
            placeholder="Quem são os parceiros chave?"
          />
        </div>
        
        <div className="md:col-span-1">
          <CanvasSection
            title="Atividades Principais"
            items={(canvas.key_activities as string[]) || []}
            onAddItem={(item) => addItem("key_activities", item)}
            onRemoveItem={(index) => removeItem("key_activities", index)}
            onUpdateItem={(index, item) => updateItem("key_activities", index, item)}
            color="border-l-4 border-l-green-500"
            placeholder="Que atividades são essenciais?"
          />
        </div>
        
        <div className="md:col-span-1">
          <CanvasSection
            title="Proposta de Valor"
            items={(canvas.value_propositions as string[]) || []}
            onAddItem={(item) => addItem("value_propositions", item)}
            onRemoveItem={(index) => removeItem("value_propositions", index)}
            onUpdateItem={(index, item) => updateItem("value_propositions", index, item)}
            color="border-l-4 border-l-orange-500"
            placeholder="Que valor entregamos?"
          />
        </div>
        
        <div className="md:col-span-1">
          <CanvasSection
            title="Relacionamento"
            items={(canvas.customer_relationships as string[]) || []}
            onAddItem={(item) => addItem("customer_relationships", item)}
            onRemoveItem={(index) => removeItem("customer_relationships", index)}
            onUpdateItem={(index, item) => updateItem("customer_relationships", index, item)}
            color="border-l-4 border-l-purple-500"
            placeholder="Como nos relacionamos?"
          />
        </div>
        
        <div className="md:col-span-1">
          <CanvasSection
            title="Segmentos de Cliente"
            items={(canvas.customer_segments as string[]) || []}
            onAddItem={(item) => addItem("customer_segments", item)}
            onRemoveItem={(index) => removeItem("customer_segments", index)}
            onUpdateItem={(index, item) => updateItem("customer_segments", index, item)}
            color="border-l-4 border-l-red-500"
            placeholder="Para quem criamos valor?"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
        {/* Row 2 */}
        <div className="md:col-span-1">
          <CanvasSection
            title="Recursos Principais"
            items={(canvas.key_resources as string[]) || []}
            onAddItem={(item) => addItem("key_resources", item)}
            onRemoveItem={(index) => removeItem("key_resources", index)}
            onUpdateItem={(index, item) => updateItem("key_resources", index, item)}
            color="border-l-4 border-l-teal-500"
            placeholder="Que recursos são necessários?"
          />
        </div>
        
        <div className="md:col-span-2">
          <CanvasSection
            title="Canais"
            items={(canvas.channels as string[]) || []}
            onAddItem={(item) => addItem("channels", item)}
            onRemoveItem={(index) => removeItem("channels", index)}
            onUpdateItem={(index, item) => updateItem("channels", index, item)}
            color="border-l-4 border-l-indigo-500"
            placeholder="Como alcançamos os clientes?"
          />
        </div>
        
        <div className="md:col-span-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Row 3 - Cost & Revenue */}
        <div>
          <CanvasSection
            title="Estrutura de Custos"
            items={(canvas.cost_structure as string[]) || []}
            onAddItem={(item) => addItem("cost_structure", item)}
            onRemoveItem={(index) => removeItem("cost_structure", index)}
            onUpdateItem={(index, item) => updateItem("cost_structure", index, item)}
            color="border-l-4 border-l-red-600"
            placeholder="Quais são os custos importantes?"
          />
        </div>
        
        <div>
          <CanvasSection
            title="Fontes de Receita"
            items={(canvas.revenue_streams as string[]) || []}
            onAddItem={(item) => addItem("revenue_streams", item)}
            onRemoveItem={(index) => removeItem("revenue_streams", index)}
            onUpdateItem={(index, item) => updateItem("revenue_streams", index, item)}
            color="border-l-4 border-l-green-600"
            placeholder="Como ganhamos dinheiro?"
          />
        </div>
      </div>
    </div>
  );
}