import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, screenType, existingElements } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um gerador de wireframes AI. Dado um prompt descrevendo uma tela ou fluxo de app, gere uma lista de elementos visuais SVG para um canvas de wireframe.

REGRAS IMPORTANTES:
- Retorne APENAS o JSON, sem markdown, sem code blocks
- Gere wireframes low-fidelity com formas simples
- Use cores em tons de cinza para wireframes (hsl com saturação 0-10%)
- Posicione elementos de forma realista para o tipo de tela
- O canvas tem 1440x900 pixels
- Tipos de elementos: rect, circle, text, line
- Para cada elemento: id (string única), type, x, y, width, height, fill (hsl), text (se type=text), rotation (0)

Tipo de tela: ${screenType || "mobile app"}
${existingElements ? `Elementos existentes (refine, não substitua): ${JSON.stringify(existingElements)}` : ""}

Padrões de wireframe:
- Header/Navbar: rect no topo, largura total, altura ~60px
- Botões: rect com bordas arredondadas, ~120x40px  
- Inputs: rect com borda, ~280x44px
- Cards: rect maior ~300x200px
- Textos: use type "text" com textos descritivos
- Ícones: circle pequenos ~24x24px
- Imagens placeholder: rect com X diagonal (use 2 linhas)
- Tab bar: rect no bottom para mobile

Gere entre 8-20 elementos dependendo da complexidade.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_wireframe",
              description: "Generate wireframe elements for a canvas",
              parameters: {
                type: "object",
                properties: {
                  elements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string", enum: ["rect", "circle", "text", "line"] },
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                        fill: { type: "string" },
                        text: { type: "string" },
                        rotation: { type: "number" },
                      },
                      required: ["id", "type", "x", "y", "width", "height", "fill", "rotation"],
                      additionalProperties: false,
                    },
                  },
                  description: { type: "string" },
                },
                required: ["elements", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_wireframe" } },
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
      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Resposta inesperada da IA" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("wireframe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
