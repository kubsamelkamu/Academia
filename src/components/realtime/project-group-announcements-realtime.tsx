"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/store/auth-store"
import { acquireNotificationsSocket, releaseNotificationsSocket } from "@/lib/realtime/notifications-socket"

type ProjectGroupAnnouncementRealtimePayload = {
  type: "created" | "updated" | "deleted"
  projectGroupId: string
  announcementId: string
  occurredAt: string
  announcement?: unknown
}

function isProjectGroupAnnouncementRealtimePayload(value: unknown): value is ProjectGroupAnnouncementRealtimePayload {
  if (!value || typeof value !== "object") return false
  const raw = value as Record<string, unknown>

  const type = raw.type
  if (type !== "created" && type !== "updated" && type !== "deleted") return false

  if (typeof raw.projectGroupId !== "string" || !raw.projectGroupId) return false
  if (typeof raw.announcementId !== "string" || !raw.announcementId) return false
  if (typeof raw.occurredAt !== "string" || !raw.occurredAt) return false

  return true
}

export function ProjectGroupAnnouncementsRealtime() {
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

    const onProjectGroupAnnouncement = (payload: unknown) => {
      if (!isProjectGroupAnnouncementRealtimePayload(payload)) {
        return
      }

      const eventKey = `${payload.type}:${payload.announcementId}:${payload.occurredAt}`
      if (seenEventKeysRef.current.has(eventKey)) return
      seenEventKeysRef.current.add(eventKey)

      // Minimal behavior: invalidate only project-group announcements queries.
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey
          return (
            Array.isArray(key) &&
            key[0] === "project-groups" &&
            key[1] === "announcements"
          )
        },
      })
    }

    socket.on("project-group-announcement", onProjectGroupAnnouncement)

    return () => {
      socket.off("project-group-announcement", onProjectGroupAnnouncement)
      releaseNotificationsSocket(socket)
    }
  }, [accessToken, queryClient, tenantDomain])

  return null
}
