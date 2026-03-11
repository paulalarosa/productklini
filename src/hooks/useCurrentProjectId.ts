import { useQuery } from "@tanstack/react-query";
import { getProjectId } from "@/lib/api";

export function useCurrentProjectId() {
  const { data: projectId } = useQuery({
    queryKey: ["current-project-id"],
    queryFn: getProjectId,
    staleTime: Infinity,
    retry: false,
  });

  return projectId || undefined;
}
