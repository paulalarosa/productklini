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
${personasRes.data?.map(pers => `- ${pers.name} (${pers.role})`).join("\n") || "Nenhuma registrada."}

TAREFAS (${tasksRes.data?.length || 0}):
${tasksRes.data?.slice(0, 10).map(t => `- [${t.module}] ${t.title} (${t.status})`).join("\n") || "Nenhuma tarefa."}

MÉTRICAS UX:
${metricsRes.data?.map(m => `- ${m.metric_name}: ${m.score}`).join("\n") || "Nenhuma métrica."}

DOCUMENTOS EXISTENTES:
${docsRes.data?.map(d => `- [${d.doc_type}] ${d.title}`).join("\n") || "Nenhum documento."}
        `.trim();
      }
    }

    const systemPrompt = `Você é o "Mentor IA" de um Dashboard de Ciclo de Vida de Produto Digital.
Você ajuda com análise de gargalos, checklists de QA, acessibilidade (WCAG), handoff Design→Dev, e análise de métricas UX.

CONTEXTO REAL DO BANCO DE DADOS:
${richContext || "Nenhum dado de projeto encontrado ainda."}

CONTEXTO DA PÁGINA ATUAL (UI):
${projectContext ? JSON.stringify(projectContext) : "Nenhum contexto de UI disponível."}

DIRETRIZES:
- Responda sempre em português brasileiro de forma direta e técnica.
- Quando o usuário pedir para criar QUALQUER documento, persona ou tarefa, USE AS FERRAMENTAS.
- Não apenas explique como fazer, FAÇA usando as ferramentas.
- IDs de projetos e usuários são tratados automaticamente pelo backend.
- Se o usuário falar "crie o mapa de empatia", use create_document com doc_type="empathy_map".`;

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
    ];

    // ── First call: non-streaming to detect tool use ──────────────────
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
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

    // ── No tool calls → stream response directly ──────────────────────
    if (!toolCalls || toolCalls.length === 0) {
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash",
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

    for (const tc of toolCalls) {
      const fnName = tc.function.name;
      let args: any;
      try { args = JSON.parse(tc.function.arguments); } catch { continue; }

      if (!projectId) {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "Projeto não encontrado" });
        continue;
      }

      if (fnName === "create_tasks") {
        const tasks = args.tasks ?? [];
        const toInsert = tasks.map((t: any) => ({
          project_id: projectId,
          title: t.title,
          module: t.module || "ux",
          phase: t.phase || "discovery",
          priority: t.priority || "medium",
          status: "todo"
        }));
        await supabase.from("tasks").insert(toInsert);
        actionsPerformed.push(`✅ ${tasks.length} tarefa(s)`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_personas") {
        const personas = args.personas ?? [];
        const toInsert = personas.map((p: any) => ({
          project_id: projectId,
          name: p.name,
          role: p.role || "User",
          goals: p.goals || [],
          pain_points: p.pain_points || []
        }));
        await supabase.from("personas").insert(toInsert);
        actionsPerformed.push(`✅ ${personas.length} persona(s)`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_document") {
        await supabase.from("project_documents").insert({
          project_id: projectId,
          title: args.title,
          doc_type: args.doc_type,
          content: args.content,
          ai_generated: true
        });
        actionsPerformed.push(`✅ Doc "${args.title}"`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_bmc") {
        await supabase.from("business_model_canvas").insert({
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
        actionsPerformed.push(`✅ BMC "${args.name}"`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_ux_metrics") {
        const metrics = args.metrics ?? [];
        const toInsert = metrics.map((m: any) => ({
          project_id: projectId,
          metric_name: m.metric_name,
          score: m.score,
          description: m.description,
          category: m.category
        }));
        await supabase.from("ux_metrics").insert(toInsert);
        actionsPerformed.push(`✅ ${metrics.length} métricas`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_ux_research") {
        await supabase.from("ux_research").insert({
          project_id: projectId,
          title: args.title,
          research_type: args.research_type,
          summary: args.summary,
          participants: args.participants || 0,
          findings: args.findings || [],
          conducted_at: new Date().toISOString()
        });
        actionsPerformed.push(`✅ Pesquisa "${args.title}"`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_empathy_map") {
        await supabase.from("empathy_maps").insert({
          project_id: projectId,
          persona_name: args.persona_name,
          thinks_and_feels: args.thinks_and_feels,
          hears: args.hears,
          sees: args.sees,
          says_and_does: args.says_and_does,
          pains: args.pains,
          gains: args.gains
        });
        actionsPerformed.push(`✅ Mapa de Empatia "${args.persona_name}"`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_benchmark") {
        await supabase.from("benchmarks").insert({
          project_id: projectId,
          name: args.name,
          competitors: args.competitors,
          features: args.features,
          insights: args.insights
        });
        actionsPerformed.push(`✅ Benchmark "${args.name}"`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_jtbd") {
        await supabase.from("jtbd_frameworks").insert({
          project_id: projectId,
          job_statement: args.job_statement,
          situation: args.situation,
          motivation: args.motivation,
          expected_outcome: args.expected_outcome
        });
        actionsPerformed.push(`✅ JTBD Framework`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_csd_matrix") {
        const itemsToInsert = args.items.map((item: any) => ({
          project_id: projectId,
          ...item
        }));
        await supabase.from("csd_matrices").insert(itemsToInsert);
        actionsPerformed.push(`✅ Matriz CSD (${args.items.length} itens)`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      } else if (fnName === "create_hmw") {
        const questionsToInsert = args.questions.map((q: any) => ({
          project_id: projectId,
          ...q
        }));
        await supabase.from("hmw_questions").insert(questionsToInsert);
        actionsPerformed.push(`✅ How Might We (${args.questions.length} perguntas)`);
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "OK" });
      }
    }

    // ── Stream final response ─────────────────────────────────────────
    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages, choice.message, ...toolResults],
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
