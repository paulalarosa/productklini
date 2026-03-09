import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Edit3 } from "lucide-react";

interface CanvasSectionProps {
  title: string;
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: string) => void;
  color: string;
  placeholder?: string;
}

export function CanvasSection({
  title,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  color,
  placeholder = "Adicionar item..."
}: CanvasSectionProps) {
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddItem(newItem.trim());
      setNewItem("");
    }
  };

  const handleEditItem = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      onUpdateItem(editingIndex, editValue.trim());
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full min-h-[200px] flex flex-col">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${color}`}>
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      
      <div className="flex-1 space-y-2 mb-3">
        {items.map((item, index) => (
          <div key={index} className="group relative">
            {editingIndex === index ? (
              <div className="space-y-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-xs resize-none min-h-[60px]"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveEdit} className="h-6 px-2 text-xs">
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 px-2 text-xs">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-md p-2 text-xs text-foreground relative group hover:bg-muted/50 transition-colors">
                <p className="pr-12">{item}</p>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditItem(index, item)}
                    className="h-6 w-6 p-0 hover:bg-background/50"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveItem(index)}
                    className="h-6 w-6 p-0 hover:bg-destructive/20 text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
          className="text-xs"
        />
        <Button 
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          size="sm"
          variant="outline"
          className="w-full h-8"
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}