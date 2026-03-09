
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmpathyMap } from "@/hooks/useEmpathyMap";

interface EmpathyMapCardProps {
  map: EmpathyMap;
  onDelete?: (id: string) => void;
}

export function EmpathyMapCard({ map, onDelete }: EmpathyMapCardProps) {
  const quadrants = [
    { title: "Pensa e Sente", data: map.thinks_and_feels as string[], color: "bg-blue-500/10 text-blue-500" },
    { title: "Escuta", data: map.hears as string[], color: "bg-purple-500/10 text-purple-500" },
    { title: "Vê", data: map.sees as string[], color: "bg-amber-500/10 text-amber-500" },
    { title: "Fala e Faz", data: map.says_and_does as string[], color: "bg-emerald-500/10 text-emerald-500" },
  ];

  const paintPoints = [
    { title: "Dores", data: map.pains as string[], color: "bg-destructive/10 text-destructive" },
    { title: "Ganhos", data: map.gains as string[], color: "bg-primary/10 text-primary" },
  ];

  return (
    <Card className="overflow-hidden border-border/40 hover:border-primary/20 transition-all group">
      <CardHeader className="pb-2 bg-secondary/30">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{map.persona_name || "Mapeamento sem Nome"}</CardTitle>
              <p className="text-[10px] text-muted-foreground">Mapa de Empatia • IA Gerado</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            onClick={() => onDelete?.(map.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {quadrants.map((q, i) => (
            <div key={i} className="space-y-2">
              <h4 className={`text-[10px] uppercase font-bold tracking-wider ${q.color.split(" ")[1]}`}>{q.title}</h4>
              <div className="space-y-1">
                {Array.isArray(q.data) && q.data.length > 0 ? (
                  q.data.map((item, idx) => (
                    <div key={idx} className="text-[11px] leading-tight text-foreground/80 bg-accent/30 p-1.5 rounded">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Nada listado</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
          {paintPoints.map((p, i) => (
            <div key={i} className="space-y-2">
              <h4 className={`text-[10px] uppercase font-bold tracking-wider ${p.color.split(" ")[1]}`}>{p.title}</h4>
              <div className="space-y-1">
                {Array.isArray(p.data) && p.data.length > 0 ? (
                  p.data.map((item, idx) => (
                    <div key={idx} className="text-[11px] leading-tight text-foreground/80 bg-accent/30 p-1.5 rounded">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Nada listado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
