"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getNotificationSummary,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications"
import type { ListNotificationsParams } from "@/types/notifications"

export function notificationsKeys() {
  return {
    root: ["notifications"] as const,
    list: (params: ListNotificationsParams) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unread-count"] as const,
    summary: ["notifications", "summary"] as const,
  }
}

export function useNotificationsList(params: ListNotificationsParams = {}) {
  return useQuery({
    queryKey: notificationsKeys().list(params),
    queryFn: () => listNotifications(params),
  })
}

export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: notificationsKeys().unreadCount,
    queryFn: getUnreadCount,
  })
}

export function useNotificationsSummary() {
  return useQuery({
    queryKey: notificationsKeys().summary,
    queryFn: getNotificationSummary,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationsKeys().root }),
      ])
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationsKeys().root }),
      ])
    },
  })
}
