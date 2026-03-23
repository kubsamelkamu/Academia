"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createDepartmentAnnouncement,
  deleteDepartmentAnnouncement,
  getDepartmentAnnouncementById,
  listDepartmentAnnouncements,
  updateDepartmentAnnouncement,
} from "@/lib/api/department-announcements"
import type {
  CreateDepartmentAnnouncementDto,
  DepartmentAnnouncementDetails,
  DepartmentAnnouncementsListData,
  UpdateDepartmentAnnouncementDto,
} from "@/types/department-announcements"

export function departmentAnnouncementsKeys() {
  return {
    root: ["department-announcements"] as const,
    list: (departmentId: string, params: { page: number; limit: number }) =>
      ["department-announcements", "list", departmentId, params] as const,
    detail: (departmentId: string, announcementId: string) =>
      ["department-announcements", "detail", departmentId, announcementId] as const,
  }
}

export function useDepartmentAnnouncements(params: {
  enabled: boolean
  departmentId: string | null | undefined
  page: number
  limit: number
  refetchIntervalMs?: number
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null

  return useQuery<DepartmentAnnouncementsListData, Error>({
    queryKey: departmentId
      ? departmentAnnouncementsKeys().list(departmentId, {
          page: params.page,
          limit: params.limit,
        })
      : departmentAnnouncementsKeys().root,
    queryFn: () => {
      if (!departmentId) throw new Error("departmentId is required")
      return listDepartmentAnnouncements(departmentId, {
        page: params.page,
        limit: params.limit,
      })
    },
    enabled: params.enabled && Boolean(departmentId),
    staleTime: 30_000,
    refetchInterval: params.refetchIntervalMs ?? false,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

export function useDepartmentAnnouncementById(params: {
  enabled: boolean
  departmentId: string | null | undefined
  announcementId: string | null | undefined
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const announcementId = params.announcementId?.trim() ? params.announcementId.trim() : null

  return useQuery<DepartmentAnnouncementDetails, Error>({
    queryKey:
      departmentId && announcementId
        ? departmentAnnouncementsKeys().detail(departmentId, announcementId)
        : departmentAnnouncementsKeys().root,
    queryFn: () => {
      if (!departmentId) throw new Error("departmentId is required")
      if (!announcementId) throw new Error("announcementId is required")
      return getDepartmentAnnouncementById(departmentId, announcementId)
    },
    enabled: params.enabled && Boolean(departmentId) && Boolean(announcementId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useCreateDepartmentAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<
    DepartmentAnnouncementDetails,
    Error,
    { departmentId: string; dto: CreateDepartmentAnnouncementDto }
  >({
    mutationFn: ({ departmentId, dto }) => createDepartmentAnnouncement(departmentId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentAnnouncementsKeys().root })
    },
  })
}

export function useUpdateDepartmentAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<
    DepartmentAnnouncementDetails,
    Error,
    { departmentId: string; announcementId: string; dto: UpdateDepartmentAnnouncementDto }
  >({
    mutationFn: ({ departmentId, announcementId, dto }) =>
      updateDepartmentAnnouncement(departmentId, announcementId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentAnnouncementsKeys().root })
    },
  })
}

export function useDeleteDepartmentAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    Error,
    { departmentId: string; announcementId: string }
  >({
    mutationFn: ({ departmentId, announcementId }) =>
      deleteDepartmentAnnouncement(departmentId, announcementId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentAnnouncementsKeys().root })
    },
  })
}
