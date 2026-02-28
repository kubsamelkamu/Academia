import apiClient from "@/lib/api/client"
import type {
  AddProjectMemberDto,
  ProjectMemberMutationResult,
  ProjectMembersResponse,
} from "@/types/project-members"

export async function listProjectMembers(projectId: string): Promise<ProjectMembersResponse> {
  const response = await apiClient.get<ProjectMembersResponse>(`/projects/${projectId}/members`)
  return response.data
}

export async function addProjectStudentMember(
  projectId: string,
  dto: AddProjectMemberDto
): Promise<ProjectMemberMutationResult> {
  const response = await apiClient.post<ProjectMemberMutationResult>(
    `/projects/${projectId}/members`,
    dto
  )
  return response.data
}

export async function removeProjectStudentMember(
  projectId: string,
  userId: string
): Promise<ProjectMemberMutationResult> {
  const response = await apiClient.delete<ProjectMemberMutationResult>(
    `/projects/${projectId}/members/${userId}`
  )
  return response.data
}
