import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, token, password, project_id, label } = await req.json();

    // === CREATE SHARE LINK (authenticated) ===
    if (action === "create") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Hash the password using Web Crypto
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: link, error } = await supabase
        .from("share_links")
        .insert({
          project_id,
          password_hash: passwordHash,
          label: label || "Diretor",
        })
        .select("id, token, label, is_active, created_at")
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ link }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === VIEW (public, password-protected) ===
    if (action === "view") {
      if (!token || !password) {
        return new Response(JSON.stringify({ error: "Token e senha obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find active share link
      const { data: shareLink } = await supabase
        .from("share_links")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (!shareLink) {
        return new Response(JSON.stringify({ error: "Link inválido ou expirado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiration
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Link expirado" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      if (passwordHash !== shareLink.password_hash) {
        return new Response(JSON.stringify({ error: "Senha incorreta" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pid = shareLink.project_id;

      // Fetch project data (filtered - NO AI content)
      const [projectRes, tasksRes, metricsRes] = await Promise.all([
        supabase.from("projects").select("name, description, current_phase, progress, phase_progress").eq("id", pid).single(),
        supabase.from("tasks").select("id, title, module, phase, status, priority, days_in_phase, estimated_days").eq("project_id", pid),
        supabase.from("ux_metrics").select("metric_name, score, previous_score").eq("project_id", pid),
      ]);

      const tasks = tasksRes.data ?? [];
      const statusCounts: Record<string, number> = {};
      const moduleCounts: Record<string, number> = {};
      const phaseCounts: Record<string, number> = {};
      tasks.forEach((t: any) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        moduleCounts[t.module] = (moduleCounts[t.module] || 0) + 1;
        phaseCounts[t.phase] = (phaseCounts[t.phase] || 0) + 1;
      });

      return new Response(JSON.stringify({
        project: projectRes.data,
        taskSummary: {
          total: tasks.length,
          byStatus: statusCounts,
          byModule: moduleCounts,
          byPhase: phaseCounts,
        },
        metrics: metricsRes.data ?? [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
