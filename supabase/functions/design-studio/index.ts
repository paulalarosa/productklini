import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, mode, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (mode === "ux-pilot") {
      systemPrompt = `Você é o UX Pilot, um assistente de ideação de UX especializado. Gere artefatos de UX como personas, mapas de jornada, fluxos de usuário e wireframes conceituais.

REGRAS:
- Retorne dados estruturados via tool call
- Gere conteúdo realista e detalhado em português
- Para jornadas: inclua 4-8 steps com emoções e touchpoints
- Para personas: dados demográficos, goals, pain_points, behaviors
- Para fluxos: steps de navegação com decisões

${context ? `Contexto do projeto: ${JSON.stringify(context)}` : ""}`;

      tools = [{
        type: "function",
        function: {
          name: "generate_ux_artifact",
          description: "Generate a UX artifact (persona, journey map, user flow, wireframe concept)",
          parameters: {
            type: "object",
            properties: {
              artifact_type: { type: "string", enum: ["persona", "journey_map", "user_flow", "wireframe_concept", "sitemap"] },
              title: { type: "string" },
              description: { type: "string" },
              data: {
                type: "object",
                properties: {
                  // Persona fields
                  name: { type: "string" },
                  age: { type: "number" },
                  role: { type: "string" },
                  bio: { type: "string" },
                  goals: { type: "array", items: { type: "string" } },
                  pain_points: { type: "array", items: { type: "string" } },
                  behaviors: { type: "array", items: { type: "string" } },
                  // Journey map fields
                  stages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        emotion: { type: "string", enum: ["happy", "neutral", "frustrated", "confused", "satisfied"] },
                        touchpoint: { type: "string" },
                        action: { type: "string" },
                        opportunity: { type: "string" },
                      },
                      required: ["name", "description", "emotion", "touchpoint", "action"],
                      additionalProperties: false,
                    },
                  },
                  // User flow fields
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        label: { type: "string" },
                        type: { type: "string", enum: ["start", "action", "decision", "end", "screen"] },
                        connections: { type: "array", items: { type: "string" } },
                      },
                      required: ["id", "label", "type", "connections"],
                      additionalProperties: false,
                    },
                  },
                  // Sitemap fields
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        path: { type: "string" },
                        children: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              path: { type: "string" },
                            },
                            required: ["name", "path"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "path"],
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["artifact_type", "title", "description", "data"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_ux_artifact" } };
    } else if (mode === "ui-make") {
      systemPrompt = `Você é o UI Make, um gerador de componentes de UI. Dado uma descrição, gere código React + Tailwind funcional para o componente.

REGRAS:
- Gere código React com Tailwind CSS válido
- Use design moderno, minimalista, estilo SaaS
- Componentes devem ser auto-contidos
- Use cores via variáveis CSS (hsl) e classes Tailwind semânticas
- Gere dados mock realistas quando necessário
- O código deve ser funcional e renderizável

${context ? `Contexto do projeto: ${JSON.stringify(context)}` : ""}`;

      tools = [{
        type: "function",
        function: {
          name: "generate_ui_component",
          description: "Generate a UI component with React + Tailwind code",
          parameters: {
            type: "object",
            properties: {
              component_name: { type: "string" },
              description: { type: "string" },
              code: { type: "string", description: "Full React + Tailwind component code as JSX string" },
              preview_elements: {
                type: "array",
                description: "SVG-like elements for canvas preview",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["rect", "circle", "text", "line"] },
                    x: { type: "number" },
                    y: { type: "number" },
                    width: { type: "number" },
                    height: { type: "number" },
                    fill: { type: "string" },
                    text: { type: "string" },
                    fontSize: { type: "number" },
                  },
                  required: ["type", "x", "y", "width", "height", "fill"],
                  additionalProperties: false,
                },
              },
            },
            required: ["component_name", "description", "code", "preview_elements"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_ui_component" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ mode, result: args }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return new Response(JSON.stringify({ mode, result: { raw: content } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Resposta inesperada da IA" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("design-studio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
