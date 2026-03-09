import React from "react";
import { MessageSquare, CheckCircle2, XCircle, Trash2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ToneOfVoiceData {
  id: string;
  personality_traits: string[];
  do_say: string[];
  dont_say: string[];
  brand_archetype?: string;
}

interface ToneOfVoiceCardProps {
  tone: ToneOfVoiceData;
  onDelete: (id: string) => void;
}

export function ToneOfVoiceCard({ tone, onDelete }: ToneOfVoiceCardProps) {
  return (
    <div className="space-y-8">
      <Card className="p-6 bg-card/30 border-muted group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              onClick={() => onDelete(tone.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold tracking-tight">Personalidade & Arquétipo</h3>
              </div>
              {tone.brand_archetype && (
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase text-primary/70 tracking-widest block mb-1">Arquétipo Dominante</span>
                  <p className="text-2xl font-serif italic text-foreground uppercase tracking-tight">{tone.brand_archetype}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {tone.personality_traits?.map((trait, idx) => (
                  <Badge key={idx} className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 overflow-hidden">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-green-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Fazer (Do)
              </h4>
              <ul className="space-y-2">
                {tone.do_say?.map((text, idx) => (
                  <li key={idx} className="text-sm text-foreground/80 leading-relaxed pl-4 border-l-2 border-green-500/30">
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Evitar (Don't)
              </h4>
              <ul className="space-y-2">
                {tone.dont_say?.map((text, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2 border-destructive/30">
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
