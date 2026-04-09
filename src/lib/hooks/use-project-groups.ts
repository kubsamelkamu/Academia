"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  browseProjectGroups,
  createProjectGroup,
  createProjectGroupJoinRequest,
  createProjectGroupInvitation,
  previewProjectGroupInvitation,
  cancelProjectGroupJoinRequest,
  approveMyGroupJoinRequest,
  rejectMyGroupJoinRequest,
  submitMyProjectGroup,
  reopenMyProjectGroup,
  listMyGroupAnnouncements,
  createMyGroupAnnouncement,
  getMyGroupAnnouncementById,
  updateMyGroupAnnouncement,
  deleteMyGroupAnnouncement,
  getAvailableStudents,
  getMyProjectGroupJoinRequests,
  getMyGroupJoinRequests,
  getMyProjectGroup,
  listMyProjectGroupMeetings,
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
  ProjectGroupInvitationPreviewResult,
  CreateProjectGroupDto,
  MyGroupJoinRequestsPage,
  MyProjectGroupJoinRequestStatus,
  MyProjectGroupJoinRequestsPage,
  MyProjectGroupMeetingsListResult,
  ProjectGroup,
  ProjectGroupDetails,
  ProjectGroupMe,
} from "@/types/project-groups"
import type {
  AnnouncementDetails,
  CreateMyGroupAnnouncementDto,
  ListAnnouncementsData,
  UpdateMyGroupAnnouncementDto,
} from "@/types/announcements"


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
    announcementsMyGroup: (params: { page: number; limit: number }) =>
      [...projectGroupKeys().root, "announcements", "my-group", params] as const,
    announcementMyGroup: (announcementId: string) =>
      [...projectGroupKeys().root, "announcements", "my-group", announcementId] as const,
    meetingsMyGroup: (params: { page: number; limit: number; projectId?: string }) =>
      [...projectGroupKeys().root, "meetings", "my-group", params] as const,
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

export function useMyProjectGroupMeetings(params: {
  enabled: boolean
  page: number
  limit: number
  projectId?: string
}) {
  const projectId = params.projectId?.trim() ? params.projectId.trim() : undefined

  return useQuery<MyProjectGroupMeetingsListResult, Error>({
    queryKey: projectGroupKeys().meetingsMyGroup({
      page: params.page,
      limit: params.limit,
      ...(projectId ? { projectId } : null),
    }),
    queryFn: () =>
      listMyProjectGroupMeetings({
        page: params.page,
        limit: params.limit,
        projectId,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
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

export function usePreviewProjectGroupInvitation() {
  return useMutation<ProjectGroupInvitationPreviewResult, Error, CreateProjectGroupInvitationDto>({
    mutationFn: (dto) => previewProjectGroupInvitation(dto),
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

export function useMyGroupAnnouncements(params: {
  enabled: boolean
  page: number
  limit: number
}) {
  return useQuery<ListAnnouncementsData, Error>({
    queryKey: projectGroupKeys().announcementsMyGroup({
      page: params.page,
      limit: params.limit,
    }),
    queryFn: () =>
      listMyGroupAnnouncements({
        page: params.page,
        limit: params.limit,
      }),
    enabled: params.enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useMyGroupAnnouncementById(params: {
  enabled: boolean
  announcementId: string | null
}) {
  const announcementId = params.announcementId?.trim() ? params.announcementId.trim() : null

  return useQuery<AnnouncementDetails, Error>({
    queryKey: projectGroupKeys().announcementMyGroup(announcementId ?? ""),
    queryFn: () => {
      if (!announcementId) throw new Error("announcementId is required")
      return getMyGroupAnnouncementById(announcementId)
    },
    enabled: params.enabled && Boolean(announcementId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useCreateMyGroupAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateMyGroupAnnouncementDto) => createMyGroupAnnouncement(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectGroupKeys().root,
      })
    },
  })
}

export function useUpdateMyGroupAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { announcementId: string; dto: UpdateMyGroupAnnouncementDto }) =>
      updateMyGroupAnnouncement(params.announcementId, params.dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectGroupKeys().root,
      })
    },
  })
}

export function useDeleteMyGroupAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { announcementId: string }) => deleteMyGroupAnnouncement(params.announcementId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectGroupKeys().root,
      })
    },
  })
}
