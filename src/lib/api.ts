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

export { };
