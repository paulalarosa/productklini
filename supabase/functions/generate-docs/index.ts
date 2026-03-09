import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Project { name: string; description?: string; current_phase: string; progress: number; }
interface Persona { name: string; role: string; goals?: string[]; pain_points?: string[]; }
interface Task { module: string; phase: string; title: string; status: string; priority: string; }
interface Metric { metric_name: string; score: number; previous_score?: number; }
interface Document { doc_type: string; title: string; }

const prompts: Record<string, { systemPrompt: string; title: string }> = {
  research_plan: { title: "Plano de Pesquisa", systemPrompt: `Você é um UX Researcher sênior. Gere um plano de pesquisa UX completo em PT-BR. Inclua: 1. Objetivo da Pesquisa 2. Hipóteses (3-5) 3. Metodologias Sugeridas 4. Perfil dos Participantes 5. Roteiro de Entrevista (8-10 perguntas) 6. Métricas de Sucesso 7. Timeline Sugerido. Formate em Markdown.` },
  journey_map: { title: "Mapa de Jornada", systemPrompt: `Você é um UX Designer sênior. Gere um mapa de jornada do usuário em PT-BR. Para cada persona, inclua: Persona, Cenário, Etapas da Jornada (5-7 com ação, pensamento, emoção, touchpoints, oportunidades), Momentos Críticos, Oportunidades. Formate em Markdown com tabelas.` },
  insights_summary: { title: "Síntese de Insights", systemPrompt: `Você é um UX Researcher sênior. Gere uma síntese de insights em PT-BR: Principais Descobertas (5-8), Padrões Identificados, Gaps de Conhecimento, Recomendações, Priorização. Formate em Markdown.` },
  ds_foundation: { title: "Fundamentos do Design System", systemPrompt: `Você é um Design System Lead. Gere as fundações do Design System em PT-BR: Princípios de Design (4-5), Tipografia, Paleta de Cores com hex, Espaçamento, Componentes Prioritários (10-15), Padrões de Interação, Acessibilidade. Formate em Markdown.` },
  dev_handoff: { title: "Handoff para Desenvolvimento", systemPrompt: `Você é um Tech Lead. Gere um handoff em PT-BR: Visão Técnica, Componentes a Implementar, APIs Necessárias, Critérios de Aceitação, Tarefas Técnicas, Riscos Técnicos, Definition of Done. Formate em Markdown.` },
  empathy_map: { title: "Mapa de Empatia", systemPrompt: `Você é um UX Researcher sênior. Para cada persona, gere um Mapa de Empatia em PT-BR: PENSA/SENTE, VÊ, OUVE, FALA/FAZ, DORES, GANHOS. Crie 2-3 personas hipotéticas se não houver. Formate em Markdown.` },
  benchmark: { title: "Análise de Benchmark", systemPrompt: `Você é um UX Strategist sênior. Gere uma análise competitiva em PT-BR: Objetivo, Concorrentes Diretos (3-5), Concorrentes Indiretos (2-3), Tabela Comparativa, Padrões UI/UX, Gaps, Best Practices, Recomendações. Formate em Markdown com tabelas.` },
  jtbd: { title: "Jobs To Be Done", systemPrompt: `Você é um Product Strategist sênior. Gere JTBD em PT-BR: Contexto, Job Statements (5-8), Job Map, Outcome Expectations, Underserved Needs, Switching Triggers, Hiring Criteria. Formate em Markdown.` },
  csd_matrix: { title: "Matriz CSD", systemPrompt: `Você é um UX Researcher / Product Owner sênior. Gere Matriz CSD em PT-BR: CERTEZAS (8-12), SUPOSIÇÕES (8-12, classificadas por risco), DÚVIDAS (8-12), Plano de Validação, Priorização. Formate em Markdown com tabelas.` },
  hmw: { title: "How Might We", systemPrompt: `Você é um Design Thinking facilitador. Gere perguntas HMW em PT-BR: Contexto, Perguntas HMW (10-15) agrupadas por tema, Critérios de Priorização, Ideias Iniciais. Formate em Markdown.` },
  affinity_diagram: { title: "Diagrama de Afinidade", systemPrompt: `Você é um UX Researcher sênior. Gere um Diagrama de Afinidade em PT-BR: Fonte dos Dados, Clusters (5-8) com 5-10 insights cada, Hierarquia de Temas, Padrões, Prioridades. Formate em Markdown.` },
  tone_of_voice: { title: "Guia de Tom de Voz", systemPrompt: `Você é um UX Writer / Content Strategist sênior. Gere um guia de Tom de Voz em PT-BR: Personalidade, Princípios de Escrita, Tom por Contexto, Vocabulário preferido vs evitado, Exemplos antes/depois, Checklist. Formate em Markdown.` },
  microcopy_library: { title: "Biblioteca de Microcopy", systemPrompt: `Você é um UX Writer sênior. Gere uma biblioteca de microcopy em PT-BR: Erros (15-20), Sucesso (10-15), Estados Vazios (8-10), CTAs (15-20), Tooltips, Placeholders, Confirmações, Loading. Formate em Markdown com tabelas.` },
  content_audit: { title: "Inventário de Conteúdo", systemPrompt: `Você é um Content Strategist sênior. Gere um inventário de conteúdo em PT-BR: Escopo, Inventário por Tela, Análise de Consistência, Gaps, Oportunidades, Glossário, Métricas de Leitura. Formate em Markdown.` },
  heuristic_evaluation: { title: "Avaliação Heurística", systemPrompt: `Você é um UX Expert sênior. Gere uma avaliação heurística baseada nas 10 Heurísticas de Nielsen em PT-BR. Para cada: Nome, Score (1-5), Evidências, Problemas, Recomendações, Severidade. Score Geral e Top 5 Prioridades. Formate em Markdown com tabela.` },
  usability_test: { title: "Roteiro de Teste de Usabilidade", systemPrompt: `Você é um UX Researcher sênior. Gere um roteiro de teste de usabilidade em PT-BR: Objetivo, Perfil dos Participantes, Setup, Script de Introdução, Tarefas (5-8), Perguntas Pós-Teste, Template de Registro, Como compilar resultados. Formate em Markdown.` },
  wcag_checklist: { title: "Checklist WCAG", systemPrompt: `Você é um Accessibility Specialist. Gere um checklist WCAG 2.1 em PT-BR: PERCEPTÍVEL, OPERÁVEL, COMPREENSÍVEL, ROBUSTO. Para cada critério: Checkbox | Critério | Nível | Status | Recomendação. Formate em Markdown com tabelas.` },
  prioritization_matrix: { title: "Matriz de Priorização", systemPrompt: `Você é um Product Manager sênior. Gere uma Matriz Impacto x Esforço em PT-BR: Critérios, Features analisadas, Quadrantes (Quick Wins, Estratégicos, Fill-ins, Thankless Tasks), Tabela de Scoring, Roadmap, Justificativas. Formate em Markdown com tabelas.` },
  sitemap: { title: "Sitemap", systemPrompt: `Você é um Information Architect sênior. Gere um Sitemap em PT-BR: Estrutura Hierárquica, Fluxos Principais (3-5), Navegação Global, Templates de Página, Pontos de Entrada, Cross-links, Prioridade. Formate em Markdown.` },
  component_states: { title: "Mapeamento de Estados de Componentes", systemPrompt: `Você é um Interaction Designer sênior. Mapeie estados de componentes em PT-BR (Botão, Input, Card, Modal, Menu, Toast, etc.): Default, Hover, Active, Focus, Disabled, Loading, Error, Empty, Success. Inclua estados de tela. Formate em Markdown com tabelas.` },
  task_flows: { title: "Task Flows", systemPrompt: `Você é um Interaction Designer sênior. Gere Task Flows em PT-BR (4-6 fluxos): Nome, Objetivo, Pré-condições, Passos (Ação → Sistema → Tela), Fluxos Alternativos, Pós-condições, Pontos de Decisão. Formate em Markdown.` },
  interview_analysis: { title: "Análise de Entrevista", systemPrompt: `Você é um UX Researcher sênior. Gere um template de análise de entrevista em PT-BR com: Pain Points, Insights, Citações-Chave, Padrões Comportamentais, Oportunidades de Design, Bandeiras Vermelhas. Formate em Markdown.` },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { doc_type, project_id } = body;

    if (!doc_type || !project_id) {
      return new Response(JSON.stringify({ error: "Nenhum projeto selecionado. Crie ou selecione um projeto primeiro." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const config = prompts[doc_type];
    if (!config) {
      return new Response(JSON.stringify({ error: `Tipo de documento inválido: "${doc_type}"` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // maybeSingle() instead of single() to avoid PGRST116 crash
    const [projectRes, personasRes, tasksRes, metricsRes, docsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", project_id).maybeSingle(),
      supabase.from("personas").select("*").eq("project_id", project_id),
      supabase.from("tasks").select("*").eq("project_id", project_id),
      supabase.from("ux_metrics").select("*").eq("project_id", project_id),
      supabase.from("project_documents").select("doc_type, title").eq("project_id", project_id),
    ]);

    const project = projectRes.data as Project | null;
    if (!project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado. Verifique se você tem um projeto ativo." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const personas = (personasRes.data ?? []) as Persona[];
    const tasks = (tasksRes.data ?? []) as Task[];
    const metrics = (metricsRes.data ?? []) as Metric[];
    const docs = (docsRes.data ?? []) as Document[];

    const contextStr = `
Projeto: ${project.name}
Descrição: ${project.description || "Sem descrição"}
Fase atual: ${project.current_phase || "N/A"}
Progresso: ${project.progress || 0}%

Personas (${personas.length}):
${personas.map(p => `- ${p.name} (${p.role}): Goals: ${Array.isArray(p.goals) ? p.goals.join(", ") : "N/A"} | Dores: ${Array.isArray(p.pain_points) ? p.pain_points.join(", ") : "N/A"}`).join("\n") || "Nenhuma persona cadastrada."}

Tarefas (${tasks.length}):
${tasks.slice(0, 15).map(t => `- [${t.module}/${t.phase}] ${t.title} (${t.status}, prioridade: ${t.priority})`).join("\n") || "Nenhuma tarefa."}

Métricas UX (${metrics.length}):
${metrics.map(m => `- ${m.metric_name}: ${m.score}${m.previous_score ? ` (anterior: ${m.previous_score})` : ""}`).join("\n") || "Nenhuma métrica."}

Documentos existentes (${docs.length}):
${docs.map(d => `- [${d.doc_type}] ${d.title}`).join("\n") || "Nenhum documento."}
    `.trim();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada nos secrets do Supabase." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Generating: ${doc_type} for project: ${project_id}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: `Contexto do projeto:\n\n${contextStr}\n\nGere o documento "${config.title}" com base neste contexto.` },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => "");
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes no gateway de IA." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: `Erro no gateway de IA (${aiResponse.status})` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";
    if (!content) {
      return new Response(JSON.stringify({ error: "IA não retornou conteúdo. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: doc, error: insertError } = await supabase
      .from("project_documents")
      .insert({ project_id, doc_type, title: config.title, content, ai_generated: true, metadata: { generated_at: new Date().toISOString(), model: "gemini-2.0-flash" } })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: `Erro ao salvar documento: ${insertError.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ document: doc }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("generate-docs error:", msg);
    return new Response(JSON.stringify({ error: "Erro interno", details: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
