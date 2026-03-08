import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import ReactMarkdown from "react-markdown";

interface AISuggestion {
  id: string;
  message: string;
  type: "warning" | "suggestion" | "milestone";
  actionLabel?: string;
}

const defaultSuggestions: AISuggestion[] = [
  {
    id: "1",
    message: "A tela de Checkout está na fase de testes há 5 dias e está bloqueada. Deseja que eu gere um roteiro de teste de usabilidade?",
    type: "warning",
    actionLabel: "Gerar Roteiro",
  },
  {
    id: "2",
    message: "Design System v2 está 1 dia atrasado. Sugiro priorizar os componentes de formulário.",
    type: "suggestion",
    actionLabel: "Ver Prioridades",
  },
  {
    id: "3",
    message: "Discovery concluído! 🎉 Deseja gerar o checklist de acessibilidade (WCAG 2.1 AA)?",
    type: "milestone",
    actionLabel: "Gerar Checklist",
  },
];

function SuggestionCard({ suggestion, onAction }: { suggestion: AISuggestion; onAction: (msg: string) => void }) {
  const icons = {
    warning: <AlertTriangle className="w-4 h-4 text-status-blocked shrink-0" />,
    suggestion: <Sparkles className="w-4 h-4 text-primary shrink-0" />,
    milestone: <CheckCircle2 className="w-4 h-4 text-status-develop shrink-0" />,
  };

  return (
    <motion.div
      className="p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{icons[suggestion.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground leading-relaxed">{suggestion.message}</p>
          {suggestion.actionLabel && (
            <button
              onClick={() => onAction(suggestion.message)}
              className="mt-2 text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              {suggestion.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AIMentorPanel({
  open,
  onClose,
  projectContext,
}: {
  open: boolean;
  onClose: () => void;
  projectContext?: Record<string, unknown>;
}) {
  const { messages, isLoading, send } = useAIChat(projectContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input);
    setInput("");
  };

  const handleSuggestionAction = (msg: string) => {
    send(msg);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] border-l border-border bg-card flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Mentor IA</h3>
                <span className="text-[10px] text-muted-foreground">
                  {isLoading ? "Pensando..." : "Ativo · Analisando projeto"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="px-3 py-3 space-y-2 border-b border-border shrink-0 max-h-[240px] overflow-y-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Sugestões Contextuais
            </span>
            {defaultSuggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onAction={handleSuggestionAction} />
            ))}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Pergunte qualquer coisa sobre o projeto!
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-3 space-y-0.5">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pergunte ao Mentor..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
