import type { MilestoneTemplate } from "@/types/milestone-templates"
import type { ProjectProposal } from "@/types/project-proposals"

export type ProposalMilestoneStatus = "pending" | "submitted" | "approved"

export function normalizeMilestoneName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

export function isProposalMilestoneName(name: string): boolean {
  const normalized = normalizeMilestoneName(name)
  return normalized.includes("proposal") || normalized.includes("project title")
}

export function toProposalMilestoneState(proposals: ProjectProposal[] | null | undefined): {
  status: ProposalMilestoneStatus
  submittedAt?: string
} | null {
  const items = proposals ?? []
  if (!items.length) return null

  const sorted = items
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
      const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })

  const latest = sorted[0]
  const latestStatus = String(latest?.status ?? "").trim().toUpperCase()
  const latestSubmittedAt = latest?.submittedAt ?? latest?.updatedAt ?? latest?.createdAt ?? undefined

  if (latestStatus === "APPROVED") {
    return { status: "approved", submittedAt: latestSubmittedAt }
  }

  if (latestStatus === "SUBMITTED") {
    return { status: "submitted", submittedAt: latestSubmittedAt }
  }

  return { status: "pending" }
}

export function getLatestProposal(proposals: ProjectProposal[] | null | undefined): ProjectProposal | null {
  const items = proposals ?? []
  if (!items.length) return null

  return items
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
      const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })[0] ?? null
}

export function getLatestLinkedProposal(proposals: ProjectProposal[] | null | undefined): ProjectProposal | null {
  const items = (proposals ?? []).filter((proposal) => proposal.project?.id)
  if (!items.length) return null

  return items
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
      const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })[0] ?? null
}

export function addDays(baseDate: string, daysToAdd: number): string {
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return baseDate
  const next = new Date(date)
  next.setDate(next.getDate() + Math.max(0, daysToAdd))
  return next.toISOString().split("T")[0]
}

export function getActiveMilestoneTemplate(templates: MilestoneTemplate[]): MilestoneTemplate | null {
  if (!templates.length) return null
  return templates.find((template) => template.isActive) ?? templates[0]
}