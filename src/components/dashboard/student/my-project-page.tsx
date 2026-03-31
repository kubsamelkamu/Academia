"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useMyGroupProposals } from "@/lib/hooks/use-project-proposals"
import { useProjectDetails } from "@/lib/hooks/use-projects"
import type { MilestoneTemplate } from "@/types/milestone-templates"
import type { ProjectProposal } from "@/types/project-proposals"

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------
interface Milestone {
  id: string
  name: string
  dueDate: string
  status: "pending" | "submitted" | "approved" | "rejected"
  submittedAt?: string
  description?: string
  sequence?: number
}

interface ProjectData {
  title: string
  groupName: string
  status: "in-progress" | "completed" | "pending"
  advisorName: string
  progress: number
  startDate: string
  milestones: Milestone[]
  description?: string
}

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------
const formatDate = (dateString: string): string => {
  if (!dateString?.trim()) return "—"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

const getDaysUntilDue = (dueDate: string): number => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0) // Normalize to start of day
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch (error) {
    console.error("Error calculating days until due:", error)
    return 0
  }
}

const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
      return "default"
    case "submitted":
    case "in-progress":
      return "secondary"
    case "rejected":
      return "destructive"
    case "pending":
    default:
      return "outline"
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const displayStatus = status.replace(/-/g, " ")
  return (
    <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
      {displayStatus}
    </Badge>
  )
}

const normalizeMilestoneName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ")

function isProposalMilestoneName(name: string): boolean {
  const normalized = normalizeMilestoneName(name)
  return normalized.includes("proposal") || normalized.includes("project title")
}

function toProposalMilestoneStatus(proposals: ProjectProposal[] | null | undefined):
  | "pending"
  | "submitted"
  | "approved"
  | null {
  const items = proposals ?? []
  if (!items.length) return null

  const normalizeStatus = (value: unknown) => String(value ?? "").trim().toUpperCase()

  const sorted = items
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
      const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })

  const latest = sorted[0]
  const status = normalizeStatus(latest?.status)

  if (status === "APPROVED") return "approved"
  if (status === "SUBMITTED") return "submitted"
  return "pending"
}

function getLatestProposal(proposals: ProjectProposal[] | null | undefined): ProjectProposal | null {
  const items = proposals ?? []
  if (!items.length) return null

  const sorted = items
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? ""))
      const bTime = Date.parse(String(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? ""))
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
    })

  return sorted[0] ?? null
}

function addDays(baseDate: string, daysToAdd: number): string {
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return baseDate
  const next = new Date(date)
  next.setDate(next.getDate() + Math.max(0, daysToAdd))
  return next.toISOString().split("T")[0]
}

function getActiveMilestoneTemplate(templates: MilestoneTemplate[]): MilestoneTemplate | null {
  if (!templates.length) return null
  return templates.find((t) => t.isActive) ?? templates[0]
}

const mapStudentMilestoneStatus = (status: string): Milestone["status"] => {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  if (normalized === "rejected") return "rejected"
  return "pending"
}

function toDisplayName(parts: Array<string | null | undefined>): string {
  const joined = parts.map((p) => (p ?? "").trim()).filter(Boolean).join(" ")
  return joined
}

function mapProjectStatus(status: string | null | undefined): ProjectData["status"] {
  const normalized = String(status ?? "").trim().toLowerCase()

  if (normalized === "completed" || normalized === "done" || normalized === "finished") {
    return "completed"
  }

  if (
    normalized === "active" ||
    normalized === "in-progress" ||
    normalized === "in progress" ||
    normalized === "ongoing"
  ) {
    return "in-progress"
  }

  return "pending"
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

function MyProjectHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your project details, milestones, and submissions
        </p>
      </div>
    </div>
  )
}

