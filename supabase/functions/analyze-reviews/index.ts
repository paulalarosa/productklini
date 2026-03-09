import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { reviews } = await req.json();
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return new Response(
        JSON.stringify({ error: "reviews array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt with reviews
    const reviewsList = reviews
      .map((r: { id: string; text: string; stars: number }, i: number) => `[${i}] (${r.stars}★) "${r.text}"`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a UX research analyst. Analyze app store reviews and categorize each one.
For each review, determine:
- ai_tag: A short label in Portuguese (e.g., "Bug de UI", "Performance", "Elogio", "UX Sugestão", "Onboarding", "Acessibilidade", "Crash", "Design Visual", "Funcionalidade", "Segurança")
- ai_tag_type: One of: "bug", "performance", "praise", "ux", "crash", "feature", "security", "accessibility"
- sentiment: One of: "positive", "neutral", "negative"

Be precise. A 5★ review praising the app is "praise/positive". A 1★ about crashes is "crash/negative". A 3★ suggesting dark mode is "ux/neutral".`,
          },
          {
            role: "user",
            content: `Analyze these ${reviews.length} app reviews and return categorization:\n\n${reviewsList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_reviews",
              description: "Return categorization for each review",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "Review index from input" },
                        ai_tag: { type: "string", description: "Short Portuguese label for the category" },
                        ai_tag_type: {
                          type: "string",
                          enum: ["bug", "performance", "praise", "ux", "crash", "feature", "security", "accessibility"],
                        },
                        sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                      },
                      required: ["index", "ai_tag", "ai_tag_type", "sentiment"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "categorize_reviews" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const results = parsed.results || [];

    // Map back to review IDs
    const taggedReviews = results.map((r: any) => ({
      id: reviews[r.index]?.id,
      ai_tag: r.ai_tag,
      ai_tag_type: r.ai_tag_type,
      sentiment: r.sentiment,
    })).filter((r: any) => r.id);

    return new Response(
      JSON.stringify({ success: true, results: taggedReviews }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-reviews error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
