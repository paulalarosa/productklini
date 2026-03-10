import React from "react";
import { Grid3X3, Trash2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CardSorting } from "@/hooks/useCardSorting";

interface CardSortingBoardProps {
  categories: CardSorting[];
  onDelete: (id: string) => void;
}

export function CardSortingBoard({ categories, onDelete }: CardSortingBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((cat) => (
        <Card key={cat.id} className="p-5 bg-card/50 border-muted flex flex-col group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-orange-500/10 text-orange-500">
                <Grid3X3 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-foreground tracking-tight uppercase text-sm">{cat.category_name}</h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-all"
              onClick={() => onDelete(cat.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-auto">
            {(cat.items as unknown as string[]).map((item, idx) => (
              <Badge key={idx} variant="secondary" className="bg-muted/50 text-muted-foreground hover:bg-muted font-medium">
                {item}
              </Badge>
            ))}
          </div>
          
          {(cat.items as unknown as string[]).length === 0 && (
            <p className="text-xs text-muted-foreground italic">Sem itens nesta categoria</p>
          )}
        </Card>
      ))}
    </div>
  );
}
