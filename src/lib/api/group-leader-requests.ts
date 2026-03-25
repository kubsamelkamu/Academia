/**
 * Approve a group leader request (department head action).
 * PATCH /group-leader-requests/{id}/approve
 * No request body.
 */
export async function approveGroupLeaderRequest(id: string): Promise<GroupLeaderRequestResponse> {
  const response = await apiClient.patch<GroupLeaderRequestResponse>(
    `/group-leader-requests/${id}/approve`
  )
  return response.data
}

/**
 * Reject a group leader request (department head action).
 * PATCH /group-leader-requests/{id}/reject
 * Body: { reason: string }
 */
export async function rejectGroupLeaderRequest(id: string, reason: string): Promise<GroupLeaderRequestResponse> {
  const response = await apiClient.patch<GroupLeaderRequestResponse>(
    `/group-leader-requests/${id}/reject`,
    { reason }
  )
  return response.data
}
import apiClient from "@/lib/api/client"
import type {
  CreateGroupLeaderRequestDto,
  GroupLeaderMeResponse,
  GroupLeaderRequestResponse,
  GroupLeaderRequestsListResponse,
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

/**
 * List pending group leader requests (for department head review).
 * Query params: search, page, limit
 */
export async function listPendingGroupLeaderRequests(params: {
  search?: string
  page?: number
  limit?: number
} = {}): Promise<GroupLeaderRequestsListResponse> {
  const { search, page = 1, limit = 20 } = params
  const response = await apiClient.get<GroupLeaderRequestsListResponse>(
    "/group-leader-requests/pending",
    {
      params: {
        ...(search ? { search } : {}),
        page,
        limit,
      },
    }
  )
  return response.data
}
