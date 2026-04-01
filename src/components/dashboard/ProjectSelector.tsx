import { useState } from "react";
import { ChevronDown, Plus, FolderOpen, Check, Trash2, Loader2 } from "lucide-react";
import { fetchAllProjects, setCurrentProjectId, deleteProject, type DbProject } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProjectSelectorProps {
  currentProject: DbProject | null;
  onCreateNew: () => void;
}

export function ProjectSelector({ currentProject, onCreateNew }: ProjectSelectorProps) {
  const [open, setOpen]                           = useState(false);
  const [toDelete, setToDelete]                   = useState<DbProject | null>(null);
  const queryClient                               = useQueryClient();

  // ── Busca a lista de projetos apenas quando o dropdown abre ───────────────
  const { data: projects = [], isFetching } = useQuery({
    queryKey: ["all-projects"],
    queryFn: fetchAllProjects,
    enabled: open,           // só busca quando o dropdown estiver aberto
    staleTime: 30_000,       // 30s — lista de projetos muda raramente
  });

  // ── Troca de projeto ──────────────────────────────────────────────────────
  const switchProject = (project: DbProject) => {
    setCurrentProjectId(project.id);
    queryClient.invalidateQueries();  // invalida tudo — novo contexto de projeto
    setOpen(false);
  };

  // ── Exclusão com confirmação via AlertDialog (sem `confirm()` nativo) ─────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-projects"] });
      queryClient.invalidateQueries();
      toast.success("Projeto excluído.");
      setToDelete(null);
    },
    onError: () => {
      toast.error("Erro ao excluir projeto. Tente novamente.");
      setToDelete(null);
    },
  });

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm md:text-lg font-bold text-foreground hover:text-primary transition-colors min-w-0"
        >
          <span className="truncate max-w-[120px] md:max-w-[250px]">
            {currentProject?.name ?? "Carregando..."}
          </span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">

              {/* Header */}
              <div className="p-3 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">Seus Projetos</p>
              </div>

              {/* Lista */}
              <div className="max-h-60 overflow-y-auto">
                {isFetching ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Carregando...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Nenhum projeto encontrado
                  </div>
                ) : (
                  projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => switchProject(project)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors group ${
                        currentProject?.id === project.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-[10px] text-muted-foreground truncate">{project.description}</p>
                        )}
                      </div>
                      {currentProject?.id === project.id ? (
                        <Check className="w-4 h-4 shrink-0 text-primary" />
                      ) : (
                        <span
                          role="button"
                          onClick={e => { e.stopPropagation(); setToDelete(project); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Excluir projeto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Rodapé — criar projeto */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => { setOpen(false); onCreateNew(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Projeto
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Dialog de confirmação de exclusão ─────────────────────────────── */}
      <AlertDialog open={!!toDelete} onOpenChange={v => { if (!v) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{toDelete?.name}"</strong>?
              Todos os dados associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Excluindo...
                </span>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
