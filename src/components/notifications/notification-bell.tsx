"use client"

import useSWR from "swr"
import Link from "next/link"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getNotificationSummary,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications"
import { useAuthStore } from "@/store/auth-store"
import type { Notification, NotificationSeverity, NotificationSummaryResponse } from "@/types/notifications"
import { NotificationItem } from "@/components/notifications/notification-item"

interface NotificationBellProps {
  initialCount?: number
}

const severityOrder: NotificationSeverity[] = ["HIGH", "MEDIUM", "LOW", "INFO"]

function groupBySeverity(items: Notification[]): Array<{ severity: NotificationSeverity; items: Notification[] }> {
  const map = new Map<NotificationSeverity, Notification[]>()

  for (const item of items) {
    const current = map.get(item.severity) ?? []
    current.push(item)
    map.set(item.severity, current)
  }

  const result: Array<{ severity: NotificationSeverity; items: Notification[] }> = []
  for (const severity of severityOrder) {
    const group = map.get(severity)
    if (group?.length) result.push({ severity, items: group })
  }
  return result
}

async function fetchUnreadCount(): Promise<number> {
  const data = await getUnreadCount()
  return data.count
}

async function fetchSummary(): Promise<NotificationSummaryResponse> {
  return getNotificationSummary()
}

export function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = Boolean(accessToken)

  const {
    data: unreadCount,
    isLoading: unreadLoading,
    mutate: mutateUnread,
  } = useSWR(isAuthenticated ? "notifications.unreadCount" : null, fetchUnreadCount, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const {
    data: summary,
    isLoading: summaryLoading,
    mutate: mutateSummary,
  } = useSWR(isAuthenticated ? "notifications.summary" : null, fetchSummary, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  })

  const badgeCount = unreadCount ?? summary?.unread ?? initialCount

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      toast.success("All notifications marked as read")
      await Promise.all([mutateUnread(), mutateSummary()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark all as read")
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      await Promise.all([mutateUnread(), mutateSummary()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark notification as read")
    }
  }

  const recent: Notification[] = summary?.recent ?? []
  const grouped = groupBySeverity(recent)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {badgeCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1"
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </Badge>
          ) : null}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[420px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={badgeCount === 0 || unreadLoading || summaryLoading}
          >
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-[420px] overflow-auto p-2" role="list">
          {summaryLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
          ) : grouped.length ? (
            <div className="grid gap-3">
              {grouped.map((group) => (
                <div key={group.severity} className="grid gap-2">
                  <div className="px-2 pt-1 text-xs font-medium text-muted-foreground">
                    {group.severity}
                  </div>
                  {group.items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      compact
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No unread notifications.</div>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-muted-foreground">
            {badgeCount > 0 ? `${badgeCount} unread` : "You're all caught up"}
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/notifications">View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
