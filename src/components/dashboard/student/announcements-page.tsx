"use client"

import * as React from "react"
import { useAuthStore } from "@/store/auth-store"
import { useMyGroupAnnouncements } from "@/lib/hooks/use-project-groups"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Clock, ExternalLink, AlertTriangle } from "lucide-react"
import type { AnnouncementItem } from "@/types/announcements"

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  HIGH: {
    label: "High",
    badgeClass: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    borderClass: "border-l-red-400",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
    borderClass: "border-l-yellow-400",
  },
  LOW: {
    label: "Low",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    borderClass: "border-l-blue-400",
  },
} as const

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

// ── Live countdown hook ───────────────────────────────────────────────────────
// Seeds from server's `secondsRemaining`, then ticks locally every second.
// The interval effect does NOT list `seconds` as a dependency — it uses the
// functional updater so it runs once and ticks cleanly without drift.

function useCountdown(serverSeconds: number | null, isExpired: boolean) {
  const [seconds, setSeconds] = React.useState<number | null>(serverSeconds)

  // Re-sync whenever the server sends a fresh value (e.g. React Query refetch)
  React.useEffect(() => {
    setSeconds(serverSeconds)
  }, [serverSeconds])

  // Single persistent interval — restarts only if isExpired flips
  React.useEffect(() => {
    if (isExpired) return
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev === null || prev <= 0) return 0
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isExpired])

  return seconds
}

// ── Countdown display ─────────────────────────────────────────────────────────

function CountdownDisplay({
  serverSeconds,
  isExpired,
  deadlineAt,
}: {
  serverSeconds: number | null
  isExpired: boolean
  deadlineAt: string
}) {
  const seconds = useCountdown(serverSeconds, isExpired)

  if (isExpired || (seconds !== null && seconds <= 0)) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-destructive font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Deadline passed — {formatDate(deadlineAt)}</span>
      </div>
    )
  }

  if (seconds === null) return null

  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  const isUrgent = seconds < 86400 // less than 1 day

  return (
    <div
      className={`flex items-center gap-1.5 text-sm font-medium ${
        isUrgent ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      <Clock className={`h-4 w-4 shrink-0 ${isUrgent ? "animate-pulse" : ""}`} />
      <span>
        Deadline:{" "}
        <span className="font-mono tabular-nums">
          {d > 0 && `${d}d `}
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
        <span className="ml-1 font-normal text-muted-foreground">
          ({formatDate(deadlineAt)})
        </span>
      </span>
    </div>
  )
}

// ── Announcement card ─────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const priority = PRIORITY_CONFIG[item.priority]
  const authorName =
    [item.createdBy.firstName, item.createdBy.lastName].filter(Boolean).join(" ") || "Advisor"

  return (
    <article
      className={`rounded-lg border bg-card shadow-sm transition-all hover:shadow-md border-l-4 ${priority.borderClass}`}
      aria-labelledby={`ann-title-${item.id}`}
    >
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`ann-title-${item.id}`}
                className="text-base font-semibold leading-tight"
              >
                {item.title}
              </h3>
              <Badge className={priority.badgeClass} variant="outline">
                {priority.label}
              </Badge>
              {item.isExpired && (
                <Badge variant="secondary" className="text-xs">
                  Expired
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              By {authorName} · <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>

        {/* Countdown — only shown when deadlineAt is set */}
        {item.deadlineAt && (
          <div className="pt-1 border-t border-border/50">
            <CountdownDisplay
              serverSeconds={item.secondsRemaining}
              isExpired={item.isExpired}
              deadlineAt={item.deadlineAt}
            />
          </div>
        )}

        {/* Attachment */}
        {item.attachmentUrl && (
          <a
            href={item.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="h-3 w-3" />
            View attachment
          </a>
        )}
      </div>
    </article>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function AnnouncementSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3 border-l-4 border-l-muted">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-5 w-40" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="rounded-xl border border-border bg-background shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
        <Bell className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold">No deadline announcements</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your advisor hasn&apos;t posted any deadline announcements for your project group yet.
        </p>
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function StudentAnnouncementsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data, isLoading, isError, error } = useMyGroupAnnouncements({
    enabled: Boolean(accessToken),
    page: 1,
    limit: 50,
  })

  // Filter to only items that have a deadline
  const items = React.useMemo(
    () => (data?.items ?? []).filter((item) => Boolean(item.deadlineAt)),
    [data]
  )

  // Sort: non-expired first (by soonest deadline), expired last
  const sorted = React.useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1
        return new Date(a.deadlineAt!).getTime() - new Date(b.deadlineAt!).getTime()
      }),
    [items]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Announcements"
        description="Deadline announcements from your advisor for your project group"
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <AnnouncementSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              Failed to load announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>
              {sorted.filter((i) => !i.isExpired).length} active ·{" "}
              {sorted.filter((i) => i.isExpired).length} expired
            </span>
          </div>

          {sorted.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
