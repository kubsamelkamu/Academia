"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useDepartmentAnnouncements } from "@/lib/hooks/use-department-announcements"
import { useMyGroupProjectProposals } from "@/lib/hooks/use-project-proposals"
import { useProject } from "@/lib/hooks/use-projects"
import type { MilestoneTemplate } from "@/types/milestone-templates"
import type { ProjectProposal } from "@/types/project-proposals"
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Users,
} from "lucide-react"

interface Milestone {
  id: string
  name: string
  status: "pending" | "submitted" | "approved" | "overdue" | "rejected"
  dueDate: string
  sequence?: number
}

interface GradeSummary {
  advisorScore: number
  evaluatorScores: number[]
  finalScore: number
  grade: string
  status: "final" | "provisional" | "pending"
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  isManager?: boolean
}

interface StudentProjectOverview {
  title: string
  advisorName: string
  progress: number
  milestones: Milestone[]
  nextDeadlineLabel: string
  nextDeadlineDays: number
}

interface StudentDashboardData {
  project: StudentProjectOverview
  grade: GradeSummary | null
}

function useLiveTime(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function mapMilestoneStatus(status: string): Milestone["status"] {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  if (normalized === "rejected") return "rejected"
  if (normalized === "overdue") return "overdue"
  return "pending"
}

function normalizeMilestoneName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

function isProposalRelatedMilestoneName(name: string): boolean {
  const normalized = normalizeMilestoneName(name)
  if (normalized.includes("proposal")) return true
  if (normalized === "project title" || normalized.includes("project title")) return true
  return false
}

function getLatestProposal(proposals: ProjectProposal[] | undefined): ProjectProposal | null {
  const items = proposals ?? []
  if (!items.length) return null

  return (
    items
      .slice()
      .sort((a, b) => {
        const aTime = Date.parse(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? "")
        const bTime = Date.parse(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? "")
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
      })[0] ?? null
  )
}

function mapProposalStatusToDashboardMilestoneStatus(status: unknown): Milestone["status"] {
  const normalized = String(status ?? "").trim().toUpperCase()
  if (normalized === "APPROVED") return "approved"
  if (normalized === "SUBMITTED") return "submitted"
  if (normalized === "REJECTED") return "rejected"
  return "pending"
}

function mergeProposalDashboardMilestoneStatus(
  backendStatus: Milestone["status"],
  proposalStatus: Milestone["status"]
): Milestone["status"] {
  if (proposalStatus === "pending") return backendStatus
  if (backendStatus === "pending") return proposalStatus
  if (proposalStatus === "approved" && backendStatus === "submitted") return "approved"
  if (proposalStatus === "rejected" && backendStatus !== "approved") return "rejected"
  return backendStatus
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

function getAnnouncementActionLabel(
  actionType: string | null | undefined,
  actionLabel: string | null | undefined
): string {
  if (actionLabel?.trim()) return actionLabel.trim()

  switch (actionType) {
    case "FORM_PROJECT_GROUP":
      return "Form Group"
    case "SUBMIT_PROPOSAL":
      return "Submit Proposal"
    case "UPLOAD_DOCUMENT":
      return "Upload Document"
    case "REGISTER_PRESENTATION":
      return "Register Presentation"
    default:
      return "Open Announcement"
  }
}

type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function toCountdownParts(totalSeconds: number | null): CountdownParts | null {
  if (totalSeconds === null || totalSeconds <= 0) return null

  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

function formatCountdown(parts: CountdownParts): string {
  return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${String(parts.seconds).padStart(2, "0")}s`
}

function formatActionTypeLabel(actionType: string | null | undefined): string {
  if (!actionType?.trim()) return "CUSTOM_ACTION"
  return actionType
    .trim()
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function getMeaningfulText(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return ""
  if (trimmed.toLowerCase() === "string") return ""
  return trimmed
}

function formatProjectStatusLabel(status: string | null | undefined): string {
  const raw = String(status ?? "").trim()
  if (!raw) return "No Project"

  const normalized = raw.toUpperCase().replace(/\s+/g, "_")
  if (normalized === "ACTIVE") return "Active"
  if (normalized === "IN_PROGRESS" || normalized === "IN-PROGRESS") return "In Progress"
  if (normalized === "COMPLETED") return "Completed"
  if (normalized === "PENDING") return "Pending"
  if (normalized === "DRAFT") return "Draft"
  return raw
}

function buildEmptyDashboardData(): StudentDashboardData {
  return {
    project: {
      title: "",
      advisorName: "",
      progress: 0,
      milestones: [],
      nextDeadlineLabel: "",
      nextDeadlineDays: 0,
    },
    grade: null,
  }
}

interface StudentDashboardProps {
  userName?: string
}

export function StudentDashboard({ userName }: StudentDashboardProps = {}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken))

  const groupProposalsQuery = useMyGroupProjectProposals(Boolean(accessToken))
  const latestGroupProposal = useMemo(
    () => getLatestProposal(groupProposalsQuery.data),
    [groupProposalsQuery.data]
  )

  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null

  const { data: projectsData } = useStudentProjects({
    departmentId,
    studentId,
  })

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 20,
    isActive: true,
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

  const projectDetailsQuery = useProject(
    activeProject?.id ?? null,
    Boolean(accessToken) && Boolean(activeProject?.id)
  )

  const { data: milestonesData } = useProjectMilestones({
    projectId: activeProject?.id,
    enabled: Boolean(activeProject?.id),
  })

  const departmentAnnouncementsQuery = useDepartmentAnnouncements({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    page: 1,
    limit: 20,
    refetchIntervalMs: 60_000,
  })

  const backendMilestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    const activeTemplate = getActiveMilestoneTemplate(templates)

    const proposalMilestoneStatus = mapProposalStatusToDashboardMilestoneStatus(latestGroupProposal?.status)

    const templateMilestones: Milestone[] = (() => {
      if (!activeTemplate?.milestones?.length) return []

      const baseDate = activeTemplate.createdAt
      let cumulativeDays = 0
      return activeTemplate.milestones
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .map((milestone) => {
          cumulativeDays += Math.max(0, milestone.defaultDurationDays ?? 0)
          return {
            id: `${activeTemplate.templateId}:${milestone.sequence}`,
            name: milestone.title,
            status: "pending" as const,
            dueDate: addDays(baseDate, cumulativeDays),
            sequence: milestone.sequence,
          }
        })
    })()

    const projectMilestonesByName = new Map(
      (milestonesData?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    if (templateMilestones.length) {
      return templateMilestones.map((templateMilestone) => {
        const matchedProjectMilestone = projectMilestonesByName.get(
          normalizeMilestoneName(templateMilestone.name)
        )

        const isProposalRelated = isProposalRelatedMilestoneName(templateMilestone.name)

        if (!matchedProjectMilestone) {
          if (!isProposalRelated || proposalMilestoneStatus === "pending") return templateMilestone
          return {
            ...templateMilestone,
            status: proposalMilestoneStatus,
          }
        }

        const backendStatus = mapMilestoneStatus(matchedProjectMilestone.status)
        const resolvedStatus =
          isProposalRelated
            ? mergeProposalDashboardMilestoneStatus(backendStatus, proposalMilestoneStatus)
            : backendStatus

        return {
          id: matchedProjectMilestone.id,
          name: templateMilestone.name,
          status: resolvedStatus,
          dueDate: matchedProjectMilestone.dueDate,
          sequence: templateMilestone.sequence,
        }
      })
    }

    return (milestonesData?.items ?? [])
      .map((milestone) => ({
        id: milestone.id,
        name: milestone.title,
        status: mapMilestoneStatus(milestone.status),
        dueDate: milestone.dueDate,
        sequence: undefined,
      }))
      .filter((milestone) => {
        const dueDate = new Date(milestone.dueDate)
        return milestone.name.trim().length > 0 && !Number.isNaN(dueDate.getTime())
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [latestGroupProposal?.status, milestonesData?.items, templatesData?.templates])

  const data = useMemo(() => {
    const emptyData = buildEmptyDashboardData()
    if (!backendMilestones.length) return emptyData

    const now = new Date()
    const completedCount = backendMilestones.filter((milestone) => milestone.status === "approved").length
    const progress = Math.round((completedCount / backendMilestones.length) * 100)

    const upcomingMilestone =
      backendMilestones.find((milestone) => milestone.status === "rejected") ??
      backendMilestones.find((milestone) => milestone.status === "pending" || milestone.status === "submitted") ??
      backendMilestones[backendMilestones.length - 1]

    const nextDeadlineDays = Math.max(
      0,
      Math.ceil((new Date(upcomingMilestone.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )

    return {
      ...emptyData,
      project: {
        ...emptyData.project,
        progress,
        milestones: backendMilestones,
        nextDeadlineLabel: upcomingMilestone.name,
        nextDeadlineDays,
      },
    }
  }, [backendMilestones])

  const activeTemplate = useMemo(() => {
    const templates = templatesData?.templates ?? []
    return getActiveMilestoneTemplate(templates)
  }, [templatesData?.templates])

  const nextMilestone = useMemo(() => {
    const items = backendMilestones
    if (!items.length) return null

    const sorted = items.slice().sort((a, b) => {
      const aSeq = typeof a.sequence === "number" ? a.sequence : Number.POSITIVE_INFINITY
      const bSeq = typeof b.sequence === "number" ? b.sequence : Number.POSITIVE_INFINITY
      if (aSeq !== bSeq) return aSeq - bSeq

      const aDue = Date.parse(a.dueDate ?? "")
      const bDue = Date.parse(b.dueDate ?? "")
      const aDueMs = Number.isFinite(aDue) ? aDue : Number.POSITIVE_INFINITY
      const bDueMs = Number.isFinite(bDue) ? bDue : Number.POSITIVE_INFINITY
      if (aDueMs !== bDueMs) return aDueMs - bDueMs

      return a.name.localeCompare(b.name)
    })

    return (
      sorted.find((milestone) => milestone.status === "rejected") ??
      sorted.find((milestone) => milestone.status === "pending" || milestone.status === "submitted") ??
      sorted[sorted.length - 1] ??
      null
    )
  }, [backendMilestones])

  const myUserId = user?.id ? String(user.id) : null
  const myGroup = myProjectGroupQuery.data ?? null
  const groupDisplayName = myGroup?.name?.trim() || ""
  const projectTitle = activeProject?.title?.trim() || "My Project"
  const projectStatusLabel = activeProject ? formatProjectStatusLabel(activeProject.status) : "No Project"

  const advisorProfile = projectDetailsQuery.data?.advisor ?? null
  const advisorDisplayName = advisorProfile
    ? `${advisorProfile.firstName ?? ""} ${advisorProfile.lastName ?? ""}`.trim() || advisorProfile.email || ""
    : ""
  const advisorEmail = advisorProfile?.email ?? ""
  const nextDeadlineAnnouncement = useMemo(() => {
    const items = departmentAnnouncementsQuery.data?.items ?? []
    const nowMs = Date.now()
    const withDeadline = items
      .filter((item) => item.deadlineAt)
      .filter((item) => {
        if (item.isExpired) return false

        if (typeof item.secondsRemaining === "number") {
          return item.secondsRemaining > 0
        }

        const deadlineMs = Date.parse(item.deadlineAt ?? "")
        if (!Number.isFinite(deadlineMs)) return false
        return deadlineMs > nowMs
      })
    if (!withDeadline.length) return null

    return withDeadline
      .slice()
      .sort((a, b) => {
        const aSeconds = typeof a.secondsRemaining === "number" ? a.secondsRemaining : Number.POSITIVE_INFINITY
        const bSeconds = typeof b.secondsRemaining === "number" ? b.secondsRemaining : Number.POSITIVE_INFINITY
        if (aSeconds !== bSeconds) return aSeconds - bSeconds

        const aDeadline = new Date(a.deadlineAt ?? "").getTime()
        const bDeadline = new Date(b.deadlineAt ?? "").getTime()
        return aDeadline - bDeadline
      })[0]
  }, [departmentAnnouncementsQuery.data?.items])

  const [uiSecondsRemaining, setUiSecondsRemaining] = useState<number | null>(null)

  useEffect(() => {
    setUiSecondsRemaining(nextDeadlineAnnouncement?.secondsRemaining ?? null)
  }, [nextDeadlineAnnouncement?.id, nextDeadlineAnnouncement?.secondsRemaining])

  useEffect(() => {
    if (uiSecondsRemaining === null || uiSecondsRemaining <= 0) return

    const timerId = window.setInterval(() => {
      setUiSecondsRemaining((prev) => {
        if (prev === null || prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [uiSecondsRemaining])

  const countdownParts = toCountdownParts(uiSecondsRemaining)
  const isAnnouncementDeadlinePassed =
    Boolean(nextDeadlineAnnouncement?.isExpired) ||
    (uiSecondsRemaining !== null && uiSecondsRemaining <= 0)

  const activeDeadlineAnnouncement = isAnnouncementDeadlinePassed
    ? null
    : nextDeadlineAnnouncement

  const isAnnouncementDisabled =
    Boolean(activeDeadlineAnnouncement?.isDisabled)

  const isCriticalWindow =
    uiSecondsRemaining !== null && uiSecondsRemaining > 0 && uiSecondsRemaining <= 3_600
  const isWarningWindow =
    uiSecondsRemaining !== null && uiSecondsRemaining > 3_600 && uiSecondsRemaining <= 86_400

  const countdownToneClass = isAnnouncementDeadlinePassed
    ? "border-destructive/40 bg-destructive/5"
    : isCriticalWindow
      ? "border-destructive/30 bg-destructive/5"
      : isWarningWindow
        ? "border-yellow-500/30 bg-yellow-500/10"
        : "border-primary/20 bg-primary/5"

  const announcementTitle = getMeaningfulText(activeDeadlineAnnouncement?.title)
  const actionTypeLabel = activeDeadlineAnnouncement
    ? formatActionTypeLabel(activeDeadlineAnnouncement.actionType)
    : ""

  const nextDeadlineTitle = announcementTitle || actionTypeLabel || "No active deadline"
  const nextDeadlineDueText = activeDeadlineAnnouncement
    ? countdownParts
      ? `${formatCountdown(countdownParts)} remaining`
      : "No deadline"
    : "No deadline"

  const nextDeadlineSummary = getMeaningfulText(activeDeadlineAnnouncement?.message)

  const nextDeadlineActionTitle = activeDeadlineAnnouncement
    ? getMeaningfulText(
        getAnnouncementActionLabel(
          activeDeadlineAnnouncement.actionType,
          activeDeadlineAnnouncement.actionLabel
        )
      ) ||
      getAnnouncementActionLabel(
        activeDeadlineAnnouncement.actionType,
        activeDeadlineAnnouncement.actionLabel
      )
    : ""

  const shouldShowTypeBadge = Boolean(
    actionTypeLabel && actionTypeLabel.toLowerCase() !== nextDeadlineTitle.toLowerCase()
  )

  const announcementCreator = activeDeadlineAnnouncement?.createdBy
  const creatorName =
    `${announcementCreator?.firstName ?? ""} ${announcementCreator?.lastName ?? ""}`.trim() ||
    ""

  const secondaryCardText = activeDeadlineAnnouncement?.deadlineAt
    ? `Deadline set for ${formatDate(activeDeadlineAnnouncement.deadlineAt)}.`
    : ""

  const hasActionUrl = Boolean(activeDeadlineAnnouncement?.actionUrl?.trim())

  const myTeamMembers: TeamMember[] = myGroup
    ? [
        {
          id: myGroup.leader.id,
          name:
            `${myGroup.leader.firstName ?? ""} ${myGroup.leader.lastName ?? ""}`.trim() ||
            myGroup.leader.email,
          email: myGroup.leader.email,
          avatarUrl: myGroup.leader.avatarUrl,
          isManager: true,
        },
        ...(myGroup.members ?? []).map((member) => ({
          id: member.user.id,
          name:
            `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
        })),
      ]
    : []

  const welcomeTitle =
    userName && userName.trim().length > 0 ? `Welcome, ${userName.trim()}` : "Welcome"

  const now = useLiveTime(1000)
  const timeString = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
    [now]
  )

  const existingProjectMilestones = milestonesData?.items ?? []
  const completedMilestones = existingProjectMilestones.length
    ? existingProjectMilestones.filter((milestone) => {
        const status = milestone.status.toLowerCase()
        return status === "approved"
      }).length
    : backendMilestones.filter((m) => m.status === "approved").length
  const totalMilestones = existingProjectMilestones.length || backendMilestones.length

  const evaluatorAverage =
    data.grade && data.grade.evaluatorScores.length > 0
      ? data.grade.evaluatorScores.reduce((sum, n) => sum + n, 0) /
        data.grade.evaluatorScores.length
      : null

  const handleViewProject = () => {
    toast.message("Tip", {
      description:
        "Open the My Project section from the left sidebar to see full project details and submissions.",
    })
  }

  const handleFileConcern = () => {
    toast.warning("Grade concern submitted", {
      description: "Your coordinator will review your concern and get back to you.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {welcomeTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your project progress, team activity, and evaluation status in one place.
          </p>
        </div>
        <div className="mt-1 sm:mt-0 flex items-center text-sm text-muted-foreground">
          <span className="tabular-nums font-medium" aria-live="polite">
            {timeString}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold truncate">
              {projectStatusLabel}
            </p>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {projectTitle}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{backendMilestones.length ? `${data.project.progress}%` : "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {completedMilestones}/{totalMilestones}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Grade</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {data.grade ? data.grade.grade : "Pending"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.grade ? `${data.grade.finalScore}% overall` : "Not published yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Project Snapshot */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {projectTitle}
              </CardTitle>
              <CardDescription>
                {groupDisplayName ? (
                  <span>
                    Group: <span className="font-medium">{groupDisplayName}</span>
                  </span>
                ) : (
                  <span>
                    Advisor: <span className="font-medium">—</span>
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/student/milestones">View milestones</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewProject}>
                View full project
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Advisor</p>
              {projectDetailsQuery.isLoading ? (
                <p className="mt-1 text-sm text-muted-foreground">Loading advisor…</p>
              ) : projectDetailsQuery.isError ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Unable to load advisor details.
                </p>
              ) : advisorProfile ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10">
                      {advisorProfile.avatarUrl ? (
                        <AvatarImage
                          src={advisorProfile.avatarUrl}
                          alt={advisorDisplayName || advisorEmail || "Advisor"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {(advisorDisplayName || advisorEmail || "A").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {advisorDisplayName || "Advisor"}
                      </p>
                      {advisorEmail ? (
                        <a
                          href={`mailto:${advisorEmail}`}
                          className="text-xs text-muted-foreground hover:underline underline-offset-4 transition-colors"
                        >
                          {advisorEmail}
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">Email not available</p>
                      )}
                    </div>
                  </div>

                  {advisorEmail ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={`mailto:${advisorEmail}`}>Email</a>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Advisor not assigned yet.</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">Active template</p>
                <p className="mt-1 text-sm font-semibold">
                  {activeTemplate ? activeTemplate.name : "No template"}
                </p>
                {activeTemplate ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeTemplate.isActive ? "Active" : "Inactive"} • Created {formatDate(activeTemplate.createdAt)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your department has not published milestone templates yet.
                  </p>
                )}
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">Next milestone</p>
                <p className="mt-1 text-sm font-semibold">
                  {nextMilestone ? nextMilestone.name : "No milestones"}
                </p>
                {nextMilestone ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {formatDate(nextMilestone.dueDate)} • Status {nextMilestone.status}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create a project to see milestone deadlines.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Overall progress</span>
                <span className="font-medium">
                  {backendMilestones.length ? `${data.project.progress}%` : "—"}
                </span>
              </div>
              <Progress value={data.project.progress} className="h-2" />
            </div>

            <div className="space-y-2">
              {backendMilestones.length ? backendMilestones.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                    "hover:bg-muted/40",
                    m.status === "approved"
                      ? "bg-primary/5 border-primary/20"
                      : m.status === "submitted"
                        ? "bg-secondary/30 border-secondary/40"
                        : m.status === "rejected" || m.status === "overdue"
                          ? "bg-destructive/5 border-destructive/30"
                          : "bg-muted/20 border-border hover:border-primary/30"
                  )}
                >
                  <div className="space-y-1">
                    <p className="font-medium leading-tight">
                      {typeof m.sequence === "number" ? `${m.sequence}. ${m.name}` : m.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(m.dueDate)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      m.status === "approved"
                        ? "default"
                        : m.status === "submitted"
                          ? "secondary"
                          : m.status === "overdue" || m.status === "rejected"
                            ? "destructive"
                            : "outline"
                    }
                    className={
                      `capitalize cursor-default select-none transition-colors ` +
                      (m.status === "approved"
                        ? "hover:bg-primary/90"
                        : m.status === "submitted"
                          ? "hover:bg-secondary/90"
                          : m.status === "overdue" || m.status === "rejected"
                            ? "hover:bg-destructive/90"
                            : "hover:bg-accent hover:text-accent-foreground")
                    }
                  >
                    {m.status === "rejected" ? "Rejected" : m.status}
                  </Badge>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm font-medium">No milestones yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Once your project and department template are set, milestones will appear here.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Items / Next Deadline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Next Deadline</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              {nextDeadlineTitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentAnnouncementsQuery.isLoading ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">Loading deadline...</p>
              </div>
            ) : !activeDeadlineAnnouncement ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm font-medium">No active deadline</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No department announcement with a deadline is available right now.
                </p>
              </div>
            ) : (
              <>
                <div className={`rounded-lg border p-4 ${countdownToneClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{nextDeadlineDueText}</p>
                    {shouldShowTypeBadge ? (
                      <Badge variant={isAnnouncementDeadlinePassed ? "destructive" : "secondary"}>
                        {actionTypeLabel}
                      </Badge>
                    ) : null}
                  </div>
                  {nextDeadlineSummary ? (
                    <p className="mt-2 text-xs text-muted-foreground">{nextDeadlineSummary}</p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    {nextDeadlineActionTitle ? (
                      <p className="text-sm font-medium">{nextDeadlineActionTitle}</p>
                    ) : null}
                    {creatorName ? (
                      <p className="mt-1 text-xs text-muted-foreground">Announcement by {creatorName}</p>
                    ) : null}
                    {secondaryCardText ? (
                      <p className="mt-1 text-xs text-muted-foreground">{secondaryCardText}</p>
                    ) : null}
                  </div>

                  {hasActionUrl ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isAnnouncementDisabled}
                      onClick={() => {
                        const target = activeDeadlineAnnouncement.actionUrl
                        if (!target) return
                        window.open(target, "_blank", "noopener,noreferrer")
                      }}
                    >
                      {nextDeadlineActionTitle}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team & Grades */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Team */}
        <Link
          href="/dashboard/student/team"
          className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open Team page"
        >
          <Card className="cursor-pointer transition-colors hover:bg-muted/30 hover:border-muted-foreground/20 hover:opacity-95">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="group-hover:underline underline-offset-4">My Team</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {myProjectGroupQuery.isLoading ? "…" : `${myTeamMembers.length} members`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myProjectGroupQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading your team…</p>
              ) : myProjectGroupQuery.isError ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Unable to load your team right now.
                </p>
              ) : myGroup ? (
                myTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        {member.avatarUrl ? (
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.name || member.email}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {(member.name || member.email || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-tight truncate">
                            {member.name}
                          </p>
                          {myUserId && member.id === myUserId ? (
                            <Badge variant="outline" className="text-[11px]">
                              You
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member.isManager && (
                      <Badge variant="secondary" className="text-[11px]">
                        Group Manager
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  You are not in a project group yet.
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>My Grades</span>
              {data.grade ? (
                <Badge
                  variant={
                    data.grade.status === "provisional"
                      ? "secondary"
                      : data.grade.status === "final"
                        ? "default"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {data.grade.status}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.grade ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Advisor score</p>
                    <p className="mt-1 text-xl font-semibold">
                      {data.grade.advisorScore}/40
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Evaluators avg.</p>
                    <p className="mt-1 text-xl font-semibold">
                      {evaluatorAverage != null
                        ? `${evaluatorAverage.toFixed(1)}/40`
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">Final score</p>
                    <p className="mt-1 text-xl font-semibold text-primary">
                      {data.grade.finalScore}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="text-xs text-muted-foreground">Grade</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {data.grade.grade}
                    </p>
                  </div>
                </div>

                {data.grade.status === "provisional" && (
                  <Button
                    variant="outline"
                    className="mt-1 w-full text-xs sm:text-sm"
                    onClick={handleFileConcern}
                  >
                    Raise a concern about this grade
                  </Button>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Grades are not yet published for this cycle.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

