
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Quote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JTBDCardProps {
  jtbd: any;
  onDelete?: (id: string) => void;
}

export function JTBDCard({ jtbd, onDelete }: JTBDCardProps) {
  return (
    <Card className="overflow-hidden border-border/40 hover:border-primary/20 transition-all bg-card/50 backdrop-blur-sm group">
      <CardHeader className="pb-2 border-b border-border/40 bg-muted/30">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold">Jobs To Be Done</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            onClick={() => onDelete?.(jtbd.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <div className="relative">
          <Quote className="w-8 h-8 text-primary/10 absolute -top-2 -left-2" />
          <p className="text-sm font-medium leading-relaxed pl-4 italic border-l-2 border-primary/20">
            "{jtbd.job_statement}"
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Situação</h4>
            <p className="text-xs text-muted-foreground">{jtbd.situation}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Motivação</h4>
            <p className="text-xs text-muted-foreground">{jtbd.motivation}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Resultado Esperado</h4>
            <p className="text-xs text-muted-foreground">{jtbd.expected_outcome}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
