export type ScheduledSessionStatus = "upcoming" | "in-progress" | "completed" | "cancelled"

export type ScheduledSessionType = "virtual" | "in-person"

export interface ScheduledSessionTeamMember {
  name: string
  role: string
  avatar?: string
}

export interface ScheduledSessionDocument {
  name: string
  size: string
  uploadedAt: string
}

export interface ScheduledSessionCriterion {
  name: string
  weight: number
  description: string
}

export interface ScheduledSessionDetail {
  id: string
  project: string
  group: string
  date: string
  time: string
  venue: string
  type: ScheduledSessionType
  status: ScheduledSessionStatus
  duration: string
  evaluator: string
  description: string
  agenda: string[]
  teamMembers: ScheduledSessionTeamMember[]
  documents: ScheduledSessionDocument[]
  evaluationCriteria: ScheduledSessionCriterion[]
}

import type { AdvisorMeeting } from "@/lib/types/advisor"

function normalizeSessionStatus(status: string | null | undefined, date: string | null | undefined): ScheduledSessionStatus {
  const normalized = status?.trim().toLowerCase().replace(/[_\s]+/g, "-")

  if (normalized) {
    if (normalized.includes("cancel")) return "cancelled"
    if (normalized.includes("complete") || normalized.includes("done") || normalized === "completed") return "completed"
    if (normalized.includes("in-progress") || normalized.includes("ongoing") || normalized.includes("started") || normalized.includes("live")) {
      return "in-progress"
    }
    if (normalized.includes("upcoming") || normalized.includes("scheduled") || normalized.includes("pending")) return "upcoming"
  }

  const scheduledDate = date ? new Date(date) : null
  if (scheduledDate && !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() < Date.now()) {
    return "completed"
  }

  return "upcoming"
}

function formatDuration(minutes: number | null | undefined): string {
  const value = typeof minutes === "number" && Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0
  if (value === 0) return "—"
  if (value < 60) return `${value} minute${value === 1 ? "" : "s"}`
  const hours = Math.floor(value / 60)
  const remainder = value % 60
  if (remainder === 0) return `${hours} hour${hours === 1 ? "" : "s"}`
  return `${hours}h ${remainder}m`
}

function agendaToList(agenda: string | null | undefined): string[] {
  const raw = agenda?.trim() ?? ""
  if (!raw) return []
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : [raw]
}

function pickLeadName(attendees: AdvisorMeeting["attendees"] | null | undefined): string {
  const list = attendees ?? []
  const evaluator = list.find((a) => a.role.toLowerCase().includes("evaluator"))
  const chair = list.find((a) => a.role.toLowerCase().includes("chair") || a.role.toLowerCase().includes("lead"))
  return (evaluator?.name ?? chair?.name ?? list[0]?.name ?? "—").trim() || "—"
}

export function mapAdvisorMeetingToScheduledSessionDetail(meeting: AdvisorMeeting): ScheduledSessionDetail {
  const project = meeting.project?.trim() || meeting.title?.trim() || "Scheduled session"
  const title = meeting.title?.trim() || ""

  return {
    id: meeting.id,
    project,
    group: title && title !== project ? title : "—",
    date: meeting.date,
    time: meeting.time,
    venue: meeting.location?.trim() || (meeting.type === "virtual" ? "Virtual" : "—"),
    type: meeting.type,
    status: normalizeSessionStatus(meeting.status, meeting.date),
    duration: formatDuration(meeting.durationMinutes),
    evaluator: pickLeadName(meeting.attendees),
    description: title || "Evaluation meeting",
    agenda: agendaToList(meeting.agenda),
    teamMembers: (meeting.attendees ?? []).map((attendee) => ({
      name: attendee.name,
      role: attendee.role,
      avatar: attendee.avatar,
    })),
    documents: [],
    evaluationCriteria: [],
  }
}
