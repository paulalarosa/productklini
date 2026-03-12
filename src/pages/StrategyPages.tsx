import { useState } from "react";
import { ArrowUpDown, Network, Plus, Check, X } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { SitemapTree } from "@/components/dashboard/SitemapTree";
import { useDocuments } from "@/hooks/useProjectData";
import { useSitemap, useDeleteSitemap } from "@/hooks/useSitemap";
import { AIGenerateButton } from "@/components/dashboard/AIGenerateButton";
import { useCurrentProjectId } from "@/hooks/useCurrentProjectId";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function PrioritizationMatrixPage() {
  const { data: docs } = useDocuments("prioritization_matrix");
  return (
    <ModulePage
      title="Matriz de Priorização"
      subtitle="Impacto vs Esforço para decisões de produto"
      icon={<ArrowUpDown className="w-4 h-4 text-primary-foreground" />}
      actions={
        <AIGenerateButton
          prompt="Crie uma matriz de priorização para o projeto. Use create_document com doc_type='prioritization_matrix'. Analise as funcionalidades e organize por impacto vs esforço."
          label="Gerar Matriz"
          invalidateKeys={[["documents"]]}
          size="sm"
        />
      }
    >
      <DocumentManager documents={docs ?? []} docType="prioritization_matrix" docTypeLabel="Matriz de Priorização" emptyIcon={<ArrowUpDown className="w-10 h-10 text-muted-foreground/30 mx-auto" />} emptyMessage="Nenhuma matriz de priorização criada" />
    </ModulePage>
  );
}

export function SitemapPage() {
  const projectId = useCurrentProjectId();
  const { data: nodes, isLoading } = useSitemap(projectId);
  const { mutate: deleteNode } = useDeleteSitemap();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ node_name: "", url_path: "", description: "" });

  const handleAdd = async () => {
    if (!form.node_name.trim() || !projectId) return;
    const { error } = await supabase.from("sitemaps").insert({
      project_id: projectId,
      node_name: form.node_name.trim(),
      url_path: form.url_path.trim() || "/",
      description: form.description.trim(),
      hierarchy_level: 0,
    });
    if (error) { toast.error("Erro ao criar nó"); return; }
    queryClient.invalidateQueries({ queryKey: ["sitemaps"] });
    setForm({ node_name: "", url_path: "", description: "" });
    setAdding(false);
    toast.success("Nó adicionado");
  };

  return (
    <ModulePage
      title="Sitemap"
      subtitle="Mapa hierárquico de telas e navegação"
      icon={<Network className="w-4 h-4 text-primary-foreground" />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo Nó
          </button>
          <AIGenerateButton
            prompt="Crie uma estrutura de sitemap completa para o projeto. Use create_sitemap com nós hierárquicos incluindo páginas principais, subpáginas e fluxos de navegação."
            label="Gerar Sitemap"
            invalidateKeys={[["sitemaps"]]}
            size="sm"
          />
        </div>
      }
    >
      {adding && (
        <div className="glass-card p-4 mb-4 space-y-3 border-2 border-primary/20">
          <h4 className="text-sm font-semibold text-foreground">Novo Nó do Sitemap</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.node_name} onChange={e => setForm(f => ({ ...f, node_name: e.target.value }))} placeholder="Nome da Página *" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" autoFocus />
            <input value={form.url_path} onChange={e => setForm(f => ({ ...f, url_path: e.target.value }))} placeholder="URL Path (ex: /home)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
              <Check className="w-3 h-3 inline mr-1" />Adicionar
            </button>
          </div>
        </div>
      )}
      <SitemapTree nodes={nodes ?? []} onDelete={(id) => deleteNode({ id })} />
      {!isLoading && (!nodes || nodes.length === 0) && !adding && (
        <div className="py-20 text-center border-2 border-dashed border-muted rounded-xl">
          <Network className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Sitemap Vazio</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie nós manualmente ou gere com IA.</p>
        </div>
      )}
    </ModulePage>
  );
}
