
"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createGroupLeaderRequest,
  getMyGroupLeaderRequest,
  listPendingGroupLeaderRequests,
  listGroupLeaderRequests,
  approveGroupLeaderRequest,
  rejectGroupLeaderRequest,
} from "@/lib/api/group-leader-requests"
import type {
  CreateGroupLeaderRequestDto,
  GroupLeaderMeResponse,
  GroupLeaderRequestResponse,
  GroupLeaderRequestsListData,
} from "@/types/group-leader-requests"

export function useApproveGroupLeaderRequest() {
  const queryClient = useQueryClient()
  return useMutation<GroupLeaderRequestResponse, Error, { id: string }>({
    mutationFn: ({ id }) => approveGroupLeaderRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupLeaderRequestListKeys().root })
    },
  })
}

export function useRejectGroupLeaderRequest() {
  const queryClient = useQueryClient()
  return useMutation<GroupLeaderRequestResponse, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => rejectGroupLeaderRequest(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupLeaderRequestListKeys().root })
    },
  })
}

export function groupLeaderRequestKeys() {
  return {
    root: ["group-leader-requests"] as const,
    me: () => ["group-leader-requests", "me"] as const,
  }
}

export function useMyGroupLeaderRequest(enabled: boolean) {
  return useQuery<GroupLeaderMeResponse, Error>({
    queryKey: groupLeaderRequestKeys().me(),
    queryFn: () => getMyGroupLeaderRequest(),
    enabled,
    staleTime: 30_000,
  })
}

export function useCreateGroupLeaderRequest() {
  const queryClient = useQueryClient()

  return useMutation<GroupLeaderRequestResponse, Error, CreateGroupLeaderRequestDto>({
    mutationFn: (dto) => createGroupLeaderRequest(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: groupLeaderRequestKeys().me() })
    },
  })
}

export function groupLeaderRequestListKeys() {
  return {
    root: ["group-leader-requests", "list"] as const,
    pending: (params: { search?: string; page?: number; limit?: number }) =>
      ["group-leader-requests", "list", "pending", params] as const,
    all: (params: { search?: string; page?: number; limit?: number }) =>
      ["group-leader-requests", "list", "all", params] as const,
  }
}

export function usePendingGroupLeaderRequests(params: {
  search?: string
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const { search, page = 1, limit = 20, enabled = true } = params
  return useQuery<GroupLeaderRequestsListData, Error>({
    queryKey: groupLeaderRequestListKeys().pending({ search, page, limit }),
    queryFn: () => listPendingGroupLeaderRequests({ search, page, limit }),
    enabled,
    staleTime: 30_000,
  })
}

export function useGroupLeaderRequests(params: {
  search?: string
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const { search, page = 1, limit = 20, enabled = true } = params
  return useQuery<GroupLeaderRequestsListData, Error>({
    queryKey: groupLeaderRequestListKeys().all({ search, page, limit }),
    queryFn: () => listGroupLeaderRequests({ search, page, limit }),
    enabled,
    staleTime: 30_000,
  })
}
