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
        systemPrompt: `Você é um UX Researcher sênior. Com base no contexto do projeto, gere um plano de pesquisa UX completo em português (PT-BR). Inclua:
1. **Objetivo da Pesquisa** — o que queremos descobrir
2. **Hipóteses** — 3-5 hipóteses a validar
3. **Metodologias Sugeridas** — entrevistas, testes de usabilidade, surveys, etc.
4. **Perfil dos Participantes** — baseado nas personas existentes
5. **Roteiro de Entrevista** — 8-10 perguntas-chave
6. **Métricas de Sucesso** — como medir os resultados
7. **Timeline Sugerido** — fases e duração

Formate em Markdown. Seja específico ao contexto do projeto.`,
      },
      journey_map: {
        title: "Mapa de Jornada",
        systemPrompt: `Você é um UX Designer sênior. Com base nas personas e contexto do projeto, gere um mapa de jornada do usuário em português (PT-BR). Para cada persona principal, inclua:
1. **Persona** — nome e contexto
2. **Cenário** — situação de uso
3. **Etapas da Jornada** — 5-7 etapas com:
   - Ação do usuário
   - Pensamento/Expectativa
   - Emoção (😊 😐 😞 😡)
   - Touchpoints
   - Oportunidades de melhoria
4. **Momentos Críticos** — pain points principais
5. **Oportunidades** — como melhorar a experiência

Formate em Markdown com tabelas quando apropriado.`,
      },
      insights_summary: {
        title: "Síntese de Insights",
        systemPrompt: `Você é um UX Researcher sênior. Com base em todos os dados do projeto (personas, métricas, tarefas, documentos existentes), gere uma síntese de insights em português (PT-BR):
1. **Principais Descobertas** — 5-8 insights-chave
2. **Padrões Identificados** — tendências nos dados
3. **Gaps de Conhecimento** — o que ainda precisamos investigar
4. **Recomendações** — próximos passos concretos
5. **Priorização** — matriz impacto x esforço

Formate em Markdown.`,
      },
      ds_foundation: {
        title: "Fundamentos do Design System",
        systemPrompt: `Você é um UI Designer / Design System Lead. Com base no projeto e nas decisões de UX documentadas, gere as fundações do Design System em português (PT-BR):
1. **Princípios de Design** — 4-5 princípios guia baseados nos objetivos do projeto
2. **Tipografia** — sugestão de font stack, hierarquia (H1-H6, body, caption)
3. **Paleta de Cores** — cores primárias, secundárias, status, neutras com códigos hex
4. **Espaçamento** — escala de spacing (4, 8, 12, 16, 24, 32, 48, 64)
5. **Componentes Prioritários** — lista dos 10-15 componentes mais importantes baseados nos fluxos
6. **Padrões de Interação** — guidelines de animação, feedback, estados
7. **Acessibilidade** — requisitos WCAG mínimos

Formate em Markdown com exemplos práticos.`,
      },
      dev_handoff: {
        title: "Handoff para Desenvolvimento",
        systemPrompt: `Você é um Tech Lead. Com base em todo o contexto do projeto (UX research, design decisions, componentes), gere um documento de handoff em português (PT-BR):
1. **Visão Técnica** — arquitetura sugerida
2. **Componentes a Implementar** — lista priorizada com specs
3. **APIs Necessárias** — endpoints e modelos de dados
4. **Critérios de Aceitação** — por feature/tela
5. **Tarefas Técnicas Sugeridas** — breakdown em tasks
6. **Riscos Técnicos** — potenciais problemas e mitigações
7. **Definition of Done** — checklist de qualidade

Formate em Markdown.`,
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