export function StudentMyProjectPage() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null
  const { data: myGroupData } = useMyProjectGroup(Boolean(user))
  const myGroupProposalsQuery = useMyGroupProposals(Boolean(user))

  const departmentIdForProjects =
    departmentId ?? myGroupData?.departmentId ?? null

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })

  const activeTemplate = useMemo(() => {
    const templates = templatesData?.templates ?? []
    return getActiveMilestoneTemplate(templates)
  }, [templatesData?.templates])

  const { data: projectsData } = useStudentProjects({
    departmentId: departmentIdForProjects,
    studentId,
  })

  const activeProject = useMemo(() => {
    const items = projectsData?.items ?? []
    if (!items.length) return null

    return (
      items.find((project) => project.status.toLowerCase() === "in-progress") ??
      items.find((project) => project.status.toLowerCase() === "active") ??
      items[0]
    )
  }, [projectsData?.items])

  const resolvedProjectId =
    activeProject?.id ?? myGroupData?.projectId ?? null

  const { data: projectMilestonesData } = useProjectMilestones({
    projectId: resolvedProjectId,
    enabled: Boolean(resolvedProjectId),
  })

  const projectDetailsQuery = useProjectDetails({
    projectId: resolvedProjectId,
    enabled: Boolean(resolvedProjectId),
  })

  const projectCreatedAt = useMemo(() => {
    return projectDetailsQuery.data?.createdAt?.trim() ?? ""
  }, [projectDetailsQuery.data?.createdAt])

  const milestoneBaseDate = useMemo(() => {
    if (projectCreatedAt) return projectCreatedAt
    if (activeTemplate?.createdAt) return activeTemplate.createdAt
    return new Date().toISOString()
  }, [activeTemplate?.createdAt, projectCreatedAt])

  const templateMilestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    const activeTemplate = getActiveMilestoneTemplate(templates)
    if (!activeTemplate?.milestones?.length) return []

    const baseDate = milestoneBaseDate

    let cumulativeDays = 0
    return activeTemplate.milestones
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((milestone) => {
        cumulativeDays += Math.max(0, milestone.defaultDurationDays ?? 0)
        return {
          id: `${activeTemplate.templateId}:${milestone.sequence}`,
          name: milestone.title,
          dueDate: addDays(baseDate, cumulativeDays),
          status: "pending" as const,
          description: milestone.description ?? undefined,
          sequence: milestone.sequence,
        }
      })
  }, [milestoneBaseDate, templatesData?.templates])

  const mergedBackendMilestones = useMemo<Milestone[]>(() => {
    const proposalStatus = toProposalMilestoneStatus(myGroupProposalsQuery.data)

    const projectMilestonesByName = new Map(
      (projectMilestonesData?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    const fromProjectOnly = (projectMilestonesData?.items ?? [])
      .map((milestone) => ({
        id: milestone.id,
        name: milestone.title,
        dueDate: milestone.dueDate,
        status: mapStudentMilestoneStatus(milestone.status),
        submittedAt: milestone.submittedAt ?? undefined,
        description: milestone.description ?? undefined,
        sequence: undefined,
      }))
      .filter((milestone) => milestone.name.trim().length > 0)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    if (!templateMilestones.length) {
      if (!proposalStatus) return fromProjectOnly
      return fromProjectOnly.map((milestone) =>
        isProposalMilestoneName(milestone.name) ? { ...milestone, status: proposalStatus } : milestone
      )
    }

    const merged = templateMilestones.map((templateMilestone) => {
      const matchedProjectMilestone = projectMilestonesByName.get(
        normalizeMilestoneName(templateMilestone.name)
      )

      if (!matchedProjectMilestone) return templateMilestone

      return {
        ...templateMilestone,
        id: matchedProjectMilestone.id,
        dueDate: matchedProjectMilestone.dueDate,
        status: mapStudentMilestoneStatus(matchedProjectMilestone.status),
        submittedAt: matchedProjectMilestone.submittedAt ?? undefined,
      }
    })

    if (!proposalStatus) return merged
    return merged.map((milestone) => {
      if (!isProposalMilestoneName(milestone.name)) return milestone
      return { ...milestone, status: proposalStatus }
    })
  }, [myGroupProposalsQuery.data, projectMilestonesData?.items, templateMilestones])

  const myProject = useMemo<ProjectData>(() => {
    const latestProposal = getLatestProposal(myGroupProposalsQuery.data)

    const advisor = projectDetailsQuery.data?.advisor
    const advisorName = advisor
      ? toDisplayName([advisor.firstName, advisor.lastName]) || advisor.email?.trim() || "—"
      : latestProposal?.advisor
          ? toDisplayName([
              latestProposal.advisor.firstName,
              latestProposal.advisor.lastName,
            ]) || latestProposal.advisor.email?.trim() || "—"
          : "—"

    const milestones = mergedBackendMilestones

    const completedMilestonesCount = milestones.filter(
      (milestone) => milestone.status === "approved"
    ).length

    const progress = milestones.length
      ? Math.round((completedMilestonesCount / milestones.length) * 100)
      : 0

    const backendGroupName = myGroupData?.name?.trim() ?? ""

    return {
      title:
        projectDetailsQuery.data?.title?.trim() ||
        activeProject?.title?.trim() ||
        latestProposal?.title?.trim() ||
        latestProposal?.titles?.[0]?.trim() ||
        latestProposal?.proposedTitles?.[0]?.trim() ||
        "My Project",
      groupName: backendGroupName || "—",
      status: mapProjectStatus(projectDetailsQuery.data?.status || activeProject?.status),
      advisorName,
      progress,
      startDate: projectCreatedAt || milestoneBaseDate,
      milestones,
      description: projectDetailsQuery.data?.description ?? undefined,
    }
  }, [
    activeProject?.status,
    activeProject?.title,
    mergedBackendMilestones,
    myGroupData?.name,
    myGroupData?.projectId,
    myGroupProposalsQuery.data,
    projectDetailsQuery.data?.advisor,
    projectDetailsQuery.data?.description,
    projectDetailsQuery.data?.status,
    projectDetailsQuery.data?.title,
    milestoneBaseDate,
    projectCreatedAt,
  ])

  const headerTitle = myProject.title?.trim() ? myProject.title : "My Project"

  // Ensure we have valid project data
  if (!myProject || !myProject.milestones || myProject.milestones.length === 0) {
    return (
      <div className="space-y-6 w-full">
        <MyProjectHeader title={headerTitle} />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No project data available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedMilestones = myProject.milestones.filter(
    (m) => m.status === "approved"
  ).length
  const totalMilestones = myProject.milestones.length

  return (
    <div className="space-y-6 w-full">
      <MyProjectHeader title={headerTitle} />

      {/* Project Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-display">{myProject.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{myProject.groupName}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>
                      {completedMilestones}/{totalMilestones} milestones completed
                    </span>
                  </span>
                </div>
              </CardDescription>
            </div>
            <StatusBadge status={myProject.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">Advisor</p>
                  <p className="text-muted-foreground text-sm">{myProject.advisorName}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">Overall Progress</h3>
                  <span className="text-sm font-medium">{myProject.progress}%</span>
                </div>
                <Progress value={myProject.progress} className="h-3" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Started</p>
                  <p className="font-medium text-sm">{formatDate(myProject.startDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl">Project Milestones</CardTitle>
              <CardDescription className="mt-1">
                Track your progress and submit deliverables for each milestone
                {activeTemplate ? (
                  <span className="block mt-1">
                    Template: {activeTemplate.name} • {activeTemplate.isActive ? "Active" : "Inactive"} • Created {formatDate(activeTemplate.createdAt)}
                  </span>
                ) : null}
                {myProject.milestones.length ? (
                  <span className="block mt-1">
                    Sequences:{" "}
                    {myProject.milestones
                      .slice()
                      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                      .map((m, idx) => m.sequence ?? idx + 1)
                      .join(" • ")}
                  </span>
                ) : null}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myProject.milestones.map((milestone, index) => {
              const daysUntilDue = getDaysUntilDue(milestone.dueDate)
              const isOverdue = daysUntilDue < 0 && milestone.status === "pending"
              const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0 && milestone.status === "pending"

              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    milestone.status === "approved"
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : milestone.status === "submitted"
                        ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
                        : "bg-muted/30 border-border hover:border-primary/50",
                    isOverdue && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      milestone.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : milestone.status === "submitted"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {milestone.status === "approved" ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold text-base">{milestone.sequence ?? index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{milestone.name}</p>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {milestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Due: {formatDate(milestone.dueDate)}
                          </span>
                          {milestone.submittedAt && (
                            <span className="text-xs text-muted-foreground">
                              Submitted: {formatDate(milestone.submittedAt)}
                            </span>
                          )}
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Overdue by {Math.abs(daysUntilDue)} days
                            </span>
                          )}
                          {isDueSoon && !isOverdue && (
                            <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Due in {daysUntilDue} days
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={milestone.status} />
                    {milestone.status === "submitted" && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
