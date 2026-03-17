import apiClient from "@/lib/api/client"
import type {
  CreateGroupLeaderRequestDto,
  GroupLeaderMeResponse,
  GroupLeaderRequestResponse,
} from "@/types/group-leader-requests"

/**
 * Apply to become a group leader (aka group/project manager).
 *
 * Note: `NEXT_PUBLIC_API_BASE_URL` is expected to include `/api/v1`,
 * so the path here omits that prefix.
 */
export async function createGroupLeaderRequest(
  dto: CreateGroupLeaderRequestDto
): Promise<GroupLeaderRequestResponse> {
  const response = await apiClient.post<GroupLeaderRequestResponse>(
    "/group-leader-requests",
    dto
  )
  return response.data
}

export async function getMyGroupLeaderRequest(): Promise<GroupLeaderMeResponse> {
  const response = await apiClient.get<GroupLeaderMeResponse>("/group-leader-requests/me")
  return response.data
}
