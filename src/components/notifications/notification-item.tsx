"use client"

import type { Notification, NotificationSeverity } from "@/types/notifications"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void | Promise<void>
  onClick?: (notification: Notification) => void | Promise<void>
  compact?: boolean
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

function severityBadgeVariant(severity: NotificationSeverity): BadgeVariant {
  if (severity === "HIGH") return "destructive"
  if (severity === "MEDIUM") return "default"
  if (severity === "LOW") return "secondary"
  return "outline"
}

function severityDotClass(severity: NotificationSeverity): string {
  if (severity === "HIGH") return "bg-destructive"
  if (severity === "MEDIUM") return "bg-primary"
  if (severity === "LOW") return "bg-secondary"
  return "bg-muted-foreground"
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = Date.now()
  if (Number.isNaN(date.getTime())) return ""

  const diffMs = date.getTime() - now
  const diffSec = Math.round(diffMs / 1000)

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(diffSec, "second")

  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute")

  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour")

  const diffDay = Math.round(diffHour / 24)
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day")

  const diffWeek = Math.round(diffDay / 7)
  if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, "week")

  const diffMonth = Math.round(diffDay / 30)
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month")

  const diffYear = Math.round(diffDay / 365)
  return rtf.format(diffYear, "year")
}

export function NotificationItem({ notification, onMarkRead, onClick, compact = false }: NotificationItemProps) {
  const time = formatRelativeTime(notification.createdAt)
  const isUnread = notification.status === "UNREAD"
  const isInteractive = Boolean(onClick) || (isUnread && Boolean(onMarkRead))

  const handleActivate = async () => {
    if (onClick) {
      await onClick(notification)
      return
    }

    if (isUnread && onMarkRead) {
      await onMarkRead(notification.id)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        compact ? "p-2" : "",
        isUnread ? "bg-muted/50" : "",
        isInteractive
          ? "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-hidden focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          : ""
      )}
      role={isInteractive ? "button" : "listitem"}
      aria-label={`${notification.title}${isUnread ? ", unread" : ""}`}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={
        isInteractive
          ? () => {
              void handleActivate()
            }
          : undefined
      }
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                void handleActivate()
              }
            }
          : undefined
      }
    >
      <div
        className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", severityDotClass(notification.severity))}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{notification.title}</p>
          <Badge
            variant={severityBadgeVariant(notification.severity)}
            className="h-5 px-2 py-0 text-[10px]"
          >
            {notification.severity}
          </Badge>
          {time ? <span className="text-xs text-muted-foreground">{time}</span> : null}
        </div>

        {notification.message ? (
          <p
            className={cn(
              "mt-1 text-sm text-muted-foreground",
              compact ? "text-xs" : ""
            )}
          >
            {notification.message}
          </p>
        ) : null}
      </div>

      {isUnread && onMarkRead ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void onMarkRead(notification.id)
          }}
        >
          Mark read
        </Button>
      ) : null}
    </div>
  )
}
