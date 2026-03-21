"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/store/auth-store"
import { acquireNotificationsSocket, releaseNotificationsSocket } from "@/lib/realtime/notifications-socket"

type DepartmentAnnouncementRealtimePayload = {
  type: "created" | "updated" | "deleted"
  announcementId: string
  announcement?: unknown
}

function isDepartmentAnnouncementRealtimePayload(
  value: unknown
): value is DepartmentAnnouncementRealtimePayload {
  if (!value || typeof value !== "object") return false
  const raw = value as Record<string, unknown>

  const type = raw.type
  if (type !== "created" && type !== "updated" && type !== "deleted") return false
  if (typeof raw.announcementId !== "string" || !raw.announcementId) return false

  return true
}

export function DepartmentAnnouncementsRealtime() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const tenantDomain = useAuthStore((s) => s.tenantDomain)
  const queryClient = useQueryClient()

  const seenEventKeysRef = useRef(new Set<string>())

  useEffect(() => {
    if (!accessToken) {
      seenEventKeysRef.current.clear()
      return
    }

    const socket = acquireNotificationsSocket({
      accessToken,
      tenantDomain,
    })

    const onDepartmentAnnouncement = (payload: unknown) => {
      if (!isDepartmentAnnouncementRealtimePayload(payload)) {
        return
      }

      const eventKey = `${payload.type}:${payload.announcementId}`
      if (seenEventKeysRef.current.has(eventKey)) return
      seenEventKeysRef.current.add(eventKey)

      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          return Array.isArray(key) && key[0] === "department-announcements"
        },
      })
    }

    socket.on("department-announcement", onDepartmentAnnouncement)

    return () => {
      socket.off("department-announcement", onDepartmentAnnouncement)
      releaseNotificationsSocket(socket)
    }
  }, [accessToken, queryClient, tenantDomain])

  return null
}
