import { useState } from "react";
import { Shield, Loader2, Sparkles } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";
import { getProjectId } from "@/lib/api";
import { getAuthHeaders } from "@/lib/authHeaders";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const getAnalyzeUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`;

export function WCAGAuditorPage() {
  const { data: docs } = useDocuments("wcag_audit");
  const [context, setContext] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAudit = async () => {
    setAuditing(true);
    setResult(null);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();
      const extraContext = context.trim()
        ? `\n\nInformações adicionais do usuário:\n${context}`
        : "\n\nFaça a auditoria baseada apenas no contexto do projeto disponível.";
      const resp = await fetch(getAnalyzeUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "audit_wcag", content: extraContext, project_id: projectId }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data.error || "Erro"); setAuditing(false); return; }
      setResult(data.result);

      // Auto-save
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("project_documents").insert({
        project_id: projectId,
        doc_type: "wcag_audit",
        title: `Auditoria WCAG — ${new Date().toLocaleDateString("pt-BR")}`,
        content: data.result,
        ai_generated: true,
        metadata: { audited_at: new Date().toISOString() },
      });
      toast.success("Auditoria WCAG concluída e salva!");
    } catch {
      toast.error("Erro de conexão");
    }
    setAuditing(false);
  };

  return (
    <ModulePage title="Auditor WCAG com IA" subtitle="Análise automatizada de acessibilidade do produto" icon={<Shield className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Auditoria de Acessibilidade</h3>
          <p className="text-xs text-muted-foreground">
            A IA vai analisar o contexto do seu projeto (personas, fluxos, componentes) e gerar uma auditoria WCAG 2.1 completa com recomendações específicas. Opcionalmente, descreva detalhes adicionais:
          </p>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="(Opcional) Descreva tecnologias usadas, componentes específicos, ou áreas de preocupação. Ex: 'Usamos muitos modais e formulários complexos. O app tem modo escuro. Temos gráficos com recharts.'"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
          <div className="flex justify-end">
            <button onClick={handleAudit} disabled={auditing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50">
              {auditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {auditing ? "Auditando..." : "Executar Auditoria WCAG"}
            </button>
          </div>
        </div>

        {result && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Relatório de Auditoria
            </h3>
            <div className="prose prose-invert prose-sm max-w-none text-foreground">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="text-xs text-foreground/80 leading-relaxed mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
                  li: ({ children }) => <li className="text-xs text-foreground/80">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  table: ({ children }) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                  th: ({ children }) => <th className="border border-border px-2 py-1.5 bg-secondary text-foreground font-semibold text-left">{children}</th>,
                  td: ({ children }) => <td className="border border-border px-2 py-1.5 text-foreground/80">{children}</td>,
                }}
              >{result}</ReactMarkdown>
            </div>
          </div>
        )}

        {(docs ?? []).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Auditorias Anteriores</h3>
            <DocumentManager
              documents={docs ?? []}
              docType="wcag_audit"
              docTypeLabel="Auditoria WCAG"
              emptyIcon={<Shield className="w-10 h-10 text-muted-foreground/30 mx-auto" />}
              emptyMessage="Nenhuma auditoria salva"
            />
          </div>
        )}
      </div>
    </ModulePage>
  );
}
