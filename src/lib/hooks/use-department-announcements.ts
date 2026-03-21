"use client"

import { useQuery } from "@tanstack/react-query"
import { listDepartmentAnnouncements } from "@/lib/api/department-announcements"
import type { DepartmentAnnouncementsListData } from "@/types/department-announcements"

export function departmentAnnouncementsKeys() {
  return {
    root: ["department-announcements"] as const,
    list: (departmentId: string, params: { page: number; limit: number }) =>
      ["department-announcements", "list", departmentId, params] as const,
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
