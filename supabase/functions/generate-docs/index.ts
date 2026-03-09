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

    const body = await req.json().catch(() => ({}));
    const { doc_type, project_id } = body;

    if (!doc_type || !project_id) {
      return new Response(JSON.stringify({ error: "Parâmetros ausentes: doc_type ou project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
Fase atual: ${project.current_phase || "N/A"}
Progresso: ${project.progress || 0}%

Personas (${personas?.length || 0}):
${(personas || []).map((p: any) => `- ${p.name || "N/A"} (${p.role || "N/A"}): Objetivos: ${Array.isArray(p.goals) ? p.goals.join(", ") : "N/A"} | Dores: ${Array.isArray(p.pain_points) ? p.pain_points.join(", ") : "N/A"}`).join("\n") || "Nenhuma persona cadastrada."}

Tarefas (${tasks?.length || 0}):
${(tasks || []).slice(0, 15).map((t: any) => `- [${t.module || "N/A"}/${t.phase || "N/A"}] ${t.title || "N/A"} (${t.status || "N/A"}, prioridade: ${t.priority || "N/A"})`).join("\n") || "Nenhuma tarefa cadastrada."}

Métricos UX (${metrics?.length || 0}):
${(metrics || []).map((m: any) => `- ${m.metric_name || "N/A"}: ${m.score || 0}${m.previous_score ? ` (anterior: ${m.previous_score})` : ""}`).join("\n") || "Nenhuma métrica cadastrada."}

Documentos existentes (${docs?.length || 0}):
${(docs || []).map((d: any) => `- [${d.doc_type || "N/A"}] ${d.title || "N/A"}`).join("\n") || "Nenhum documento cadastrado."}
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
        systemPrompt: `Você é um UX Researcher sênior. Para cada persona do projeto, gere um Mapa de Empatia completo em PT-BR with: 1. Persona (nome e contexto) 2. O que PENSA e SENTE? 3. O que VÊ? 4. O que OUVE? 5. O que FALA e FAZ? 6. DORES 7. GANHOS. Se não houver personas, crie 2-3 hipotéticas. Formate em Markdown.`,
      },
      benchmark: {
        title: "Análise de Benchmark",
        systemPrompt: `Você é um UX Strategist sênior. Gere uma análise competitiva/benchmark em PT-BR: 1. Objetivo 2. Concorrentes Diretos (3-5) 3. Concorrentes Indiretos (2-3) 4. Tabela Comparativa 5. Padrões UI/UX 6. Gaps e Oportunidades 7. Best Practices 8. Recomendações. Formate em Markdown com tabelas.`,
      },
      jtbd: {
        title: "Jobs To Be Done",
        systemPrompt: `Você é um Product Strategist sênior. Gere um framework JTBD em PT-BR: 1. Contexto 2. Job Statements (5-8) 3. Job Map 4. Outcome Expectations 5. Underserved Needs 6. Switching Triggers 7. Hiring Criteria. Formate em Markdown.`,
      },
      csd_matrix: {
        title: "Matriz CSD",
        systemPrompt: `Você é um UX Researcher / Product Owner sênior. Gere uma Matriz CSD em PT-BR: 1. CERTEZAS (8-12) 2. SUPOSIÇÕES (8-12, por risco) 3. DÚVIDAS (8-12) 4. Plano de Validação 5. Priorização. Formate em Markdown com tabelas.`,
      },
      hmw: {
        title: "How Might We",
        systemPrompt: `Você é um Design Thinking facilitador. Gere perguntas HMW em PT-BR: 1. Contexto 2. HMW (10-15) por tema 3. Critérios de Priorização 4. Ideias Iniciais. Formate em Markdown.`,
      },
      affinity_diagram: {
        title: "Diagrama de Afinidade",
        systemPrompt: `Você é um UX Researcher sênior. Gere um Diagrama de Afinidade em PT-BR: 1. Fonte dos Dados 2. Clusters (5-8) 3. Hierarquia de Temas 4. Padrões Transversais 5. Prioridades. Formate em Markdown.`,
      },
      tone_of_voice: {
        title: "Guia de Tom de Voz",
        systemPrompt: `Você é um UX Writer / Content Strategist sênior. Gere um guia de Tom de Voz em PT-BR: 1. Personalidade (4-5 adjetivos) 2. Princípios (5 regras) 3. Tom por Contexto 4. Vocabulário (tabela) 5. Exemplos antes/depois 6. Checklist. Formate em Markdown.`,
      },
      microcopy_library: {
        title: "Biblioteca de Microcopy",
        systemPrompt: `Você é um UX Writer sênior. Gere uma biblioteca de microcopy em PT-BR: 1. Erros (15-20) 2. Sucesso (10-15) 3. Empty States (8-10) 4. CTAs (15-20) 5. Tooltips (10) 6. Placeholders 7. Confirmações 8. Loading. Formate em Markdown com tabelas.`,
      },
      content_audit: {
        title: "Inventário de Conteúdo",
        systemPrompt: `Você é um Content Strategist sênior. Gere um inventário de conteúdo em PT-BR: 1. Escopo 2. Inventário por Tela 3. Consistência 4. Gaps 5. Oportunidades 6. Glossário 7. Métricas. Formate em Markdown.`,
      },
      heuristic_evaluation: {
        title: "Avaliação Heurística",
        systemPrompt: `Você é um UX Expert sênior. Gere uma avaliação heurística nas 10 Heurísticas de Nielsen em PT-BR. Para cada: Nome, Score (1-5), Evidências, Problemas, Recomendações, Severidade (1-4). Score Geral e Top 5. Formate em Markdown.`,
      },
      usability_test: {
        title: "Roteiro de Teste de Usabilidade",
        systemPrompt: `Você é um UX Researcher sênior. Gere um roteiro de teste de usabilidade em PT-BR: 1. Objetivo 2. Perfil (5-8) 3. Setup 4. Introdução 5. Tarefas (5-8) 6. Pós-Teste 7. Template de Registro 8. Como compilar. Formate em Markdown.`,
      },
      wcag_checklist: {
        title: "Checklist WCAG",
        systemPrompt: `Você é um Accessibility Specialist. Gere checklist WCAG 2.1 PT-BR: 1. PERCEPTÍVEL 2. OPERÁVEL 3. COMPREENSÍVEL 4. ROBUSTO. Para cada: ☐ | Critério | Nível | Status | Recomendação. Formate em Markdown com tabelas.`,
      },
      prioritization_matrix: {
        title: "Matriz de Priorização",
        systemPrompt: `Você é um Product Manager sênior. Gere uma Matriz Impacto x Esforço em PT-BR: 1. Critérios 2. Features 3. Quadrantes 🟢🔵🟡🔴 4. Scoring 5. Roadmap 6. Justificativas. Formate em Markdown com tabelas.`,
      },
      sitemap: {
        title: "Sitemap",
        systemPrompt: `Você é um Information Architect sênior. Gere um Sitemap em PT-BR: 1. Estrutura Hierárquica 2. Fluxos Principais (3-5) 3. Navegação Global 4. Templates 5. Pontos de Entrada 6. Cross-links 7. Prioridade. Formate em Markdown.`,
      },
      component_states: {
        title: "Mapeamento de Estados de Componentes",
        systemPrompt: `Você é um Interaction Designer sênior. Gere um mapeamento de estados de componentes em PT-BR. Para cada componente (Botão, Input, Card, Modal, etc.): Default, Hover, Active, Focus, Disabled, Loading, Error, Empty, Success. Inclua estados de telas. Formate em Markdown com tabelas.`,
      },
      task_flows: {
        title: "Task Flows",
        systemPrompt: `Você é um Interaction Designer sênior. Gere Task Flows em PT-BR. Para cada fluxo: 1. Nome 2. Objetivo 3. Pré-condições 4. Passos (Ação→Resposta→Tela) 5. Fluxos Alternativos 6. Pós-condições 7. Pontos de Decisão. Gere 4-6 task flows. Formate em Markdown.`,
      },
      interview_analysis: {
        title: "Análise de Entrevista",
        systemPrompt: `Você é um UX Researcher sênior. Gere um template de análise de entrevista em PT-BR com: Pain Points, Insights, Citações-Chave, Padrões Comportamentais, Oportunidades de Design, Bandeiras Vermelhas. Formate em Markdown.`,
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
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada. Vá em Supabase → Project Settings → Edge Functions → Secrets e adicione a chave." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
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
      const errText = await aiResponse.text();
      console.error("Lovable AI gateway error:", aiResponse.status, errText);

      const friendlyMsg =
        aiResponse.status === 429 ? "Rate limit excedido. Aguarde alguns segundos e tente novamente." :
        aiResponse.status === 402 ? "Créditos insuficientes no workspace Lovable. Verifique seu plano." :
        aiResponse.status === 401 ? "LOVABLE_API_KEY inválida ou expirada. Regenere a chave em Lovable." :
        `Erro no gateway de IA (status ${aiResponse.status}). Detalhes: ${errText}`;

      return new Response(JSON.stringify({ error: friendlyMsg }), {
        status: aiResponse.status >= 500 ? 502 : aiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    if (!content) {
      console.error("Empty AI content. Raw response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "IA não retornou conteúdo. Verifique os logs da Edge Function no Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to project_documents
    const { data: doc, error: insertError } = await supabase
      .from("project_documents")
      .insert({
        project_id,
        doc_type,
        title: config.title,
        content,
        ai_generated: true,
        metadata: { generated_at: new Date().toISOString(), model: "gemini-2.0-flash" },
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
    console.error("generate-docs unhandled error:", e);
    return new Response(JSON.stringify({
      error: "Erro interno",
      details: e instanceof Error ? e.message : String(e),
      debug_tag: "v0.3.0",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
