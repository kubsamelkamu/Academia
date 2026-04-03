import type { Notification, NotificationMetadata } from "@/types/notifications"

export const DEPARTMENT_ACTIVITY_EVENT_TYPES = [
  "PROPOSAL_SUBMITTED",
  "PROPOSAL_APPROVED",
  "PROPOSAL_REJECTED",
  "PROPOSAL_FEEDBACK_ADDED",
  "PROJECT_GROUP_FORMED",
  "MILESTONE_COMPLETED",
] as const

export type DepartmentActivityBadge = "pending" | "completed" | "info"

export type DepartmentActivityItem = {
  id: string
  type: string
  title: string
  description: string
  badge: DepartmentActivityBadge
  occurredAt: string
  href?: string
  raw: Notification
  context: string
  relativeTime: string
}

export type DepartmentActivityGroup = {
  label: "Today" | "Yesterday" | "Earlier"
  items: DepartmentActivityItem[]
}

function asMetadataRecord(metadata?: NotificationMetadata | null): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  return metadata as Record<string, unknown>
}

function readMetadataString(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key]
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function eventFallbackLabel(eventType: string): string {
  switch (eventType) {
    case "PROPOSAL_SUBMITTED":
      return "Proposal workflow"
    case "PROPOSAL_APPROVED":
      return "Proposal approved"
    case "PROPOSAL_REJECTED":
      return "Proposal rejected"
    case "PROPOSAL_FEEDBACK_ADDED":
      return "Feedback added"
    case "PROJECT_GROUP_FORMED":
      return "Project group"
    case "MILESTONE_COMPLETED":
      return "Milestone update"
    default:
      return "Department activity"
  }
}

function badgeForEventType(eventType: string): DepartmentActivityBadge {
  switch (eventType) {
    case "PROPOSAL_SUBMITTED":
      return "pending"
    case "PROPOSAL_APPROVED":
    case "PROPOSAL_REJECTED":
    case "PROPOSAL_FEEDBACK_ADDED":
    case "PROJECT_GROUP_FORMED":
    case "MILESTONE_COMPLETED":
      return "completed"
    default:
      return "info"
  }
}

function resolveMetadataHref(record: Record<string, unknown> | null): string | undefined {
  const candidate = readMetadataString(record, "href") ?? readMetadataString(record, "path") ?? readMetadataString(record, "url")

  if (!candidate || !candidate.startsWith("/")) {
    return undefined
  }

  return candidate
}

export function resolveDepartmentActivityHref(notification: Notification): string | undefined {
  const record = asMetadataRecord(notification.metadata)
  const explicitHref = resolveMetadataHref(record)

  if (explicitHref) {
    return explicitHref
  }

  const projectGroupId = readMetadataString(record, "projectGroupId")
  if (projectGroupId) {
    return `/dashboard/department-head/review/group-${encodeURIComponent(projectGroupId)}`
  }

  const proposalId = readMetadataString(record, "proposalId")
  if (proposalId) {
    return "/dashboard/department-head/review"
  }

  if (DEPARTMENT_ACTIVITY_EVENT_TYPES.includes(notification.eventType as (typeof DEPARTMENT_ACTIVITY_EVENT_TYPES)[number])) {
    return "/dashboard/department-head/review"
  }

  return undefined
}

function resolveDepartmentActivityContext(notification: Notification): string {
  const record = asMetadataRecord(notification.metadata)

  return (
    readMetadataString(record, "actorName") ??
    readMetadataString(record, "userName") ??
    readMetadataString(record, "submitterName") ??
    readMetadataString(record, "projectGroupName") ??
    readMetadataString(record, "groupName") ??
    readMetadataString(record, "proposalTitle") ??
    eventFallbackLabel(notification.eventType)
  )
}

export function formatRelativeTime(iso: string): string {
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

export function normalizeDepartmentActivity(notification: Notification): DepartmentActivityItem {
  return {
    id: notification.id,
    type: notification.eventType,
    title: notification.title,
    description: notification.message,
    badge: badgeForEventType(notification.eventType),
    occurredAt: notification.createdAt,
    href: resolveDepartmentActivityHref(notification),
    raw: notification,
    context: resolveDepartmentActivityContext(notification),
    relativeTime: formatRelativeTime(notification.createdAt),
  }
}

function activityGroupLabel(occurredAt: string): DepartmentActivityGroup["label"] {
  const date = new Date(occurredAt)
  if (Number.isNaN(date.getTime())) {
    return "Earlier"
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  if (date >= todayStart) {
    return "Today"
  }

  if (date >= yesterdayStart) {
    return "Yesterday"
  }

  return "Earlier"
}

export function groupDepartmentActivityItems(items: DepartmentActivityItem[]): DepartmentActivityGroup[] {
  const sortedItems = [...items].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  )

  const groups: DepartmentActivityGroup[] = []

  for (const item of sortedItems) {
    const label = activityGroupLabel(item.occurredAt)
    const existingGroup = groups.find((group) => group.label === label)

    if (existingGroup) {
      existingGroup.items.push(item)
      continue
    }

    groups.push({ label, items: [item] })
  }

  return groups
}