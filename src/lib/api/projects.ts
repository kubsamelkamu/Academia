import apiClient from "@/lib/api/client"
import type {
  AssignProjectAdvisorDto,
  DepartmentProjectAdvisorDirectoryItem,
  DepartmentProjectsOverview,
  ProjectDetail,
} from "@/types/projects"

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

export async function getDepartmentProjectAdvisors(
  departmentId: string
): Promise<DepartmentProjectAdvisorDirectoryItem[]> {
  const trimmed = departmentId.trim()
  if (!trimmed) {
    throw new Error("departmentId is required")
  }

  const response = await apiClient.get<DepartmentProjectAdvisorDirectoryItem[]>(
    `/projects/advisors?departmentId=${encodeURIComponent(trimmed)}`
  )

  return Array.isArray(response.data) ? response.data : []
}

export async function assignProjectAdvisor(
  projectId: string,
  dto: AssignProjectAdvisorDto
): Promise<ProjectDetail> {
  const trimmedProjectId = projectId.trim()
  const advisorId = dto.advisorId.trim()

  if (!trimmedProjectId) {
    throw new Error("projectId is required")
  }

  if (!advisorId) {
    throw new Error("advisorId is required")
  }

  const response = await apiClient.put<ProjectDetail>(
    `/projects/${encodeURIComponent(trimmedProjectId)}/advisor`,
    { advisorId }
  )

  return response.data
}
