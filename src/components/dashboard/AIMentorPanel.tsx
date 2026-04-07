import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, X, Send, Sparkles, AlertTriangle, CheckCircle2,
  ChevronRight, Trash2, Copy, Check, Paperclip,
  Lightbulb, BarChart3, Palette, Search, Code2,
} from "lucide-react";
import { useAIChat, ChatAttachment } from "@/hooks/useAIChat";
import { ChatAttachments } from "@/components/dashboard/ChatAttachments";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks, useProject, usePersonas, useUxMetrics } from "@/hooks/useProjectData";
import ReactMarkdown from "react-markdown";
import { DbTask, DbProject, DbPersona, DbUxMetric } from "@/lib/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AISuggestion {
  id: string;
  message: string;
  type: "warning" | "suggestion" | "milestone";
  actionLabel?: string;
}

interface PromptChip {
  label: string;
  prompt: string;
  icon: React.ElementType;
  category: "ux" | "ui" | "strategy" | "research" | "dev";
}

// ─── Prompt Chips ─────────────────────────────────────────────────────────────
const PROMPT_CHIPS: PromptChip[] = [
  { label: "Analisar projeto", prompt: "Analise o estado atual do meu projeto e me diga o que está bem e o que precisa de atenção urgente.", icon: Search, category: "strategy" },
  { label: "Próximos passos", prompt: "Com base no contexto atual do projeto, quais são os 3 próximos passos mais importantes que devo tomar agora?", icon: ChevronRight, category: "strategy" },
  { label: "Gerar personas", prompt: "Gere 2 personas detalhadas e realistas para o meu projeto, baseadas no contexto disponível.", icon: Sparkles, category: "ux" },
  { label: "Revisar acessibilidade", prompt: "Quais são os principais problemas de acessibilidade WCAG que devo verificar no meu produto? Liste os mais críticos primeiro.", icon: Check, category: "ux" },
  { label: "Métricas UX", prompt: "Quais métricas UX devo acompanhar para o meu produto? Defina as mais importantes com metas realistas.", icon: BarChart3, category: "ux" },
  { label: "Design tokens", prompt: "Sugira um conjunto de design tokens essenciais para o meu design system, incluindo cores, tipografia e espaçamento.", icon: Palette, category: "ui" },
  { label: "OKRs do produto", prompt: "Sugira 2 OKRs estratégicos para o próximo trimestre baseados no meu projeto.", icon: Lightbulb, category: "strategy" },
  { label: "Heurísticas Nielsen", prompt: "Avalie meu produto com base nas 10 heurísticas de Nielsen e aponte os problemas mais críticos.", icon: Code2, category: "ux" },
];

