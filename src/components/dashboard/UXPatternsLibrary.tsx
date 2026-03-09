import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UXPatternCard } from "./UXPatternCard";
import { useUXPatterns, PATTERN_CATEGORIES, PATTERN_TYPES, DIFFICULTY_LEVELS } from "@/hooks/useUXPatterns";
import { Search, Filter, Grid3X3, List, Loader2, Smartphone } from "lucide-react";

export function UXPatternsLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: patterns, isLoading } = useUXPatterns({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    pattern_type: selectedType !== "all" ? selectedType : undefined,
    difficulty_level: selectedDifficulty !== "all" ? selectedDifficulty : undefined,
    search: searchTerm || undefined,
  });

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedDifficulty("all");
    setSearchTerm("");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedType !== "all" || selectedDifficulty !== "all" || searchTerm;

  const groupedPatterns = patterns?.reduce((acc, pattern) => {
    const category = pattern.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(pattern);
    return acc;
  }, {} as Record<string, typeof patterns>) ?? {};

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Buscar & Filtrar Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar patterns por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {PATTERN_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {PATTERN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Dificuldades</SelectItem>
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary">
                  {PATTERN_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge variant="secondary">
                  {PATTERN_TYPES.find(t => t.value === selectedType)?.label}
                </Badge>
              )}
              {selectedDifficulty !== "all" && (
                <Badge variant="secondary">
                  {DIFFICULTY_LEVELS.find(d => d.value === selectedDifficulty)?.label}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary">"{searchTerm}"</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Carregando patterns...</span>
        </div>
      ) : !patterns || patterns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum pattern encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? "Tente ajustar os filtros para encontrar patterns relevantes."
                : "Não há patterns disponíveis no momento."
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {patterns.length} pattern{patterns.length !== 1 ? "s" : ""} encontrado{patterns.length !== 1 ? "s" : ""}
            </p>
          </div>

          {viewMode === "grid" ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="all">
                  Todos ({patterns.length})
                </TabsTrigger>
                <TabsTrigger value="flutter" className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Flutter ({groupedPatterns["flutter"]?.length ?? 0})
                </TabsTrigger>
                {Object.entries(groupedPatterns)
                  .filter(([cat]) => cat !== "flutter")
                  .map(([category, categoryPatterns]) => (
                    <TabsTrigger key={category} value={category}>
                      {PATTERN_CATEGORIES.find(c => c.value === category)?.label || category} ({categoryPatterns.length})
                    </TabsTrigger>
                  ))}
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patterns.map((pattern) => (
                    <UXPatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="flutter" className="mt-6">
                {(groupedPatterns["flutter"]?.length ?? 0) > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Smartphone className="w-4 h-4 text-primary" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Biblioteca Flutter:</span> Widgets, padrões e boas práticas do Material Design 3 para apps Flutter.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(groupedPatterns["flutter"] ?? []).map((pattern) => (
                        <UXPatternCard key={pattern.id} pattern={pattern} />
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Smartphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum pattern Flutter disponível.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {Object.entries(groupedPatterns)
                .filter(([cat]) => cat !== "flutter")
                .map(([category, categoryPatterns]) => (
                  <TabsContent key={category} value={category} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryPatterns.map((pattern) => (
                        <UXPatternCard key={pattern.id} pattern={pattern} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
            </Tabs>
          ) : (
            <div className="space-y-4">
              {patterns.map((pattern) => (
                <UXPatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}