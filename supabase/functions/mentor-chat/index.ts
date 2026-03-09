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

    const { messages, projectContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada. Vá em Supabase → Project Settings → Edge Functions → Secrets." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's project ID for tool execution
    const { data: projectRow } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const projectId = projectRow?.id;

    const systemPrompt = `Você é o "Mentor IA" de um Dashboard de Ciclo de Vida de Produto Digital. Você ajuda equipes de produto com análise de gargalos, checklists de QA, acessibilidade (WCAG), sugestões de handoff Design→Dev, e análise de métricas UX.

Contexto do projeto atual:
${projectContext ? JSON.stringify(projectContext) : "Nenhum contexto disponível."}

Diretrizes:
- Responda sempre em português brasileiro
- Seja conciso e direto, use markdown para formatar
- Use emojis relevantes para destacar pontos importantes
- Quando identificar gargalos, sugira ações concretas
- Considere as fases do Double Diamond (Descobrir, Definir, Desenvolver, Entregar)
- Priorize recomendações acionáveis
- Quando o usuário pedir para criar tarefas, personas ou documentos, USE AS FERRAMENTAS DISPONÍVEIS para criá-los diretamente no banco de dados
- Após usar uma ferramenta, confirme o que foi criado com uma mensagem amigável`;

    const tools = [
      {
        type: "function",
        function: {
          name: "create_tasks",
          description: "Cria uma ou mais tarefas no projeto. Use quando o usuário pedir para criar, sugerir ou adicionar tarefas.",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título da tarefa" },
                    module: { type: "string", enum: ["ux", "ui", "dev"], description: "Módulo: ux, ui ou dev" },
                    phase: { type: "string", enum: ["discovery", "define", "develop", "deliver"], description: "Fase do Double Diamond" },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade" },
                    estimated_days: { type: "number", description: "Dias estimados" },
                  },
                  required: ["title", "module", "phase"],
                  additionalProperties: false,
                },
              },
            },
            required: ["tasks"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_personas",
          description: "Cria uma ou mais personas no projeto. Use quando o usuário pedir para gerar ou adicionar personas.",
          parameters: {
            type: "object",
            properties: {
              personas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Nome da persona" },
                    role: { type: "string", description: "Perfil/papel da persona" },
                    goals: { type: "array", items: { type: "string" }, description: "Objetivos" },
                    pain_points: { type: "array", items: { type: "string" }, description: "Dores/frustrações" },
                  },
                  required: ["name", "role"],
                  additionalProperties: false,
                },
              },
            },
            required: ["personas"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_document",
          description: "Cria um documento de projeto (insight, plano de pesquisa, mapa de jornada, etc). Use quando o usuário pedir para documentar algo.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título do documento" },
              doc_type: { type: "string", enum: ["research_plan", "journey_map", "insights_summary", "ds_foundation", "dev_handoff"], description: "Tipo de documento" },
              content: { type: "string", description: "Conteúdo em Markdown" },
            },
            required: ["title", "doc_type", "content"],
            additionalProperties: false,
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
      console.error("Lovable AI gateway error (first call):", firstResponse.status, errText);

      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace Lovable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 401) {
        return new Response(JSON.stringify({ error: "LOVABLE_API_KEY inválida ou expirada. Regenere a chave em Lovable." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Erro no gateway de IA (${firstResponse.status}). Detalhes: ${errText}` }), {
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
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "Erro ao interpretar argumentos" });
        continue;
      }

      if (!projectId) {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "Projeto não encontrado" });
        continue;
      }

      if (fnName === "create_tasks") {
        const tasks = (args.tasks as { title: string; module?: string; phase?: string; priority?: string; estimated_days?: number }[]) ?? [];
        const toInsert = tasks.map((t) => ({
          project_id: projectId,
          title: t.title,
          module: t.module || "dev",
          phase: t.phase || "develop",
          priority: t.priority || "medium",
          status: "todo",
          estimated_days: t.estimated_days || 3,
          days_in_phase: 0,
        }));
        const { error } = await supabase.from("tasks").insert(toInsert);
        if (error) {
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `Erro: ${error.message}` });
        } else {
          actionsPerformed.push(`✅ ${tasks.length} tarefa(s) criada(s)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `${tasks.length} tarefas criadas com sucesso: ${tasks.map((t) => t.title).join(", ")}` });
        }
      } else if (fnName === "create_personas") {
        const personas = (args.personas as { name: string; role?: string; goals?: string[]; pain_points?: string[] }[]) ?? [];
        const toInsert = personas.map((p) => ({
          project_id: projectId,
          name: p.name,
          role: p.role || "Usuário",
          goals: p.goals || [],
          pain_points: p.pain_points || [],
        }));
        const { error } = await supabase.from("personas").insert(toInsert);
        if (error) {
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `Erro: ${error.message}` });
        } else {
          actionsPerformed.push(`✅ ${personas.length} persona(s) criada(s)`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `${personas.length} personas criadas: ${personas.map((p) => p.name).join(", ")}` });
        }
      } else if (fnName === "create_document") {
        const { error } = await supabase.from("project_documents").insert({
          project_id: projectId,
          title: args.title as string,
          doc_type: args.doc_type as string,
          content: args.content as string,
          ai_generated: true,
          metadata: { generated_by: "mentor-ia", generated_at: new Date().toISOString() },
        });
        if (error) {
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `Erro: ${error.message}` });
        } else {
          actionsPerformed.push(`✅ Documento "${args.title}" criado`);
          toolResults.push({ tool_call_id: tc.id, role: "tool", content: `Documento "${args.title}" criado com sucesso` });
        }
      } else {
        toolResults.push({ tool_call_id: tc.id, role: "tool", content: "Ferramenta desconhecida" });
      }
    }

    // ── Second call: send tool results and stream final response ──────
    const followUpMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
      choice.message,  // assistant message with tool_calls
      ...toolResults,
    ];

    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: followUpMessages,
        stream: true,
      }),
    });

    if (!finalResponse.ok) {
      // Return actions summary as fallback SSE
      const summary = actionsPerformed.length > 0
        ? `Ações realizadas:\n${actionsPerformed.join("\n")}`
        : "Não foi possível gerar a resposta final.";

      const encoder = new TextEncoder();
      const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: summary } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(encoder.encode(sseData), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Prepend action badges to the stream if any tools were executed
    if (actionsPerformed.length > 0) {
      const actionPrefix = actionsPerformed.join(" | ") + "\n\n";
      const prefixSSE = `data: ${JSON.stringify({ choices: [{ delta: { content: actionPrefix } }] })}\n\n`;
      const encoder = new TextEncoder();
      const prefixBytes = encoder.encode(prefixSSE);

      const reader = finalResponse.body!.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(prefixBytes);
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(finalResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

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
