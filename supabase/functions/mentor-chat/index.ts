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
          description: "Cria um documento de projeto. Use para preencher painéis de Discovery, UX Writing, Strategy, etc.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título do documento" },
              doc_type: { 
                type: "string", 
                enum: [
                  "research_plan", "journey_map", "insights_summary", "ds_foundation", "dev_handoff",
                  "empathy_map", "benchmark", "jtbd", "csd_matrix", "hmw", "affinity_diagram",
                  "tone_of_voice", "microcopy_library", "content_audit", "heuristic_evaluation",
                  "usability_test", "wcag_checklist", "prioritization_matrix", "sitemap", 
                  "component_states", "task_flows"
                ],
                description: "Tipo de documento (slug)" 
              },
              content: { type: "string", description: "Conteúdo completo em Markdown" },
            },
            required: ["title", "doc_type", "content"],
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
