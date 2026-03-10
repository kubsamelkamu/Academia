"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createGroupLeaderRequest, getMyGroupLeaderRequest } from "@/lib/api/group-leader-requests"
import type {
  CreateGroupLeaderRequestDto,
  GroupLeaderMeResponse,
  GroupLeaderRequestResponse,
} from "@/types/group-leader-requests"

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
