// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, mode, context, history, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Fetch project context from DB ──
    let projectContext = "";
    let designTokens: { name: string; category: string; value: string }[] = [];
    let personas: { name: string; role: string }[] = [];

    if (context?.project_id) {
      const [tokensRes, personasRes, projectRes] = await Promise.all([
        supabase.from("design_tokens").select("name, category, value").eq("project_id", context.project_id).limit(20),
        supabase.from("personas").select("name, role, goals, pain_points").eq("project_id", context.project_id).limit(5),
        supabase.from("projects").select("name, description, current_phase").eq("id", context.project_id).maybeSingle(),
      ]);
      designTokens = tokensRes.data || [];
      personas = personasRes.data || [];
      const p = projectRes.data;
      if (p) {
        projectContext = `
PROJETO: ${p.name}
DESCRIÇÃO: ${p.description || "N/A"}
FASE: ${p.current_phase}

PERSONAS (${personas.length}):
${personas.map(pe => `- ${pe.name} (${pe.role})`).join("\n") || "Nenhuma"}

DESIGN TOKENS (${designTokens.length}):
${designTokens.map(t => `- ${t.category}: ${t.name} = ${t.value}`).join("\n") || "Nenhum"}
`.trim();
      }
    }

    // ── Build conversation history ──
    const historyMessages = (history || []).slice(-6).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content,
    }));

    let systemPrompt = "";
    let tools: unknown[] = [];
    let toolChoice: unknown = undefined;
    let userContent: unknown = prompt;

    // ════════════════════════════════════════════════════════
    // UX PILOT MODE
    // ════════════════════════════════════════════════════════
    if (mode === "ux-pilot") {
      systemPrompt = `Você é o UX Pilot — um especialista sênior em UX Research e Design Thinking com 15+ anos de experiência.

Você gera artefatos de UX estruturados, detalhados e realistas em português brasileiro.

${projectContext ? `═══ CONTEXTO DO PROJETO ═══\n${projectContext}\n` : ""}

ESPECIALIDADES:
- Personas baseadas em pesquisa real (não estereótipos)
- Journey Maps com emoções calibradas e oportunidades acionáveis
- User Flows com decisões, erros e caminhos alternativos
- Sitemaps com arquitetura de informação fundamentada
- Wireframe concepts com estrutura e hierarquia visual

DIRETRIZES DE QUALIDADE:
- Personas: inclua nome completo, idade, contexto de vida, citação representativa, 4+ goals, 4+ pain points, 3+ behaviors
- Journey Maps: 5-8 estágios, emoções variadas (não apenas positivas), 1 oportunidade por estágio
- User Flows: inclua estados de erro, loading e edge cases
- Sitemaps: hierarquia clara com máximo 3 níveis
- Todo conteúdo deve ser específico ao contexto do projeto, não genérico

ANÁLISE DE IMAGENS:
Quando receber screenshots ou imagens de interfaces, analise:
1. Hierarquia visual e organização do layout
2. Padrões de interação identificados
3. Possíveis dores do usuário na interface
4. Oportunidades de melhoria de UX
Incorpore os insights na geração do artefato solicitado.

Retorne SEMPRE via tool call generate_ux_artifact.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_ux_artifact",
          description: "Gera artefato UX estruturado (persona, journey map, user flow, sitemap)",
          parameters: {
            type: "object",
            properties: {
              artifact_type: {
                type: "string",
                enum: ["persona", "journey_map", "user_flow", "sitemap", "wireframe_concept"],
              },
              title: { type: "string", description: "Título descritivo do artefato" },
              description: { type: "string", description: "Resumo executivo do artefato em 2-3 frases" },
              data: {
                type: "object",
                properties: {
                  // Persona fields
                  name: { type: "string" },
                  age: { type: "number" },
                  role: { type: "string" },
                  bio: { type: "string", description: "Contexto de vida e trabalho em 2-3 frases" },
                  quote: { type: "string", description: "Frase que representa a persona" },
                  goals: { type: "array", items: { type: "string" } },
                  pain_points: { type: "array", items: { type: "string" } },
                  behaviors: { type: "array", items: { type: "string" } },
                  tech_savviness: { type: "string", enum: ["baixo", "médio", "alto"] },
                  // Journey Map fields
                  stages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        emotion: { type: "string", enum: ["happy", "satisfied", "neutral", "confused", "frustrated"] },
                        touchpoint: { type: "string" },
                        action: { type: "string" },
                        opportunity: { type: "string" },
                        pain: { type: "string" },
                      },
                      required: ["name", "description", "emotion", "touchpoint", "action"],
                      additionalProperties: false,
                    },
                  },
                  // User Flow fields
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        label: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string", enum: ["start", "action", "decision", "screen", "end", "error"] },
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
                        description: { type: "string" },
                        children: {
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
                                  properties: { name: { type: "string" }, path: { type: "string" } },
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
                      required: ["name", "path"],
                      additionalProperties: false,
                    },
                  },
                  // Insights (para análise de imagens)
                  insights: {
                    type: "array",
                    items: { type: "string" },
                    description: "Insights gerados a partir de análise de imagens",
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

      // Handle image input
      if (image) {
        userContent = [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${image.mime_type || "image/png"};base64,${image.data}` } },
        ];
      }

    // ════════════════════════════════════════════════════════
    // UI MAKE MODE
    // ════════════════════════════════════════════════════════
    } else if (mode === "ui-make") {

      const tokenContext = designTokens.length > 0
        ? `\nDESIGN TOKENS DO PROJETO:\n${designTokens.map(t => `- ${t.category}/${t.name}: ${t.value}`).join("\n")}`
        : "";

      systemPrompt = `Você é o UI Make — um especialista em UI Engineering e Design Systems que gera componentes React + Tailwind CSS de alta qualidade.

${projectContext ? `═══ CONTEXTO DO PROJETO ═══\n${projectContext}\n` : ""}${tokenContext}

STACK TÉCNICA:
- React 18 com hooks funcionais
- Tailwind CSS com classes semânticas
- TypeScript (opcional mas preferível)
- Lucide React para ícones (import { Icon } from "lucide-react")
- Variáveis CSS customizadas: --background, --foreground, --primary, --secondary, --muted, --border, --accent, --destructive

PRINCÍPIOS DE UI:
1. HIERARQUIA: tamanhos, pesos e contrastes claros
2. ESPAÇAMENTO: escala consistente (4px base) — use gap-2, gap-4, gap-6, p-4, p-6
3. TIPOGRAFIA: font-size mínimo 12px, line-height adequado
4. CORES: use CSS vars via hsl() — hsl(var(--primary)), hsl(var(--muted))
5. ESTADOS: sempre implemente hover, focus, disabled, loading
6. ACESSIBILIDADE: aria-labels, role, tabIndex, focus-visible
7. RESPONSIVIDADE: mobile-first, breakpoints md: lg:
8. DARK MODE: use classes semânticas (bg-background, text-foreground) não cores fixas

PADRÕES OBRIGATÓRIOS:
- Componentes auto-contidos com dados mock realistas
- Export default do componente principal
- Nenhum import externo além de React e lucide-react
- Código limpo, comentado nas partes complexas
- Evitar inline styles — preferir classes Tailwind

ESTILOS ACEITOS:
- SaaS dashboard (padrão)
- Landing page moderna
- Mobile app UI
- Admin panel
- E-commerce

${context?.iteration_context ? `\nCONTEXTO DA ITERAÇÃO ANTERIOR:\n${context.iteration_context}\n` : ""}

Retorne SEMPRE via tool call generate_ui_component com código completo e funcional.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_ui_component",
          description: "Gera componente UI completo com React + Tailwind",
          parameters: {
            type: "object",
            properties: {
              component_name: { type: "string", description: "PascalCase name ex: LoginForm, PricingTable" },
              description: { type: "string", description: "O que o componente faz e quando usar" },
              code: {
                type: "string",
                description: "Código React JSX/TSX completo e funcional. Deve incluir export default. Use dados mock realistas.",
              },
              usage_example: {
                type: "string",
                description: "Exemplo de uso: <ComponentName prop1='value' />",
              },
              design_notes: {
                type: "string",
                description: "Notas de design: decisões tomadas, variações possíveis, customizações",
              },
              preview_elements: {
                type: "array",
                description: "Elementos SVG para preview no canvas",
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
                    opacity: { type: "number" },
                    cornerRadius: { type: "number" },
                    strokeColor: { type: "string" },
                    strokeWidth: { type: "number" },
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

      // Handle image reference for UI Make
      if (image) {
        userContent = [
          { type: "text", text: `Analise esta referência visual e gere um componente similar: ${prompt}` },
          { type: "image_url", image_url: { url: `data:${image.mime_type || "image/png"};base64,${image.data}` } },
        ];
      }
    }

    // ── Build messages with history ──
    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: userContent },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: toolChoice,
        temperature: 0.7,
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

    // Fallback: raw content
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
