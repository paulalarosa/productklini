import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette, Search, Filter, Plus, X, Grid, Target, 
  Lightbulb, Code, Users, MousePointer2, Square, Circle, Type
} from "lucide-react";
import { useUXPatterns, PATTERN_CATEGORIES, PATTERN_TYPES, DIFFICULTY_LEVELS } from "@/hooks/useUXPatterns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type UXPattern = Tables<"ux_patterns">;

interface UXPatternsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPattern: (pattern: UXPattern, elements: CanvasElement[]) => void;
}

interface CanvasElement {
  id: string;
  type: "rect" | "circle" | "text" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  rotation: number;
}

// Pattern to canvas elements mapping
const patternToElements: Record<string, (x: number, y: number) => CanvasElement[]> = {
  // Navigation patterns
  "navigation-breadcrumb": (x, y) => [
    { id: crypto.randomUUID(), type: "text", x, y, width: 60, height: 20, fill: "#3B82F6", text: "Home", fontSize: 14, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 70, y, width: 10, height: 20, fill: "#6B7280", text: ">", fontSize: 14, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 90, y, width: 80, height: 20, fill: "#3B82F6", text: "Products", fontSize: 14, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 180, y, width: 10, height: 20, fill: "#6B7280", text: ">", fontSize: 14, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 200, y, width: 60, height: 20, fill: "#1F2937", text: "Detail", fontSize: 14, rotation: 0 },
  ],
  
  // Forms patterns
  "form-validation": (x, y) => [
    { id: crypto.randomUUID(), type: "rect", x, y, width: 300, height: 40, fill: "#FFFFFF", stroke: "#D1D5DB", strokeWidth: 1, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 10, y: y - 25, width: 100, height: 20, fill: "#374151", text: "Email *", fontSize: 14, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 10, y: y + 10, width: 200, height: 20, fill: "#9CA3AF", text: "Digite seu email", fontSize: 12, rotation: 0 },
    { id: crypto.randomUUID(), type: "rect", x, y: y + 50, width: 300, height: 20, fill: "#FEF2F2", stroke: "#FECACA", strokeWidth: 1, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 10, y: y + 55, width: 200, height: 15, fill: "#DC2626", text: "Email inválido", fontSize: 12, rotation: 0 },
  ],
  
  // CTAs
  "cta-button": (x, y) => [
    { id: crypto.randomUUID(), type: "rect", x, y, width: 150, height: 44, fill: "#3B82F6", stroke: "#2563EB", strokeWidth: 1, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 25, y: y + 15, width: 100, height: 20, fill: "#FFFFFF", text: "Começar Agora", fontSize: 14, rotation: 0 },
  ],
  
  // Social proof
  "social-proof-testimonial": (x, y) => [
    { id: crypto.randomUUID(), type: "rect", x, y, width: 320, height: 120, fill: "#F9FAFB", stroke: "#E5E7EB", strokeWidth: 1, rotation: 0 },
    { id: crypto.randomUUID(), type: "circle", x: x + 20, y: y + 20, width: 40, height: 40, fill: "#D1D5DB", rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 75, y: y + 25, width: 100, height: 18, fill: "#1F2937", text: "Maria Silva", fontSize: 14, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 75, y: y + 45, width: 120, height: 15, fill: "#6B7280", text: "CEO, TechCorp", fontSize: 12, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 20, y: y + 75, width: 280, height: 30, fill: "#374151", text: "\"Esta ferramenta transformou nosso processo\"", fontSize: 13, rotation: 0 },
  ],
  
  // Urgency/Scarcity
  "urgency-timer": (x, y) => [
    { id: crypto.randomUUID(), type: "rect", x, y, width: 200, height: 60, fill: "#FEF2F2", stroke: "#FECACA", strokeWidth: 2, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 10, y: y + 10, width: 180, height: 18, fill: "#DC2626", text: "⏰ Oferta termina em:", fontSize: 12, rotation: 0 },
    { id: crypto.randomUUID(), type: "text", x: x + 50, y: y + 30, width: 100, height: 24, fill: "#991B1B", text: "02:45:33", fontSize: 18, rotation: 0 },
  ],
};

export function UXPatternsPanel({ isOpen, onClose, onApplyPattern }: UXPatternsPanelProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  
  const { data: patterns, isLoading } = useUXPatterns({
    search: search || undefined,
    category: categoryFilter || undefined,
    pattern_type: typeFilter || undefined,
    difficulty_level: difficultyFilter || undefined,
  });

  const handleApplyPattern = (pattern: UXPattern) => {
    const patternKey = pattern.name.toLowerCase().replace(/\s+/g, '-');
    const elementGenerator = patternToElements[patternKey] || patternToElements["cta-button"];
    
    // Generate elements at a default position (center of canvas)
    const elements = elementGenerator(400, 200);
    onApplyPattern(pattern, elements);
    
    toast.success(`Pattern "${pattern.name}" aplicado ao canvas!`);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setDifficultyFilter("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        className="fixed left-0 top-0 h-full w-80 bg-background border-r shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">UX Patterns</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {PATTERN_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {PATTERN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(search || categoryFilter || typeFilter || difficultyFilter) && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando patterns...</p>
              </div>
            ) : patterns && patterns.length > 0 ? (
              patterns.map((pattern) => (
                <Card key={pattern.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {pattern.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {pattern.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {pattern.category}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          pattern.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                          pattern.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {pattern.difficulty_level === 'beginner' ? 'Iniciante' :
                         pattern.difficulty_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </Badge>
                    </div>
                    
                    <Button
                      onClick={() => handleApplyPattern(pattern)}
                      size="sm"
                      className="w-full h-8 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Aplicar ao Canvas
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Grid className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum pattern encontrado</p>
                <p className="text-xs">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}