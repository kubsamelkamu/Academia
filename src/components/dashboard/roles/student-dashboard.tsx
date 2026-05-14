"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { getErrorMessage } from "@/lib/api/errors"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useDepartmentAnnouncements } from "@/lib/hooks/use-department-announcements"
import { useMyGroupAnnouncements, useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import {
  getStudentFinalGrade,
  submitStudentGradeComplaint,
  type StudentFinalGradeResponse,
  type StudentFinalGradeStage,
} from "@/lib/api/student-final-grades"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useMyGroupProposals } from "@/lib/hooks/use-project-proposals"
import { useProjectDetails } from "@/lib/hooks/use-projects"
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
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MessageSquare,
  Users,
} from "lucide-react"
import type { DepartmentAnnouncementItem } from "@/types/department-announcements"

const MIN_GRADE_COMPLAINT_REASON_CHARS = 25

interface Milestone {
  id: string
  name: string
  status: "pending" | "submitted" | "approved" | "overdue"
  dueDate: string
  sequence?: number
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
}

type StudentGradePhase = "capstone1" | "capstone2"

type StudentGradeStatusTone = "default" | "secondary" | "destructive" | "outline"

interface StudentFinalGradeViewState {
  response: StudentFinalGradeResponse | null
  errorMessage: string | null
  publishedGrade: Extract<StudentFinalGradeResponse, { isPublished: true; status: "APPROVED" }> | null
  statusLabel: string
  statusTone: StudentGradeStatusTone
  project: { id: string; title: string; status: string } | null
  group: { id: string; name: string; status: string; totalMembers: number } | null
  kpiMessage: string
  footnote: string
  kpiValue: string
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

function getRemainingSecondsFromDeadline(
  deadlineAt: string | null | undefined,
  nowMs: number,
  fallbackSeconds?: number | null
): number | null {
  if (typeof fallbackSeconds === "number") {
    const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : Number.NaN
    if (!Number.isNaN(deadlineMs)) {
      return Math.max(0, Math.floor((deadlineMs - nowMs) / 1000))
    }

    return Math.max(0, fallbackSeconds)
  }

  if (!deadlineAt) return null

  const deadlineMs = new Date(deadlineAt).getTime()
  if (Number.isNaN(deadlineMs)) return null

  return Math.max(0, Math.floor((deadlineMs - nowMs) / 1000))
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
  }
}

