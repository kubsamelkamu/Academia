"use client"

import { Timer } from "lucide-react"

import { StatusIndicator } from "@/components/timeline/StatusIndicator"
import { mockProjectTimelines, type ProjectTimeline } from "@/data/timelineData"

export function timelineStatusForProject(
  timeline: ProjectTimeline | undefined,
  projectProgress: number,
): "on_track" | "at_risk" | "overdue" | "completed" | "pending" {
  if (projectProgress >= 100) return "completed"
  if (!timeline) return "pending"
  if (timeline.status === "overdue") return "overdue"
  if (timeline.status === "at_risk") return "at_risk"
  return "on_track"
}

export function DueBadge({
  timeline,
  projectProgress,
}: {
  timeline: ProjectTimeline | undefined
  projectProgress: number
}) {
  const days = timeline?.daysRemaining
  if (days === undefined) {
    return <span className="text-muted-foreground">—</span>
  }
  if (projectProgress >= 100) {
    return <span className="text-muted-foreground">Complete</span>
  }
  if (days < 0) {
    return <span className="font-medium text-destructive">Overdue {Math.abs(days)}d</span>
  }
  if (days === 0) {
    return <span className="font-medium text-amber-600 dark:text-amber-500">Due today</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{days}d left</span>
    </span>
  )
}

export function TimelineStatusRow({
  status,
}: {
  status: ReturnType<typeof timelineStatusForProject>
}) {
  const label =
    status === "on_track"
      ? "On track"
      : status === "at_risk"
        ? "At risk"
        : status === "overdue"
          ? "Overdue"
          : status === "completed"
            ? "Complete"
            : "Pending"

  return (
    <div className="flex items-center gap-2">
      <StatusIndicator status={status} size="sm" />
      <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
    </div>
  )
}

/** Next non-completed milestone due date (ISO-ish string from mock), or null */
export function getNextMilestoneDueDate(projectId: string): string | null {
  const t = mockProjectTimelines.find((x) => x.projectId === projectId)
  if (!t) return null
  const dates = t.milestones
    .filter((m) => m.status !== "completed")
    .map((m) => m.dueDate)
    .sort()
  return dates[0] ?? null
}

export function filterAdvisorPendingProjects<
  T extends { progress?: number; status: string },
>(projects: T[]): T[] {
  return projects.filter(
    (p) =>
      p.progress !== undefined &&
      p.progress < 100 &&
      (p.status === "in_progress" || p.progress >= 55),
  )
}
