import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Network, Plus, Trash2, ChevronRight, ChevronDown, GripVertical, Sparkles, Loader2 } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { getProjectId } from "@/lib/api";
import { getAuthHeaders } from "@/lib/authHeaders";
import { toast } from "sonner";

const getGenerateUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docs`;

interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  collapsed?: boolean;
}

let nextId = 1;
const uid = () => `node-${nextId++}`;

function TreeItem({ node, depth, onUpdate, onDelete, onAddChild, onToggle }: {
  node: TreeNode; depth: number;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(node.label);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1 group py-0.5" style={{ paddingLeft: `${depth * 20}px` }}>
        <button onClick={() => onToggle(node.id)} className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (node.collapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />) : <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />}
        </button>
        <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0" />
        {editing ? (
          <input value={label} onChange={e => setLabel(e.target.value)} autoFocus
            onBlur={() => { onUpdate(node.id, label); setEditing(false); }}
            onKeyDown={e => { if (e.key === "Enter") { onUpdate(node.id, label); setEditing(false); } }}
            className="flex-1 px-2 py-0.5 rounded bg-secondary border border-primary/30 text-xs text-foreground focus:outline-none" />
        ) : (
          <span className="flex-1 text-xs text-foreground cursor-pointer hover:text-primary transition-colors"
            onDoubleClick={() => setEditing(true)}>{node.label}</span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button onClick={() => onAddChild(node.id)} className="p-0.5 rounded hover:bg-accent" title="Adicionar sub-item">
            <Plus className="w-3 h-3 text-muted-foreground" />
          </button>
          {depth > 0 && (
            <button onClick={() => onDelete(node.id)} className="p-0.5 rounded hover:bg-destructive/10" title="Remover">
              <Trash2 className="w-3 h-3 text-destructive/70" />
            </button>
          )}
        </div>
      </div>
      {!node.collapsed && node.children.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1}
          onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} onToggle={onToggle} />
      ))}
    </div>
  );
}

export function VisualSitemapPage() {
  const [tree, setTree] = useState<TreeNode[]>([
    { id: uid(), label: "Home", children: [
      { id: uid(), label: "Dashboard", children: [] },
      { id: uid(), label: "Perfil", children: [
        { id: uid(), label: "Configurações", children: [] },
      ] },
    ] },
  ]);
  const [generating, setGenerating] = useState(false);

  const updateNode = (nodes: TreeNode[], id: string, label: string): TreeNode[] =>
    nodes.map(n => n.id === id ? { ...n, label } : { ...n, children: updateNode(n.children, id, label) });

  const deleteNode = (nodes: TreeNode[], id: string): TreeNode[] =>
    nodes.filter(n => n.id !== id).map(n => ({ ...n, children: deleteNode(n.children, id) }));

  const addChild = (nodes: TreeNode[], parentId: string): TreeNode[] =>
    nodes.map(n => n.id === parentId
      ? { ...n, collapsed: false, children: [...n.children, { id: uid(), label: "Nova Página", children: [] }] }
      : { ...n, children: addChild(n.children, parentId) });

  const toggleNode = (nodes: TreeNode[], id: string): TreeNode[] =>
    nodes.map(n => n.id === id ? { ...n, collapsed: !n.collapsed } : { ...n, children: toggleNode(n.children, id) });

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();
      const resp = await fetch(getGenerateUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify({ doc_type: "sitemap", project_id: projectId }),
      });
      if (resp.ok) {
        toast.success("Sitemap gerado como documento! Veja na página Sitemap (documentos).");
      } else {
        const data = await resp.json().catch(() => ({}));
        toast.error(data.error || "Erro ao gerar");
      }
    } catch {
      toast.error("Erro de conexão");
    }
    setGenerating(false);
  };

  const addRootNode = () => {
    setTree(prev => [...prev, { id: uid(), label: "Nova Seção", children: [] }]);
  };

  const countNodes = (nodes: TreeNode[]): number =>
    nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);

  return (
    <ModulePage title="Sitemap Visual" subtitle="Mapa hierárquico interativo de telas e navegação" icon={<Network className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Clique duplo para editar • {countNodes(tree)} páginas mapeadas
          </p>
          <div className="flex gap-2">
            <button onClick={handleGenerateAI} disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium disabled:opacity-50">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Gerar com IA
            </button>
            <button onClick={addRootNode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-3.5 h-3.5" /> Seção Raiz
            </button>
          </div>
        </div>

        <motion.div className="glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tree.map(node => (
            <TreeItem key={node.id} node={node} depth={0}
              onUpdate={(id, label) => setTree(prev => updateNode(prev, id, label))}
              onDelete={(id) => setTree(prev => deleteNode(prev, id))}
              onAddChild={(id) => setTree(prev => addChild(prev, id))}
              onToggle={(id) => setTree(prev => toggleNode(prev, id))}
            />
          ))}
        </motion.div>
      </div>
    </ModulePage>
  );
}
