import { supabase } from "@/integrations/supabase/client";

export type DbTask = {
  id: string;
  project_id: string;
  title: string;
  module: "ux" | "ui" | "dev";
  phase: "discovery" | "define" | "develop" | "deliver";
  status: "todo" | "in_progress" | "review" | "done" | "blocked";
  assignee: string | null;
  avatar: string | null;
  days_in_phase: number;
  estimated_days: number;
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
};

export type DbProject = {
  id: string;
  name: string;
  description: string | null;
  current_phase: string;
  progress: number;
  phase_progress: Record<string, number>;
  created_at: string;
  updated_at: string;
  user_id: string | null;
};

export type DbTeamMember = {
  id: string;
  project_id: string;
  name: string;
  role: string;
  avatar: string;
};

export type DbPersona = {
  id: string;
  project_id: string;
  name: string;
  role: string;
  pain_points: string[];
  goals: string[];
};

export type DbUxMetric = {
  id: string;
  project_id: string;
  metric_name: string;
  score: number;
  previous_score: number | null;
};

export type DbProjectDocument = {
  id: string;
  project_id: string;
  doc_type: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
};

// Get or create the current user's project
let cachedProjectId: string | null = null;

export async function getProjectId(): Promise<string> {
  if (cachedProjectId) return cachedProjectId;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    cachedProjectId = existing.id;
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("projects")
    .insert({ name: "Meu Projeto", user_id: user.id })
    .select("id")
    .single();

  if (error) throw error;
  cachedProjectId = created.id;
  return created.id;
}

supabase.auth.onAuthStateChange(() => {
  cachedProjectId = null;
});

export async function fetchProject(): Promise<DbProject | null> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("projects").select("*").eq("id", projectId).single();
  return data as DbProject | null;
}

export async function fetchTasks(): Promise<DbTask[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at");
  return (data as DbTask[]) ?? [];
}

export async function updateTaskStatus(taskId: string, status: string) {
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) throw error;
}

export async function fetchTeamMembers(): Promise<DbTeamMember[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("team_members").select("*").eq("project_id", projectId);
  return (data as DbTeamMember[]) ?? [];
}

export async function fetchPersonas(): Promise<DbPersona[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("personas").select("*").eq("project_id", projectId);
  return (data as DbPersona[]) ?? [];
}

export async function fetchUxMetrics(): Promise<DbUxMetric[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("ux_metrics").select("*").eq("project_id", projectId);
  return (data as DbUxMetric[]) ?? [];
}

export async function fetchDocuments(docType?: string): Promise<DbProjectDocument[]> {
  const projectId = await getProjectId();
  let query = supabase.from("project_documents").select("*").eq("project_id", projectId);
  if (docType) query = query.eq("doc_type", docType);
  const { data } = await query.order("created_at", { ascending: false });
  return (data as DbProjectDocument[]) ?? [];
}

export async function fetchAllDocuments(): Promise<DbProjectDocument[]> {
  const projectId = await getProjectId();
  const { data } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as DbProjectDocument[]) ?? [];
}

export async function fetchAiMessages() {
  const projectId = await getProjectId();
  const { data } = await supabase.from("ai_messages").select("*").eq("project_id", projectId).order("created_at");
  return data ?? [];
}

export async function saveAiMessage(role: string, content: string) {
  const projectId = await getProjectId();
  const { error } = await supabase.from("ai_messages").insert({ project_id: projectId, role, content });
  if (error) throw error;
}

// ---- Analytics ----
export type DbAnalyticsSnapshot = {
  id: string; project_id: string; period_label: string;
  dau: number; mau: number; crash_free_percent: number; recorded_at: string;
};
export type DbFunnelStep = {
  id: string; project_id: string; step_name: string; step_order: number;
  percent_value: number; user_count: number; recorded_at: string;
};
export type DbAppReview = {
  id: string; project_id: string; stars: number; text: string;
  author: string; platform: string; ai_tag: string; ai_tag_type: string; created_at: string;
};

export async function fetchAnalyticsSnapshots(): Promise<DbAnalyticsSnapshot[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("analytics_snapshots" as any).select("*").eq("project_id", projectId).order("recorded_at");
  return (data as unknown as DbAnalyticsSnapshot[]) ?? [];
}

export async function fetchFunnelSteps(): Promise<DbFunnelStep[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("analytics_funnel" as any).select("*").eq("project_id", projectId).order("step_order");
  return (data as unknown as DbFunnelStep[]) ?? [];
}

export async function fetchAppReviews(): Promise<DbAppReview[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("app_reviews" as any).select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  return (data as unknown as DbAppReview[]) ?? [];
}

export async function insertAppReview(review: Omit<DbAppReview, "id" | "project_id" | "created_at">) {
  const projectId = await getProjectId();
  const { error } = await supabase.from("app_reviews" as any).insert({ ...review, project_id: projectId });
  if (error) throw error;
}

export async function insertAppReviews(reviews: Omit<DbAppReview, "id" | "project_id" | "created_at">[]) {
  const projectId = await getProjectId();
  const rows = reviews.map(r => ({ ...r, project_id: projectId }));
  const { error } = await supabase.from("app_reviews" as any).insert(rows);
  if (error) throw error;
}

