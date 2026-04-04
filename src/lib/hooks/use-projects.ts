import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  assignProjectAdvisor,
  getDepartmentProjectAdvisors,
  getDepartmentProjectsOverview,
  getProjectDetails,
} from "@/lib/api/projects"
import type {
  AssignProjectAdvisorDto,
  DepartmentProjectAdvisorDirectoryItem,
  DepartmentProjectsOverview,
  ProjectDetail,
} from "@/types/projects"

export function projectKeys() {
  return {
    root: ["projects"] as const,
    details: (projectId: string) => [...projectKeys().root, "details", projectId] as const,
    departmentOverview: (departmentId: string) =>
      [...projectKeys().root, "department-overview", departmentId] as const,
    departmentAdvisors: (departmentId: string) =>
      [...projectKeys().root, "department-advisors", departmentId] as const,
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

export function useDepartmentProjectAdvisors(params: {
  departmentId: string | null | undefined
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(departmentId)

  return useQuery<DepartmentProjectAdvisorDirectoryItem[], Error>({
    queryKey: enabled
      ? projectKeys().departmentAdvisors(departmentId ?? "")
      : projectKeys().root,
    queryFn: () => {
      if (!departmentId) throw new Error("departmentId is required")
      return getDepartmentProjectAdvisors(departmentId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAssignProjectAdvisor() {
  const queryClient = useQueryClient()

  return useMutation<ProjectDetail, Error, {
    projectId: string
    dto: AssignProjectAdvisorDto
  }>({
    mutationFn: ({ projectId, dto }) => assignProjectAdvisor(projectId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys().root })
      await queryClient.invalidateQueries({ queryKey: ["project-proposals"] })
    },
  })
}
