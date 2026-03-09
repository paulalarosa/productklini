import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UXPatternsLibrary } from "@/components/dashboard/UXPatternsLibrary";
import { useUXPatterns } from "@/hooks/useUXPatterns";

export default function UXPatternsPage() {
  const navigate = useNavigate();
  const { data: patterns } = useUXPatterns();

  const stats = {
    total: patterns?.length ?? 0,
    persuasive: patterns?.filter(p => p.category === "persuasion").length ?? 0,
    components: patterns?.filter(p => p.pattern_type === "component").length ?? 0,
    principles: patterns?.filter(p => p.pattern_type === "principle").length ?? 0,
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Biblioteca UX Patterns</h2>
            <p className="text-xs text-muted-foreground">Templates e exemplos práticos de design persuasivo</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <BookOpen className="w-3 h-3" />
              Disponíveis na biblioteca
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Design Persuasivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.persuasive}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" />
              Patterns de persuasão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.components}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              Templates prontos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Princípios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.principles}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Conceitos fundamentais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Library */}
      <UXPatternsLibrary />
    </motion.div>
  );
}