"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listAdvisorProjectAnnouncements,
  createAdvisorProjectAnnouncement,
  getAdvisorProjectAnnouncementById,
  updateAdvisorProjectAnnouncement,
  deleteAdvisorProjectAnnouncement,
} from "@/lib/api/advisor"
import type {
  AdvisorAnnouncementItem,
  CreateAdvisorAnnouncementDto,
  UpdateAdvisorAnnouncementDto,
  ListAdvisorAnnouncementsData,
} from "@/types/announcements"

// ── Query key factory ─────────────────────────────────────────────────────────

export const advisorAnnouncementKeys = {
  root: ["advisor", "announcements"] as const,
  list: (projectId: string, page: number, limit: number) =>
    [...advisorAnnouncementKeys.root, projectId, "list", page, limit] as const,
  detail: (projectId: string, announcementId: string) =>
    [...advisorAnnouncementKeys.root, projectId, "detail", announcementId] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useAdvisorAnnouncements(params: {
  projectId: string | null
  page: number
  limit: number
  enabled?: boolean
}) {
  const enabled = (params.enabled ?? true) && Boolean(params.projectId)

  return useQuery<ListAdvisorAnnouncementsData, Error>({
    queryKey: advisorAnnouncementKeys.list(params.projectId ?? "", params.page, params.limit),
    queryFn: () =>
      listAdvisorProjectAnnouncements({
        projectId: params.projectId!,
        page: params.page,
        limit: params.limit,
      }),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAdvisorAnnouncementById(params: {
  announcementId: string | null
  projectId: string | null
  enabled?: boolean
}) {
  const announcementId = params.announcementId?.trim() || null
  const projectId = params.projectId?.trim() || null
  const enabled =
    (params.enabled ?? true) && Boolean(announcementId) && Boolean(projectId)

  return useQuery<AdvisorAnnouncementItem, Error>({
    queryKey: advisorAnnouncementKeys.detail(projectId ?? "", announcementId ?? ""),
    queryFn: () => {
      if (!announcementId || !projectId) throw new Error("announcementId and projectId are required")
      return getAdvisorProjectAnnouncementById(announcementId, projectId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateAdvisorAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateAdvisorAnnouncementDto) => createAdvisorProjectAnnouncement(dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...advisorAnnouncementKeys.root, variables.projectId],
      })
    },
  })
}

export function useUpdateAdvisorAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      announcementId: string
      projectId: string
      dto: UpdateAdvisorAnnouncementDto
    }) => updateAdvisorProjectAnnouncement(params.announcementId, params.projectId, params.dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...advisorAnnouncementKeys.root, variables.projectId],
      })
    },
  })
}

export function useDeleteAdvisorAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { announcementId: string; projectId: string }) =>
      deleteAdvisorProjectAnnouncement(params.announcementId, params.projectId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...advisorAnnouncementKeys.root, variables.projectId],
      })
    },
  })
}
