"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"

import { useAuthStore } from "@/store/auth-store"
import { notificationsKeys } from "@/lib/hooks/use-notifications"
import { departmentSettingsKeys } from "@/lib/hooks/use-department-group-size-settings"
import type {
  ListNotificationsResponse,
  Notification,
  NotificationSeverity,
  NotificationStatus,
  NotificationSummaryResponse,
  NotificationUnreadCountResponse,
} from "@/types/notifications"

function deriveSocketOrigin(apiBaseUrl: string | undefined): string {
  if (apiBaseUrl) {
    try {
      return new URL(apiBaseUrl).origin
    } catch {
      // ignore and fall back
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return ""
}

function isSeverity(value: unknown): value is NotificationSeverity {
  return value === "INFO" || value === "HIGH" || value === "MEDIUM" || value === "LOW"
}

function isStatus(value: unknown): value is NotificationStatus {
  return value === "READ" || value === "UNREAD"
}

function normalizeIncomingNotification(payload: unknown): Notification | null {
  if (!payload || typeof payload !== "object") return null

  const raw = payload as Record<string, unknown>

  const id = typeof raw.id === "string" ? raw.id : null
  if (!id) return null

  const eventType =
    typeof raw.eventType === "string"
      ? raw.eventType
      : typeof raw.type === "string"
        ? raw.type
        : "UNKNOWN"

  const title = typeof raw.title === "string" ? raw.title : "Notification"
  const message = typeof raw.message === "string" ? raw.message : ""

  const severity = isSeverity(raw.severity) ? raw.severity : "INFO"
  const status = isStatus(raw.status) ? raw.status : "UNREAD"

  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
  const readAt = typeof raw.readAt === "string" ? raw.readAt : null

  return {
    id,
    eventType,
    severity,
    title,
    message,
    metadata: (raw.metadata as Notification["metadata"]) ?? null,
    status,
    readAt,
    createdAt,
  }
}

function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value
}

function addToSummaryCache(previous: NotificationSummaryResponse, notification: Notification): NotificationSummaryResponse {
  const nextUnread = previous.unread + (notification.status === "UNREAD" ? 1 : 0)
  const nextTotal = previous.total + 1

  const nextBySeverity = { ...previous.bySeverity }
  const current = nextBySeverity[notification.severity]
  nextBySeverity[notification.severity] = (typeof current === "number" ? current : 0) + 1

  const maxRecent = Math.max(previous.recent.length, 5)
  const nextRecent = [notification, ...previous.recent.filter((n) => n.id !== notification.id)].slice(0, maxRecent)

  return {
    ...previous,
    total: nextTotal,
    unread: nextUnread,
    bySeverity: nextBySeverity,
    recent: nextRecent,
  }
}

function addToListCache(previous: ListNotificationsResponse, notification: Notification): ListNotificationsResponse {
  // Avoid shifting older pages.
  if (previous.offset > 0) return previous

  const alreadyPresent = previous.notifications.some((n) => n.id === notification.id)
  if (alreadyPresent) return previous

  const isReadOnlyList = previous.notifications.length > 0 && previous.notifications.every((n) => n.status === "READ")
  if (isReadOnlyList && notification.status === "UNREAD") {
    return previous
  }

  const nextNotifications = [notification, ...previous.notifications].slice(0, previous.limit)

  return {
    ...previous,
    notifications: nextNotifications,
    total: previous.total + 1,
    unreadCount: notification.status === "UNREAD" ? previous.unreadCount + 1 : previous.unreadCount,
  }
}

export function NotificationsRealtime() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const tenantDomain = useAuthStore((s) => s.tenantDomain)
  const queryClient = useQueryClient()

  const socketRef = useRef<Socket | null>(null)
  const tokenRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!accessToken) {
      socketRef.current?.disconnect()
      socketRef.current = null
      tokenRef.current = undefined
      return
    }

    if (socketRef.current && tokenRef.current === accessToken) {
      return
    }

    socketRef.current?.disconnect()

    const origin = deriveSocketOrigin(process.env.NEXT_PUBLIC_API_BASE_URL)
    if (!origin) {
      return
    }

    const socket = io(`${origin}/notifications`, {
      transports: ["websocket"],
      auth: {
        token: accessToken,
        tenantDomain,
      },
    })

    socketRef.current = socket
    tokenRef.current = accessToken

    const onNotification = (payload: unknown) => {
      const notification = normalizeIncomingNotification(payload)
      if (!notification) return

      toast(notification.title, {
        description: notification.message,
      })

      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationsKeys().unreadCount,
        (previous) => {
          const delta = notification.status === "UNREAD" ? 1 : 0
          if (!previous) return { count: delta }
          return { count: clampNonNegative(previous.count + delta) }
        }
      )

      queryClient.setQueryData<NotificationSummaryResponse>(
        notificationsKeys().summary,
        (previous) => {
          if (!previous) return previous
          return addToSummaryCache(previous, notification)
        }
      )

      queryClient.setQueriesData({ queryKey: notificationsKeys().root }, (old) => {
        if (!old) return old
        if (typeof old !== "object") return old
        if (old && typeof (old as ListNotificationsResponse).limit !== "number") return old
        return addToListCache(old as ListNotificationsResponse, notification)
      })

      if (notification.eventType === "DEPARTMENT_GROUP_SIZE_UPDATED") {
        void queryClient.invalidateQueries({ queryKey: departmentSettingsKeys().groupSize })
      }
    }

    socket.on("notification", onNotification)

    return () => {
      socket.off("notification", onNotification)
      socket.disconnect()
      if (socketRef.current === socket) {
        socketRef.current = null
        tokenRef.current = undefined
      }
    }
  }, [accessToken, queryClient, tenantDomain])

  return null
}
