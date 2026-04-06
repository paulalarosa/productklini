import { supabase } from "@/integrations/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

export type Persona = DbPersona;

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

export type AIReviewTag = {
  id: string; ai_tag: string; ai_tag_type: string; sentiment: string;
};

export type DbDesignToken = {
  id: string; project_id: string; token_key: string; token_value: string;
  token_label: string; category: string; updated_at: string;
};

export type DbTokenHistoryEntry = {
  id: string; project_id: string; token_key: string;
  old_value: string; new_value: string; author: string; reason: string; changed_at: string;
};

export type DbNotification = {
  id: string; project_id: string; type: string; title: string; message: string | null;
  is_read: boolean; created_at: string;
};

// ─── Gerenciamento de projeto atual ───────────────────────────────────────────

const CURRENT_PROJECT_KEY = "current_project_id";

// Cache em memória — evita roundtrips repetidos ao Supabase na mesma sessão
let cachedProjectId: string | null = null;

// Promise em vôo — impede que chamadas paralelas disparem múltiplas queries
// ao mesmo tempo (ex: fetchTasks + fetchPersonas chamados juntos na home)
let inflightRequest: Promise<string> | null = null;

export function setCurrentProjectId(projectId: string) {
  cachedProjectId = projectId;
  localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
}

export function clearCurrentProjectId() {
  cachedProjectId = null;
  inflightRequest = null;
  localStorage.removeItem(CURRENT_PROJECT_KEY);
}

export async function fetchAllProjects(): Promise<DbProject[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  return (data as DbProject[]) ?? [];
}

export async function createNewProject(name: string, description?: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, description: description ?? null, user_id: user.id })
    .select("id")
    .single();
  if (error) throw error;
  setCurrentProjectId(data.id);
  return data.id;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);
  if (error) throw error;
  if (localStorage.getItem(CURRENT_PROJECT_KEY) === projectId) {
    clearCurrentProjectId();
  }
}

// ─── getProjectId — ponto central de resolução do projeto ─────────────────────
// Problema anterior: cada fetch* chamava getProjectId independentemente,
// disparando até 3 queries ao Supabase em paralelo na primeira carga.
// Solução: promise deduplication — chamadas simultâneas compartilham o mesmo
// roundtrip, e o resultado fica em cache para o resto da sessão.
export async function getProjectId(): Promise<string> {
  // 1. Cache em memória (mais rápido — zero I/O)
  if (cachedProjectId) return cachedProjectId;

  // 2. Deduplica chamadas paralelas — retorna a promise já em andamento
  if (inflightRequest) return inflightRequest;

  inflightRequest = resolveProjectId().finally(() => {
    inflightRequest = null;
  });

  return inflightRequest;
}

async function resolveProjectId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const savedId = localStorage.getItem(CURRENT_PROJECT_KEY);

  // Verifica se o ID salvo ainda pertence ao usuário (uma única query)
  if (savedId) {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("id", savedId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      cachedProjectId = data.id;
      return data.id;
    }
  }

  // Busca o projeto mais recente do usuário
  const { data: first } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (first) {
    setCurrentProjectId(first.id);
    return first.id;
  }

  // Sinaliza que não há projeto — o wizard de setup será exibido
  return "";
}

// Limpa o cache ao fazer logout, mantém o localStorage ao trocar de aba
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    clearCurrentProjectId();
  } else {
    cachedProjectId = null;
    inflightRequest = null;
  }
});

// ─── Helpers internos ─────────────────────────────────────────────────────────

// Evita repetir o padrão "busca projectId → retorna [] se vazio" em cada fetch
async function withProject<T>(fn: (projectId: string) => Promise<T>, fallback: T): Promise<T> {
  const projectId = await getProjectId();
  if (!projectId) return fallback;
  return fn(projectId);
}

// ─── Fetchers de dados ────────────────────────────────────────────────────────

export async function fetchProject(): Promise<DbProject | null> {
  const projectId = await getProjectId();
  if (!projectId) return null;
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  return data as DbProject | null;
}

export const fetchTasks = (): Promise<DbTask[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, priority, module, phase, updated_at, assignee, avatar, days_in_phase, estimated_days, created_at, project_id")
      .eq("project_id", projectId)
      .order("created_at");
    return (data as DbTask[]) ?? [];
  }, []);

export const updateTaskStatus = async (taskId: string, status: string) => {
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) throw error;
};

export const fetchTeamMembers = (): Promise<DbTeamMember[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("project_id", projectId);
    return (data as DbTeamMember[]) ?? [];
  }, []);

export const fetchPersonas = (): Promise<DbPersona[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("personas")
      .select("*")
      .eq("project_id", projectId);
    return (data as DbPersona[]) ?? [];
  }, []);

