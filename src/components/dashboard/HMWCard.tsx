
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Trash2, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { HMW } from "@/hooks/useHMW";

interface HMWCardProps {
  hmw: HMW;
  onDelete?: (id: string) => void;
}

export function HMWCard({ hmw, onDelete }: HMWCardProps) {
  const priorityColor = hmw.priority === 'P1' ? 'text-rose-500 bg-rose-500/10' : hmw.priority === 'P2' ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10';

  return (
    <Card className="overflow-hidden border-border/40 hover:border-primary/20 transition-all bg-card/50 group relative">
      <CardContent className="p-4 pt-8">
        <div className="absolute top-3 left-4 flex items-center gap-2">
           <Badge variant="outline" className={`text-[9px] font-bold ${priorityColor} border-none`}>
             {hmw.priority}
           </Badge>
           <h4 className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Oportunidade</h4>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive absolute top-2 right-2"
          onClick={() => onDelete?.(hmw.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>

        <div className="space-y-4">
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Lightbulb className="w-4 h-4" />
             </div>
             <div>
               <p className="text-sm font-bold text-foreground leading-tight">
                 {hmw.hmw_question}
               </p>
             </div>
          </div>

          <div className="pl-11 border-l border-border/40 space-y-1">
             <div className="flex items-center gap-1.5">
                <ArrowUpCircle className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Baseado em:</span>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed italic">
               "{hmw.problem_statement}"
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
