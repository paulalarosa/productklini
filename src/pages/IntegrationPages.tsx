import { Figma, GitBranch, Settings } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";

export function FigmaPage() {
  return (
    <ModulePage title="Figma" subtitle="Integração com design" icon={<Figma className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <Figma className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Conecte sua conta do Figma para visualizar telas e componentes.</p>
          <button className="mt-4 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            Conectar Figma
          </button>
        </div>
      </div>
    </ModulePage>
  );
}

export function GitHubPage() {
  return (
    <ModulePage title="GitHub" subtitle="Integração com código" icon={<GitBranch className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Conecte o repositório GitHub para sync de commits e PRs.</p>
          <button className="mt-4 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            Conectar GitHub
          </button>
        </div>
      </div>
    </ModulePage>
  );
}

export function ConfigPage() {
  return (
    <ModulePage title="Configurações" subtitle="Preferências do projeto" icon={<Settings className="w-4 h-4 text-primary-foreground" />}>
      <div className="glass-card p-5">
        <div className="text-center py-12">
          <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Configurações de integrações e projeto.</p>
        </div>
      </div>
    </ModulePage>
  );
}
