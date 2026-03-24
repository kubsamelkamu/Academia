import apiClient from "@/lib/api/client"
import type {
  ListTenantUsersPagedParams,
  TenantUserListItem,
  TenantUserDetail,
  TenantUserStatusChange,
  TenantUsersPagedData,
  UpdateTenantUserDto,
} from "@/types/tenant-users"

export async function listTenantUsers(): Promise<TenantUserListItem[]> {
  const response = await apiClient.get<TenantUserListItem[]>("/tenant/users")
  return response.data
}

function normalizeListParams(params: ListTenantUsersPagedParams): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    page: params.page,
    limit: params.limit,
  }

  if (typeof params.search === "string") {
    const trimmed = params.search.trim()
    if (trimmed.length > 0) {
      normalized.search = trimmed
    }
  }

  if (params.roleNames && params.roleNames.length > 0) {
    normalized.roleNames = params.roleNames.join(",")
  }

  return normalized
}

export async function listTenantUsersPaged(
  params: ListTenantUsersPagedParams = {}
): Promise<TenantUsersPagedData> {
  const response = await apiClient.get<TenantUsersPagedData>("/tenant/users/paged", {
    params: normalizeListParams(params),
  })

  return response.data
}

export async function getTenantUser(userId: string): Promise<TenantUserDetail> {
  const response = await apiClient.get<TenantUserDetail>(`/tenant/users/${userId}`)
  return response.data
}

export async function updateTenantUser(
  userId: string,
  dto: UpdateTenantUserDto
): Promise<TenantUserDetail> {
  const response = await apiClient.put<TenantUserDetail>(`/tenant/users/${userId}`, dto)
  return response.data
}

export async function deactivateTenantUser(userId: string): Promise<void> {
  await apiClient.delete(`/tenant/users/${userId}`)
}

export async function reactivateTenantUser(userId: string): Promise<TenantUserStatusChange> {
  const response = await apiClient.patch<TenantUserStatusChange>(`/tenant/users/${userId}/reactivate`)
  return response.data
}
