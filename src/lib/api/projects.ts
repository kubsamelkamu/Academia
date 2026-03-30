import apiClient from "@/lib/api/client"
import type { ProjectDetails } from "@/types/projects"

export async function getProjectById(projectId: string): Promise<ProjectDetails> {
  const trimmed = projectId.trim()
  if (!trimmed) {
    throw new Error("projectId is required")
  }

  const response = await apiClient.get<ProjectDetails>(`/projects/${encodeURIComponent(trimmed)}`)
  return response.data
}
