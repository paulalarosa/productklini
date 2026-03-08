export type Phase = "discovery" | "define" | "develop" | "deliver";
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type Module = "ux" | "ui" | "dev";

export interface ProjectTask {
  id: string;
  title: string;
  module: Module;
  phase: Phase;
  status: TaskStatus;
  assignee: string;
  avatar: string;
  daysInPhase: number;
  estimatedDays: number;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

export interface AISuggestion {
  id: string;
  message: string;
  type: "warning" | "suggestion" | "milestone";
  actionLabel?: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  painPoints: string[];
  goals: string[];
}

export const projectName = "Redesign do App de Logística";
export const projectProgress = 62;

export const teamMembers: TeamMember[] = [
  { name: "Ana Souza", role: "UX Lead", avatar: "AS" },
  { name: "Bruno Lima", role: "UI Designer", avatar: "BL" },
  { name: "Carlos Mendes", role: "Dev Lead", avatar: "CM" },
  { name: "Diana Rocha", role: "QA Engineer", avatar: "DR" },
  { name: "Eduardo Farias", role: "PM", avatar: "EF" },
];

export const currentPhase: Phase = "develop";

export const phaseProgress: Record<Phase, number> = {
  discovery: 100,
  define: 100,
  develop: 45,
  deliver: 0,
};

export const tasks: ProjectTask[] = [
  { id: "1", title: "Mapa de Jornada - Motorista", module: "ux", phase: "discovery", status: "done", assignee: "Ana Souza", avatar: "AS", daysInPhase: 3, estimatedDays: 3, priority: "high" },
  { id: "2", title: "Entrevistas com Despachantes", module: "ux", phase: "discovery", status: "done", assignee: "Ana Souza", avatar: "AS", daysInPhase: 5, estimatedDays: 5, priority: "high" },
  { id: "3", title: "Análise Heurística do App Atual", module: "ux", phase: "define", status: "done", assignee: "Ana Souza", avatar: "AS", daysInPhase: 2, estimatedDays: 2, priority: "medium" },
  { id: "4", title: "Wireframes de Checkout", module: "ui", phase: "define", status: "done", assignee: "Bruno Lima", avatar: "BL", daysInPhase: 4, estimatedDays: 3, priority: "high" },
  { id: "5", title: "Design System v2 - Componentes", module: "ui", phase: "develop", status: "in_progress", assignee: "Bruno Lima", avatar: "BL", daysInPhase: 6, estimatedDays: 5, priority: "high" },
  { id: "6", title: "Tela de Rastreamento em Tempo Real", module: "ui", phase: "develop", status: "in_progress", assignee: "Bruno Lima", avatar: "BL", daysInPhase: 3, estimatedDays: 4, priority: "urgent" },
  { id: "7", title: "Tela de Checkout - Testes de Usabilidade", module: "ux", phase: "develop", status: "blocked", assignee: "Ana Souza", avatar: "AS", daysInPhase: 5, estimatedDays: 2, priority: "urgent" },
  { id: "8", title: "API de Rastreamento - Integração", module: "dev", phase: "develop", status: "in_progress", assignee: "Carlos Mendes", avatar: "CM", daysInPhase: 4, estimatedDays: 6, priority: "high" },
  { id: "9", title: "Frontend - Tela de Login", module: "dev", phase: "develop", status: "review", assignee: "Carlos Mendes", avatar: "CM", daysInPhase: 2, estimatedDays: 2, priority: "medium" },
  { id: "10", title: "Testes E2E - Fluxo de Entrega", module: "dev", phase: "deliver", status: "todo", assignee: "Diana Rocha", avatar: "DR", daysInPhase: 0, estimatedDays: 3, priority: "high" },
  { id: "11", title: "Checklist WCAG - Acessibilidade", module: "ux", phase: "deliver", status: "todo", assignee: "Ana Souza", avatar: "AS", daysInPhase: 0, estimatedDays: 2, priority: "medium" },
  { id: "12", title: "Deploy Staging + QA", module: "dev", phase: "deliver", status: "todo", assignee: "Diana Rocha", avatar: "DR", daysInPhase: 0, estimatedDays: 2, priority: "high" },
];

export const aiSuggestions: AISuggestion[] = [
  {
    id: "1",
    message: "A tela de Checkout está na fase de testes há 5 dias e está bloqueada. Deseja que eu gere um roteiro de teste de usabilidade para acelerar a aprovação?",
    type: "warning",
    actionLabel: "Gerar Roteiro",
  },
  {
    id: "2",
    message: "Fase de UI do Design System v2 está 1 dia atrasada. Sugiro priorizar os componentes de formulário que bloqueiam o Frontend.",
    type: "suggestion",
    actionLabel: "Ver Prioridades",
  },
  {
    id: "3",
    message: "O módulo Discovery foi concluído com sucesso! 🎉 Deseja que eu gere o checklist de acessibilidade (WCAG 2.1 AA) antes do Handoff?",
    type: "milestone",
    actionLabel: "Gerar Checklist",
  },
];

export const aiChatHistory = [
  { role: "assistant" as const, content: "Olá! Sou o **Mentor IA** do projeto *Redesign do App de Logística*. Estou monitorando o progresso e posso ajudar com:\n\n- 📊 Análise de gargalos\n- ✅ Checklists de QA e acessibilidade\n- 🔄 Sugestões de handoff Design→Dev\n\nComo posso ajudar?" },
  { role: "user" as const, content: "Qual é o status atual do projeto?" },
  { role: "assistant" as const, content: "O projeto está na **fase de Desenvolvimento** com **62% de progresso geral**.\n\n**Pontos de atenção:**\n- 🔴 **1 tarefa bloqueada**: Testes de usabilidade do Checkout (5 dias)\n- ⚠️ Design System v2 está 1 dia atrasado\n- ✅ API de Rastreamento está dentro do prazo\n\nRecomendo focar no desbloqueio dos testes de usabilidade primeiro." },
];

export const personas: Persona[] = [
  {
    id: "1",
    name: "João, o Motorista",
    role: "Motorista de entregas, 34 anos",
    painPoints: ["Interface confusa no app atual", "Dificuldade em atualizar status de entrega"],
    goals: ["Roteiro otimizado", "Atualização de status com 1 toque"],
  },
  {
    id: "2",
    name: "Maria, a Despachante",
    role: "Coordenadora de logística, 28 anos",
    painPoints: ["Sem visibilidade em tempo real", "Relatórios manuais"],
    goals: ["Dashboard de rastreamento", "Alertas automáticos de atraso"],
  },
];

export const uxMetrics = {
  sus: { score: 72, previous: 58, label: "SUS Score" },
  nps: { score: 45, previous: 32, label: "NPS" },
  taskSuccess: { score: 87, previous: 74, label: "Taxa de Sucesso" },
  timeOnTask: { score: 3.2, previous: 5.1, label: "Tempo Médio (min)" },
};