function hasProjectContext(response: StudentFinalGradeResponse | null | undefined) {
  return Boolean(response && "project" in response)
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "Not available"

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatFinalGradeValue(value: number, digits: number): string {
  return value.toFixed(digits)
}

function gradePhaseLabel(phase: StudentGradePhase) {
  return phase === "capstone2" ? "Capstone II" : "Capstone I"
}

function studentGradePhaseToStage(phase: StudentGradePhase): StudentFinalGradeStage {
  return phase === "capstone2" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function normalizeStudentGradePhaseQuery(value: string | null): StudentGradePhase {
  const normalized = value?.trim().toLowerCase()

  if (normalized === "capstone1" || normalized === "capstone-i" || normalized === "capstone_i") {
    return "capstone1"
  }

  return "capstone2"
}

function studentGradePhaseQueryValue(phase: StudentGradePhase) {
  return phase === "capstone1" ? "capstone-i" : "capstone-ii"
}

function buildStudentFinalGradeViewState({
  response,
  isLoading,
  isError,
  error,
  phase,
}: {
  response: StudentFinalGradeResponse | null
  isLoading: boolean
  isError: boolean
  error: unknown
  phase: StudentGradePhase
}): StudentFinalGradeViewState {
  const publishedGrade =
    response && response.isPublished && response.status === "APPROVED" ? response : null
  const phaseLabel = gradePhaseLabel(phase)
  const errorMessage = isError
    ? getErrorMessage(error, "Failed to load your final grade.")
    : null
  const statusLabel = isLoading
    ? "Loading"
    : isError
      ? "Unavailable"
      : response?.status === "APPROVED"
        ? "Published"
        : response?.status === "FINALIZED_PENDING_DEPARTMENT_HEAD"
          ? "Pending approval"
          : response?.status === "REJECTED"
            ? "Under review"
            : "Not available"
  const statusTone: StudentGradeStatusTone = isError
    ? "destructive"
    : publishedGrade
      ? "default"
      : response?.status === "FINALIZED_PENDING_DEPARTMENT_HEAD"
        ? "secondary"
        : "outline"
  const project = hasProjectContext(response) ? response.project : null
  const group = hasProjectContext(response) ? response.group : null
  const kpiMessage = isLoading
    ? `Checking publication status for your ${phaseLabel} final result.`
    : isError
      ? "Your final-grade status could not be loaded right now."
      : publishedGrade
        ? `Published ${formatDate(publishedGrade.publishedAt ?? publishedGrade.finalizedAt)}`
        : response?.status === "FINALIZED_PENDING_DEPARTMENT_HEAD"
          ? `Your ${phaseLabel} final grade has been prepared and is awaiting department-head approval.`
          : response?.status === "REJECTED"
            ? `Your ${phaseLabel} final grade is being reviewed again and is not published yet.`
            : `Your ${phaseLabel} final grade is not available yet.`
  const footnote = publishedGrade
    ? `${phaseLabel} published ${formatDate(publishedGrade.publishedAt ?? publishedGrade.finalizedAt)}.`
    : `${phaseLabel} final grades will appear here when they are approved and published.`
  const kpiValue = publishedGrade
    ? `${publishedGrade.scores.letterGrade} (${formatFinalGradeValue(
        publishedGrade.scores.finalGrade,
        publishedGrade.roundedToDecimalPlaces
      )}%)`
    : statusLabel

  return {
    response,
    errorMessage,
    publishedGrade,
    statusLabel,
    statusTone,
    project,
    group,
    kpiMessage,
    footnote,
    kpiValue,
  }
}

interface StudentDashboardProps {
  userName?: string
}

export function StudentDashboard({ userName }: StudentDashboardProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const gradesSectionRef = useRef<HTMLDivElement | null>(null)
  const selectedGradePhase = useMemo(
    () => normalizeStudentGradePhaseQuery(searchParams.get("grade-stage")),
    [searchParams]
  )
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

  const departmentAnnouncementsQuery = useDepartmentAnnouncements({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    page: 1,
    limit: 10,
    refetchIntervalMs: 60_000,
  })

  const studentFinalGradeCapstoneOneQuery = useQuery({
    queryKey: ["student", "final-grade", "CAPSTONE_I"],
    queryFn: () => getStudentFinalGrade("CAPSTONE_I"),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: 1,
  })

  const studentFinalGradeCapstoneTwoQuery = useQuery({
    queryKey: ["student", "final-grade", "CAPSTONE_II"],
    queryFn: () => getStudentFinalGrade("CAPSTONE_II"),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: 1,
  })

  const [gradeComplaintDialogOpen, setGradeComplaintDialogOpen] = useState(false)
  const [gradeComplaintReason, setGradeComplaintReason] = useState("")

  const gradeComplaintMutation = useMutation({
    mutationFn: submitStudentGradeComplaint,
    onSuccess: () => {
      toast.success("Complaint submitted", {
        description: "Your coordinator will review your concern about this published grade.",
      })
      setGradeComplaintDialogOpen(false)
      setGradeComplaintReason("")
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 405)) {
        toast.error("Complaint service unavailable", {
          description: "Please use Messages to contact your coordinator about your grade.",
        })
        return
      }
      toast.error(getErrorMessage(err, "Could not submit your complaint. Try again or use Messages."))
    },
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
              dueDate: templateMilestone.dueDate,
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

  const data = useMemo(() => {
    const emptyData = buildEmptyDashboardData()
    const base: StudentDashboardData = { ...emptyData }

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
  }, [backendMilestones])

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

  const departmentDeadlineAnnouncements = useMemo<DepartmentAnnouncementItem[]>(() => {
    const items = departmentAnnouncementsQuery.data?.items ?? []
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now()

    return items
      .filter((item) => {
        if (!item.deadlineAt) return false

        if (typeof item.secondsRemaining === "number") {
          return item.secondsRemaining > 0
        }

        if (item.isExpired) return false

        const deadlineMs = new Date(item.deadlineAt).getTime()
        if (Number.isNaN(deadlineMs)) return false

        return deadlineMs > nowMs
      })
      .slice()
      .sort((firstItem, secondItem) => {
        const firstSeconds =
          typeof firstItem.secondsRemaining === "number"
            ? firstItem.secondsRemaining
            : new Date(firstItem.deadlineAt ?? "").getTime() - nowMs
        const secondSeconds =
          typeof secondItem.secondsRemaining === "number"
            ? secondItem.secondsRemaining
            : new Date(secondItem.deadlineAt ?? "").getTime() - nowMs

        if (firstSeconds !== secondSeconds) {
          return firstSeconds - secondSeconds
        }

        const firstDeadline = new Date(firstItem.deadlineAt ?? "").getTime()
        const secondDeadline = new Date(secondItem.deadlineAt ?? "").getTime()
        return firstDeadline - secondDeadline
      })
  }, [departmentAnnouncementsQuery.data?.items])

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
  const advisorDeadlinesLoading = myGroupAnnouncementsQuery.isLoading
  const departmentDeadlinesLoading = departmentAnnouncementsQuery.isLoading
  const departmentDeadlineErrorMessage = departmentAnnouncementsQuery.isError
    ? getErrorMessage(
        departmentAnnouncementsQuery.error,
        "Department deadlines are unavailable right now."
      )
    : null
  const hasDepartmentDeadlineAnnouncements = departmentDeadlineAnnouncements.length > 0
  const hasAnyDeadlineCards = Boolean(activeDeadlineAnnouncement) || hasDepartmentDeadlineAnnouncements
  const deadlinesCardDescription = hasAnyDeadlineCards
    ? "Advisor and department deadlines that need your attention."
    : "No active advisor or department deadlines right now."

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

  const capstoneOneGradeState = buildStudentFinalGradeViewState({
    response: studentFinalGradeCapstoneOneQuery.data ?? null,
    isLoading: studentFinalGradeCapstoneOneQuery.isLoading,
    isError: studentFinalGradeCapstoneOneQuery.isError,
    error: studentFinalGradeCapstoneOneQuery.error,
    phase: "capstone1",
  })
  const capstoneTwoGradeState = buildStudentFinalGradeViewState({
    response: studentFinalGradeCapstoneTwoQuery.data ?? null,
    isLoading: studentFinalGradeCapstoneTwoQuery.isLoading,
    isError: studentFinalGradeCapstoneTwoQuery.isError,
    error: studentFinalGradeCapstoneTwoQuery.error,
    phase: "capstone2",
  })
  const activeGradeState = selectedGradePhase === "capstone2" ? capstoneTwoGradeState : capstoneOneGradeState
  const activeGradeQuery = selectedGradePhase === "capstone2"
    ? studentFinalGradeCapstoneTwoQuery
    : studentFinalGradeCapstoneOneQuery
  const studentFinalGrade = activeGradeState.response
  const studentGradeErrorMessage = activeGradeState.errorMessage
  const publishedStudentFinalGrade = activeGradeState.publishedGrade
  const studentGradeStatusLabel = activeGradeState.statusLabel
  const studentGradeStatusTone = activeGradeState.statusTone
  const studentGradeProject = activeGradeState.project
  const studentGradeGroup = activeGradeState.group
  const studentGradeKpiMessage = activeGradeState.kpiMessage
  const capstone1KpiValue = capstoneOneGradeState.kpiValue
  const capstone2KpiValue = capstoneTwoGradeState.kpiValue
  const studentGradesFootnote = activeGradeState.footnote
  const prevGradePhaseRef = useRef<StudentGradePhase | null>(null)

  useEffect(() => {
    if (prevGradePhaseRef.current !== null && prevGradePhaseRef.current !== selectedGradePhase) {
      setGradeComplaintDialogOpen(false)
      setGradeComplaintReason("")
    }
    prevGradePhaseRef.current = selectedGradePhase
  }, [selectedGradePhase])

  const handleSubmitGradeComplaint = useCallback(() => {
    const grade = publishedStudentFinalGrade
    if (!grade) return
    const trimmed = gradeComplaintReason.trim()
    if (trimmed.length < MIN_GRADE_COMPLAINT_REASON_CHARS) {
      toast.error("Please add more detail", {
        description: `Explain your concern in at least ${MIN_GRADE_COMPLAINT_REASON_CHARS} characters.`,
      })
      return
    }
    gradeComplaintMutation.mutate({
      stage: studentGradePhaseToStage(selectedGradePhase),
      projectId: grade.project.id,
      reason: trimmed,
    })
  }, [publishedStudentFinalGrade, gradeComplaintReason, selectedGradePhase, gradeComplaintMutation])

  const setSelectedGradePhase = (phase: StudentGradePhase) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("grade-stage", studentGradePhaseQueryValue(phase))
    router.replace(`${pathname}?${nextParams.toString()}`)
  }

  const focusGradePhase = (phase: StudentGradePhase) => {
    setSelectedGradePhase(phase)
    gradesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleViewProject = () => {
    toast.message("Tip", {
      description:
        "Open the My Project section from the left sidebar to see full project details and submissions.",
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
              <span className="shrink-0 text-muted-foreground">Capstone I</span>
              <button
                type="button"
                onClick={() => focusGradePhase("capstone1")}
                className="min-w-0 break-words text-right font-semibold tabular-nums text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-pressed={selectedGradePhase === "capstone1"}
              >
                {capstone1KpiValue}
              </button>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 text-[10px] leading-tight sm:text-xs">
              <span className="shrink-0 text-muted-foreground">Capstone II</span>
              <button
                type="button"
                onClick={() => focusGradePhase("capstone2")}
                className="min-w-0 break-words text-right font-semibold tabular-nums text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-pressed={selectedGradePhase === "capstone2"}
              >
                {capstone2KpiValue}
              </button>
            </div>
            <p className="border-t border-border/60 pt-2 text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]">
              {publishedStudentFinalGrade ? studentGradesFootnote : `${studentGradeKpiMessage} ${studentGradesFootnote}`}
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
            <CardDescription>{deadlinesCardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {advisorDeadlinesLoading && departmentDeadlinesLoading ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">Loading deadline...</p>
              </div>
            ) : !hasAnyDeadlineCards && !departmentDeadlineErrorMessage ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm font-medium">No active deadline</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No advisor or department announcement with a deadline is available right now.
                </p>
              </div>
            ) : (
              <>
                {activeDeadlineAnnouncement ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Advisor deadline
                    </p>

                    <div className={`rounded-lg border p-4 ${countdownToneClass}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{nextDeadlineDueText}</p>
                      </div>
                      {nextDeadlineSummary ? (
                        <p className="mt-2 text-xs text-muted-foreground">{nextDeadlineSummary}</p>
                      ) : null}
                    </div>

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
                ) : advisorDeadlinesLoading ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Advisor deadline
                    </p>

                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-sm text-muted-foreground">Loading advisor deadline...</p>
                    </div>
                  </div>
                ) : null}

                {departmentDeadlineErrorMessage ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Department deadlines
                    </p>

                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-sm font-medium">Department deadlines unavailable</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {departmentDeadlineErrorMessage}
                      </p>
                    </div>
                  </div>
                ) : hasDepartmentDeadlineAnnouncements ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Department deadlines
                    </p>

                    {departmentDeadlineAnnouncements.map((announcement) => {
                      const countdownParts = toCountdownParts(
                        getRemainingSecondsFromDeadline(
                          announcement.deadlineAt,
                          now.getTime(),
                          announcement.secondsRemaining
                        )
                      )
                      const countdownText = countdownParts
                        ? `${formatCountdown(countdownParts)} remaining`
                        : "Deadline passed"
                      const departmentCreatorName = toDisplayName([
                        announcement.createdBy.firstName,
                        announcement.createdBy.lastName,
                      ])
                      const departmentAnnouncementMessage = getMeaningfulText(announcement.message)
                      const departmentAnnouncementTitle = getMeaningfulText(announcement.title)

                      return (
                        <div key={announcement.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <Badge variant={announcement.isExpired ? "secondary" : "outline"} className="shrink-0">
                              {announcement.isExpired ? "Expired" : "Department"}
                            </Badge>
                          </div>

                          <div className="mt-3 space-y-2">
                            {departmentAnnouncementMessage ? (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {departmentAnnouncementMessage}
                              </p>
                            ) : null}
                            {departmentAnnouncementTitle ? (
                              <p className="text-sm font-semibold text-foreground">{departmentAnnouncementTitle}</p>
                            ) : null}
                          </div>

                          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="text-sm font-semibold">{countdownText}</p>
                          </div>

                          {departmentCreatorName ? (
                            <p className="mt-3 text-xs text-muted-foreground">
                              Announcement by {departmentCreatorName}
                            </p>
                          ) : null}
                          {announcement.deadlineAt ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Deadline set for {formatDate(announcement.deadlineAt)}.
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : departmentDeadlinesLoading ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Department deadlines
                    </p>

                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-sm text-muted-foreground">Loading department deadlines...</p>
                    </div>
                  </div>
                ) : null}
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
        <div ref={gradesSectionRef} id="my-grades">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex flex-col items-start gap-2 text-base sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">My Grades</span>
              {!activeGradeQuery.isLoading ? (
                <Badge
                  variant={studentGradeStatusTone}
                  className="capitalize self-start sm:self-auto"
                >
                  {studentGradeStatusLabel}
                </Badge>
              ) : null}
            </CardTitle>
            <CardDescription>
              Read-only final grade visibility for {gradePhaseLabel(selectedGradePhase)}.
            </CardDescription>
            <Tabs value={selectedGradePhase} onValueChange={(value) => setSelectedGradePhase(value as StudentGradePhase)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="capstone1">Capstone I</TabsTrigger>
                <TabsTrigger value="capstone2">Capstone II</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeGradeQuery.isLoading ? (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-lg bg-muted" />
                <div className="h-28 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : studentGradeErrorMessage ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Unable to load your final grade</p>
                    <p className="text-xs text-muted-foreground">{studentGradeErrorMessage}</p>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => activeGradeQuery.refetch()}>
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            ) : publishedStudentFinalGrade ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border bg-primary/10 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Final grade</p>
                    <p className="mt-1 break-words text-xl font-semibold text-primary sm:text-2xl">
                      {formatFinalGradeValue(
                        publishedStudentFinalGrade.scores.finalGrade,
                        publishedStudentFinalGrade.roundedToDecimalPlaces
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="text-xs font-medium text-muted-foreground">Letter grade</p>
                    <p className="mt-1 break-words text-xl font-semibold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                      {publishedStudentFinalGrade.scores.letterGrade}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Advisor score</p>
                    <p className="mt-1 break-words text-lg font-semibold">
                      {publishedStudentFinalGrade.scores.advisorScore}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Evaluator average</p>
                    <p className="mt-1 break-words text-lg font-semibold">
                      {publishedStudentFinalGrade.scores.evaluatorAverageScore}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Project</p>
                    <p className="mt-1 break-words text-sm font-semibold">{publishedStudentFinalGrade.project.title}</p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                      {publishedStudentFinalGrade.group?.name ?? "No group assigned"}
                      {publishedStudentFinalGrade.group
                        ? ` · ${publishedStudentFinalGrade.group.totalMembers} members`
                        : ""}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Weights</p>
                    <p className="mt-1 break-words text-sm font-semibold leading-relaxed">
                      Advisor {publishedStudentFinalGrade.weights.advisorPercentage}% · Evaluator {publishedStudentFinalGrade.weights.evaluatorPercentage}%
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Weighted breakdown from the approved final result.</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Published at</p>
                    <p className="mt-1 break-words text-sm font-semibold leading-relaxed">
                      {formatDateTime(publishedStudentFinalGrade.publishedAt ?? publishedStudentFinalGrade.finalizedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Finalized at</p>
                    <p className="mt-1 break-words text-sm font-semibold leading-relaxed">
                      {formatDateTime(publishedStudentFinalGrade.finalizedAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">Your {gradePhaseLabel(selectedGradePhase)} final grade is published.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This view is read-only and only shows the approved {gradePhaseLabel(selectedGradePhase)} final result for your own record.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    If you believe this published {gradePhaseLabel(selectedGradePhase)} grade is incorrect, you can file a formal complaint for coordinator review.
                  </p>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setGradeComplaintReason("")
                        setGradeComplaintDialogOpen(true)
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      File grade complaint
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <Link href="/dashboard/student/messages">Open Messages</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : studentFinalGrade?.status === "FINALIZED_PENDING_DEPARTMENT_HEAD" || studentFinalGrade?.status === "REJECTED" ? (
              <div className="space-y-4">
                <div className={
                  studentFinalGrade.status === "REJECTED"
                    ? "rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                    : "rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10"
                }>
                  <div className="flex items-start gap-3">
                    {studentFinalGrade.status === "REJECTED" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium leading-relaxed">
                        {studentFinalGrade.status === "FINALIZED_PENDING_DEPARTMENT_HEAD"
                          ? `Your ${gradePhaseLabel(selectedGradePhase)} final grade has been prepared and is awaiting department-head approval.`
                          : `Your ${gradePhaseLabel(selectedGradePhase)} final grade is being reviewed again and is not published yet.`}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{studentFinalGrade.message}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Project</p>
                    <p className="mt-1 break-words text-sm font-semibold">{studentGradeProject?.title ?? projectDisplayName}</p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">Status {studentGradeProject?.status ?? projectStatusLabel}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Group</p>
                    <p className="mt-1 break-words text-sm font-semibold">{studentGradeGroup?.name ?? myGroup?.name ?? "No group assigned"}</p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                      {studentGradeGroup ? `${studentGradeGroup.totalMembers} members` : "Group details are not available yet."}
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Final numeric grades stay hidden until the {gradePhaseLabel(selectedGradePhase)} result is approved and published.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium">Your {gradePhaseLabel(selectedGradePhase)} final grade is not available yet.</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {studentFinalGrade?.message ?? "No finalized result is available for this stage yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      <Dialog
        open={gradeComplaintDialogOpen}
        onOpenChange={(open) => {
          setGradeComplaintDialogOpen(open)
          if (!open) setGradeComplaintReason("")
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>File a grade complaint</DialogTitle>
            <DialogDescription>
              Describe why you believe your published {gradePhaseLabel(selectedGradePhase)} grade should be reviewed. Your coordinator will receive this request.
            </DialogDescription>
          </DialogHeader>
          {publishedStudentFinalGrade ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{publishedStudentFinalGrade.project.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {gradePhaseLabel(selectedGradePhase)} · Letter {publishedStudentFinalGrade.scores.letterGrade} · Final{" "}
                  {formatFinalGradeValue(
                    publishedStudentFinalGrade.scores.finalGrade,
                    publishedStudentFinalGrade.roundedToDecimalPlaces,
                  )}
                  %
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade-complaint-reason">Your explanation</Label>
                <Textarea
                  id="grade-complaint-reason"
                  value={gradeComplaintReason}
                  onChange={(e) => setGradeComplaintReason(e.target.value)}
                  placeholder="Explain your concern clearly (e.g. calculation, missing evaluation, or documentation you believe was overlooked)."
                  rows={5}
                  className="resize-y min-h-[120px]"
                  disabled={gradeComplaintMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum {MIN_GRADE_COMPLAINT_REASON_CHARS} characters. Be specific so your coordinator can investigate.
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGradeComplaintDialogOpen(false)}
              disabled={gradeComplaintMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitGradeComplaint}
              disabled={
                gradeComplaintMutation.isPending
                || gradeComplaintReason.trim().length < MIN_GRADE_COMPLAINT_REASON_CHARS
                || !publishedStudentFinalGrade
              }
            >
              {gradeComplaintMutation.isPending ? "Submitting…" : "Submit complaint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

