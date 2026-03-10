import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Briefcase, Edit, Trash2, Calendar, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BusinessModelCanvasView } from "@/components/dashboard/BusinessModelCanvasView";
import { 
  useBusinessModelCanvases, 
  useBusinessModelCanvas, 
  useCreateBusinessModelCanvas,
  useDeleteBusinessModelCanvas 
} from "@/hooks/useBusinessModelCanvas";
import { toast } from "sonner";

export default function BusinessModelCanvasPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canvasId = searchParams.get("canvas");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [newCanvasDescription, setNewCanvasDescription] = useState("");
  
  const { data: canvases, isLoading } = useBusinessModelCanvases();
  const { data: selectedCanvas, isLoading: isLoadingCanvas } = useBusinessModelCanvas(canvasId || undefined);
  const { mutate: createCanvas, isPending: isCreating } = useCreateBusinessModelCanvas();
  const { mutate: deleteCanvas } = useDeleteBusinessModelCanvas();

  const handleCreateCanvas = () => {
    if (!newCanvasName.trim()) return;
    
    createCanvas({
      name: newCanvasName,
      description: newCanvasDescription || undefined,
    }, {
      onSuccess: (data) => {
        toast.success("Canvas criado com sucesso!");
        setIsCreateDialogOpen(false);
        setNewCanvasName("");
        setNewCanvasDescription("");
        setSearchParams({ canvas: data.id });
      },
      onError: (error) => {
        toast.error("Erro ao criar canvas");
        console.error(error);
      }
    });
  };

  const handleDeleteCanvas = (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o canvas "${name}"?`)) return;
    
    deleteCanvas(id, {
      onSuccess: () => {
        toast.success("Canvas excluído com sucesso!");
        if (canvasId === id) {
          setSearchParams({});
        }
      },
      onError: () => {
        toast.error("Erro ao excluir canvas");
      }
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (canvasId && selectedCanvas) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setSearchParams({})}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Business Model Canvas</h2>
              <p className="text-xs text-muted-foreground">Colaboração em tempo real</p>
            </div>
          </div>
        </div>

        {isLoadingCanvas ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Carregando canvas...</div>
          </div>
        ) : (
          <BusinessModelCanvasView canvas={selectedCanvas} />
        )}
      </motion.div>
    );
  }

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
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Business Model Canvas</h2>
            <p className="text-xs text-muted-foreground">Modelos de negócio interativos com colaboração em tempo real</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Meus Canvas</h3>
          <p className="text-sm text-muted-foreground">Gerencie seus modelos de negócio</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Canvas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Canvas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Nome do Canvas
                </label>
                <Input
                  placeholder="Ex: Produto Digital SaaS"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Descrição (opcional)
                </label>
                <Textarea
                  placeholder="Descreva o contexto do modelo de negócio..."
                  value={newCanvasDescription}
                  onChange={(e) => setNewCanvasDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateCanvas}
                  disabled={!newCanvasName.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? "Criando..." : "Criar Canvas"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : canvases && canvases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canvases.map((canvas) => (
            <Card key={canvas.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {canvas.name}
                  </CardTitle>
                  <Badge variant={canvas.status === "published" ? "default" : "secondary"}>
                    {canvas.status === "published" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                {canvas.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {canvas.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(canvas.updated_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Colaborativo
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSearchParams({ canvas: canvas.id })}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCanvas(canvas.id, canvas.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum Canvas Criado
            </h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro Business Model Canvas para começar a estruturar seu modelo de negócio.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Canvas
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}