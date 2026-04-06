import { useState, useRef } from "react";
import { Mic, Loader2, Sparkles, FileText, ClipboardPaste, FileDown } from "lucide-react";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { DocumentManager } from "@/components/dashboard/DocumentManager";
import { useDocuments } from "@/hooks/useProjectData";
import { getProjectId } from "@/lib/api";
import { getAuthHeaders } from "@/lib/authHeaders";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const getAnalyzeUrl = () => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ux`;

export function InterviewTranscriberPage() {
  const { data: docs } = useDocuments("interview_analysis");
  const reportRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 50) {
      toast.error("Cole pelo menos 50 caracteres da transcrição");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const projectId = await getProjectId();
      const headers = await getAuthHeaders();
      const resp = await fetch(getAnalyzeUrl(), {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "analyze_interview", content: text, project_id: projectId }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data.error || "Erro na análise"); setAnalyzing(false); return; }
      setResult(data.result);

      // Auto-save as document
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("project_documents").insert({
        project_id: projectId,
        doc_type: "interview_analysis",
        title: `Análise de Entrevista — ${new Date().toLocaleDateString("pt-BR")}`,
        content: data.result,
        ai_generated: true,
        metadata: { source_length: text.length, analyzed_at: new Date().toISOString() },
      });
      toast.success("Análise concluída e salva!");
    } catch {
      toast.error("Erro de conexão");
    }
    setAnalyzing(false);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
      toast.success("Texto colado da área de transferência");
    } catch {
      toast.error("Não foi possível acessar a área de transferência");
    }
  };
  
  const handleExportPdf = async () => {
    if (!reportRef.current || !result) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0e12",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`interview-analysis-${new Date().getTime()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <ModulePage 
        title="Transcritor de Entrevistas" 
        subtitle="Cole a transcrição e a IA extrai insights automaticamente" 
        icon={<Mic className="w-4 h-4 text-primary-foreground" />}
      >
        <div className="space-y-6">
          {/* Input area */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Transcrição da Entrevista</h3>
              <button onClick={handlePaste} className="flex items-center justify-center sm:justify-start w-full sm:w-auto gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <ClipboardPaste className="w-3.5 h-3.5" /> Colar
              </button>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Cole aqui a transcrição da entrevista com o usuário. Pode ser texto corrido, notas, ou Q&A formatado. A IA vai extrair automaticamente pain points, insights, citações-chave e oportunidades de design..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y font-mono leading-relaxed"
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground">{text.length} caracteres</span>
              <button 
                onClick={handleAnalyze} 
                disabled={analyzing || text.trim().length < 50}
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? "Analisando com IA..." : "Analisar Entrevista"}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Análise da IA
                </h3>
                <button
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {exporting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileDown className="w-3 h-3" />
                  )}
                  EXPORTAR PDF
                </button>
              </div>
              
              <div ref={reportRef} className="prose prose-invert prose-sm max-w-none text-foreground">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="text-xs text-foreground/80 leading-relaxed mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="text-xs text-foreground/80">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                    table: ({ children }) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                    th: ({ children }) => <th className="border border-border px-2 py-1.5 bg-secondary text-foreground font-semibold text-left">{children}</th>,
                    td: ({ children }) => <td className="border border-border px-2 py-1.5 text-foreground/80">{children}</td>,
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Previous analyses */}
          {(docs ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Análises Anteriores
              </h3>
              <DocumentManager
                documents={docs ?? []}
                docType="interview_analysis"
                docTypeLabel="Análise de Entrevista"
                emptyIcon={<Mic className="w-10 h-10 text-muted-foreground/30 mx-auto" />}
                emptyMessage="Nenhuma análise salva"
              />
            </div>
          )}
        </div>
      </ModulePage>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .prose { color: black !important; font-size: 12px !important; }
          .prose h1, .prose h2, .prose h3 { color: black !important; }
          .prose blockquote { border-left-color: #ccc !important; color: #666 !important; }
        }
      `}</style>
    </>
  );
}