// ─── Suggestions generator ────────────────────────────────────────────────────
function generateDynamicSuggestions(
  tasks: DbTask[] | undefined,
  project: DbProject | null | undefined,
  personas: DbPersona[] | undefined,
  metrics: DbUxMetric[] | undefined
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const allTasks = tasks ?? [];
  const allPersonas = personas ?? [];
  const allMetrics = metrics ?? [];

  const blockedTasks = allTasks.filter(t => t.status === "blocked");
  if (blockedTasks.length > 0) {
    suggestions.push({
      id: "blocked",
      message: `${blockedTasks.length} tarefa(s) bloqueada(s): "${blockedTasks[0]?.title}". Sugerir solução?`,
      type: "warning",
      actionLabel: "Sugerir Solução",
    });
  }

  const overdueTasks = allTasks.filter(t => t.days_in_phase > t.estimated_days && t.status !== "done");
  if (overdueTasks.length > 0) {
    suggestions.push({
      id: "overdue",
      message: `${overdueTasks.length} tarefa(s) atrasada(s). "${overdueTasks[0]?.title}" ${overdueTasks[0]?.days_in_phase}d/${overdueTasks[0]?.estimated_days}d.`,
      type: "warning",
      actionLabel: "Ver Prioridades",
    });
  }

  if (project) {
    const pp = project.phase_progress as Record<string, number> | undefined;
    const currentPhase = project.current_phase;
    const progress = pp?.[currentPhase] ?? 0;
    if (progress >= 90) {
      suggestions.push({
        id: "phase-complete",
        message: `Fase "${currentPhase}" em ${progress}%! 🎉 Gerar checklist de transição?`,
        type: "milestone",
        actionLabel: "Gerar Checklist",
      });
    } else if (progress < 30 && allTasks.filter(t => t.phase === currentPhase && t.status === "in_progress").length === 0) {
      suggestions.push({
        id: "phase-stalled",
        message: `Fase "${currentPhase}" em ${progress}% sem tarefas em andamento.`,
        type: "suggestion",
        actionLabel: "Sugerir Passos",
      });
    }
  }

  if (allPersonas.length === 0) {
    suggestions.push({ id: "no-personas", message: "Nenhuma persona definida. Gerar baseado no projeto?", type: "suggestion", actionLabel: "Gerar Personas" });
  }
  if (allMetrics.length === 0) {
    suggestions.push({ id: "no-metrics", message: "Nenhuma métrica UX definida. Definir KPIs?", type: "suggestion", actionLabel: "Definir Métricas" });
  }

  const doneTasks = allTasks.filter(t => t.status === "done").length;
  if (allTasks.length > 5 && doneTasks / allTasks.length > 0.7) {
    suggestions.push({ id: "good-progress", message: `${doneTasks}/${allTasks.length} tarefas concluídas! 🚀 Gerar relatório?`, type: "milestone", actionLabel: "Gerar Relatório" });
  }
  if (allTasks.length === 0) {
    suggestions.push({ id: "no-tasks", message: "Nenhuma tarefa criada. Sugerir tarefas iniciais?", type: "suggestion", actionLabel: "Sugerir Tarefas" });
  }

  return suggestions.slice(0, 3);
}

