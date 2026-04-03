import apiClient from "@/lib/api/client"
import type { DepartmentProjectsOverview, ProjectDetail } from "@/types/projects"

export async function getProjectDetails(projectId: string): Promise<ProjectDetail> {
  const trimmed = projectId.trim()
  if (!trimmed) {
    throw new Error("projectId is required")
  }

  const response = await apiClient.get<ProjectDetail>(`/projects/${encodeURIComponent(trimmed)}`)
  return response.data
}

export async function getDepartmentProjectsOverview(
  departmentId: string
): Promise<DepartmentProjectsOverview> {
  const trimmed = departmentId.trim()
  if (!trimmed) {
    throw new Error("departmentId is required")
  }

  const response = await apiClient.get<DepartmentProjectsOverview>(
    `/analytics/department/overview?departmentId=${encodeURIComponent(trimmed)}`
  )

  return response.data
}
