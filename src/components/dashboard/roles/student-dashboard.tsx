"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useMyGroupAnnouncements, useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useMyGroupProposals } from "@/lib/hooks/use-project-proposals"
import { useProjectDetails } from "@/lib/hooks/use-projects"
import type { ProjectDetail } from "@/types/projects"
import {
  addDays,
  getActiveMilestoneTemplate,
  getLatestLinkedProposal,
  getLatestProposal,
  isProposalMilestoneName,
  normalizeMilestoneName,
  toProposalMilestoneState,
} from "@/lib/student-milestone-helpers"
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
  status: "pending" | "submitted" | "approved" | "overdue"
  dueDate: string
  sequence?: number
}

type CapstoneGradeSlice = {
  letter: string | null
  percent: number | null
}

interface GradeSummary {
  advisorScore: number
  evaluatorScores: number[]
  finalScore: number
  grade: string
  status: "final" | "provisional" | "pending"
  capstone1: CapstoneGradeSlice
  capstone2: CapstoneGradeSlice
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
  if (normalized === "overdue" || normalized === "rejected") return "overdue"
  return "pending"
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

function getMeaningfulText(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return ""
  if (trimmed.toLowerCase() === "string") return ""
  return trimmed
}

function toDisplayName(parts: Array<string | null | undefined>): string {
  const joined = parts.map((p) => (p ?? "").trim()).filter(Boolean).join(" ")
  return joined
}

function formatProjectStatusLabel(status: string | null | undefined): string {
  const normalized = String(status ?? "").trim().toLowerCase()
  if (!normalized) return "In Progress"
  if (normalized === "active" || normalized === "in-progress" || normalized === "in progress") {
    return "In Progress"
  }
  if (normalized === "draft") return "Draft"
  if (normalized === "submitted") return "Submitted"
  if (normalized === "approved") return "Approved"
  if (normalized === "rejected") return "Rejected"
  if (normalized === "completed" || normalized === "done" || normalized === "finished") {
    return "Completed"
  }
  if (normalized === "pending") return "Pending"
  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
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

function formatCapstoneGradeLine(slice: CapstoneGradeSlice | undefined): string {
  if (!slice) return "—"
  const { letter, percent } = slice
  if (letter?.trim() && percent != null && !Number.isNaN(percent)) {
    return `${letter.trim()} (${Math.round(percent)}%)`
  }
  if (letter?.trim()) return letter.trim()
  if (percent != null && !Number.isNaN(percent)) return `${Math.round(percent)}%`
  return "—"
}

function buildGradeSummaryFromProject(pd: ProjectDetail | null | undefined): GradeSummary | null {
  if (!pd) return null

  const capstone1: CapstoneGradeSlice = {
    letter: pd.capstone1Grade?.trim() ? pd.capstone1Grade.trim() : null,
    percent:
      pd.capstone1FinalScore != null && !Number.isNaN(Number(pd.capstone1FinalScore))
        ? Number(pd.capstone1FinalScore)
        : null,
  }
  const capstone2: CapstoneGradeSlice = {
    letter: pd.capstone2Grade?.trim() ? pd.capstone2Grade.trim() : null,
    percent:
      pd.capstone2FinalScore != null && !Number.isNaN(Number(pd.capstone2FinalScore))
        ? Number(pd.capstone2FinalScore)
        : null,
  }

  const hasCapstone =
    capstone1.letter != null ||
    capstone1.percent != null ||
    capstone2.letter != null ||
    capstone2.percent != null

  if (!hasCapstone) return null

  const percents = [capstone1.percent, capstone2.percent].filter(
    (n): n is number => n != null && !Number.isNaN(n)
  )
  const finalScore =
    percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0

  return {
    advisorScore: 0,
    evaluatorScores: [],
    finalScore,
    grade: "—",
    status: "pending",
    capstone1,
    capstone2,
  }
}

interface StudentDashboardProps {
  userName?: string
}

export function StudentDashboard({ userName }: StudentDashboardProps = {}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const myProjectGroupQuery = useMyProjectGroup(Boolean(user))
  const myGroupProposalsQuery = useMyGroupProposals(Boolean(user))

  const myGroup = myProjectGroupQuery.data ?? null

  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null

  const departmentIdForProjects =
    departmentId ?? myGroup?.departmentId ?? null

  const { data: projectsData } = useStudentProjects({
    departmentId: departmentIdForProjects,
    studentId,
  })

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })

  const latestLinkedProposal = useMemo(
    () => getLatestLinkedProposal(myGroupProposalsQuery.data),
    [myGroupProposalsQuery.data]
  )

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
    latestLinkedProposal?.project?.id?.trim() || activeProject?.id || myGroup?.projectId || null