export const fetchUxMetrics = (): Promise<DbUxMetric[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("ux_metrics")
      .select("*")
      .eq("project_id", projectId);
    return (data as DbUxMetric[]) ?? [];
  }, []);

export const fetchDocuments = (docType?: string): Promise<DbProjectDocument[]> =>
  withProject(async (projectId) => {
    let query = supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId);
    if (docType) query = query.eq("doc_type", docType);
    const { data } = await query.order("created_at", { ascending: false });
    return (data as DbProjectDocument[]) ?? [];
  }, []);

export const fetchAllDocuments = (): Promise<DbProjectDocument[]> =>
  fetchDocuments();

export const fetchAiMessages = (): Promise<unknown[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at");
    return data ?? [];
  }, []);

export async function saveAiMessage(role: string, content: string): Promise<void> {
  await withProject(async (projectId) => {
    const { error } = await supabase
      .from("ai_messages")
      .insert({ project_id: projectId, role, content });
    if (error) throw error;
  }, undefined);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export const fetchAnalyticsSnapshots = (): Promise<DbAnalyticsSnapshot[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("analytics_snapshots")
      .select("*")
      .eq("project_id", projectId)
      .order("recorded_at");
    return (data as unknown as DbAnalyticsSnapshot[]) ?? [];
  }, []);

export const fetchFunnelSteps = (): Promise<DbFunnelStep[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("analytics_funnel")
      .select("*")
      .eq("project_id", projectId)
      .order("step_order");
    return (data as unknown as DbFunnelStep[]) ?? [];
  }, []);

export const fetchAppReviews = (): Promise<DbAppReview[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("app_reviews")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    return (data as unknown as DbAppReview[]) ?? [];
  }, []);

export async function insertAppReview(
  review: Omit<DbAppReview, "id" | "project_id" | "created_at">,
): Promise<void> {
  await withProject(async (projectId) => {
    const { error } = await supabase
      .from("app_reviews")
      .insert({ ...review, project_id: projectId });
    if (error) throw error;
  }, undefined);
}

export async function insertAppReviews(
  reviews: Omit<DbAppReview, "id" | "project_id" | "created_at">[],
): Promise<void> {
  await withProject(async (projectId) => {
    const { error } = await supabase
      .from("app_reviews")
      .insert(reviews.map(r => ({ ...r, project_id: projectId })));
    if (error) throw error;
  }, undefined);
}

export async function scrapeStoreReviews(url: string): Promise<{
  reviews: Array<{ author: string; text: string; stars: number; platform: string }>;
  platform: string;
}> {
  const { data, error } = await supabase.functions.invoke("scrape-store-reviews", { body: { url } });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error ?? "Falha ao extrair reviews");
  return { reviews: data.reviews, platform: data.platform };
}

export async function analyzeReviewsWithAI(
  reviews: { id: string; text: string; stars: number }[],
): Promise<AIReviewTag[]> {
  const BATCH = 20;
  const results: AIReviewTag[] = [];
  for (let i = 0; i < reviews.length; i += BATCH) {
    const { data, error } = await supabase.functions.invoke("analyze-reviews", {
      body: { reviews: reviews.slice(i, i + BATCH) },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error ?? "Falha na análise de IA");
    results.push(...(data.results as AIReviewTag[]));
  }
  return results;
}

export async function updateReviewTags(
  reviewId: string,
  ai_tag: string,
  ai_tag_type: string,
): Promise<void> {
  const { error } = await supabase
    .from("app_reviews")
    .update({ ai_tag, ai_tag_type })
    .eq("id", reviewId);
  if (error) throw error;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

export const fetchDesignTokens = (): Promise<DbDesignToken[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("design_tokens")
      .select("*")
      .eq("project_id", projectId)
      .order("token_key");
    return (data as unknown as DbDesignToken[]) ?? [];
  }, []);

export async function upsertDesignToken(token: {
  token_key: string;
  token_value: string;
  token_label: string;
  category?: string;
}): Promise<void> {
  await withProject(async (projectId) => {
    const { data: existing } = await supabase
      .from("design_tokens")
      .select("token_value")
      .eq("project_id", projectId)
      .eq("token_key", token.token_key)
      .maybeSingle();

    const { error } = await supabase.from("design_tokens").upsert(
      {
        project_id: projectId,
        token_key: token.token_key,
        token_value: token.token_value,
        token_label: token.token_label,
        category: token.category ?? "color",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,token_key" },
    );
    if (error) throw error;

    // Só registra histórico se o valor realmente mudou
    if (existing?.token_value && existing.token_value !== token.token_value) {
      await supabase.from("design_token_history").insert({
        project_id: projectId,
        token_key: token.token_key,
        old_value: existing.token_value,
        new_value: token.token_value,
        author: "Designer",
        reason: "Atualizado via DS Hub",
      });
    }
  }, undefined);
}

export const fetchTokenHistory = (): Promise<DbTokenHistoryEntry[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("design_token_history")
      .select("*")
      .eq("project_id", projectId)
      .order("changed_at", { ascending: false });
    return (data as unknown as DbTokenHistoryEntry[]) ?? [];
  }, []);

export const fetchNotifications = (): Promise<DbNotification[]> =>
  withProject(async (projectId) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    return (data as unknown as DbNotification[]) ?? [];
  }, []);

