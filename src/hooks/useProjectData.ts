import { useQuery } from "@tanstack/react-query";
import { fetchProject, fetchTasks, fetchTeamMembers, fetchPersonas, fetchUxMetrics } from "@/lib/api";

export function useProject() {
  return useQuery({ queryKey: ["project"], queryFn: fetchProject });
}

export function useTasks() {
  return useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
}

export function useTeamMembers() {
  return useQuery({ queryKey: ["team-members"], queryFn: fetchTeamMembers });
}

export function usePersonas() {
  return useQuery({ queryKey: ["personas"], queryFn: fetchPersonas });
}

export function useUxMetrics() {
  return useQuery({ queryKey: ["ux-metrics"], queryFn: fetchUxMetrics });
}