// ─── SuggestionCard ───────────────────────────────────────────────────────────
function SuggestionCard({ suggestion, onAction }: { suggestion: AISuggestion; onAction: (msg: string) => void }) {
  const icons = {
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
    suggestion: <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />,
    milestone: <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />,
  };
  const bg = {
    warning: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
    suggestion: "bg-primary/5 border-primary/20 hover:border-primary/40",
    milestone: "bg-green-500/5 border-green-500/20 hover:border-green-500/40",
  };

  return (
    <motion.div
      className={`p-2.5 rounded-lg border transition-colors ${bg[suggestion.type]}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icons[suggestion.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-foreground leading-relaxed">{suggestion.message}</p>
          {suggestion.actionLabel && (
            <button
              onClick={() => onAction(suggestion.message)}
              className="mt-1.5 text-[10px] font-medium text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
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

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado!");
  };

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-br-sm px-3 py-2 text-xs leading-relaxed bg-primary text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2 group">
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="max-w-[95%] rounded-2xl rounded-bl-sm px-3 py-2.5 text-xs leading-relaxed bg-secondary text-secondary-foreground">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              h1: ({ children }) => <h1 className="font-bold text-foreground text-sm mb-1 mt-2">{children}</h1>,
              h2: ({ children }) => <h2 className="font-semibold text-foreground text-xs mb-1 mt-2 uppercase tracking-wide">{children}</h2>,
              h3: ({ children }) => <h3 className="font-semibold text-foreground text-xs mb-1 mt-1.5">{children}</h3>,
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                return isBlock ? (
                  <code className="block bg-background/50 rounded-md px-3 py-2 text-[10px] font-mono my-1.5 overflow-x-auto border border-border/50">{children}</code>
                ) : (
                  <code className="bg-background/50 rounded px-1 py-0.5 text-[10px] font-mono border border-border/50">{children}</code>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/40 pl-2 my-1 text-muted-foreground italic">{children}</blockquote>
              ),
              hr: () => <hr className="border-border/50 my-2" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex gap-1 items-center h-3">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AIMentorPanel({
  open,
  onClose,
  projectContext,
}: {
  open: boolean;
  onClose: () => void;
  projectContext?: Record<string, unknown>;
}) {
  const queryClient = useQueryClient();
  const { messages, isLoading, send } = useAIChat(projectContext);
  const { data: tasks } = useTasks();
  const { data: project } = useProject();
  const { data: personas } = usePersonas();
  const { data: metrics } = useUxMetrics();

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showChips, setShowChips] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevLoadingRef = useRef(isLoading);

  // Invalidate queries after AI response
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["ux-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-items"] });
      queryClient.invalidateQueries({ queryKey: ["design-tokens"] });
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, queryClient]);

  const suggestions = useMemo(
    () => generateDynamicSuggestions(tasks, project, personas, metrics),
    [tasks, project, personas, metrics]
  );

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hide chips after first message
  useEffect(() => {
    if (messages.length > 0) setShowChips(false);
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input, attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
    setShowChips(false);
    textareaRef.current?.focus();
  };

  const handleChip = (chip: PromptChip) => {
    send(chip.prompt);
    setShowChips(false);
  };

  const handleClearChat = () => {
    // Reload page to clear in-memory messages (messages are persisted in DB)
    window.location.reload();
  };

  const categories = [
    { key: "all", label: "Todos" },
    { key: "ux", label: "UX" },
    { key: "ui", label: "UI" },
    { key: "strategy", label: "Estratégia" },
    { key: "research", label: "Research" },
  ];

  const filteredChips = activeCategory === "all"
    ? PROMPT_CHIPS
    : PROMPT_CHIPS.filter(c => c.category === activeCategory);

  const showTyping = isLoading && messages[messages.length - 1]?.role !== "assistant";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto z-50 md:w-[400px] border-l border-border bg-card flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Mentor IA</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {isLoading ? "Processando..." : "Especialista Product Design"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Limpar conversa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* ── Suggestions ── */}
            {suggestions.length > 0 && messages.length === 0 && (
              <div className="px-3 py-2.5 space-y-1.5 border-b border-border shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Insights do projeto
                </span>
                {suggestions.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} onAction={(msg) => { send(msg); setShowChips(false); }} />
                ))}
              </div>
            )}

            {/* ── Chat area ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4">

              {/* Empty state with chips */}
              {messages.length === 0 && showChips && (
                <div className="space-y-4">
                  <div className="text-center pt-2">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Bot className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Como posso ajudar?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Especialista em Product Design, UI/UX e Estratégia
                    </p>
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1.5 flex-wrap">
                    {categories.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                          activeCategory === cat.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Chips grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredChips.map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleChip(chip)}
                        disabled={isLoading}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-secondary/50 hover:bg-accent hover:border-primary/30 transition-all text-left group disabled:opacity-50"
                      >
                        <chip.icon className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-foreground leading-tight">{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <MessageBubble key={i} role={msg.role} content={msg.content} />
              ))}

              {/* Typing indicator */}
              {showTyping && <TypingIndicator />}

              {/* Show chips again if chat has messages */}
              {messages.length > 0 && showChips && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Atalhos rápidos</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PROMPT_CHIPS.slice(0, 4).map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleChip(chip)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-secondary/30 hover:bg-accent transition-all text-left text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <chip.icon className="w-3 h-3 text-primary shrink-0" />
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div className="px-3 pb-4 pt-2 border-t border-border shrink-0 space-y-2">

              {/* Attachments */}
              <ChatAttachments
                attachments={attachments}
                onAdd={(att) => setAttachments((prev) => [...prev, att])}
                onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={isLoading}
              />

              {/* Show chips toggle */}
              {messages.length > 0 && !showChips && (
                <button
                  onClick={() => setShowChips(true)}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Ver atalhos rápidos
                </button>
              )}

              {/* Textarea input */}
              <div className="flex items-end gap-2 bg-secondary rounded-xl px-3 py-2.5 border border-border focus-within:border-primary/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Pergunte ao Mentor... (Enter para enviar, Shift+Enter para nova linha)"
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none min-w-0 max-h-[120px] leading-relaxed"
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1 shrink-0 pb-0.5">
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground/50 text-center">
                Enter para enviar · Shift+Enter nova linha · Anexe imagens e PDFs
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