// ─── Seed de dados de exemplo ─────────────────────────────────────────────────

export async function seedAnalyticsData(): Promise<void> {
  await withProject(async (projectId) => {
    const { data: existing } = await supabase
      .from("analytics_snapshots")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);
    if (existing && existing.length > 0) return;

    await Promise.all([
      supabase.from("analytics_snapshots").insert([
        { project_id: projectId, period_label: "Sem 1", dau: 12400, mau: 38200, crash_free_percent: 99.6 },
        { project_id: projectId, period_label: "Sem 2", dau: 13100, mau: 39800, crash_free_percent: 99.7 },
        { project_id: projectId, period_label: "Sem 3", dau: 11800, mau: 40100, crash_free_percent: 99.5 },
        { project_id: projectId, period_label: "Sem 4", dau: 14200, mau: 41500, crash_free_percent: 99.8 },
        { project_id: projectId, period_label: "Sem 5", dau: 15600, mau: 43200, crash_free_percent: 99.8 },
        { project_id: projectId, period_label: "Sem 6", dau: 14900, mau: 44800, crash_free_percent: 99.9 },
        { project_id: projectId, period_label: "Sem 7", dau: 16300, mau: 46100, crash_free_percent: 99.8 },
      ]),
      supabase.from("analytics_funnel").insert([
        { project_id: projectId, step_name: "App Aberto",  step_order: 0, percent_value: 100, user_count: 46100 },
        { project_id: projectId, step_name: "Login",       step_order: 1, percent_value: 72,  user_count: 33192 },
        { project_id: projectId, step_name: "Add Carrinho",step_order: 2, percent_value: 38,  user_count: 17518 },
        { project_id: projectId, step_name: "Compra",      step_order: 3, percent_value: 12,  user_count: 5532  },
      ]),
      supabase.from("app_reviews").insert([
        { project_id: projectId, stars: 5, text: "App incrível! A interface é super fluida e bonita.", author: "Maria S.",   platform: "ios",     ai_tag: "Elogio",     ai_tag_type: "praise"      },
        { project_id: projectId, stars: 2, text: "Desde a última atualização o app trava na tela de checkout.", author: "João P.", platform: "android", ai_tag: "Bug de UI",  ai_tag_type: "bug"         },
        { project_id: projectId, stars: 3, text: "Funciona bem mas demora muito pra carregar as imagens.", author: "Ana L.",    platform: "android", ai_tag: "Performance",ai_tag_type: "performance" },
        { project_id: projectId, stars: 1, text: "Impossível completar o cadastro. O botão some com o teclado.", author: "Carlos R.", platform: "ios", ai_tag: "Bug de UI", ai_tag_type: "bug"        },
        { project_id: projectId, stars: 4, text: "Muito bom! Só sinto falta de um modo escuro.", author: "Fernanda M.", platform: "ios", ai_tag: "UX Sugestão", ai_tag_type: "ux"             },
        { project_id: projectId, stars: 2, text: "O app consome muita bateria. Depois de 30 min já drena 20%.", author: "Ricardo T.", platform: "android", ai_tag: "Performance", ai_tag_type: "performance" },
      ]),
      supabase.from("design_tokens").insert([
        { project_id: projectId, token_key: "primary",    token_value: "#6200EE", token_label: "Primary",    category: "color" },
        { project_id: projectId, token_key: "secondary",  token_value: "#03DAC6", token_label: "Secondary",  category: "color" },
        { project_id: projectId, token_key: "surface",    token_value: "#131620", token_label: "Surface",    category: "color" },
        { project_id: projectId, token_key: "background", token_value: "#0F1117", token_label: "Background", category: "color" },
        { project_id: projectId, token_key: "error",      token_value: "#EF4444", token_label: "Error",      category: "color" },
        { project_id: projectId, token_key: "onPrimary",  token_value: "#FFFFFF", token_label: "On Primary", category: "color" },
        { project_id: projectId, token_key: "onSurface",  token_value: "#E2E8F0", token_label: "On Surface", category: "color" },
      ]),
    ]);
  }, undefined);
}

export { };
