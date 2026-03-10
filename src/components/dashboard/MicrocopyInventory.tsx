import React from "react";
import { Type, Trash2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Microcopy } from "@/hooks/useMicrocopy";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MicrocopyInventoryProps {
  items: Microcopy[];
  onDelete: (id: string) => void;
}

export function MicrocopyInventory({ items, onDelete }: MicrocopyInventoryProps) {
  return (
    <Card className="border-muted bg-card/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-muted">
            <TableHead className="w-[150px]">Componente</TableHead>
            <TableHead>Contexto/Original</TableHead>
            <TableHead>Sugestão UX Writing</TableHead>
            <TableHead>Tom Aplicado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-muted hover:bg-muted/30 group">
              <TableCell className="font-semibold">
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {item.component_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {item.context && <p className="text-xs text-primary font-medium">{item.context}</p>}
                  {item.original_text && (
                    <p className="text-sm text-muted-foreground italic leading-tight">
                      "{item.original_text}"
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {item.suggested_copy}
                </p>
              </TableCell>
              <TableCell>
                {item.tone_applied && (
                  <Badge variant="secondary" className="text-[10px] bg-muted/50">
                    {item.tone_applied}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-all"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
