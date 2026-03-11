import apiClient from "@/lib/api/client"
import type { CreateProjectGroupDto, ProjectGroup, ProjectGroupMe } from "@/types/project-groups"

/**
 * Create a new project group for the current approved group leader.
 *
 * Note: `NEXT_PUBLIC_API_BASE_URL` is expected to include `/api/v1`.
 */
export async function createProjectGroup(dto: CreateProjectGroupDto): Promise<ProjectGroup> {
  const response = await apiClient.post<ProjectGroup>("/project-groups", dto)
  return response.data
}

/**
 * Fetch the current group for the approved group leader.
 *
 * Backend:
 * - 200: returns group + leader + members + pendingInvitationsCount
 * - 400: group not found for this leader
 */
export async function getMyProjectGroup(): Promise<ProjectGroupMe> {
  const response = await apiClient.get<ProjectGroupMe>("/project-groups/me")
  return response.data
}
