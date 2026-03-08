import { useState } from "react";
import { Type, Loader2, Sparkles, ClipboardPaste } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { getProjectId } from "@/lib/api";
import { getAuthHeaders } from "@/lib/authHeaders";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`;

export function MicrocopyValidatorPage() {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 10) {
      toast.error("Insira pelo menos 10 caracteres de microcopy");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "validate_microcopy", content: text, project_id: projectId }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data.error || "Erro"); setAnalyzing(false); return; }
      setResult(data.result);
      toast.success("Análise de microcopy concluída!");
    } catch {
      toast.error("Erro de conexão");
    }
    setAnalyzing(false);
  };

  return (
    <ModulePage title="Validador de Microcopy" subtitle="Cole textos da interface e a IA analisa e sugere melhorias" icon={<Type className="w-4 h-4 text-primary-foreground" />}>
      <div className="space-y-6">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Textos para Análise</h3>
            <button onClick={async () => {
              try { setText(await navigator.clipboard.readText()); toast.success("Colado!"); } catch { toast.error("Erro ao colar"); }
            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <ClipboardPaste className="w-3.5 h-3.5" /> Colar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole textos de botões, mensagens de erro, tooltips, títulos, placeholders — um por linha ou em blocos. A IA vai analisar cada um.
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Exemplos:\nSalvar alterações\nOcorreu um erro inesperado. Tente novamente.\nVocê tem certeza que deseja excluir?\nNenhum resultado encontrado\nClique aqui para saber mais\nSeu cadastro foi realizado com sucesso!`}
            rows={10}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono leading-relaxed"
          />
          <div className="flex justify-end">
            <button onClick={handleAnalyze} disabled={analyzing || text.trim().length < 10}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "Analisando..." : "Validar Microcopy"}
            </button>
          </div>
        </div>

        {result && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Resultado da Análise
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
      </div>
    </ModulePage>
  );
}
