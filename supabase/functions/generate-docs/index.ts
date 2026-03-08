import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { doc_type, project_id } = await req.json();

    // Fetch project context
    const [projectRes, personasRes, tasksRes, metricsRes, docsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", project_id).single(),
      supabase.from("personas").select("*").eq("project_id", project_id),
      supabase.from("tasks").select("*").eq("project_id", project_id),
      supabase.from("ux_metrics").select("*").eq("project_id", project_id),
      supabase.from("project_documents").select("*").eq("project_id", project_id),
    ]);

    const project = projectRes.data;
    const personas = personasRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const metrics = metricsRes.data ?? [];
    const docs = docsRes.data ?? [];

    if (!project) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextStr = `
Projeto: ${project.name}
Descrição: ${project.description || "Sem descrição"}
Fase atual: ${project.current_phase}
Progresso: ${project.progress}%

Personas (${personas.length}):
${personas.map(p => `- ${p.name} (${p.role}): Objetivos: ${p.goals?.join(", ") || "N/A"} | Dores: ${p.pain_points?.join(", ") || "N/A"}`).join("\n")}

Tarefas (${tasks.length}):
${tasks.slice(0, 15).map(t => `- [${t.module}/${t.phase}] ${t.title} (${t.status}, prioridade: ${t.priority})`).join("\n")}

Métricas UX (${metrics.length}):
${metrics.map(m => `- ${m.metric_name}: ${m.score}${m.previous_score ? ` (anterior: ${m.previous_score})` : ""}`).join("\n")}

Documentos existentes (${docs.length}):
${docs.map(d => `- [${d.doc_type}] ${d.title}`).join("\n")}
`.trim();

    const prompts: Record<string, { systemPrompt: string; title: string }> = {
      research_plan: {
        title: "Plano de Pesquisa",
        systemPrompt: `Você é um UX Researcher sênior. Gere um plano de pesquisa UX completo em PT-BR. Inclua: 1. Objetivo da Pesquisa 2. Hipóteses (3-5) 3. Metodologias Sugeridas 4. Perfil dos Participantes 5. Roteiro de Entrevista (8-10 perguntas) 6. Métricas de Sucesso 7. Timeline Sugerido. Formate em Markdown. Seja específico ao contexto.`,
      },
      journey_map: {
        title: "Mapa de Jornada",
        systemPrompt: `Você é um UX Designer sênior. Gere um mapa de jornada do usuário em PT-BR. Para cada persona, inclua: Persona, Cenário, Etapas da Jornada (5-7 com ação, pensamento, emoção 😊😐😞😡, touchpoints, oportunidades), Momentos Críticos, Oportunidades. Formate em Markdown com tabelas.`,
      },
      insights_summary: {
        title: "Síntese de Insights",
        systemPrompt: `Você é um UX Researcher sênior. Gere uma síntese de insights em PT-BR: Principais Descobertas (5-8), Padrões Identificados, Gaps de Conhecimento, Recomendações, Priorização. Formate em Markdown.`,
      },
      ds_foundation: {
        title: "Fundamentos do Design System",
        systemPrompt: `Você é um Design System Lead. Gere as fundações do Design System em PT-BR: Princípios de Design (4-5), Tipografia, Paleta de Cores com hex, Espaçamento, Componentes Prioritários (10-15), Padrões de Interação, Acessibilidade. Formate em Markdown.`,
      },
      dev_handoff: {
        title: "Handoff para Desenvolvimento",
        systemPrompt: `Você é um Tech Lead. Gere um handoff em PT-BR: Visão Técnica, Componentes a Implementar, APIs Necessárias, Critérios de Aceitação, Tarefas Técnicas, Riscos Técnicos, Definition of Done. Formate em Markdown.`,
      },
      empathy_map: {
        title: "Mapa de Empatia",
        systemPrompt: `Você é um UX Researcher sênior. Para cada persona do projeto, gere um Mapa de Empatia completo em PT-BR com: 1. Persona (nome e contexto) 2. O que PENSA e SENTE? (preocupações, aspirações, medos) 3. O que VÊ? (ambiente, mercado) 4. O que OUVE? (influências, mídia) 5. O que FALA e FAZ? (comportamento, atitude) 6. DORES (frustrações, obstáculos) 7. GANHOS (desejos, necessidades). Se não houver personas, crie 2-3 hipotéticas. Formate em Markdown.`,
      },
      benchmark: {
        title: "Análise de Benchmark",
        systemPrompt: `Você é um UX Strategist sênior. Gere uma análise competitiva/benchmark em PT-BR: 1. Objetivo da Análise 2. Concorrentes Diretos (3-5) com pontos fortes/fracos 3. Concorrentes Indiretos (2-3) 4. Tabela Comparativa (features, UX, pricing) 5. Padrões de UI/UX Identificados 6. Gaps e Oportunidades 7. Best Practices 8. Recomendações Estratégicas. Formate em Markdown com tabelas.`,
      },
      jtbd: {
        title: "Jobs To Be Done",
        systemPrompt: `Você é um Product Strategist sênior. Gere um framework JTBD completo em PT-BR: 1. Contexto do Produto 2. Job Statements (5-8): "Quando [situação], eu quero [motivação], para que [resultado]" 3. Job Map (Definir, Localizar, Preparar, Confirmar, Executar, Monitorar, Modificar, Concluir) 4. Outcome Expectations 5. Underserved Needs 6. Switching Triggers 7. Hiring Criteria. Formate em Markdown.`,
      },
      csd_matrix: {
        title: "Matriz CSD",
        systemPrompt: `Você é um UX Researcher / Product Owner sênior. Gere uma Matriz CSD em PT-BR: 1. CERTEZAS (8-12 items) 2. SUPOSIÇÕES (8-12 items, classificadas por risco alto/médio/baixo) 3. DÚVIDAS (8-12 items) 4. Plano de Validação 5. Priorização de investigação. Formate em Markdown com tabelas.`,
      },
      hmw: {
        title: "How Might We",
        systemPrompt: `Você é um Design Thinking facilitador. Gere perguntas HMW em PT-BR: 1. Contexto dos desafios 2. Perguntas HMW (10-15) agrupadas por tema: "Como poderíamos [verbo] [solução] para [benefício]?" 3. Critérios de Priorização 4. Ideias Iniciais (2-3 por HMW prioritário). Derive das dores das personas. Formate em Markdown.`,
      },
      affinity_diagram: {
        title: "Diagrama de Afinidade",
        systemPrompt: `Você é um UX Researcher sênior. Gere um Diagrama de Afinidade em PT-BR: 1. Fonte dos Dados 2. Clusters Identificados (5-8) com nome, 5-10 insights e insight-chave 3. Hierarquia de Temas 4. Padrões Transversais 5. Prioridades de Ação. Formate em Markdown.`,
      },
      tone_of_voice: {
        title: "Guia de Tom de Voz",
        systemPrompt: `Você é um UX Writer / Content Strategist sênior. Gere um guia de Tom de Voz em PT-BR: 1. Personalidade da Marca (4-5 adjetivos, "Somos X, não Y") 2. Princípios de Escrita (5 regras) 3. Tom por Contexto (Onboarding, Sucesso, Erro, Vazio, Notificações) 4. Vocabulário preferido vs evitado (tabela) 5. Exemplos antes/depois 6. Checklist de Revisão. Formate em Markdown.`,
      },
      microcopy_library: {
        title: "Biblioteca de Microcopy",
        systemPrompt: `Você é um UX Writer sênior. Gere uma biblioteca de microcopy em PT-BR: 1. Mensagens de Erro (15-20) 2. Mensagens de Sucesso (10-15) 3. Estados Vazios (8-10) 4. CTAs (15-20) 5. Tooltips (10) 6. Placeholders 7. Confirmações 8. Loading/Progress. Formate em Markdown com tabelas.`,
      },
      content_audit: {
        title: "Inventário de Conteúdo",
        systemPrompt: `Você é um Content Strategist sênior. Gere um inventário de conteúdo em PT-BR: 1. Escopo da Auditoria 2. Inventário por Tela (tabela) 3. Análise de Consistência 4. Gaps de Conteúdo 5. Oportunidades de Melhoria 6. Recomendações de Glossário 7. Métricas de Leitura. Formate em Markdown.`,
      },
      heuristic_evaluation: {
        title: "Avaliação Heurística",
        systemPrompt: `Você é um UX Expert sênior. Gere uma avaliação heurística baseada nas 10 Heurísticas de Nielsen em PT-BR. Para cada: Nome, Descrição, Score (1-5), Evidências, Problemas, Recomendações, Severidade (1-4). As 10: Visibilidade do status, Correspondência sistema-mundo real, Controle/liberdade, Consistência, Prevenção de erros, Reconhecimento vs memorização, Flexibilidade, Design minimalista, Recuperação de erros, Ajuda/documentação. Score Geral e Top 5 Prioridades. Formate em Markdown com tabela.`,
      },
      usability_test: {
        title: "Roteiro de Teste de Usabilidade",
        systemPrompt: `Você é um UX Researcher sênior. Gere um roteiro de teste de usabilidade em PT-BR: 1. Objetivo 2. Perfil dos Participantes (5-8) 3. Setup 4. Script de Introdução 5. Tarefas (5-8) com cenário, critérios, métricas, perguntas pós-tarefa 6. Perguntas Pós-Teste (NPS) 7. Template de Registro (tabela) 8. Como compilar resultados. Formate em Markdown.`,
      },
      wcag_checklist: {
        title: "Checklist WCAG",
        systemPrompt: `Você é um Accessibility Specialist. Gere um checklist WCAG 2.1 em PT-BR organizado por: 1. PERCEPTÍVEL (1.1-1.4) 2. OPERÁVEL (2.1-2.5) 3. COMPREENSÍVEL (3.1-3.3) 4. ROBUSTO (4.1). Para cada critério: ☐ Checkbox | Critério | Nível (A/AA/AAA) | Status sugerido | Recomendação. Inclua recomendações para o projeto. Formate em Markdown com tabelas.`,
      },
      prioritization_matrix: {
        title: "Matriz de Priorização",
        systemPrompt: `Você é um Product Manager sênior. Gere uma Matriz Impacto x Esforço em PT-BR: 1. Critérios (Impacto 1-5, Esforço 1-5) 2. Features analisadas 3. Quadrantes: 🟢 Quick Wins, 🔵 Estratégicos, 🟡 Fill-ins, 🔴 Thankless Tasks 4. Tabela de Scoring 5. Roadmap Sugerido 6. Justificativas. Formate em Markdown com tabelas.`,
      },
      sitemap: {
        title: "Sitemap",
        systemPrompt: `Você é um Information Architect sênior. Gere um Sitemap em PT-BR: 1. Estrutura Hierárquica (árvore indentada) 2. Fluxos Principais (3-5) 3. Navegação Global 4. Templates de Página 5. Pontos de Entrada 6. Cross-links 7. Prioridade de Conteúdo. Baseie nos fluxos e personas. Formate em Markdown.`,
      },
      component_states: {
        title: "Mapeamento de Estados de Componentes",
        systemPrompt: `Você é um Interaction Designer sênior. Gere um mapeamento completo de estados de componentes em PT-BR. Para cada componente principal do produto (Botão, Input, Card, Modal, Menu, Toast, Dropdown, Tab, etc.), documente: 1. **Default** 2. **Hover** 3. **Active/Pressed** 4. **Focus** 5. **Disabled** 6. **Loading** 7. **Error** 8. **Empty/Placeholder** 9. **Success**. Para cada estado: descrição visual, comportamento, especificações CSS sugeridas. Inclua também: estados de telas (Loading Page, Empty State, Error Page, Offline). Formate em Markdown com tabelas.`,
      },
      task_flows: {
        title: "Task Flows",
        systemPrompt: `Você é um Interaction Designer / UX Designer sênior. Gere Task Flows detalhados em PT-BR. Para cada fluxo principal do produto (baseado nas tarefas e personas): 1. **Nome do Fluxo** 2. **Objetivo do Usuário** 3. **Pré-condições** 4. **Passos** (numerados, cada um com: Ação do Usuário → Resposta do Sistema → Tela/Componente envolvido) 5. **Fluxos Alternativos** (erros, cancelamento) 6. **Pós-condições** 7. **Pontos de Decisão** (onde o fluxo pode bifurcar). Gere 4-6 task flows. Formate em Markdown.`,
      },
      interview_analysis: {
        title: "Análise de Entrevista",
        systemPrompt: `Você é um UX Researcher sênior. Gere um template de análise de entrevista em PT-BR com seções para: Pain Points, Insights, Citações-Chave, Padrões Comportamentais, Oportunidades de Design, e Bandeiras Vermelhas. Formate em Markdown.`,
      },
    };

    const config = prompts[doc_type];
    if (!config) {
      return new Response(JSON.stringify({ error: "Tipo de documento inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: `Contexto do projeto:\n\n${contextStr}\n\nGere o documento "${config.title}" com base neste contexto.` },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("AI error:", err);
      return new Response(JSON.stringify({ error: "Erro ao gerar documento com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Save to project_documents
    const { data: doc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id,
        doc_type,
        title: config.title,
        content,
        ai_generated: true,
        metadata: { generated_at: new Date().toISOString(), model: "gemini-2.5-flash" },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Erro ao salvar documento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ document: doc }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