export async function scrapeStoreReviews(url: string): Promise<{ reviews: Array<{ author: string; text: string; stars: number; platform: string }>; platform: string }> {
  const { data, error } = await supabase.functions.invoke("scrape-store-reviews", {
    body: { url },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Falha ao extrair reviews");
  return { reviews: data.reviews, platform: data.platform };
}

// ---- Design Tokens ----
export type DbDesignToken = {
  id: string; project_id: string; token_key: string; token_value: string;
  token_label: string; category: string; updated_at: string;
};
export type DbTokenHistoryEntry = {
  id: string; project_id: string; token_key: string;
  old_value: string; new_value: string; author: string; reason: string; changed_at: string;
};

export async function fetchDesignTokens(): Promise<DbDesignToken[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("design_tokens" as any).select("*").eq("project_id", projectId).order("token_key");
  return (data as unknown as DbDesignToken[]) ?? [];
}

export async function upsertDesignToken(token: { token_key: string; token_value: string; token_label: string; category?: string }) {
  const projectId = await getProjectId();
  // Check existing value for history
  const { data: existing } = await supabase
    .from("design_tokens" as any)
    .select("token_value")
    .eq("project_id", projectId)
    .eq("token_key", token.token_key)
    .maybeSingle();

  const oldValue = (existing as any)?.token_value;

  const { error } = await supabase.from("design_tokens" as any).upsert({
    project_id: projectId,
    token_key: token.token_key,
    token_value: token.token_value,
    token_label: token.token_label,
    category: token.category || "color",
    updated_at: new Date().toISOString(),
  }, { onConflict: "project_id,token_key" });
  if (error) throw error;

  // Record history if value changed
  if (oldValue && oldValue !== token.token_value) {
    await supabase.from("design_token_history" as any).insert({
      project_id: projectId,
      token_key: token.token_key,
      old_value: oldValue,
      new_value: token.token_value,
      author: "Designer",
      reason: "Atualizado via DS Hub",
    });
  }
}

export async function fetchTokenHistory(): Promise<DbTokenHistoryEntry[]> {
  const projectId = await getProjectId();
  const { data } = await supabase.from("design_token_history" as any).select("*").eq("project_id", projectId).order("changed_at", { ascending: false });
  return (data as unknown as DbTokenHistoryEntry[]) ?? [];
}

export async function seedAnalyticsData() {
  const projectId = await getProjectId();
  // Check if data already exists
  const { data: existing } = await supabase.from("analytics_snapshots" as any).select("id").eq("project_id", projectId).limit(1);
  if (existing && existing.length > 0) return;

  // Seed snapshots
  const snapshots = [
    { period_label: "Sem 1", dau: 12400, mau: 38200, crash_free_percent: 99.6 },
    { period_label: "Sem 2", dau: 13100, mau: 39800, crash_free_percent: 99.7 },
    { period_label: "Sem 3", dau: 11800, mau: 40100, crash_free_percent: 99.5 },
    { period_label: "Sem 4", dau: 14200, mau: 41500, crash_free_percent: 99.8 },
    { period_label: "Sem 5", dau: 15600, mau: 43200, crash_free_percent: 99.8 },
    { period_label: "Sem 6", dau: 14900, mau: 44800, crash_free_percent: 99.9 },
    { period_label: "Sem 7", dau: 16300, mau: 46100, crash_free_percent: 99.8 },
  ];
  await supabase.from("analytics_snapshots" as any).insert(snapshots.map(s => ({ ...s, project_id: projectId })));

  // Seed funnel
  const funnel = [
    { step_name: "App Aberto", step_order: 0, percent_value: 100, user_count: 46100 },
    { step_name: "Login", step_order: 1, percent_value: 72, user_count: 33192 },
    { step_name: "Add Carrinho", step_order: 2, percent_value: 38, user_count: 17518 },
    { step_name: "Compra", step_order: 3, percent_value: 12, user_count: 5532 },
  ];
  await supabase.from("analytics_funnel" as any).insert(funnel.map(f => ({ ...f, project_id: projectId })));

  // Seed reviews
  const reviews = [
    { stars: 5, text: "App incrível! A interface é super fluida e bonita. Parabéns ao time!", author: "Maria S.", platform: "ios", ai_tag: "Elogio", ai_tag_type: "praise" },
    { stars: 2, text: "Desde a última atualização o app trava na tela de checkout. Já tentei reinstalar.", author: "João P.", platform: "android", ai_tag: "Bug de UI", ai_tag_type: "bug" },
    { stars: 3, text: "Funciona bem mas demora muito pra carregar as imagens dos produtos.", author: "Ana L.", platform: "android", ai_tag: "Performance", ai_tag_type: "performance" },
    { stars: 1, text: "Impossível completar o cadastro. O botão de Próximo some quando o teclado aparece.", author: "Carlos R.", platform: "ios", ai_tag: "Bug de UI", ai_tag_type: "bug" },
    { stars: 4, text: "Muito bom! Só sinto falta de um modo escuro. Fora isso, 10/10.", author: "Fernanda M.", platform: "ios", ai_tag: "UX Sugestão", ai_tag_type: "ux" },
    { stars: 2, text: "O app consome muita bateria. Depois de 30 min de uso já drena 20%.", author: "Ricardo T.", platform: "android", ai_tag: "Performance", ai_tag_type: "performance" },
  ];
  await supabase.from("app_reviews" as any).insert(reviews.map(r => ({ ...r, project_id: projectId })));

  // Seed default tokens
  const tokens = [
    { token_key: "primary", token_value: "#6200EE", token_label: "Primary", category: "color" },
    { token_key: "secondary", token_value: "#03DAC6", token_label: "Secondary", category: "color" },
    { token_key: "surface", token_value: "#131620", token_label: "Surface", category: "color" },
    { token_key: "background", token_value: "#0F1117", token_label: "Background", category: "color" },
    { token_key: "error", token_value: "#EF4444", token_label: "Error", category: "color" },
    { token_key: "onPrimary", token_value: "#FFFFFF", token_label: "On Primary", category: "color" },
    { token_key: "onSurface", token_value: "#E2E8F0", token_label: "On Surface", category: "color" },
  ];
  await supabase.from("design_tokens" as any).insert(tokens.map(t => ({ ...t, project_id: projectId })));
}

export { };
