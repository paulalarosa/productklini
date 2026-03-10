import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { messages, projectContext, project_id: bodyProjectId } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada. Vá em Supabase → Project Settings → Edge Functions → Secrets." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identify project ID
    let projectId = bodyProjectId;
    if (!projectId) {
      const { data: projectRow } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      projectId = projectRow?.id;
    }

    // Fetch rich context if project exists
    let richContext = "";
    if (projectId) {
      const [projectRes, personasRes, tasksRes, metricsRes, docsRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase.from("personas").select("*").eq("project_id", projectId),
        supabase.from("tasks").select("*").eq("project_id", projectId),
        supabase.from("ux_metrics").select("*").eq("project_id", projectId),
        supabase.from("project_documents").select("doc_type, title").eq("project_id", projectId),
      ]);

      const p = projectRes.data;
      if (p) {
        richContext = `
PROJETO: ${p.name}
DESCRIÇÃO: ${p.description || "N/A"}
FASE ATUAL: ${p.current_phase || "Discovery"}
PROGRESSO: ${p.progress || 0}%

PERSONAS (${personasRes.data?.length || 0}):
${personasRes.data?.map((pers: { name: string; role: string }) => `- ${pers.name} (${pers.role})`).join("\n") || "Nenhuma registrada."}

TAREFAS (${tasksRes.data?.length || 0}):
${tasksRes.data?.slice(0, 10).map((t: { module: string; title: string; status: string }) => `- [${t.module}] ${t.title} (${t.status})`).join("\n") || "Nenhuma tarefa."}

MÉTRICAS UX:
${metricsRes.data?.map((m: { metric_name: string; score: number }) => `- ${m.metric_name}: ${m.score}`).join("\n") || "Nenhuma métrica."}

DOCUMENTOS EXISTENTES:
${docsRes.data?.map((d: { doc_type: string; title: string }) => `- [${d.doc_type}] ${d.title}`).join("\n") || "Nenhum documento."}
        `.trim();
      }
    }

    const systemPrompt = `Você é o "Mentor IA" de um Dashboard de Ciclo de Vida de Produto Digital.
Você ajuda com análise de gargalos, checklists de QA, acessibilidade (WCAG), handoff Design→Dev, e análise de métricas UX.

CONTEXTO REAL DO BANCO DE DADOS:
${richContext || "Nenhum dado de projeto encontrado ainda."}

CONTEXTO DA PÁGINA ATUAL (UI):
${projectContext ? JSON.stringify(projectContext) : "Nenhum contexto de UI disponível."}

FRAMEWORKS DE DISCOVERY (baseado em Teresa Torres, Marty Cagan, Lean UX):
- JTBD (Jobs To Be Done): Foco em contexto e motivação, não demografia. Jobs são funcionais, emocionais e sociais.
- Opportunity Solution Tree (OST): Foco implacável na oportunidade de maior alavancagem.
- 5 Porquês (Toyota): Cada "porquê" remove uma camada de superficialidade até a causa raiz sistêmica.
- Problem Statement: "Qual o problema?", "Como sabemos que é um problema?", "Por que é um problema?", "Qual o valor de negócio?"
- Continuous Discovery: Entrevistas baseadas em histórias ("conte-me como foi a última vez que..."), não "o que você quer?"
- Tríade Estratégica: Desirability × Viability × Feasibility = onde a inovação acontece.
- Output ≠ Outcome: Entregar ≠ Resolver. Research wins revenue.

COERÊNCIA DE CONTEXTO:
- SEMPRE use as PERSONAS EXISTENTES do projeto listadas acima. NÃO invente novas personas.
- Todo conteúdo gerado (Mapa de Empatia, JTBD, Benchmark, etc.) deve ser coerente com o projeto e personas existentes.
- Se não houver personas cadastradas, crie uma persona base primeiro usando create_personas.

DIRETRIZES:
- Responda sempre em português brasileiro de forma direta e técnica.
- Quando o usuário pedir para criar QUALQUER artefato, USE AS FERRAMENTAS para inserir diretamente nas tabelas.
- IMPORTANTE: NÃO use create_document para artefatos que têm tabela própria. Use a ferramenta específica:
  - Benchmark → use create_benchmark (insere na tabela benchmarks)
  - Mapa de Empatia → use create_empathy_map (insere na tabela empathy_maps)
  - JTBD → use create_jtbd (insere na tabela jtbd_frameworks)
  - Matriz CSD → use create_csd_matrix (insere na tabela csd_matrices)
  - How Might We → use create_hmw (insere na tabela hmw_questions)
  - BMC → use create_bmc (insere na tabela business_model_canvas)
  - Sitemap → use create_sitemap (insere na tabela sitemaps)
  - Card Sorting → use create_card_sorting (insere na tabela card_sorting)
  - Tom de Voz → use create_tone_of_voice (insere na tabela tone_of_voice)
  - Microcopy → use create_microcopy (insere na tabela microcopy_inventory)
  - Heurística Nielsen → use create_nielsen_evaluation (insere na tabela nielsen_heuristics)
  - Teste de Usabilidade → use create_usability_result (insere na tabela usability_tests)
  - WCAG → use create_wcag_audit (insere na tabela wcag_audits)
  - Bug/QA → use create_qa_bug (insere na tabela qa_bugs)
- Use create_document APENAS para documentos genéricos que não têm tabela própria.

FORMATO DE AÇÃO OBRIGATÓRIO:
Quando precisar usar uma ferramenta, você DEVE usar function calling. Se por algum motivo function calling não funcionar, use EXATAMENTE este formato no seu texto (uma chamada por bloco):

<tool_call>
{"name": "nome_da_ferramenta", "arguments": {"chave": "valor"}}
</tool_call>

Exemplo para JTBD:
<tool_call>
{"name": "create_jtbd", "arguments": {"job_statement": "...", "situation": "...", "motivation": "...", "expected_outcome": "..."}}
</tool_call>

NUNCA descreva o que você faria. SEMPRE execute a ferramenta. Se for criar 3 JTBDs, faça 3 chamadas separadas.
- Sempre tente preencher o máximo de informações técnicas possíveis baseado no contexto que você tem.
- Quando gerar benchmarks, inclua concorrentes reais do mercado com análises detalhadas.
- Quando gerar mapas de empatia, baseie-se nas personas existentes do projeto.`;

    const tools = [

      {
        type: "function",
        function: {
          name: "create_tasks",
          description: "Cria tarefas no projeto.",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    module: { type: "string", enum: ["ux", "ui", "dev"] },
                    phase: { type: "string", enum: ["discovery", "define", "develop", "deliver"] },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  },
                  required: ["title", "module", "phase"],
                },
              },
            },
            required: ["tasks"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_personas",
          description: "Cria personas no projeto.",
          parameters: {
            type: "object",
            properties: {
              personas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: "string" },
                    goals: { type: "array", items: { type: "string" } },
                    pain_points: { type: "array", items: { type: "string" } },
                  },
                  required: ["name", "role"],
                },
              },
            },
            required: ["personas"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_document",
          description: "Cria um documento de projeto (slugs: empathy_map, csd_matrix, jtbd, journey_map, etc).",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              doc_type: { 
                type: "string", 
                enum: [
                  "research_plan", "journey_map", "insights_summary", "ds_foundation", "dev_handoff",
                  "empathy_map", "benchmark", "jtbd", "csd_matrix", "hmw", "affinity_diagram",
                  "tone_of_voice", "microcopy_library", "content_audit", "heuristic_evaluation",
                  "usability_test", "wcag_checklist", "prioritization_matrix", "sitemap", 
                  "component_states", "task_flows", "interview_analysis"
                ] 
              },
              content: { type: "string", description: "Conteúdo Markdown" },
            },
            required: ["title", "doc_type", "content"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_bmc",
          description: "Cria um Business Model Canvas estruturado.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              value_propositions: { type: "array", items: { type: "string" } },
              customer_segments: { type: "array", items: { type: "string" } },
              customer_relationships: { type: "array", items: { type: "string" } },
              channels: { type: "array", items: { type: "string" } },
              key_activities: { type: "array", items: { type: "string" } },
              key_resources: { type: "array", items: { type: "string" } },
              key_partners: { type: "array", items: { type: "string" } },
              cost_structure: { type: "array", items: { type: "string" } },
              revenue_streams: { type: "array", items: { type: "string" } },
            },
            required: ["name", "value_propositions", "customer_segments"]
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_ux_metrics",
          description: "Define métricas de UX para o projeto.",
          parameters: {
            type: "object",
            properties: {
              metrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    metric_name: { type: "string" },
                    score: { type: "number" },
                    description: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["metric_name", "score", "category"],
                },
              },
            },
            required: ["metrics"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_ux_research",
          description: "Registra uma pesquisa de UX realizada.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              research_type: { type: "string" },
              summary: { type: "string" },
              participants: { type: "number" },
              findings: { type: "array", items: { type: "string" } },
            },
            required: ["title", "research_type", "summary"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_empathy_map",
          description: "Cria um mapa de empatia estruturado para uma persona.",
          parameters: {
            type: "object",
            properties: {
              persona_name: { type: "string" },
              thinks_and_feels: { type: "array", items: { type: "string" } },
              hears: { type: "array", items: { type: "string" } },
              sees: { type: "array", items: { type: "string" } },
              says_and_does: { type: "array", items: { type: "string" } },
              pains: { type: "array", items: { type: "string" } },
              gains: { type: "array", items: { type: "string" } },
            },
            required: ["persona_name", "thinks_and_feels", "hears", "sees", "says_and_does", "pains", "gains"]
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_benchmark",
          description: "Realiza uma análise de benchmark competitiva estruturada.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    url: { type: "string" },
                  },
                  required: ["name", "strengths", "weaknesses"]
                }
              },
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    feature: { type: "string" },
                    competitors: { type: "object", description: "Map of competitor name to 'Yes' or 'No'" }
                  },
                  required: ["feature", "competitors"]
                }
              },
              insights: { type: "array", items: { type: "string" } },
            },
            required: ["name", "competitors", "features", "insights"]
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_jtbd",
          description: "Cria um framework Jobs To Be Done (JTBD) estruturado.",
          parameters: {
            type: "object",
            properties: {
              job_statement: { type: "string" },
              situation: { type: "string" },
              motivation: { type: "string" },
              expected_outcome: { type: "string" },
            },
            required: ["job_statement", "situation", "motivation", "expected_outcome"]
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_csd_matrix",
          description: "Adiciona novos itens à Matriz CSD (Certezas, Suposições, Dúvidas).",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string", enum: ["Certeza", "Suposição", "Dúvida"] },
                    description: { type: "string" },
                    impact_level: { type: "string", enum: ["Low", "Medium", "High"] },
                  },
                  required: ["category", "description", "impact_level"]
                }
              }
            },
            required: ["items"]
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_hmw",
          description: "Cria perguntas How Might We (Como Poderíamos) para ideação.",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    problem_statement: { type: "string" },
                    hmw_question: { type: "string" },
                    priority: { type: "string", enum: ["P1", "P2", "P3"] },
                  },
                  required: ["problem_statement", "hmw_question", "priority"]
                }
              }
            },
            required: ["questions"]
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_sitemap",
          description: "Cria a estrutura de um sitemap (nós de navegação).",
          parameters: {
            type: "object",
            properties: {
              nodes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    node_name: { type: "string" },
                    url_path: { type: "string" },
                    description: { type: "string" },
                    hierarchy_level: { type: "number" }
                  }
                }
              }
            },
            required: ["nodes"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_card_sorting",
          description: "Cria categorias e itens para um exercício de Card Sorting.",
          parameters: {
            type: "object",
            properties: {
              category_name: { type: "string" },
              items: { type: "array", items: { type: "string" } }
            },
            required: ["category_name", "items"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_tone_of_voice",
          description: "Define as diretrizes de Tom de Voz da marca.",
          parameters: {
            type: "object",
            properties: {
              personality_traits: { type: "array", items: { type: "string" } },
              do_say: { type: "array", items: { type: "string" } },
              dont_say: { type: "array", items: { type: "string" } },
              brand_archetype: { type: "string" }
            },
            required: ["personality_traits", "do_say", "dont_say"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_microcopy",
          description: "Cria inventário de microcopy para componentes da interface.",
          parameters: {
            type: "object",
            properties: {
              component_type: { type: "string" },
              context: { type: "string" },
              original_text: { type: "string" },
              suggested_copy: { type: "string" },
              tone_applied: { type: "string" }
            },
            required: ["component_type", "suggested_copy"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_nielsen_evaluation",
          description: "Registra uma avaliação heurística de Nielsen para uma tela ou fluxo.",
          parameters: {
            type: "object",
            properties: {
              heuristic_name: { type: "string" },
              evaluation_notes: { type: "string" },
              severity_level: { type: "number", minimum: 1, maximum: 5 },
              recommendation: { type: "string" }
            },
            required: ["heuristic_name", "severity_level"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_usability_result",
          description: "Registra os resultados de um teste de usabilidade com usuários.",
          parameters: {
            type: "object",
            properties: {
              task_description: { type: "string" },
              success_rate_percentage: { type: "number" },
              user_feedback: { type: "string" },
              key_observations: { type: "string" }
            },
            required: ["task_description", "success_rate_percentage"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_wcag_audit",
          description: "Registra um item de auditoria de acessibilidade WCAG.",
          parameters: {
            type: "object",
            properties: {
              guideline_reference: { type: "string" },
              compliance_status: { type: "string", enum: ["Pass", "Fail", "Warning"] },
              issue_description: { type: "string" },
              fix_suggestion: { type: "string" }
            },
            required: ["guideline_reference", "compliance_status"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_qa_bug",
          description: "Relata um bug ou erro técnico encontrado no sistema.",
          parameters: {
            type: "object",
            properties: {
              bug_title: { type: "string" },
              steps_to_reproduce: { type: "string" },
              severity: { type: "string", enum: ["Baixa", "Média", "Alta", "Crítica"] },
              status: { type: "string", enum: ["Aberto", "Em Análise", "Resolvido"] }
            },
            required: ["bug_title", "severity"]
          }
        }
      }
    ];

    // ── First call: non-streaming to detect tool use ──────────────────
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        stream: false,
      }),
    });

    if (!firstResponse.ok) {
      const errText = await firstResponse.text();
      return new Response(JSON.stringify({ error: `Erro na IA (${firstResponse.status})`, details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstData = await firstResponse.json();
    const choice = firstData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    // ── Fallback: parse tool calls from text if model didn't use function calling ──
    const validToolNames = new Set([
      "create_tasks", "create_personas", "create_document", "create_bmc",
      "create_ux_metrics", "create_ux_research", "create_empathy_map",
      "create_benchmark", "create_jtbd", "create_csd_matrix", "create_hmw",
      "create_sitemap", "create_card_sorting", "create_tone_of_voice",
      "create_microcopy", "create_nielsen_evaluation", "create_usability_result",
      "create_wcag_audit", "create_qa_bug"
    ]);

    function parseToolCallsFromText(text: string): { id: string; function: { name: string; arguments: string } }[] {
      const parsed: { id: string; function: { name: string; arguments: string } }[] = [];
      let counter = 0;

      // Pattern 1: <tool_call>{"name": "...", "arguments": {...}}</tool_call>
      const toolCallRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
      let match;
      while ((match = toolCallRegex.exec(text)) !== null) {
        try {
          const obj = JSON.parse(match[1]);
          if (obj.name && validToolNames.has(obj.name)) {
            parsed.push({
              id: `fallback_${counter++}`,
              function: {
                name: obj.name,
                arguments: typeof obj.arguments === "string" ? obj.arguments : JSON.stringify(obj.arguments)
              }
            });
          }
        } catch { /* skip malformed */ }
      }

      // Pattern 2: create_tool_name({...}) or create_tool_name{...}
      if (parsed.length === 0) {
        const inlineRegex = /(?:token_call:|tool_call:)?(create_\w+)\s*\(?\s*(\{[\s\S]*?\})\s*\)?/gi;
        while ((match = inlineRegex.exec(text)) !== null) {
          const fnName = match[1];
          if (validToolNames.has(fnName)) {
            try {
              JSON.parse(match[2]);
              parsed.push({
                id: `fallback_${counter++}`,
                function: { name: fnName, arguments: match[2] }
              });
            } catch { /* skip malformed */ }
          }
        }
      }

      return parsed;
    }

    // Check if tool_calls exist natively OR can be parsed from text
    let effectiveToolCalls = toolCalls;
    const responseContent = choice?.message?.content || "";

    if (!effectiveToolCalls || effectiveToolCalls.length === 0) {
      const parsedFromText = parseToolCallsFromText(responseContent);
      if (parsedFromText.length > 0) {
        effectiveToolCalls = parsedFromText;
      }
    }

    // ── No tool calls at all → stream response directly ──────────────────
    if (!effectiveToolCalls || effectiveToolCalls.length === 0) {
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      });

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }


    // ── Execute tool calls ────────────────────────────────────────────
    const toolResults: { tool_call_id: string; role: "tool"; content: string }[] = [];
    const actionsPerformed: string[] = [];

    interface TaskArg { title: string; module?: "ux" | "ui" | "dev"; phase?: "discovery" | "define" | "develop" | "deliver"; priority?: "low" | "medium" | "high" | "urgent" }
    interface PersonaArg { name: string; role: string; goals?: string[]; pain_points?: string[] }
    interface MetricArg { metric_name: string; score: number; description?: string; category: string }
    interface CSDArg { category: "Certeza" | "Suposição" | "Dúvida"; description: string; impact_level: "Low" | "Medium" | "High" }
    interface HMWArg { problem_statement: string; hmw_question: string; priority: "P1" | "P2" | "P3" }
    interface SitemapArg { node_name: string; url_path?: string; description?: string; hierarchy_level: number }

    for (const tc of effectiveToolCalls) {
      const fnName = tc.function.name;
      let args: Record<string, unknown>;
      try { args = JSON.parse(tc.function.arguments); } catch { continue; }

      if (!projectId) {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "Projeto não encontrado" });
        continue;
      }

      if (fnName === "create_tasks") {
        const tasks = (args.tasks as TaskArg[]) ?? [];
        const toInsert = tasks.map((t) => ({
          project_id: projectId,
          title: t.title,
          module: t.module || "ux",
          phase: t.phase || "discovery",
          priority: t.priority || "medium",
          status: "todo"
        }));
        const { error: dbErr } = await supabase.from("tasks").insert(toInsert);
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar tarefas: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ ${tasks.length} tarefa(s)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_personas") {
        const personas = (args.personas as PersonaArg[]) ?? [];
        const toInsert = personas.map((p) => ({
          project_id: projectId,
          name: p.name,
          role: p.role || "User",
          goals: p.goals || [],
          pain_points: p.pain_points || []
        }));
        const { error: dbErr } = await supabase.from("personas").insert(toInsert);
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar personas: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ ${personas.length} persona(s)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_document") {
        const { error: dbErr } = await supabase.from("project_documents").insert({
          project_id: projectId,
          title: args.title,
          doc_type: args.doc_type,
          content: args.content,
          ai_generated: true
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar doc: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Doc "${args.title}"`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_bmc") {
        const { error: dbErr } = await supabase.from("business_model_canvas").insert({
          project_id: projectId,
          name: args.name,
          value_propositions: args.value_propositions,
          customer_segments: args.customer_segments,
          customer_relationships: args.customer_relationships || [],
          channels: args.channels || [],
          key_activities: args.key_activities || [],
          key_resources: args.key_resources || [],
          key_partners: args.key_partners || [],
          cost_structure: args.cost_structure || [],
          revenue_streams: args.revenue_streams || [],
          status: "draft"
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar BMC: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ BMC "${args.name}"`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_ux_metrics") {
        const metrics = (args.metrics as MetricArg[]) ?? [];
        const toInsert = metrics.map((m) => ({
          project_id: projectId,
          metric_name: m.metric_name,
          score: m.score,
          description: m.description,
          category: m.category
        }));
        const { error: dbErr } = await supabase.from("ux_metrics").insert(toInsert);
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar métricas: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ ${metrics.length} métricas`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_ux_research") {
        const { error: dbErr } = await supabase.from("ux_research").insert({
          project_id: projectId,
          title: args.title,
          research_type: args.research_type,
          summary: args.summary,
          participants: args.participants || 0,
          findings: args.findings || [],
          conducted_at: new Date().toISOString()
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar pesquisa: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Pesquisa "${args.title}"`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_empathy_map") {
        const { error: dbErr } = await supabase.from("empathy_maps").insert({
          project_id: projectId,
          persona_name: args.persona_name,
          thinks_and_feels: args.thinks_and_feels,
          hears: args.hears,
          sees: args.sees,
          says_and_does: args.says_and_does,
          pains: args.pains,
          gains: args.gains
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Mapa de Empatia: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Mapa de Empatia "${args.persona_name}"`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_benchmark") {
        const { error: dbErr } = await supabase.from("benchmarks").insert({
          project_id: projectId,
          name: args.name,
          competitors: args.competitors,
          features: args.features,
          insights: args.insights
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Benchmark: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Benchmark "${args.name}"`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_jtbd") {
        const { error: dbErr } = await supabase.from("jtbd_frameworks").insert({
          project_id: projectId,
          job_statement: args.job_statement,
          situation: args.situation,
          motivation: args.motivation,
          expected_outcome: args.expected_outcome
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar JTBD: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ JTBD Framework`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_csd_matrix") {
        const itemsToInsert = (args.items as CSDArg[]).map((item) => ({
          project_id: projectId,
          ...item
        }));
        const { error: dbErr } = await supabase.from("csd_matrices").insert(itemsToInsert);
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Matriz CSD: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Matriz CSD (${(args.items as CSDArg[]).length} itens)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_hmw") {
        const questionsToInsert = (args.questions as HMWArg[]).map((q) => ({
          project_id: projectId,
          ...q
        }));
        const { error: dbErr } = await supabase.from("hmw_questions").insert(questionsToInsert);
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar HMW: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ How Might We (${(args.questions as HMWArg[]).length} perguntas)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_sitemap") {
        const nodes = (args.nodes as SitemapArg[]).map((n) => ({
          project_id: projectId,
          ...n
        }));
        const { error: dbErr } = await supabase.from("sitemaps").insert(nodes);
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Sitemap: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Sitemap (${(args.nodes as SitemapArg[]).length} nós)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_card_sorting") {
        const { error: dbErr } = await supabase.from("card_sorting").insert({
          project_id: projectId,
          category_name: args.category_name,
          items: args.items
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Card Sorting: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Card Sorting ("${args.category_name}")`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_tone_of_voice") {
        const { error: dbErr } = await supabase.from("tone_of_voice").insert({
          project_id: projectId,
          personality_traits: args.personality_traits,
          do_say: args.do_say,
          dont_say: args.dont_say,
          brand_archetype: args.brand_archetype
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Tom de Voz: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Tom de Voz`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_microcopy") {
        const { error: dbErr } = await supabase.from("microcopy_inventory").insert({
          project_id: projectId,
          component_type: args.component_type,
          context: args.context,
          original_text: args.original_text,
          suggested_copy: args.suggested_copy,
          tone_applied: args.tone_applied
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Microcopy: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Microcopy ("${args.component_type}")`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_nielsen_evaluation") {
        const { error: dbErr } = await supabase.from("nielsen_heuristics").insert({
          project_id: projectId,
          heuristic_name: args.heuristic_name,
          evaluation_notes: args.evaluation_notes,
          severity_level: args.severity_level,
          recommendation: args.recommendation
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Heurística: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Heurística "${args.heuristic_name}" (Nível ${args.severity_level})`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_usability_result") {
        const { error: dbErr } = await supabase.from("usability_tests").insert({
          project_id: projectId,
          task_description: args.task_description,
          success_rate_percentage: args.success_rate_percentage,
          user_feedback: args.user_feedback,
          key_observations: args.key_observations
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Teste: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Teste "${args.task_description}" (${args.success_rate_percentage}%)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_wcag_audit") {
        const { error: dbErr } = await supabase.from("wcag_audits").insert({
          project_id: projectId,
          guideline_reference: args.guideline_reference,
          compliance_status: args.compliance_status,
          issue_description: args.issue_description,
          fix_suggestion: args.fix_suggestion
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar WCAG Audit: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ WCAG Audit: ${args.guideline_reference} (${args.compliance_status})`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      } else if (fnName === "create_qa_bug") {
        const { error: dbErr } = await supabase.from("qa_bugs").insert({
          project_id: projectId,
          bug_title: args.bug_title,
          steps_to_reproduce: args.steps_to_reproduce,
          severity: args.severity,
          status: args.status || "Aberto"
        });
        if (dbErr) {
          actionsPerformed.push(`❌ Erro ao criar Bug: ${dbErr.message}`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `ERRO: ${dbErr.message}` });
        } else {
          actionsPerformed.push(`✅ Bug: "${args.bug_title}" (${args.severity})`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
        }
      }
    }

    // ── Stream final response ─────────────────────────────────────────
    // Build the assistant message for context - use original if native tool calls, synthetic if fallback
    const assistantMessage = (toolCalls && toolCalls.length > 0)
      ? choice.message
      : { role: "assistant" as const, content: responseContent || "Executando ferramentas..." };

    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          assistantMessage,
          ...toolResults,
          { role: "user", content: `As ferramentas foram executadas. Resultado: ${actionsPerformed.join(", ")}. Resuma o que foi criado de forma concisa.` }
        ],
        stream: true,
      }),
    });

    // Simple stream forward with prefix
    const encoder = new TextEncoder();
    const actionPrefix = actionsPerformed.length > 0 ? `[Ações: ${actionsPerformed.join(", ")}]\n\n` : "";
    const prefixBytes = encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: actionPrefix } }] })}\n\n`);

    const reader = finalResponse.body!.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        if (actionPrefix) controller.enqueue(prefixBytes);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (e) {
    console.error("mentor-chat unhandled error:", e);
    return new Response(JSON.stringify({ 
        error: "Erro interno",
        details: e instanceof Error ? e.message : String(e),
        debug_tag: "v0.3.0"
     }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
