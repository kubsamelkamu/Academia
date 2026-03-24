"use client"

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import {
  deactivateTenantUser,
  getTenantUser,
  listTenantUsers,
  listTenantUsersPaged,
  reactivateTenantUser,
  updateTenantUser,
} from "@/lib/api/users"
import type {
  ListTenantUsersPagedParams,
  TenantUserListItem,
  TenantUserDetail,
  TenantUserStatusChange,
  TenantUsersPagedData,
  UpdateTenantUserDto,
} from "@/types/tenant-users"

export type TenantUserRoleCountKey =
  | "all"
  | "departmentHead"
  | "coordinator"
  | "advisor"
  | "student"

export type TenantUserRoleCounts = Record<TenantUserRoleCountKey, number>

const EMPTY_ROLE_COUNTS: TenantUserRoleCounts = {
  all: 0,
  departmentHead: 0,
  coordinator: 0,
  advisor: 0,
  student: 0,
}

const roleCountDefinitions: Array<{
  key: TenantUserRoleCountKey
  params: ListTenantUsersPagedParams
}> = [
  { key: "all", params: { page: 1, limit: 1, roleNames: ["DEPARTMENT_HEAD", "ADVISOR", "COORDINATOR", "STUDENT"] } },
  { key: "departmentHead", params: { page: 1, limit: 1, roleNames: ["DEPARTMENT_HEAD"] } },
  { key: "coordinator", params: { page: 1, limit: 1, roleNames: ["COORDINATOR"] } },
  { key: "advisor", params: { page: 1, limit: 1, roleNames: ["ADVISOR"] } },
  { key: "student", params: { page: 1, limit: 1, roleNames: ["STUDENT"] } },
]

export function tenantUserKeys() {
  return {
    root: ["tenant-users"] as const,
    list: () => [...tenantUserKeys().root, "list"] as const,
    paged: (params: ListTenantUsersPagedParams) =>
      [...tenantUserKeys().root, "paged", params] as const,
    roleCount: (key: TenantUserRoleCountKey) => [...tenantUserKeys().root, "role-count", key] as const,
    detail: (userId: string) => [...tenantUserKeys().root, "detail", userId] as const,
  }
}

export function useTenantUsers(
  options?: Omit<
    UseQueryOptions<TenantUserListItem[], Error, TenantUserListItem[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: tenantUserKeys().list(),
    queryFn: () => listTenantUsers(),
    ...options,
  })
}

export function useTenantUsersPaged(
  params: ListTenantUsersPagedParams,
  options?: Omit<
    UseQueryOptions<TenantUsersPagedData, Error, TenantUsersPagedData>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: tenantUserKeys().paged(params),
    queryFn: () => listTenantUsersPaged(params),
    ...options,
  })
}

export function useTenantUser(
  userId: string | null,
  options?: Omit<
    UseQueryOptions<TenantUserDetail, Error, TenantUserDetail>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: tenantUserKeys().detail(userId ?? "unknown"),
    queryFn: () => getTenantUser(userId as string),
    enabled: Boolean(userId),
    ...options,
  })
}

export function useTenantUserRoleCounts() {
  const queries = useQueries({
    queries: roleCountDefinitions.map(({ key, params }) => ({
      queryKey: tenantUserKeys().roleCount(key),
      queryFn: () => listTenantUsersPaged(params),
      staleTime: 60_000,
    })),
  })

  const counts = roleCountDefinitions.reduce<TenantUserRoleCounts>((accumulator, definition, index) => {
    accumulator[definition.key] = queries[index].data?.pagination.total ?? 0
    return accumulator
  }, { ...EMPTY_ROLE_COUNTS })

  return {
    counts,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    error: queries.find((query) => query.error)?.error ?? null,
  }
}

export function useUpdateTenantUser(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation<TenantUserDetail, Error, UpdateTenantUserDto>({
    mutationFn: async (dto) => {
      if (!userId) {
        throw new Error("userId is required")
      }

      return updateTenantUser(userId, dto)
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: tenantUserKeys().root })
      queryClient.setQueryData(tenantUserKeys().detail(data.id), data)
    },
  })
}

export function useDeactivateTenantUser() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (userId) => deactivateTenantUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantUserKeys().root })
    },
  })
}

export function useReactivateTenantUser() {
  const queryClient = useQueryClient()

  return useMutation<TenantUserStatusChange, Error, string>({
    mutationFn: (userId) => reactivateTenantUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantUserKeys().root })
    },
  })
}
