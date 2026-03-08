import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { aiSuggestions, aiChatHistory, type AISuggestion } from "@/data/mockData";
import ReactMarkdown from "react-markdown";

function SuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  const icons = {
    warning: <AlertTriangle className="w-4 h-4 text-status-blocked" />,
    suggestion: <Sparkles className="w-4 h-4 text-primary" />,
    milestone: <CheckCircle2 className="w-4 h-4 text-status-develop" />,
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
            <button className="mt-2 text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              {suggestion.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AIMentorPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState(aiChatHistory);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user" as const, content: input }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Entendido! Vou analisar os dados do projeto e volto com uma recomendação detalhada em instantes. 🔍",
        },
      ]);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="w-[380px] h-full border-l border-border bg-card flex flex-col shrink-0"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
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
                <span className="text-[10px] text-muted-foreground">Ativo · Analisando projeto</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="px-3 py-3 space-y-2 border-b border-border shrink-0 max-h-[280px] overflow-y-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Sugestões Contextuais
            </span>
            {aiSuggestions.map(s => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
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
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Pergunte ao Mentor..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={handleSend}
                className="p-1 rounded-md hover:bg-accent transition-colors"
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
