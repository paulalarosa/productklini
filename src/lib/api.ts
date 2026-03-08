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

const PROJECT_ID = "a0000000-0000-0000-0000-000000000001";

export async function fetchProject(): Promise<DbProject | null> {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", PROJECT_ID)
    .single();
  return data as DbProject | null;
}

export async function fetchTasks(): Promise<DbTask[]> {
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", PROJECT_ID)
    .order("created_at");
  return (data as DbTask[]) ?? [];
}

export async function updateTaskStatus(taskId: string, status: string) {
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);
  if (error) throw error;
}

export async function fetchTeamMembers(): Promise<DbTeamMember[]> {
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("project_id", PROJECT_ID);
  return (data as DbTeamMember[]) ?? [];
}

export async function fetchPersonas(): Promise<DbPersona[]> {
  const { data } = await supabase
    .from("personas")
    .select("*")
    .eq("project_id", PROJECT_ID);
  return (data as DbPersona[]) ?? [];
}

export async function fetchUxMetrics(): Promise<DbUxMetric[]> {
  const { data } = await supabase
    .from("ux_metrics")
    .select("*")
    .eq("project_id", PROJECT_ID);
  return (data as DbUxMetric[]) ?? [];
}

export async function fetchAiMessages() {
  const { data } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("project_id", PROJECT_ID)
    .order("created_at");
  return data ?? [];
}

export async function saveAiMessage(role: string, content: string) {
  const { error } = await supabase
    .from("ai_messages")
    .insert({ project_id: PROJECT_ID, role, content });
  if (error) throw error;
}

export { PROJECT_ID };
