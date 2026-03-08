import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro na autenticação");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Erro ao conectar com Google");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">ProductOS</span>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-foreground text-center mb-1">
            {forgotPassword ? "Recuperar senha" : isSignUp ? "Criar conta" : "Entrar"}
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {forgotPassword
              ? "Insira seu email para receber o link de recuperação"
              : "Dashboard de Ciclo de Vida de Produto"}
          </p>

          {/* Google Sign-In */}
          {!forgotPassword && (
            <>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-accent text-foreground text-sm font-medium transition-colors mb-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar com Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {!forgotPassword && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? "Carregando..."
                : forgotPassword
                ? "Enviar link"
                : isSignUp
                ? "Criar conta"
                : "Entrar"}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {!forgotPassword && (
              <button
                onClick={() => setForgotPassword(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueceu a senha?
              </button>
            )}
            <div>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setForgotPassword(false);
                }}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar"}
              </button>
            </div>
            {forgotPassword && (
              <button
                onClick={() => setForgotPassword(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
