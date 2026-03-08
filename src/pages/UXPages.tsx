import { Search, Users, Route } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { usePersonas } from "@/hooks/useProjectData";
import { useTasks } from "@/hooks/useProjectData";

export function PesquisasPage() {
  const { data: tasks } = useTasks();
  const uxTasks = (tasks ?? []).filter((t) => t.module === "ux");

  return (
    <ModulePage title="Pesquisas" subtitle="Repositório de pesquisas UX" icon={<Search className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tarefas de Pesquisa</h3>
        <div className="space-y-2">
          {uxTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-xs font-medium text-foreground">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.assignee} · {t.phase}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                t.status === "done" ? "bg-status-develop/10 text-status-develop" :
                t.status === "blocked" ? "bg-destructive/10 text-status-urgent" :
                "bg-status-discovery/10 text-status-discovery"
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </ModulePage>
  );
}

export function PersonasPage() {
  const { data: personas } = usePersonas();

  return (
    <ModulePage title="Personas" subtitle="Perfis de usuários do projeto" icon={<Users className="w-4 h-4 text-primary-foreground" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(personas ?? []).map((p) => (
          <div key={p.id} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{p.role}</p>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-status-urgent">Dores</span>
                <ul className="mt-1 space-y-1">
                  {p.pain_points.map((pp) => (
                    <li key={pp} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-status-urgent mt-0.5">•</span>{pp}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-status-develop">Objetivos</span>
                <ul className="mt-1 space-y-1">
                  {p.goals.map((g) => (
                    <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-status-develop mt-0.5">•</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}

export function FluxosPage() {
  return (
    <ModulePage title="Fluxos de Jornada" subtitle="Mapas de jornada do usuário" icon={<Route className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <Route className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Os mapas de jornada do projeto serão exibidos aqui.</p>
          <p className="text-xs text-muted-foreground mt-1">Integre com o Figma para importar fluxos automaticamente.</p>
        </div>
      </div>
    </ModulePage>
  );
}
