import { useState, forwardRef } from "react";
import { FileText, Sparkles, Pencil, Trash2, Save, X, Plus, Loader2, Eye, EyeOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { getProjectId, type DbProjectDocument } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/authHeaders";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const getGenerateUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docs`;

interface Props {
  documents: DbProjectDocument[];
  docType: string;
  docTypeLabel: string;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
}

// forwardRef needed because ModulePage wraps children in motion.div which tries to pass refs
export const DocumentManager = forwardRef<HTMLDivElement, Props>(
  function DocumentManagerRender({ documents, docType, docTypeLabel, emptyIcon, emptyMessage }, ref) {
    const queryClient = useQueryClient();
    const [generating, setGenerating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});

    const handleGenerate = async () => {
      setGenerating(true);
      try {
        const projectId = await getProjectId();
        if (!projectId) {
          toast.error("Nenhum projeto selecionado. Crie ou selecione um projeto primeiro.");
          setGenerating(false);
          return;
        }
        const headers = await getAuthHeaders();
        const resp = await fetch(getGenerateUrl(), {
          method: "POST",
          headers,
          body: JSON.stringify({ doc_type: docType, project_id: projectId }),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          let err: Record<string, string> = {};
          try { err = JSON.parse(text); } catch { /* ignore */ }
          const errorMessage = err.details
            ? `${err.error}: ${err.details}`
            : (err.error || "Erro ao gerar documento");
          toast.error(errorMessage, { duration: 5000 });
          setGenerating(false);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(`${docTypeLabel} gerado com IA!`);
      } catch {
        toast.error("Erro ao conectar com IA");
      }
      setGenerating(false);
    };

    const handleSaveEdit = async (id: string) => {
      const { error } = await supabase
        .from("project_documents")
        .update({ title: editTitle.trim(), content: editContent, ai_generated: false })
        .eq("id", id);
      if (error) { toast.error("Erro ao salvar"); return; }
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditingId(null);
      toast.success("Documento atualizado");
    };

    const handleDelete = async (id: string) => {
      const { error } = await supabase.from("project_documents").delete().eq("id", id);
      if (error) { toast.error("Erro ao remover"); return; }
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento removido");
    };

    const handleAddManual = async () => {
      if (!newTitle.trim()) return;
      const projectId = await getProjectId();
      if (!projectId) { toast.error("Nenhum projeto selecionado."); return; }
      const { error } = await supabase.from("project_documents").insert({
        project_id: projectId,
        doc_type: docType,
        title: newTitle.trim(),
        content: newContent,
        ai_generated: false,
      });
      if (error) { toast.error("Erro ao criar"); return; }
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setNewTitle(""); setNewContent(""); setAdding(false);
      toast.success("Documento criado");
    };

    const startEdit = (doc: DbProjectDocument) => {
      setEditingId(doc.id);
      setEditTitle(doc.title);
      setEditContent(doc.content);
    };

    const togglePreview = (id: string) => {
      setPreviewMode(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
      <div ref={ref} className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? "Gerando com IA..." : `Gerar ${docTypeLabel} com IA`}
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Criar manualmente
          </button>
        </div>

        {adding && (
          <div className="glass-card p-5 space-y-3 border-2 border-primary/20 animate-slide-down">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Título do documento" autoFocus
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
              placeholder="Conteúdo (suporta Markdown)" rows={8}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-xs" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setAdding(false); setNewTitle(""); setNewContent(""); }}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">Cancelar</button>
              <button onClick={handleAddManual}
                className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
                <Save className="w-3 h-3 inline mr-1" /> Salvar
              </button>
            </div>
          </div>
        )}

        {documents.length === 0 && !adding && (
          <EmptyState
            title={emptyMessage}
            description="Use o botão 'Gerar com IA' para criar um rascunho inicial ou crie manualmente."
            size="page"
          />
        )}

        <div className="stagger-children">
          {documents.map((doc) => (
            <div key={doc.id} className="glass-card overflow-hidden animate-fade-in">
            {editingId === doc.id ? (
              <div className="p-5 space-y-3">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                  rows={16}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono leading-relaxed" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
                    <X className="w-3 h-3 inline mr-1" /> Cancelar
                  </button>
                  <button onClick={() => handleSaveEdit(doc.id)}
                    className="px-4 py-1.5 rounded-lg text-xs gradient-primary text-primary-foreground hover:opacity-90 font-medium">
                    <Save className="w-3 h-3 inline mr-1" /> Salvar alterações
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{doc.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {doc.ai_generated && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">IA</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePreview(doc.id)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors" title={previewMode[doc.id] ? "Ver fonte" : "Ver preview"}>
                      {previewMode[doc.id] ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => startEdit(doc)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Editar">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Excluir">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="px-5 py-4 max-h-[500px] overflow-y-auto font-sans leading-relaxed text-sm">
                  {previewMode[doc.id] ? (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{doc.content}</pre>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-foreground">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2 tracking-tight">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-3 mb-2 tracking-tight">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1 tracking-tight">{children}</h3>,
                          p: ({ children }) => <p className="text-xs text-foreground/80 leading-relaxed mb-2">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-xs">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 text-xs">{children}</ol>,
                          li: ({ children }) => <li className="text-xs text-foreground/80">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          table: ({ children }) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                          th: ({ children }) => <th className="border border-border px-2 py-1.5 bg-secondary text-foreground font-semibold text-left">{children}</th>,
                          td: ({ children }) => <td className="border border-border px-2 py-1.5 text-foreground/80">{children}</td>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                          code: ({ children }) => <code className="px-1 py-0.5 rounded bg-secondary text-xs text-primary font-mono">{children}</code>,
                        }}
                      >
                        {doc.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      </div>
    );
  }
);
DocumentManager.displayName = "DocumentManager";
