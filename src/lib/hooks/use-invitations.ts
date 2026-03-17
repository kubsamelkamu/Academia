"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import {
  acceptInvitation,
  acceptInvitationPreview,
  bulkInviteStudentsAsyncJob,
  bulkInviteStudentsSync,
  createTenantInvitation,
  getBulkInviteJob,
  listAllTenantInvitations,
  listTenantInvitations,
  previewInvitationEmail,
  resendTenantInvitation,
  revokeTenantInvitation,
} from "@/lib/api/invitations"
import type {
  AcceptInvitationDto,
  AcceptInvitationPreviewResult,
  AcceptInvitationResult,
  BulkInviteJobEnqueueResult,
  BulkInviteJobStatus,
  BulkInviteStudentsDto,
  BulkInviteSyncResult,
  CreateTenantInvitationDto,
  ListTenantInvitationsParams,
  PreviewInvitationEmailDto,
  PreviewInvitationEmailResult,
  TenantInvitation,
} from "@/types/invitations"

export function invitationKeys() {
  return {
    root: ["invitations"] as const,
    tenantList: (params: ListTenantInvitationsParams) =>
      ["invitations", "tenant", "list", params] as const,
    tenantListAll: ["invitations", "tenant", "list", "all-statuses"] as const,
    bulkJob: (jobId: string) => ["invitations", "tenant", "bulk", "job", jobId] as const,
    acceptPreview: (token: string) => ["invitations", "accept", "preview", token] as const,
  }
}

export function useAcceptInvitationPreview(
  token: string | null,
  options?: Omit<
    UseQueryOptions<AcceptInvitationPreviewResult, Error, AcceptInvitationPreviewResult>,
    "queryKey" | "queryFn"
  >
) {
  const enabled = Boolean(token)
  return useQuery({
    queryKey: invitationKeys().acceptPreview(token ?? ""),
    queryFn: () => acceptInvitationPreview({ token: token as string }),
    enabled,
    ...options,
  })
}

export function useTenantInvitationsList(
  params: ListTenantInvitationsParams = {},
  options?: Omit<
    UseQueryOptions<TenantInvitation[], Error, TenantInvitation[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: invitationKeys().tenantList(params),
    queryFn: () => listTenantInvitations(params),
    ...options,
  })
}

export function useAllTenantInvitationsList(
  options?: Omit<
    UseQueryOptions<TenantInvitation[], Error, TenantInvitation[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: invitationKeys().tenantListAll,
    queryFn: listAllTenantInvitations,
    ...options,
  })
}

export function useCreateTenantInvitation() {
  const queryClient = useQueryClient()
  return useMutation<TenantInvitation, Error, CreateTenantInvitationDto>({
    mutationFn: (dto) => createTenantInvitation(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys().root })
    },
  })
}

export function useBulkInviteStudentsSync() {
  const queryClient = useQueryClient()
  return useMutation<BulkInviteSyncResult, Error, BulkInviteStudentsDto>({
    mutationFn: (dto) => bulkInviteStudentsSync(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys().root })
    },
  })
}

export function useBulkInviteStudentsAsyncJob() {
  const queryClient = useQueryClient()
  return useMutation<BulkInviteJobEnqueueResult, Error, BulkInviteStudentsDto>({
    mutationFn: (dto) => bulkInviteStudentsAsyncJob(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys().root })
    },
  })
}

export function usePreviewInvitationEmail() {
  return useMutation<PreviewInvitationEmailResult, Error, PreviewInvitationEmailDto>({
    mutationFn: (dto) => previewInvitationEmail(dto),
  })
}

export function useBulkInviteJob(
  jobId: string | null,
  options?: Omit<
    UseQueryOptions<BulkInviteJobStatus, Error, BulkInviteJobStatus>,
    "queryKey" | "queryFn"
  >
) {
  const enabled = Boolean(jobId)

  return useQuery({
    queryKey: invitationKeys().bulkJob(jobId ?? ""),
    queryFn: () => getBulkInviteJob(jobId as string),
    enabled,
    ...options,
  })
}

export function useResendTenantInvitation() {
  const queryClient = useQueryClient()
  return useMutation<TenantInvitation, Error, string>({
    mutationFn: (invitationId) => resendTenantInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys().root })
    },
  })
}

export function useRevokeTenantInvitation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (invitationId) => revokeTenantInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys().root })
    },
  })
}

export function useAcceptInvitation() {
  return useMutation<AcceptInvitationResult, Error, AcceptInvitationDto>({
    mutationFn: (dto) => acceptInvitation(dto),
  })
}
