import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action || body.type;
    const content = body.content;
    const project_id = body.project_id;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

interface ProjectData {
  name: string;
  description: string;
}

interface PersonaData {
  name: string;
  role: string;
  goals?: string[];
  pain_points?: string[];
}

    // Fetch project context for context-aware analysis
    let projectContext = "";
    if (project_id) {
      const [pRes, persRes] = await Promise.all([
        supabase.from("projects").select("name, description").eq("id", project_id).single(),
        supabase.from("personas").select("name, role, goals, pain_points").eq("project_id", project_id),
      ]);
      const p = pRes.data as ProjectData | null;
      const personas = (persRes.data ?? []) as PersonaData[];
      projectContext = `Projeto: ${p?.name || "N/A"}. ${p?.description || ""}
Personas: ${personas.map((pe: PersonaData) => `${pe.name} (${pe.role})`).join(", ") || "Nenhuma"}`;
    }

    const prompts: Record<string, string> = {
      analyze_interview: `Você é um UX Researcher sênior especialista em análise qualitativa. Analise a transcrição de entrevista abaixo e extraia:

1. **📌 Pain Points (Pontos de Dor)** — Liste cada dor identificada com:
   - Descrição do problema
   - Severidade (Alta/Média/Baixa)
   - Citação direta do entrevistado (entre aspas)

2. **💡 Insights Principais** — Descobertas-chave não óbvias

3. **🎯 Necessidades do Usuário** — O que o usuário realmente precisa (Jobs To Be Done implícitos)

4. **💬 Citações-Chave** — As 5-8 citações mais reveladoras com contexto

5. **📊 Padrões Comportamentais** — Comportamentos recorrentes observados

6. **🚀 Oportunidades de Design** — Sugestões concretas baseadas nos achados

7. **⚠️ Bandeiras Vermelhas** — Problemas críticos que precisam de atenção imediata

Contexto do projeto: ${projectContext}

Formate tudo em Markdown. Seja específico e cite trechos da entrevista.`,

      validate_microcopy: `Você é um UX Writer sênior e especialista em Content Design. Analise os textos de interface abaixo e para CADA texto forneça:

1. **Texto Original** → **Sugestão Melhorada**
2. **Motivo da Mudança** — por que a versão nova é melhor
3. **Princípio Aplicado** — qual princípio de UX Writing foi usado

Categorize em:
- 🔴 **Crítico** — textos confusos, ambíguos ou que podem causar erro
- 🟡 **Melhoria** — textos funcionais mas que podem ser otimizados
- 🟢 **Bom** — textos que já estão adequados

Também forneça:
- **Score Geral de Qualidade** (0-100)
- **Checklist de UX Writing**: ☑ Clareza | ☑ Concisão | ☑ Utilidade | ☑ Tom de voz | ☑ Acessibilidade

Contexto do projeto: ${projectContext}

Formate em Markdown com tabelas.`,

      audit_wcag: `Você é um Especialista em Acessibilidade (a11y) sênior certificado em WCAG 2.1. Gere uma auditoria WCAG completa com:

1. **Resumo Executivo** — Score geral de conformidade
2. **Auditoria por Princípio** (Perceptível, Operável, Compreensível, Robusto)
3. **Top 10 Issues Prioritários**
4. **Anotações para Desenvolvedores**
5. **Checklist de Quick Wins**
6. **Roadmap de Conformidade**

Contexto do projeto: ${projectContext}

Formate em Markdown com tabelas e emojis de status (✅ ⚠️ ❌).`,

      responsive_audit: `Você é um especialista em Design Responsivo e Mobile-First. Analise os resultados do audit de breakpoints abaixo e forneça:

1. **📊 Score Geral** — Avaliação da responsividade
2. **📱 Análise Mobile** — Problemas específicos de mobile
3. **📱 Análise Tablet** — Problemas específicos de tablet
4. **🖥️ Análise Desktop** — Problemas específicos de desktop
5. **🔥 Issues Críticos** — Os problemas mais urgentes a corrigir
6. **✅ Recomendações** — Ações prioritizadas por impacto
7. **📐 Breakpoints Sugeridos** — Se os breakpoints atuais são adequados
8. **🎯 Quick Wins** — Correções rápidas de alto impacto

Contexto do projeto: ${projectContext}

Formate em Markdown.`,

      ai_ux_overview: `Você é um Head de UX/Product Design sênior. Com base nos dados do projeto abaixo, forneça uma análise completa do estado atual da UX:

1. **📊 Diagnóstico Geral** — Estado atual do projeto e sua saúde
2. **✅ Pontos Fortes** — O que está indo bem
3. **⚠️ Pontos de Atenção** — O que precisa de melhoria
4. **📈 Métricas vs Benchmarks** — Como as métricas se comparam ao mercado
5. **🎯 Próximos Passos** — Top 5 ações recomendadas

Contexto: ${projectContext}

Formate em Markdown com emojis.`,

      ai_ux_personas: `Você é um UX Researcher especialista em Personas. Analise as personas do projeto e forneça:

1. **📋 Avaliação das Personas Atuais** — Qualidade e completude de cada persona
2. **🔍 Gaps Identificados** — Segmentos de usuário não representados
3. **🎯 Sugestões de Novas Personas** — Com nome, role, goals e pain points
4. **🔗 Mapa de Relacionamento** — Como as personas interagem entre si
5. **📊 Cobertura de Jornada** — Quais etapas da jornada cada persona cobre

Contexto: ${projectContext}

Formate em Markdown.`,

      ai_ux_behavior: `Você é um especialista em Behavioral Design (Modelo de Fogg). Analise os modelos de comportamento e forneça:

1. **📊 Análise dos Modelos Atuais** — Avaliação de cada modelo
2. **🧠 Insights de Motivação** — Padrões motivacionais identificados
3. **💪 Análise de Habilidade** — Barreiras de habilidade mais comuns
4. **🔔 Eficácia dos Prompts** — Quais triggers funcionam melhor
5. **🎯 Recomendações** — Como otimizar cada componente do modelo

Contexto: ${projectContext}

Formate em Markdown.`,

      ai_ux_improvements: `Você é um Product Design Lead. Gere sugestões de melhoria priorizadas:

1. **🔥 Quick Wins** — Melhorias de alto impacto e baixo esforço
2. **📈 Melhorias Estratégicas** — Iniciativas de médio prazo
3. **🚀 Inovações** — Oportunidades de diferenciação
4. **📊 Impacto Estimado** — Para cada sugestão, estime o impacto
5. **📋 Roadmap Sugerido** — Ordem de implementação

Contexto: ${projectContext}

Formate em Markdown com prioridades claras.`,

      ai_ux_maturity: `Você é um consultor de Maturidade UX. Avalie o nível de maturidade:

1. **📊 Nível Atual** — De 1 (Ausente) a 6 (Líder em UX)
2. **📋 Avaliação por Dimensão** — Estratégia, Cultura, Processo, Outcomes
3. **✅ O que já está bom** — Práticas que demonstram maturidade
4. **⚠️ O que falta** — Gaps para o próximo nível
5. **🎯 Roadmap de Evolução** — Passos concretos para evoluir

Contexto: ${projectContext}

Formate em Markdown.`,

      ai_ux_risks: `Você é um Risk Analyst de UX/Product. Identifique riscos e lacunas:

1. **🔴 Riscos Críticos** — Problemas que podem impactar o produto
2. **🟡 Riscos Moderados** — Problemas que podem crescer
3. **📋 Gaps de Processo** — Etapas faltantes no processo de UX
4. **📊 Gaps de Dados** — Informações que estão faltando
5. **🛡️ Plano de Mitigação** — Como endereçar cada risco

Contexto: ${projectContext}

Formate em Markdown.`,

      ai_ux_report_summary: `Você é um Head de Produto/UX. Gere um resumo executivo do projeto:

1. **📊 Status Geral** — Saúde do projeto em uma frase
2. **📈 Destaques** — Os 3 pontos mais relevantes
3. **⚠️ Alertas** — O que precisa de atenção imediata
4. **🎯 Recomendação Principal** — A ação mais importante agora
5. **📋 KPIs** — Métricas-chave e tendências

Contexto: ${projectContext}

Formate em Markdown de forma concisa e acionável.`,
    };

    // Handle visual-check with structured output (tool calling)
    if (action === "visual-check") {
      const colors = JSON.parse(content).colors;
      const visualPrompt = `Você é um Visual Designer e especialista em teoria das cores. Analise a paleta: ${colors.join(", ")}

Avalie:
1. Tipo de harmonia cromática (complementar, análoga, triádica, etc.)
2. Score de harmonia (0-10)
3. Mood/clima que a paleta transmite
4. Alinhamento com marca (se parece profissional, confiável, etc.)
5. Problemas visuais encontrados
6. Sugestões de melhoria

Contexto: ${projectContext}`;

      const visRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash",
          messages: [{ role: "system", content: visualPrompt }, { role: "user", content: `Paleta: ${colors.join(", ")}` }],
          tools: [{
            type: "function",
            function: {
              name: "visual_analysis",
              description: "Return visual analysis of color palette",
              parameters: {
                type: "object",
                properties: {
                  harmony_score: { type: "number" },
                  harmony_type: { type: "string" },
                  mood: { type: "string" },
                  brand_alignment: { type: "string" },
                  issues: { type: "array", items: { type: "string" } },
                  suggestions: { type: "array", items: { type: "string" } },
                },
                required: ["harmony_score", "harmony_type", "mood", "brand_alignment", "issues", "suggestions"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "visual_analysis" } },
        }),
      });

      if (!visRes.ok) {
        const s = visRes.status;
        if (s === 429) return new Response(JSON.stringify({ error: "Rate limit excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (s === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Erro na análise visual" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const visData = await visRes.json();
      const tc = visData.choices?.[0]?.message?.tool_calls?.[0];
      if (tc?.function?.arguments) {
        return new Response(JSON.stringify({ result: JSON.parse(tc.function.arguments) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Resposta inesperada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = prompts[action];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const result = aiData.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
