import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- PBKDF2 helpers ---
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, keyMaterial, 256);
  const derivedHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${derivedHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy unsalted SHA-256 hashes (no colon)
  if (!storedHash.includes(":")) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return legacyHash === storedHash;
  }
  const [saltHex, derivedHex] = storedHash.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, keyMaterial, 256);
  const computedHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computedHex === derivedHex;
}

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

      // Verify ownership: userClient respects RLS, so only the owner's projects are visible
      const { data: proj } = await userClient
        .from("projects")
        .select("id")
        .eq("id", project_id)
        .single();

      if (!proj) {
        return new Response(JSON.stringify({ error: "Projeto não encontrado ou sem permissão" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const passwordHash = await hashPassword(password);

      // Use userClient so RLS enforces ownership on share_links too
      const { data: link, error } = await userClient
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

      // Find active share link (service role needed since viewer is unauthenticated)
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

      // Verify password (supports both PBKDF2 and legacy SHA-256)
      const passwordValid = await verifyPassword(password, shareLink.password_hash);
      if (!passwordValid) {
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
      tasks.forEach((t: { status: string; module: string; phase: string }) => {
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
