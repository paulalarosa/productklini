import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  // Fallback customizado por seção (ex: sidebar, página, card)
  fallback?: ReactNode;
  // Nível de severidade — afeta o visual do fallback padrão
  level?: "page" | "section" | "card";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção, enviar para Sentry/Supabase logs aqui
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback)  return this.props.fallback;

    const { level = "page" } = this.props;

    // ── Fallback nível card (inline, compacto) ────────────────────────────
    if (level === "card") {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
          <AlertTriangle className="w-4 h-4 text-destructive/60" />
          <p className="text-xs text-muted-foreground">Erro ao carregar este componente.</p>
          <button
            onClick={this.reset}
            className="text-xs text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    // ── Fallback nível section (área da página) ───────────────────────────
    if (level === "section") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-6 rounded-lg border border-destructive/20 bg-destructive/5">
          <AlertTriangle className="w-6 h-6 text-destructive/60" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Algo deu errado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Esta seção não pôde ser carregada.</p>
          </div>
          <button
            onClick={this.reset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      );
    }

    // ── Fallback nível page (página inteira) ──────────────────────────────
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive/60" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Erro inesperado</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Esta página encontrou um problema. Tente recarregar ou voltar ao início.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-3 text-left text-[10px] text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3 max-w-md overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={this.reset}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Início
          </a>
        </div>
      </div>
    );
  }
}