  const { data: milestonesData } = useProjectMilestones({
    projectId: resolvedProjectId,
    enabled: Boolean(resolvedProjectId),
  })

  const projectDetailsQuery = useProjectDetails({
    projectId: resolvedProjectId,
    enabled: Boolean(resolvedProjectId),
  })

  const myGroupAnnouncementsQuery = useMyGroupAnnouncements({
    enabled: Boolean(accessToken),
    page: 1,
    limit: 20,
  })

  const backendMilestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    const activeTemplate = getActiveMilestoneTemplate(templates)
    const proposalStatus = toProposalMilestoneState(myGroupProposalsQuery.data)?.status ?? null

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

        const merged: Milestone = matchedProjectMilestone
          ? {
              id: matchedProjectMilestone.id,
              name: templateMilestone.name,
              status: mapMilestoneStatus(matchedProjectMilestone.status),
              dueDate: matchedProjectMilestone.dueDate,
              sequence: templateMilestone.sequence,
            }
          : templateMilestone

        if (!proposalStatus) return merged
        if (!isProposalMilestoneName(merged.name)) return merged
        return { ...merged, status: proposalStatus }
      })
    }

    const rawMilestones = (milestonesData?.items ?? [])
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

    if (!proposalStatus) return rawMilestones
    return rawMilestones.map((milestone) => {
      if (!isProposalMilestoneName(milestone.name)) return milestone
      return { ...milestone, status: proposalStatus }
    })
  }, [milestonesData?.items, myGroupProposalsQuery.data, templatesData?.templates])

  const gradeFromProject = useMemo(
    () => buildGradeSummaryFromProject(projectDetailsQuery.data ?? null),
    [projectDetailsQuery.data]
  )

  const data = useMemo(() => {
    const emptyData = buildEmptyDashboardData()
    const base: StudentDashboardData = {
      ...emptyData,
      grade: gradeFromProject,
    }

    if (!backendMilestones.length) return base

    const now = new Date()
    const completedCount = backendMilestones.filter(
      (milestone) => milestone.status === "approved"
    ).length
    const progress = Math.round((completedCount / backendMilestones.length) * 100)

    const upcomingMilestone =
      backendMilestones.find((milestone) => milestone.status === "pending" || milestone.status === "submitted") ??
      backendMilestones[backendMilestones.length - 1]

    const nextDeadlineDays = Math.max(
      0,
      Math.ceil((new Date(upcomingMilestone.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )

    return {
      ...base,
      project: {
        ...base.project,
        progress,
        milestones: backendMilestones,
        nextDeadlineLabel: upcomingMilestone.name,
        nextDeadlineDays,
      },
    }
  }, [backendMilestones, gradeFromProject])

  const activeTemplate = useMemo(() => {
    const templates = templatesData?.templates ?? []
    return getActiveMilestoneTemplate(templates)
  }, [templatesData?.templates])

  const nextMilestone = useMemo(() => {
    const items = backendMilestones
    if (!items.length) return null
    return (
      items.find((milestone) => milestone.status === "pending" || milestone.status === "submitted") ??
      items[items.length - 1] ??
      null
    )
  }, [backendMilestones])

  const myUserId = user?.id ? String(user.id) : null
  const projectDisplayName =
    projectDetailsQuery.data?.title?.trim() ||
    activeProject?.title?.trim() ||
    myGroup?.name?.trim() ||
    "My Project"

  const advisorDisplayName = useMemo(() => {
    const advisor = projectDetailsQuery.data?.advisor
    if (advisor) {
      const fullName = toDisplayName([advisor.firstName, advisor.lastName])
      return fullName || advisor.email?.trim() || "—"
    }

    const latestProposal = getLatestProposal(myGroupProposalsQuery.data)
    const proposalAdvisor = latestProposal?.advisor
    if (!proposalAdvisor) return "—"

    const proposalAdvisorName = toDisplayName([
      proposalAdvisor.firstName,
      proposalAdvisor.lastName,
    ])
    return proposalAdvisorName || proposalAdvisor.email?.trim() || "—"
  }, [myGroupProposalsQuery.data, projectDetailsQuery.data?.advisor])

  const projectStatusLabel = useMemo(() => {
    if (!activeProject) {
      if (myGroup?.status) return formatProjectStatusLabel(myGroup.status)
      return "No Project"
    }
    const backendStatus = projectDetailsQuery.data?.status
    return formatProjectStatusLabel(backendStatus || activeProject.status)
  }, [activeProject, activeProject?.status, myGroup?.status, projectDetailsQuery.data?.status])
  const nextDeadlineAnnouncement = useMemo(() => {
    const items = myGroupAnnouncementsQuery.data?.items ?? []
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now()

    const activeWithDeadline = items.filter((item) => {
      if (!item.deadlineAt) return false
      if (item.isExpired) return false
      if (typeof item.secondsRemaining === "number") return item.secondsRemaining > 0

      const deadlineMs = new Date(item.deadlineAt).getTime()
      if (Number.isNaN(deadlineMs)) return false
      return deadlineMs > nowMs
    })

    if (!activeWithDeadline.length) return null

    return activeWithDeadline
      .slice()
      .sort((a, b) => {
        const aSeconds =
          typeof a.secondsRemaining === "number"
            ? a.secondsRemaining
            : new Date(a.deadlineAt ?? "").getTime() - nowMs
        const bSeconds =
          typeof b.secondsRemaining === "number"
            ? b.secondsRemaining
            : new Date(b.deadlineAt ?? "").getTime() - nowMs

        if (aSeconds !== bSeconds) return aSeconds - bSeconds

        const aDeadline = new Date(a.deadlineAt ?? "").getTime()
        const bDeadline = new Date(b.deadlineAt ?? "").getTime()
        return aDeadline - bDeadline
      })[0]
  }, [myGroupAnnouncementsQuery.data?.items])

  const [uiSecondsRemaining, setUiSecondsRemaining] = useState<number | null>(
    nextDeadlineAnnouncement?.secondsRemaining ?? null
  )

  useEffect(() => {
    setUiSecondsRemaining(nextDeadlineAnnouncement?.secondsRemaining ?? null)
  }, [nextDeadlineAnnouncement?.secondsRemaining])

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

  const hasActiveDeadlineAnnouncement = Boolean(nextDeadlineAnnouncement) && !isAnnouncementDeadlinePassed
  const activeDeadlineAnnouncement = hasActiveDeadlineAnnouncement ? nextDeadlineAnnouncement : null

  const isAnnouncementDisabled =
    Boolean(nextDeadlineAnnouncement?.isDisabled) || isAnnouncementDeadlinePassed

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

  const nextDeadlineTitle = hasActiveDeadlineAnnouncement
    ? announcementTitle || "Next deadline"
    : "No active deadline"

  const nextDeadlineDueText = hasActiveDeadlineAnnouncement
    ? countdownParts
      ? `${formatCountdown(countdownParts)} remaining`
      : "No deadline"
    : "No deadline"

  const nextDeadlineSummary = getMeaningfulText(activeDeadlineAnnouncement?.message)

  const announcementCreator = activeDeadlineAnnouncement?.createdBy
  const creatorName =
    `${announcementCreator?.firstName ?? ""} ${announcementCreator?.lastName ?? ""}`.trim() ||
    ""

  const secondaryCardText = activeDeadlineAnnouncement?.deadlineAt
    ? `Deadline set for ${formatDate(activeDeadlineAnnouncement.deadlineAt)}.`
    : ""

  const hasAttachmentUrl = Boolean(activeDeadlineAnnouncement?.attachmentUrl?.trim())

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
  /** Match advisor dashboard: locale date + time with seconds */
  const { formattedDate, formattedTime } = useMemo(() => {
    return {
      formattedDate: now.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      formattedTime: now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }
  }, [now])

  const completedMilestones = backendMilestones.filter((milestone) => milestone.status === "approved").length
  const totalMilestones = backendMilestones.length

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
    <div className="w-full min-w-0 space-y-5 animate-fade-in sm:space-y-6">
      {/* Header — aligned with advisor dashboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent sm:text-3xl">
            {welcomeTitle}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Track your project progress, team activity, and evaluation status in one place.
          </p>
        </div>

        <div
          className="w-full min-w-0 shrink-0 rounded-lg border border-border bg-card px-3 py-2.5 text-center text-sm font-semibold text-muted-foreground tabular-nums sm:w-auto sm:text-left"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="break-words">{formattedDate}</span>{" "}
          <span className="whitespace-nowrap">{formattedTime}</span>
        </div>
      </div>

      {/* KPI Row — compact on mobile only; full-size from sm+ */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-2.5 shadow-sm sm:gap-6 sm:rounded-xl sm:py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-0 sm:px-6 sm:pb-2">
            <CardTitle className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">
              Project Status
            </CardTitle>
            <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="px-3 pb-0 pt-0 sm:px-6 sm:pb-6">
            <p className="truncate text-lg font-bold leading-tight sm:text-2xl">{projectStatusLabel}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">{projectDisplayName}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-2.5 shadow-sm sm:gap-6 sm:rounded-xl sm:py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-0 sm:px-6 sm:pb-2">
            <CardTitle className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">
              Progress
            </CardTitle>
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="px-3 pb-0 pt-0 sm:px-6 sm:pb-6">
            <p className="text-lg font-bold leading-tight sm:text-2xl">
              {backendMilestones.length ? `${data.project.progress}%` : "—"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">Overall completion</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-2.5 shadow-sm sm:gap-6 sm:rounded-xl sm:py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-0 sm:px-6 sm:pb-2">
            <CardTitle className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">
              Milestones
            </CardTitle>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="px-3 pb-0 pt-0 sm:px-6 sm:pb-6">
            <p className="text-lg font-bold leading-tight sm:text-2xl">
              {completedMilestones}/{totalMilestones}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">Completed</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-2.5 shadow-sm sm:gap-6 sm:rounded-xl sm:py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-0 sm:px-6 sm:pb-2">
            <CardTitle className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">
              My Grades
            </CardTitle>
            <BarChart3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-0 pt-0 sm:space-y-2.5 sm:px-6 sm:pb-6">
            <div className="flex min-w-0 items-start justify-between gap-2 text-[10px] leading-tight sm:text-xs">
              <span className="shrink-0 text-muted-foreground">Capstone 1</span>
              <span className="min-w-0 text-right font-semibold tabular-nums text-foreground">
                {formatCapstoneGradeLine(data.grade?.capstone1)}
              </span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 text-[10px] leading-tight sm:text-xs">
              <span className="shrink-0 text-muted-foreground">Capstone 2</span>
              <span className="min-w-0 text-right font-semibold tabular-nums text-foreground">
                {formatCapstoneGradeLine(data.grade?.capstone2)}
              </span>
            </div>
            <p className="border-t border-border/60 pt-2 text-[9px] text-muted-foreground sm:text-[10px]">
              {data.grade
                ? "Official grades appear when your department publishes them."
                : "Capstone I & II grades will show here when published."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        {/* Project Snapshot */}
        <Card className="min-w-0 overflow-hidden xl:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-1">
              <CardTitle className="break-words text-base font-semibold sm:text-lg">
                {projectDisplayName}
              </CardTitle>
              <CardDescription className="break-words">
                Advisor: <span className="font-medium">{advisorDisplayName}</span>
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 min-[420px]:flex-row sm:w-auto sm:shrink-0">
              <Button asChild variant="outline" size="sm" className="w-full min-[420px]:flex-1 sm:w-auto sm:min-w-0">
                <Link href="/dashboard/student/milestones">View milestones</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full min-[420px]:flex-1 sm:w-auto sm:min-w-0" onClick={handleViewProject}>
                View full project
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
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
                          : m.status === "overdue"
                            ? "destructive"
                            : "outline"
                    }
                    className="capitalize"
                  >
                    {m.status}
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
            {myGroupAnnouncementsQuery.isLoading ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">Loading deadline...</p>
              </div>
            ) : !activeDeadlineAnnouncement ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm font-medium">No active deadline</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No advisor announcement with a deadline is available right now.
                </p>
              </div>
            ) : (
              <>
                <div className={`rounded-lg border p-4 ${countdownToneClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{nextDeadlineDueText}</p>
                  </div>
                  {nextDeadlineSummary ? (
                    <p className="mt-2 text-xs text-muted-foreground">{nextDeadlineSummary}</p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    {announcementTitle ? (
                      <p className="text-sm font-medium">{announcementTitle}</p>
                    ) : null}
                    {creatorName ? (
                      <p className="mt-1 text-xs text-muted-foreground">Announcement by {creatorName}</p>
                    ) : null}
                    {secondaryCardText ? (
                      <p className="mt-1 text-xs text-muted-foreground">{secondaryCardText}</p>
                    ) : null}
                  </div>

                  {hasAttachmentUrl ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isAnnouncementDisabled}
                      onClick={() => {
                        const target = activeDeadlineAnnouncement.attachmentUrl
                        if (!target) return
                        window.open(target, "_blank", "noopener,noreferrer")
                      }}
                    >
                      Open attachment
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
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="min-w-0">My Grades</span>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Capstone I</p>
                    <p className="mt-1 text-lg font-semibold sm:text-xl">
                      {formatCapstoneGradeLine(data.grade.capstone1)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Capstone II</p>
                    <p className="mt-1 text-lg font-semibold sm:text-xl">
                      {formatCapstoneGradeLine(data.grade.capstone2)}
                    </p>
                  </div>
                </div>

                {(data.grade.advisorScore > 0 ||
                  data.grade.evaluatorScores.length > 0 ||
                  (data.grade.grade && data.grade.grade !== "—")) ? (
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
                ) : null}

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

