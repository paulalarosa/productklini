import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks, useProject, usePersonas, useUxMetrics } from "@/hooks/useProjectData";
import ReactMarkdown from "react-markdown";

interface AISuggestion {
  id: string;
  message: string;
  type: "warning" | "suggestion" | "milestone";
  actionLabel?: string;
}

function generateDynamicSuggestions(
  tasks: any[] | undefined,
  project: any | undefined,
  personas: any[] | undefined,
  metrics: any[] | undefined
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
      message: `${overdueTasks.length} tarefa(s) atrasadas. "${overdueTasks[0]?.title}" ${overdueTasks[0]?.days_in_phase}d/${overdueTasks[0]?.estimated_days}d.`,
      type: "warning",
      actionLabel: "Ver Prioridades",
    });
  }

  if (project) {
    const pp = project.phase_progress as Record<string, number>;
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
    suggestions.push({ id: "no-metrics", message: "Nenhuma métrica UX. Definir KPIs?", type: "suggestion", actionLabel: "Definir Métricas" });
  }

  const doneTasks = allTasks.filter(t => t.status === "done").length;
  if (allTasks.length > 5 && doneTasks / allTasks.length > 0.7) {
    suggestions.push({ id: "good-progress", message: `${doneTasks}/${allTasks.length} tarefas concluídas! Gerar relatório?`, type: "milestone", actionLabel: "Gerar Relatório" });
  }
  if (allTasks.length === 0) {
    suggestions.push({ id: "no-tasks", message: "Nenhuma tarefa criada. Sugerir tarefas iniciais?", type: "suggestion", actionLabel: "Sugerir Tarefas" });
  }

  return suggestions.slice(0, 3);
}

function SuggestionCard({ suggestion, onAction }: { suggestion: AISuggestion; onAction: (msg: string) => void }) {
  const icons = {
    warning: <AlertTriangle className="w-3.5 h-3.5 text-status-blocked shrink-0" />,
    suggestion: <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />,
    milestone: <CheckCircle2 className="w-3.5 h-3.5 text-status-develop shrink-0" />,
  };

  return (
    <motion.div
      className="p-2.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 8 }}
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["ux-metrics"] });
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, queryClient]);

  const suggestions = useMemo(
    () => generateDynamicSuggestions(tasks, project, personas, metrics),
    [tasks, project, personas, metrics]
  );

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
            className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto z-50 md:w-[380px] border-l border-border bg-card flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-border shrink-0 safe-area-top">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Mentor IA</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {isLoading ? "Pensando..." : "Ativo"}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Suggestions - scrollable, compact on mobile */}
            {suggestions.length > 0 && (
              <div className="px-2.5 py-2.5 space-y-1.5 border-b border-border shrink-0 max-h-[160px] md:max-h-[200px] overflow-y-auto overscroll-contain">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                  Sugestões ({suggestions.length})
                </span>
                {suggestions.map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} onAction={handleSuggestionAction} />
                ))}
              </div>
            )}

            {/* Chat */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2.5">
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
                    className={`max-w-[90%] md:max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
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
            <div className="px-3 py-3 border-t border-border shrink-0 safe-area-bottom">
              <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Pergunte ao Mentor..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
