import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { figma_url, component_id, output_format } = await req.json();

    // Validate input
    if (!figma_url && !component_id) {
      return new Response(
        JSON.stringify({ success: false, error: "figma_url ou component_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
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
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────────────────────────────────────
    // MCP Integration Placeholder
    // ──────────────────────────────────────────────
    // Future flow:
    // 1. Use Figma REST API to fetch component tree from figma_url
    // 2. Send component JSON to AI via MCP (Model Context Protocol)
    // 3. AI returns structured Flutter/Dart code
    // 4. Return code to client
    //
    // Required secrets (to be added when integrating):
    //   - FIGMA_ACCESS_TOKEN
    //   - MCP_ENDPOINT_URL
    // ──────────────────────────────────────────────

    const format = output_format || "flutter";

    return new Response(
      JSON.stringify({
        success: true,
        status: "scaffold_ready",
        message: `Endpoint analyze-figma-mcp está ativo. Integração MCP para ${format} será conectada quando as credenciais do Figma e endpoint MCP forem configurados.`,
        expected_flow: [
          "1. Receber URL/ID do componente Figma",
          "2. Extrair árvore de componentes via Figma REST API",
          "3. Enviar para IA via protocolo MCP",
          `4. Retornar código ${format === "flutter" ? "Flutter (Dart)" : format}`,
        ],
        input_received: { figma_url, component_id, output_format: format },
        integrations: {
          figma_api: { status: "pending", requires: "FIGMA_ACCESS_TOKEN" },
          mcp_ai: { status: "pending", requires: "MCP_ENDPOINT_URL" },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
