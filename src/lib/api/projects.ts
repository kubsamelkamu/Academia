import apiClient from "@/lib/api/client"
import type { ProjectDetail } from "@/types/projects"

export async function getProjectDetails(projectId: string): Promise<ProjectDetail> {
  const trimmed = projectId.trim()
  if (!trimmed) {
    throw new Error("projectId is required")
  }

  const response = await apiClient.get<ProjectDetail>(`/projects/${encodeURIComponent(trimmed)}`)
  return response.data
}
