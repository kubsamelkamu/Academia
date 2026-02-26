"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import {
  getNotificationSummary,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications"
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  MarkAllReadResponse,
  MarkOneReadResponse,
  Notification,
  NotificationSummaryResponse,
  NotificationUnreadCountResponse,
} from "@/types/notifications"

export function notificationsKeys() {
  return {
    root: ["notifications"] as const,
    list: (params: ListNotificationsParams) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unread-count"] as const,
    summary: ["notifications", "summary"] as const,
  }
}

export function useNotificationsList(
  params: ListNotificationsParams = {},
  options?: Omit<
    UseQueryOptions<ListNotificationsResponse, Error, ListNotificationsResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: notificationsKeys().list(params),
    queryFn: () => listNotifications(params),
    ...options,
  })
}

export function useNotificationsUnreadCount(
  options?: Omit<
    UseQueryOptions<NotificationUnreadCountResponse, Error, NotificationUnreadCountResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: notificationsKeys().unreadCount,
    queryFn: getUnreadCount,
    ...options,
  })
}

export function useNotificationsSummary(
  options?: Omit<
    UseQueryOptions<NotificationSummaryResponse, Error, NotificationSummaryResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: notificationsKeys().summary,
    queryFn: getNotificationSummary,
    ...options,
  })
}

function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value
}

function markOneInListCache(
  previous: ListNotificationsResponse,
  notificationId: string,
  readAtIso: string
): ListNotificationsResponse {
  const isUnreadList = previous.notifications.every((n) => n.status === "UNREAD")
  const hasItem = previous.notifications.some((n) => n.id === notificationId)

  // If this is an UNREAD-filtered list, removing the item gives a better UX.
  // We can't reliably know the list params from here, so we use a heuristic:
  // if every item is UNREAD, treat as an unread-only list.
  if (isUnreadList && hasItem) {
    const nextNotifications = previous.notifications.filter((n) => n.id !== notificationId)
    return {
      ...previous,
      notifications: nextNotifications,
      total: clampNonNegative(previous.total - 1),
      unreadCount: clampNonNegative(previous.unreadCount - 1),
    }
  }

  if (!hasItem) return previous

  const nextNotifications = previous.notifications.map((n) =>
    n.id === notificationId
      ? ({ ...n, status: "READ", readAt: readAtIso } satisfies Notification)
      : n
  )

  return {
    ...previous,
    notifications: nextNotifications,
    unreadCount: clampNonNegative(previous.unreadCount - 1),
  }
}

function markAllInListCache(previous: ListNotificationsResponse, readAtIso: string): ListNotificationsResponse {
  const isUnreadList = previous.notifications.every((n) => n.status === "UNREAD")

  if (isUnreadList) {
    return {
      ...previous,
      notifications: [],
      total: 0,
      unreadCount: 0,
    }
  }

  const nextNotifications = previous.notifications.map((n) => ({
    ...n,
    status: "READ" as const,
    readAt: n.readAt ?? readAtIso,
  }))

  return {
    ...previous,
    notifications: nextNotifications,
    unreadCount: 0,
  }
}

function markOneInSummaryCache(
  previous: NotificationSummaryResponse,
  notificationId: string
): NotificationSummaryResponse {
  const target = previous.recent.find((n) => n.id === notificationId)

  const nextUnread = clampNonNegative(previous.unread - 1)
  const nextRecent = previous.recent.filter((n) => n.id !== notificationId)

  const nextBySeverity = { ...previous.bySeverity }
  if (target) {
    const current = nextBySeverity[target.severity]
    if (typeof current === "number") {
      nextBySeverity[target.severity] = clampNonNegative(current - 1)
    }
  }

  return {
    ...previous,
    unread: nextUnread,
    recent: nextRecent,
    bySeverity: nextBySeverity,
  }
}

function markAllInSummaryCache(previous: NotificationSummaryResponse): NotificationSummaryResponse {
  return {
    ...previous,
    unread: 0,
    recent: [],
    bySeverity: {},
  }
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation<MarkOneReadResponse, Error, string, { previousUnread?: NotificationUnreadCountResponse; previousSummary?: NotificationSummaryResponse }>(
    {
      mutationFn: (id: string) => markNotificationRead(id),
      onMutate: async (id) => {
        const readAtIso = new Date().toISOString()

        await queryClient.cancelQueries({ queryKey: notificationsKeys().root })

        const previousUnread = queryClient.getQueryData<NotificationUnreadCountResponse>(notificationsKeys().unreadCount)
        const previousSummary = queryClient.getQueryData<NotificationSummaryResponse>(notificationsKeys().summary)

        if (previousUnread) {
          queryClient.setQueryData<NotificationUnreadCountResponse>(notificationsKeys().unreadCount, {
            count: clampNonNegative(previousUnread.count - 1),
          })
        }

        if (previousSummary) {
          queryClient.setQueryData<NotificationSummaryResponse>(notificationsKeys().summary, markOneInSummaryCache(previousSummary, id))
        }

        // Update all cached list pages (any params)
        queryClient.setQueriesData({ queryKey: notificationsKeys().root }, (old) => {
          if (!old) return old
          if (typeof old !== "object") return old
          if (old && typeof (old as ListNotificationsResponse).limit !== "number") return old
          return markOneInListCache(old as ListNotificationsResponse, id, readAtIso)
        })

        return { previousUnread, previousSummary }
      },
      onError: (_err, _id, context) => {
        if (context?.previousUnread) {
          queryClient.setQueryData(notificationsKeys().unreadCount, context.previousUnread)
        }
        if (context?.previousSummary) {
          queryClient.setQueryData(notificationsKeys().summary, context.previousSummary)
        }
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: notificationsKeys().root })
      },
    }
  )
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation<MarkAllReadResponse, Error, void, { previousUnread?: NotificationUnreadCountResponse; previousSummary?: NotificationSummaryResponse }>(
    {
      mutationFn: markAllNotificationsRead,
      onMutate: async () => {
        const readAtIso = new Date().toISOString()

        await queryClient.cancelQueries({ queryKey: notificationsKeys().root })

        const previousUnread = queryClient.getQueryData<NotificationUnreadCountResponse>(notificationsKeys().unreadCount)
        const previousSummary = queryClient.getQueryData<NotificationSummaryResponse>(notificationsKeys().summary)

        if (previousUnread) {
          queryClient.setQueryData<NotificationUnreadCountResponse>(notificationsKeys().unreadCount, { count: 0 })
        }
        if (previousSummary) {
          queryClient.setQueryData<NotificationSummaryResponse>(notificationsKeys().summary, markAllInSummaryCache(previousSummary))
        }

        queryClient.setQueriesData<ListNotificationsResponse>(
          { queryKey: notificationsKeys().root },
          (old) => {
            if (!old) return old
            if (typeof old !== "object") return old
            if (old && typeof (old as ListNotificationsResponse).limit !== "number") return old
            return markAllInListCache(old as ListNotificationsResponse, readAtIso)
          }
        )

        return { previousUnread, previousSummary }
      },
      onError: (_err, _vars, context) => {
        if (context?.previousUnread) {
          queryClient.setQueryData(notificationsKeys().unreadCount, context.previousUnread)
        }
        if (context?.previousSummary) {
          queryClient.setQueryData(notificationsKeys().summary, context.previousSummary)
        }
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: notificationsKeys().root })
      },
    }
  )
}
