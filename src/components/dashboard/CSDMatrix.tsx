
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, HelpCircle, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CSDMatrixProps {
  items: any[];
  onDelete?: (id: string) => void;
}

export function CSDMatrix({ items, onDelete }: CSDMatrixProps) {
  const categories = [
    { name: "Certeza", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { name: "Suposição", icon: <AlertCircle className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { name: "Dúvida", icon: <HelpCircle className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {categories.map((cat) => (
        <div key={cat.name} className="space-y-4">
          <div className={`p-3 rounded-xl border ${cat.border} ${cat.bg} flex items-center gap-2`}>
            <div className={cat.color}>{cat.icon}</div>
            <h3 className="font-bold text-sm tracking-tight">{cat.name}s</h3>
            <Badge variant="outline" className="ml-auto bg-background/50 text-[10px]">
              {items?.filter(i => i.category === cat.name).length || 0}
            </Badge>
          </div>

          <div className="space-y-3">
            {items?.filter(i => i.category === cat.name).map((item) => (
              <Card key={item.id} className="border-border/40 hover:border-primary/20 transition-all group overflow-hidden">
                <CardContent className="p-3 relative">
                  <p className="text-xs leading-relaxed text-foreground/90 pr-6">
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className="text-[9px] py-0 px-1.5 font-normal" variant="secondary">
                       Impacto {item.impact_level}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive absolute top-1 right-1"
                      onClick={() => onDelete?.(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!items || items.filter(i => i.category === cat.name).length === 0) && (
              <div className="py-8 text-center border border-dashed border-muted rounded-xl opacity-40">
                <p className="text-[10px] text-muted-foreground italic">Nenhuma {cat.name.toLowerCase()}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
