import { useQuery } from "@tanstack/react-query"
import { getProjectDetails } from "@/lib/api/projects"
import type { ProjectDetail } from "@/types/projects"

export function projectKeys() {
  return {
    root: ["projects"] as const,
    details: (projectId: string) => [...projectKeys().root, "details", projectId] as const,
  }
}

export function useProjectDetails(params: {
  projectId: string | null | undefined
  enabled?: boolean
}) {
  const projectId = params.projectId?.trim() ? params.projectId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(projectId)

  return useQuery<ProjectDetail, Error>({
    queryKey: enabled ? projectKeys().details(projectId ?? "") : projectKeys().root,
    queryFn: () => {
      if (!projectId) throw new Error("projectId is required")
      return getProjectDetails(projectId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
