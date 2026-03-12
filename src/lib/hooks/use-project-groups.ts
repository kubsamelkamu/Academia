"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  browseProjectGroups,
  createProjectGroup,
  createProjectGroupJoinRequest,
  createProjectGroupInvitation,
  cancelProjectGroupJoinRequest,
  approveMyGroupJoinRequest,
  rejectMyGroupJoinRequest,
  submitMyProjectGroup,
  reopenMyProjectGroup,
  getAvailableStudents,
  getMyProjectGroupJoinRequests,
  getMyGroupJoinRequests,
  getMyProjectGroup,
  getProjectGroupDetails,
} from "@/lib/api/project-groups"
import type {
  AvailableStudentsPage,
  BrowseProjectGroupsPage,
  CancelProjectGroupJoinRequestResult,
  ApproveMyGroupJoinRequestResult,
  RejectMyGroupJoinRequestDto,
  RejectMyGroupJoinRequestResult,
  SubmitMyProjectGroupResult,
  ReopenMyProjectGroupResult,
  CreateProjectGroupJoinRequestDto,
  CreateProjectGroupJoinRequestResult,
  CreateProjectGroupInvitationDto,
  CreateProjectGroupInvitationResult,
  CreateProjectGroupDto,
  MyGroupJoinRequestsPage,
  MyProjectGroupJoinRequestStatus,
  MyProjectGroupJoinRequestsPage,
  ProjectGroup,
  ProjectGroupDetails,
  ProjectGroupMe,
} from "@/types/project-groups"


export function projectGroupKeys() {
  return {
    root: ["project-groups"] as const,
    me: () => [...projectGroupKeys().root, "me"] as const,
    availableStudents: (params: { page: number; limit: number; search?: string }) =>
      [...projectGroupKeys().root, "available-students", params] as const,
    browse: (params: { page: number; limit: number; search?: string }) =>
      [...projectGroupKeys().root, "browse", params] as const,
    details: (groupId: string) => [...projectGroupKeys().root, "details", groupId] as const,
    joinRequestsMe: (params: { page: number; limit: number; status?: MyProjectGroupJoinRequestStatus | string }) =>
      [...projectGroupKeys().root, "join-requests", "me", params] as const,
    joinRequestsMyGroup: (params: { page: number; limit: number; status?: MyProjectGroupJoinRequestStatus | string }) =>
      [...projectGroupKeys().root, "join-requests", "my-group", params] as const,
  }
}

export function useCreateProjectGroup() {
  return useMutation<ProjectGroup, Error, CreateProjectGroupDto>({
    mutationFn: (dto) => createProjectGroup(dto),
  })
}

export function useMyProjectGroup(enabled: boolean) {
  return useQuery<ProjectGroupMe, Error>({
    queryKey: projectGroupKeys().me(),
    queryFn: () => getMyProjectGroup(),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAvailableStudents(params: {
  enabled: boolean
  page: number
  limit: number
  search?: string
}) {
  const search = params.search?.trim() ? params.search.trim() : undefined

  return useQuery<AvailableStudentsPage, Error>({
    queryKey: projectGroupKeys().availableStudents({
      page: params.page,
      limit: params.limit,
      ...(search ? { search } : null),
    }),
    queryFn: () =>
      getAvailableStudents({
        page: params.page,
        limit: params.limit,
        search,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useBrowseProjectGroups(params: {
  enabled: boolean
  page: number
  limit: number
  search?: string
}) {
  const search = params.search?.trim() ? params.search.trim() : undefined

  return useQuery<BrowseProjectGroupsPage, Error>({
    queryKey: projectGroupKeys().browse({
      page: params.page,
      limit: params.limit,
      ...(search ? { search } : null),
    }),
    queryFn: () =>
      browseProjectGroups({
        page: params.page,
        limit: params.limit,
        search,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: false,
  })
}

export function useCreateProjectGroupInvitation() {
  return useMutation<CreateProjectGroupInvitationResult, Error, CreateProjectGroupInvitationDto>({
    mutationFn: (dto) => createProjectGroupInvitation(dto),
  })
}

export function useCreateProjectGroupJoinRequest() {
  return useMutation<CreateProjectGroupJoinRequestResult, Error, { groupId: string; dto?: CreateProjectGroupJoinRequestDto }>({
    mutationFn: ({ groupId, dto }) => createProjectGroupJoinRequest(groupId, dto ?? {}),
  })
}

export function useCancelProjectGroupJoinRequest() {
  const queryClient = useQueryClient()

  return useMutation<CancelProjectGroupJoinRequestResult, Error, { requestId: string }>({
    mutationFn: ({ requestId }) => cancelProjectGroupJoinRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupKeys().root })
    },
  })
}

export function useProjectGroupDetails(params: { enabled: boolean; groupId: string | null }) {
  const groupId = params.groupId?.trim() ? params.groupId.trim() : null

  return useQuery<ProjectGroupDetails, Error>({
    queryKey: projectGroupKeys().details(groupId ?? ""),
    queryFn: () => {
      if (!groupId) throw new Error("groupId is required")
      return getProjectGroupDetails(groupId)
    },
    enabled: params.enabled && Boolean(groupId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useMyProjectGroupJoinRequests(params: {
  enabled: boolean
  page: number
  limit: number
  status?: MyProjectGroupJoinRequestStatus | string
}) {
  const status = params.status?.trim() ? params.status.trim() : undefined

  return useQuery<MyProjectGroupJoinRequestsPage, Error>({
    queryKey: projectGroupKeys().joinRequestsMe({
      page: params.page,
      limit: params.limit,
      ...(status ? { status } : null),
    }),
    queryFn: () =>
      getMyProjectGroupJoinRequests({
        page: params.page,
        limit: params.limit,
        status,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: false,
  })
}

export function useMyGroupJoinRequests(params: {
  enabled: boolean
  page: number
  limit: number
  status?: MyProjectGroupJoinRequestStatus | string
}) {
  const status = params.status?.trim() ? params.status.trim() : undefined

  return useQuery<MyGroupJoinRequestsPage, Error>({
    queryKey: projectGroupKeys().joinRequestsMyGroup({
      page: params.page,
      limit: params.limit,
      ...(status ? { status } : null),
    }),
    queryFn: () =>
      getMyGroupJoinRequests({
        page: params.page,
        limit: params.limit,
        status,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: false,
  })
}

export function useApproveMyGroupJoinRequest() {
  const queryClient = useQueryClient()

  return useMutation<ApproveMyGroupJoinRequestResult, Error, { requestId: string }>({
    mutationFn: ({ requestId }) => approveMyGroupJoinRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupKeys().root })
    },
  })
}

export function useRejectMyGroupJoinRequest() {
  const queryClient = useQueryClient()

  return useMutation<RejectMyGroupJoinRequestResult, Error, { requestId: string; dto?: RejectMyGroupJoinRequestDto }>({
    mutationFn: ({ requestId, dto }) => rejectMyGroupJoinRequest(requestId, dto ?? {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupKeys().root })
    },
  })
}

export function useSubmitMyProjectGroup() {
  const queryClient = useQueryClient()

  return useMutation<SubmitMyProjectGroupResult, Error, void>({
    mutationFn: () => submitMyProjectGroup(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupKeys().root })
    },
  })
}

export function useReopenMyProjectGroup() {
  const queryClient = useQueryClient()

  return useMutation<ReopenMyProjectGroupResult, Error, void>({
    mutationFn: () => reopenMyProjectGroup(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectGroupKeys().root })
    },
  })
}
