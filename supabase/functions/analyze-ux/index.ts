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

    // Fetch project context for context-aware analysis
    let projectContext = "";
    if (project_id) {
      const [pRes, persRes] = await Promise.all([
        supabase.from("projects").select("name, description").eq("id", project_id).single(),
        supabase.from("personas").select("name, role, goals, pain_points").eq("project_id", project_id),
      ]);
      const p = pRes.data;
      const personas = persRes.data ?? [];
      projectContext = `Projeto: ${p?.name || "N/A"}. ${p?.description || ""}
Personas: ${personas.map(pe => `${pe.name} (${pe.role})`).join(", ") || "Nenhuma"}`;
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
3. **Princípio Aplicado** — qual princípio de UX Writing foi usado (clareza, concisão, tom, ação, etc.)

Categorize em:
- 🔴 **Crítico** — textos confusos, ambíguos ou que podem causar erro
- 🟡 **Melhoria** — textos funcionais mas que podem ser otimizados
- 🟢 **Bom** — textos que já estão adequados

Também forneça:
- **Score Geral de Qualidade** (0-100)
- **Checklist de UX Writing**: ☑ Clareza | ☑ Concisão | ☑ Utilidade | ☑ Tom de voz | ☑ Acessibilidade
- **Padrões de Microcopy Sugeridos** — templates para padronizar

Contexto do projeto: ${projectContext}

Formate em Markdown com tabelas.`,

      audit_wcag: `Você é um Especialista em Acessibilidade (a11y) sênior certificado em WCAG 2.1. Com base no contexto do projeto e nas informações fornecidas, gere uma auditoria WCAG completa:

1. **Resumo Executivo** — Score geral de conformidade (A/AA/AAA) e nível atual estimado

2. **Auditoria por Princípio** — Para cada princípio WCAG:
   **PERCEPTÍVEL**
   - 1.1 Alternativas em Texto — Status | Severidade | Recomendação
   - 1.3 Adaptável — Status | Severidade | Recomendação
   - 1.4 Distinguível (Contraste) — Status | Severidade | Recomendação

   **OPERÁVEL**
   - 2.1 Navegação por Teclado — Status | Severidade | Recomendação
   - 2.4 Navegável (Focus, Headings) — Status | Severidade | Recomendação

   **COMPREENSÍVEL**
   - 3.1 Legível — Status | Severidade | Recomendação
   - 3.3 Assistência de Input — Status | Severidade | Recomendação

   **ROBUSTO**
   - 4.1 Compatível (ARIA, Semântica) — Status | Severidade | Recomendação

3. **Top 10 Issues Prioritários** com:
   - Critério WCAG violado
   - Severidade (Crítica/Alta/Média/Baixa)
   - Impacto no usuário
   - Como corrigir (código/design)

4. **Anotações para Desenvolvedores** — Ordem de foco, tags ARIA necessárias, landmarks

5. **Checklist de Quick Wins** — Correções rápidas de alto impacto

6. **Roadmap de Conformidade** — Plano para atingir nível AA

Contexto do projeto: ${projectContext}

Formate em Markdown com tabelas e emojis de status (✅ ⚠️ ❌).`,
    };

    const systemPrompt = prompts[action];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
