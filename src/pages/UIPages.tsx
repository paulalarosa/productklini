import { Palette, Layers, ArrowRightLeft } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { useTasks } from "@/hooks/useProjectData";

export function DesignSystemPage() {
  const { data: tasks } = useTasks();
  const uiTasks = (tasks ?? []).filter((t) => t.module === "ui");

  return (
    <ModulePage title="Design System" subtitle="Biblioteca de componentes UI" icon={<Palette className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Componentes em Desenvolvimento</h3>
        <div className="space-y-2">
          {uiTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-xs font-medium text-foreground">{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{t.assignee}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                t.status === "done" ? "bg-status-develop/10 text-status-develop" :
                t.status === "in_progress" ? "bg-status-discovery/10 text-status-discovery" :
                "bg-secondary text-muted-foreground"
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </ModulePage>
  );
}

export function TelasPage() {
  return (
    <ModulePage title="Telas" subtitle="Designs e mockups do projeto" icon={<Layers className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Conecte o Figma para visualizar as telas aqui.</p>
        </div>
      </div>
    </ModulePage>
  );
}

export function HandoffPage() {
  return (
    <ModulePage title="Handoff" subtitle="Entrega de Design para Dev" icon={<ArrowRightLeft className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <ArrowRightLeft className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">O Inspetor de Design System e gerador de snippets aparecerão aqui.</p>
          <p className="text-xs text-muted-foreground mt-1">Componentes do Figma serão comparados com o código existente.</p>
        </div>
      </div>
    </ModulePage>
  );
}
