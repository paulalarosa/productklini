import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layers, FileText, Clock, AlertTriangle, Loader2 } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SharePayload = {
  id: string;
  token: string;
  doc_type: string;
  title: string;
  content: string;
  project_name: string;
  expires_at: string | null;
  created_at: string;
};

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchSharedDoc(token: string): Promise<SharePayload> {
  const { data, error } = await supabase
    .from("shared_documents")
    .select("*, project_documents(title, content, doc_type), projects(name)")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error("Erro ao buscar documento compartilhado.");
  if (!data)  throw new Error("NOT_FOUND");

  // Verifica expiração
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error("EXPIRED");
  }

  // A estrutura de retorno depende de como as relações estão no Supabase.
  // Ajustando para lidar com o retorno do join (que vem como array ou objeto dependendo da config)
  const doc = Array.isArray(data.project_documents) ? data.project_documents[0] : data.project_documents;
  const proj = Array.isArray(data.projects) ? data.projects[0] : data.projects;

  return {
    id:           data.id,
    token:        data.token,
    doc_type:     doc?.doc_type ?? "",
    title:        doc?.title    ?? "Documento",
    content:      doc?.content  ?? "",
    project_name: proj?.name    ?? "",
    expires_at:   data.expires_at,
    created_at:   data.created_at,
  };
}

// ─── Estados de erro ──────────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-background">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Link inválido</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Este link de compartilhamento não existe ou foi removido.
        </p>
      </div>
      <Link
        to="/login"
        className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
      >
        Ir para o app
      </Link>
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-background">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
        <Clock className="w-8 h-8 text-amber-500/70" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Link expirado</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Este link de compartilhamento expirou. Solicite um novo link ao autor.
        </p>
      </div>
      <Link
        to="/login"
        className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
      >
        Ir para o app
      </Link>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ShareViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-doc", token],
    queryFn: () => fetchSharedDoc(token!),
    enabled: !!token,
    retry: false, // não re-tentar em NOT_FOUND ou EXPIRED
    staleTime: 5 * 60 * 1000,
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando documento...</span>
      </div>
    );
  }

  // ── Erros semânticos ──────────────────────────────────────────────────────
  if (error) {
    const msg = (error as Error).message;
    if (msg === "EXPIRED")   return <ExpiredState />;
    return <NotFoundState />;  // NOT_FOUND ou qualquer outro erro
  }

  if (!data) return <NotFoundState />;

  // ── Documento encontrado e válido ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header público */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">ProductOS</span>
          {data.project_name && (
            <span className="text-sm text-muted-foreground">· {data.project_name}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          Documento compartilhado
        </span>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {data.doc_type}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">{data.title}</h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            Compartilhado em {new Date(data.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
            {data.expires_at && (
              <span className="ml-2">
                · Expira em {new Date(data.expires_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-6 bg-card">
          {data.content ? (
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {data.content}
            </pre>
          ) : (
            <p className="text-muted-foreground italic">Este documento está vazio.</p>
          )}
        </div>
      </main>
    </div>
  );
}
