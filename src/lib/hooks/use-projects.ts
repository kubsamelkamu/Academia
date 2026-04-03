import { useQuery } from "@tanstack/react-query"
import { getDepartmentProjectsOverview, getProjectDetails } from "@/lib/api/projects"
import type { DepartmentProjectsOverview, ProjectDetail } from "@/types/projects"

export function projectKeys() {
  return {
    root: ["projects"] as const,
    details: (projectId: string) => [...projectKeys().root, "details", projectId] as const,
    departmentOverview: (departmentId: string) =>
      [...projectKeys().root, "department-overview", departmentId] as const,
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

export function useDepartmentProjectsOverview(params: {
  departmentId: string | null | undefined
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(departmentId)

  return useQuery<DepartmentProjectsOverview, Error>({
    queryKey: enabled
      ? projectKeys().departmentOverview(departmentId ?? "")
      : projectKeys().root,
    queryFn: () => {
      if (!departmentId) throw new Error("departmentId is required")
      return getDepartmentProjectsOverview(departmentId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
