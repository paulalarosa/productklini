import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Convert Anthropic SSE stream → OpenAI-compatible SSE stream
// so the existing frontend (which expects OpenAI format) keeps working.
async function anthropicToOpenAIStream(anthropicStream: ReadableStream<Uint8Array>): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = anthropicStream.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).replace(/\r$/, "");
            buffer = buffer.slice(newlineIdx + 1);

            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const evt = JSON.parse(jsonStr);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                const openaiChunk = {
                  choices: [{ delta: { content: evt.delta.text }, finish_reason: null }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              } else if (evt.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
}

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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "ANTHROPIC_API_KEY não configurada", 
        details: "Adicione em Project Settings > Edge Functions > Secrets.",
        debug_tag: "v0.2.4"
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standardize projectId retrieval
    let projectId = bodyProjectId;
    if (!projectId) {
      const { data: projectRow } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      projectId = projectRow?.id;
    }

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
- Quando o usuário pedir para criar tarefas, personas ou documentos, USE AS FERRAMENTAS DISPONÍVEIS
- Após usar uma ferramenta, confirme o que foi criado com uma mensagem amigável`;

    // Anthropic tools format
    const tools = [
      {
        name: "create_tasks",
        description: "Cria uma ou mais tarefas no projeto. Use quando o usuário pedir para criar, sugerir ou adicionar tarefas.",
        input_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título da tarefa" },
                  module: { type: "string", enum: ["ux", "ui", "dev"], description: "Módulo" },
                  phase: { type: "string", enum: ["discovery", "define", "develop", "deliver"], description: "Fase do Double Diamond" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade" },
                  estimated_days: { type: "number", description: "Dias estimados" },
                },
                required: ["title", "module", "phase"],
              },
            },
          },
          required: ["tasks"],
        },
      },
      {
        name: "create_personas",
        description: "Cria uma ou mais personas no projeto.",
        input_schema: {
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
                required: ["name"],
              },
            },
          },
          required: ["personas"],
        },
      },
      {
        name: "create_document",
        description: "Cria um documento no projeto.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            doc_type: { type: "string" },
            content: { type: "string" },
          },
          required: ["title", "doc_type", "content"],
        },
      },
    ];

    // ── First call: non-streaming, check for tool use ─────────────────
    const firstResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages,
      }),
    });

    if (!firstResponse.ok) {
      const errText = await firstResponse.text();
      console.error("Anthropic error:", firstResponse.status, errText);
      return new Response(JSON.stringify({ 
        error: "Erro no serviço de IA", 
        details: errText, 
        status: firstResponse.status,
        debug_tag: "v0.2.4"
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstData = await firstResponse.json();
    const toolUseBlocks = firstData.content?.filter((b: { type: string }) => b.type === "tool_use") ?? [];

    // ── No tool calls → stream the response directly ──────────────────
    if (toolUseBlocks.length === 0) {
      const streamResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          system: systemPrompt,
          messages,
          stream: true,
        }),
      });

      if (!streamResponse.body) {
        throw new Error("No response body from Anthropic stream");
      }

      const converted = await anthropicToOpenAIStream(streamResponse.body);
      return new Response(converted, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Execute tool calls ────────────────────────────────────────────
    const toolResults: { type: "tool_result"; tool_use_id: string; content: string }[] = [];

    for (const tc of toolUseBlocks) {
      const fnName = tc.name as string;
      const args = tc.input as Record<string, unknown>;

      if (!projectId) {
        toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: "Projeto não encontrado" });
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
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: `Erro: ${error.message}` });
        } else {
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: `${tasks.length} tarefas criadas com sucesso` });
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
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: `Erro: ${error.message}` });
        } else {
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: `${personas.length} personas criadas com sucesso` });
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
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: `Erro: ${error.message}` });
        } else {
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: `Documento "${args.title}" criado com sucesso` });
        }
      } else {
        toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: "Ferramenta desconhecida" });
      }
    }

    // ── Second call: send tool results and stream final response ──────
    const followUpMessages = [
      ...messages,
      { role: "assistant", content: firstData.content }, // assistant message with tool_use blocks
      { role: "user", content: toolResults },             // tool results
    ];

    const finalResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: systemPrompt,
        messages: followUpMessages,
        stream: true,
      }),
    });

    if (!finalResponse.body) {
      throw new Error("No response body from final Anthropic stream");
    }

    const converted = await anthropicToOpenAIStream(finalResponse.body);
    return new Response(converted, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ 
      error: "Erro interno", 
      details: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      debug_tag: "v0.2.4"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
