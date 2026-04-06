import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layers, FileText, Clock, AlertTriangle, Loader2, Lock } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SharePayload = {
  id:           string;
  token:        string;
  doc_type:     string;
  title:        string;
  content:      string;
  project_name: string;
  expires_at:   string | null;
  created_at:   string;
};

// ─── Fetcher com tratamento semântico de erros ────────────────────────────────

async function fetchSharedDoc(token: string): Promise<SharePayload> {
  // Tenta buscar via tabela shared_documents (se existir)
  // Se não existir, tenta via project_documents com share_token
  const { data, error } = await supabase
    .from("shared_documents")
    .select(`
      id,
      token,
      expires_at,
      created_at,
      project_documents (
        title,
        content,
        doc_type
      ),
      projects (
        name
      )
    `)
    .eq("token", token)
    .maybeSingle();

  // Tabela não existe — fallback para busca direta em project_documents
  if (error?.code === "42P01") {
    return fetchSharedDocFallback(token);
  }

  if (error) throw new Error("FETCH_ERROR");
  if (!data)  throw new Error("NOT_FOUND");

  // Verifica expiração
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error("EXPIRED");
  }

  const doc     = Array.isArray(data.project_documents)
    ? data.project_documents[0]
    : data.project_documents;
  const project = Array.isArray(data.projects)
    ? data.projects[0]
    : data.projects;

  return {
    id:           data.id,
    token:        data.token,
    doc_type:     doc?.doc_type     ?? "",
    title:        doc?.title        ?? "Documento",
    content:      doc?.content      ?? "",
    project_name: project?.name     ?? "",
    expires_at:   data.expires_at,
    created_at:   data.created_at,
  };
}

// Fallback: busca documento diretamente por share_token se a tabela shared_documents
// não existir ainda no banco (útil durante desenvolvimento)
async function fetchSharedDocFallback(token: string): Promise<SharePayload> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("id, title, content, doc_type, created_at, project_id")
    .eq("share_token", token)
    .maybeSingle();

  if (error || !data) throw new Error("NOT_FOUND");

  return {
    id:           data.id,
    token,
    doc_type:     data.doc_type  ?? "",
    title:        data.title     ?? "Documento",
    content:      data.content   ?? "",
    project_name: "",
    expires_at:   null,
    created_at:   data.created_at,
  };
}

// ─── Estados visuais ──────────────────────────────────────────────────────────

function PublicHeader({ projectName }: { projectName?: string }) {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">ProductOS</span>
        {projectName && (
          <span className="text-sm text-muted-foreground">· {projectName}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Lock className="w-3 h-3" />
        Documento compartilhado
      </span>
    </header>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
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
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
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
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ShareViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey:  ["shared-doc", token],
    queryFn:   () => fetchSharedDoc(token!),
    enabled:   !!token,
    retry:     false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando documento...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const msg = (error as Error).message;
    if (msg === "EXPIRED") return <ExpiredState />;
    return <NotFoundState />;
  }

  if (!data) return <NotFoundState />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader projectName={data.project_name} />

      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1">
        {/* Meta */}
        <div className="mb-6">
          {data.doc_type && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {data.doc_type.replace(/_/g, " ")}
            </span>
          )}
          <h1 className="text-2xl font-bold text-foreground mt-1">{data.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {new Date(data.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </span>
            {data.expires_at && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" />
                Expira em {new Date(data.expires_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="border rounded-lg bg-card p-6">
          {data.content ? (
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {data.content}
            </pre>
          ) : (
            <p className="text-muted-foreground italic text-sm">
              Este documento está vazio.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Compartilhado via{" "}
          <Link to="/login" className="text-primary hover:underline">
            ProductOS
          </Link>
        </p>
      </main>
    </div>
  );
}
