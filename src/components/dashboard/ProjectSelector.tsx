import { useState, useEffect } from "react";
import { ChevronDown, Plus, FolderOpen, Check, Trash2 } from "lucide-react";
import { fetchAllProjects, setCurrentProjectId, deleteProject, type DbProject } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectSelectorProps {
  currentProject: DbProject | null;
  onCreateNew: () => void;
}

export function ProjectSelector({ currentProject, onCreateNew }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const all = await fetchAllProjects();
      setProjects(all);
    } catch (e) {
      console.error("Error loading projects:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadProjects();
  }, [open]);

  const switchProject = (project: DbProject) => {
    setCurrentProjectId(project.id);
    queryClient.invalidateQueries();
    setOpen(false);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      await loadProjects();
      queryClient.invalidateQueries();
    } catch (e) {
      console.error("Error deleting project:", e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm md:text-lg font-bold text-foreground hover:text-primary transition-colors min-w-0"
      >
        <span className="truncate max-w-[120px] md:max-w-[250px]">{currentProject?.name ?? "Carregando..."}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">Seus Projetos</p>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
              ) : projects.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Nenhum projeto encontrado</div>
              ) : (
                projects.map((project) => (
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
                      <button
                        onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-border">
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
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
  );
}
