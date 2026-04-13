"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import DataTable, { Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { StatusIndicator } from "@/components/timeline/StatusIndicator"
import { useCoordinatorAdvisorOverview, useCoordinatorProjectTracking } from "@/lib/hooks/use-coordinator-analytics"
import { useDepartmentAnnouncements } from "@/lib/hooks/use-department-announcements"
import { useDepartmentProjectProposals } from "@/lib/hooks/use-project-proposals"
import { useDepartmentProjectsOverview } from "@/lib/hooks/use-projects"
import {
  FileText,
  FileCheck,
  Users,
  ClipboardCheck,
  Calculator,
  AlertTriangle,
  Send,
  UserPlus,
  CheckCircle2,
  TrendingUp,
  Clock,
  BarChart3,
  Timer,
  ArrowRight,
  Bell,
  GraduationCap,
  LayoutDashboard,
  Zap,
  Activity,
  ChevronRight,
  MessageSquare,
  Shield,
  Star,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import {
  mockProjects,
  mockEvaluations,
  mockComplaints,
  mockUsers,
  mockGrades,
  Complaint,
  Grade,
} from "@/data/mockData"
import type { CoordinatorProjectTrackingItem, CoordinatorProjectTrackingMilestone } from "@/types/project-tracking"
import type { DepartmentAnnouncementItem } from "@/types/department-announcements"

interface DashboardTimelineMilestone {
  id: string
  title: string
  label: string
  tone: string
}

interface DashboardTimelineCardModel {
  projectId: string
  projectTitle: string
  overallProgress: number
  daysRemaining: number
  milestoneSummary: string
  status: "on_track" | "at_risk" | "overdue"
  milestones: DashboardTimelineMilestone[]
}

interface DashboardActiveProjectRow {
  id: string
  title: string
  groupName: string
  advisorName: string
  evaluatorLabel: string
  progress: number
  status: string
}

interface DashboardAnnouncementAlert {
  id: string
  title: string
  message: string
  severity: "low" | "high" | "critical"
  isRead: boolean
  createdAt: string
}

interface DashboardCapstoneGradeRow {
  id: string
  studentName: string
  capstone1Score: number
  capstone1Grade: string
  capstone2Score: number
  capstone2Grade: string
  status: Grade["status"]
}

const ALERT_DUE_SOON_SECONDS = 3 * 24 * 60 * 60

function performanceLabel(progress: number) {
  if (progress >= 75) return "Excellent"
  if (progress >= 50) return "Good"
  return "Attention"
}

function scoreToLetterGrade(score: number): string {
  if (score >= 90) return "A+"
  if (score >= 85) return "A"
  if (score >= 80) return "A-"
  if (score >= 75) return "B+"
  if (score >= 70) return "B"
  if (score >= 65) return "B-"
  if (score >= 60) return "C+"
  if (score >= 55) return "C"
  if (score >= 50) return "C-"
  return "F"
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

function toSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.round(diff / 86400000)
}

function mapMilestoneLabel(status: string) {
  const normalized = status.trim().toUpperCase()

  if (normalized === "APPROVED") {
    return { label: "Approved", tone: "bg-primary/10 text-primary border-primary/20" }
  }

  if (normalized === "SUBMITTED") {
    return { label: "Submitted", tone: "bg-amber-500/10 text-amber-700 border-amber-400/30" }
  }

  if (normalized === "REJECTED") {
    return { label: "Rejected", tone: "bg-destructive/10 text-destructive border-destructive/20" }
  }

  return { label: "Pending", tone: "bg-muted text-muted-foreground border-border" }
}

function deriveTimelineStatus(item: CoordinatorProjectTrackingItem): DashboardTimelineCardModel["status"] {
  const overduePendingMilestone = item.milestones.some((milestone) => {
    const status = milestone.status.trim().toUpperCase()
    return status !== "APPROVED" && new Date(milestone.dueDate).getTime() < Date.now()
  })

  if (overduePendingMilestone) {
    return "overdue"
  }

  if (item.milestoneProgress.rejected > 0 || item.milestoneProgress.pending > item.milestoneProgress.approved) {
    return "at_risk"
  }

  return "on_track"
}

function mapTrackingItemToTimelineCard(item: CoordinatorProjectTrackingItem): DashboardTimelineCardModel {
  const milestones = [...item.milestones].sort(
    (left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
  )
  const lastMilestone = milestones[milestones.length - 1]
  const approvedMilestones = item.milestoneProgress.approved

  return {
    projectId: item.projectId,
    projectTitle: item.projectTitle,
    overallProgress: item.milestoneProgress.percentage,
    daysRemaining: lastMilestone ? daysUntil(lastMilestone.dueDate) : 0,
    milestoneSummary: `${approvedMilestones}/${item.milestoneProgress.total} milestones`,
    status: deriveTimelineStatus(item),
    milestones: milestones.slice(0, 2).map((milestone: CoordinatorProjectTrackingMilestone) => {
      const mapped = mapMilestoneLabel(milestone.status)
      return {
        id: milestone.id,
        title: milestone.title,
        label: mapped.label,
        tone: mapped.tone,
      }
    }),
  }
}

function toDisplayStatus(status: string) {
  const normalized = status.trim().toUpperCase()

  if (normalized === "ACTIVE") return "active"
  if (normalized === "COMPLETED") return "completed"
  if (normalized === "CANCELLED") return "cancelled"

  return status.toLowerCase()
}

function advisorDisplayName(advisor: CoordinatorProjectTrackingItem["advisor"]) {
  const fullName = advisor?.fullName?.trim()
  if (fullName) return fullName

  return advisor?.email?.trim() || "Unassigned"
}

function mapTrackingItemToActiveProjectRow(item: CoordinatorProjectTrackingItem): DashboardActiveProjectRow {
  return {
    id: item.projectId,
    title: item.projectTitle,
    groupName: item.group?.name?.trim() || "Unassigned Group",
    advisorName: advisorDisplayName(item.advisor),
    evaluatorLabel: "Pending integration",
    progress: item.milestoneProgress.percentage,
    status: toDisplayStatus(item.projectStatus),
  }
}

function formatDueRelative(secondsRemaining: number): string {
  if (secondsRemaining < 0) {
    const overdueDays = Math.max(1, Math.ceil(Math.abs(secondsRemaining) / 86_400))
    return `Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`
  }

  const days = Math.floor(secondsRemaining / 86_400)
  const hours = Math.floor((secondsRemaining % 86_400) / 3_600)

  if (days > 0) {
    return `Due in ${days} day${days === 1 ? "" : "s"}`
  }

  if (hours > 0) {
    return `Due in ${hours} hour${hours === 1 ? "" : "s"}`
  }

  return "Due soon"
}

function mapAnnouncementToTimelineAlert(announcement: DepartmentAnnouncementItem): DashboardAnnouncementAlert | null {
  if (announcement.isDisabled || announcement.isExpired) return null

  const secondsRemaining = announcement.secondsRemaining
  const isOverdue = secondsRemaining !== null && secondsRemaining < 0
  const isDueSoon = secondsRemaining !== null && secondsRemaining >= 0 && secondsRemaining <= ALERT_DUE_SOON_SECONDS

  const relativeDueMessage =
    secondsRemaining !== null
      ? formatDueRelative(secondsRemaining)
      : "No deadline"

  return {
    id: announcement.id,
    title: announcement.title,
    message: `${announcement.message} • ${relativeDueMessage}`,
    severity: isOverdue ? "critical" : isDueSoon ? "high" : "low",
    isRead: false,
    createdAt: announcement.createdAt,
  }
}

function DashboardTimelineCard({ timeline }: { timeline: DashboardTimelineCardModel }) {
  const statusIcon =
    timeline.status === "overdue"
      ? <Timer className="h-4 w-4 text-destructive" />
      : timeline.status === "at_risk"
        ? <AlertTriangle className="h-4 w-4 text-amber-600" />
        : <CheckCircle2 className="h-4 w-4 text-primary" />

  const statusClasses =
    timeline.status === "overdue"
      ? "border-destructive/20 bg-destructive/5 hover:border-destructive/30"
      : timeline.status === "at_risk"
        ? "border-amber-400/30 bg-amber-500/5 hover:border-amber-500/40"
        : "border-primary/20 bg-primary/5 hover:border-primary/30"

  return (
    <Link href={`/dashboard/coordinator/groups?search=${encodeURIComponent(timeline.projectTitle)}`}>
      <Card className={`h-full border transition-all hover:shadow-md ${statusClasses}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-start justify-between gap-3 text-sm font-medium">
            <span className="line-clamp-2 leading-snug">{timeline.projectTitle}</span>
            <span className="shrink-0">{statusIcon}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{timeline.overallProgress}%</span>
            </div>
            <Progress value={timeline.overallProgress} className="h-2" />
          </div>

          <div className="flex items-center justify-end gap-2 text-sm">
            <Badge variant="outline" className="text-xs">{timeline.milestoneSummary}</Badge>
          </div>

          <div className="space-y-2">
            {timeline.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-foreground">{milestone.title}</span>
                <Badge variant="outline" className={`text-[10px] ${milestone.tone}`}>
                  {milestone.label}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end pt-1 text-xs font-medium text-primary">
            Open in Projects <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function CoordinatorDashboard() {
  const authUser = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const displayName = authUser
    ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() || "Coordinator"
    : "Coordinator"

  // Live clock — same pattern as student dashboard
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const dateTimeString = useMemo(() => {
    const datePart = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(now)

    const timePart = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(now)

    return `${datePart} ${timePart}`
  }, [now])

  const [localGrades] = useState<Grade[]>(mockGrades)
  const [timelinePage, setTimelinePage] = useState(1)

  const departmentId = authUser?.departmentId ?? authUser?.department?.id ?? null

  const timelineTrackingQuery = useCoordinatorProjectTracking({
    departmentId,
    projectStatus: "ACTIVE",
    page: timelinePage,
    limit: 4,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const activeProjectsTableQuery = useCoordinatorProjectTracking({
    departmentId,
    projectStatus: "ACTIVE",
    page: 1,
    limit: 5,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const advisorOverviewQuery = useCoordinatorAdvisorOverview({
    departmentId,
    projectStatus: "ACTIVE",
    page: 1,
    limit: 6,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const timelineAnnouncementsQuery = useDepartmentAnnouncements({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    page: 1,
    limit: 50,
    refetchIntervalMs: 60_000,
  })

  const projectsOverviewQuery = useDepartmentProjectsOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const departmentProposalsQuery = useDepartmentProjectProposals({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const pendingTitlesCount = departmentProposalsQuery.data?.summary.pending ?? 0
  const pendingEvaluations = mockEvaluations.filter(e => e.status === 'pending')
  const openComplaints = mockComplaints.filter(c => c.status === 'open' || c.status === 'under_review')

  const advisors = mockUsers.filter(u => u.role === 'advisor')
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')
  const activeProjectRows = useMemo(
    () => (activeProjectsTableQuery.data?.items ?? []).map(mapTrackingItemToActiveProjectRow),
    [activeProjectsTableQuery.data?.items]
  )

  const activeOverviewProjects = useMemo(() => {
    return (projectsOverviewQuery.data?.projects ?? []).filter((project) => {
      const normalizedStatus = String(project.status ?? "").trim().toUpperCase()
      return normalizedStatus === "ACTIVE" || normalizedStatus === "IN_PROGRESS"
    })
  }, [projectsOverviewQuery.data?.projects])

  const activeProjectsCount = projectsOverviewQuery.data?.activeProjects ?? activeOverviewProjects.length

  const avgActiveProjectProgress = useMemo(() => {
    if (activeOverviewProjects.length === 0) return 0

    const totalProgress = activeOverviewProjects.reduce((sum, project) => {
      const value = Number(project.milestoneProgressPercent)
      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

    return Math.round(totalProgress / activeOverviewProjects.length)
  }, [activeOverviewProjects])

  // Workflow stages use primary + secondary + muted — all theme-reactive
  const workflowStages = [
    { label: 'Title Review',  count: 5,  icon: FileText,     color: 'text-primary',            bg: 'bg-primary/10',       border: 'border-primary/20' },
    { label: 'In Progress',   count: 12, icon: Clock,         color: 'text-primary/70',          bg: 'bg-primary/[0.06]',   border: 'border-primary/10' },
    { label: 'Evaluation',    count: 8,  icon: ClipboardCheck,color: 'text-foreground',          bg: 'bg-muted',            border: 'border-border' },
    { label: 'Grading',       count: 4,  icon: Calculator,    color: 'text-muted-foreground',    bg: 'bg-muted/60',         border: 'border-border' },
    { label: 'Completed',     count: 25, icon: CheckCircle2,  color: 'text-primary',             bg: 'bg-primary/10',       border: 'border-primary/20' },
  ]

  // Quick actions — use primary for icon tints, muted for others
  const quickActions = [
    { href: "/dashboard/coordinator/title-management",  icon: Shield,       label: "Title Management",   description: "Forward validated titles to DC",  bg: "bg-primary/10",  color: "text-primary" },
    { href: "/dashboard/coordinator/advisor-progress",  icon: BarChart3,    label: "Advisor Analytics",  description: "Monitor advisor performance",       bg: "bg-primary/10",  color: "text-primary" },
    { href: "/dashboard/coordinator/evaluator-progress",icon: Star,         label: "Evaluator Progress", description: "Track evaluation submissions",      bg: "bg-primary/[0.06]", color: "text-primary/80" },
    { href: "/dashboard/coordinator/grade-management",  icon: Calculator,   label: "Grade Management",   description: "Calculate & publish grades",        bg: "bg-muted",       color: "text-foreground" },
    { href: "/dashboard/coordinator/reports",           icon: FileCheck,    label: "Reports",            description: "Generate department reports",       bg: "bg-muted",       color: "text-foreground" },
    { href: "/dashboard/coordinator/messages",          icon: MessageSquare,label: "Messages",           description: "Communication center",             bg: "bg-muted",       color: "text-foreground" },
  ]

  const projectColumns: Column<DashboardActiveProjectRow>[] = [
    { 
      key: 'title', header: 'Project',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
        <div>
            <p className="font-medium leading-tight">{p.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{p.groupName}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'advisorName', header: 'Advisor',
      render: (p) => p.advisorName && p.advisorName !== "Unassigned" ? (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{p.advisorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{p.advisorName}</span>
        </div>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
      )
    },
    {
      key: 'evaluators', header: 'Evaluators',
      render: (p) => <Badge variant="outline" className="text-muted-foreground text-xs">{p.evaluatorLabel}</Badge>
    },
    {
      key: 'progress', header: 'Progress',
      render: (p) => (
        <div className="w-28 space-y-1">
          <span className="text-xs font-medium">{p.progress}%</span>
          <Progress value={p.progress} className="h-1.5" />
        </div>
      )
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions', header: '',
      render: (p) => (
        <Link href="/dashboard/coordinator/projects">
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Manage
          </Button>
        </Link>
      )
    },
  ]

  const capstoneGrades = useMemo<DashboardCapstoneGradeRow[]>(() => {
    return localGrades.map((grade) => {
      const evaluatorScores = grade.evaluatorScores ?? [35, 38, 32]
      const evaluatorAverage = evaluatorScores.reduce((sum, score) => sum + score, 0) / evaluatorScores.length
      const advisorScore = grade.advisorScore ?? 28
      const evaluatorPercent = (evaluatorAverage / 40) * 100
      const advisorPercent = (advisorScore / 30) * 100
      const baseScore = clampScore(toSingleDecimal((evaluatorPercent * 0.8) + (advisorPercent * 0.2)))
      const capstone1Score = clampScore(toSingleDecimal(baseScore - 4))
      const capstone2Score = clampScore(toSingleDecimal(baseScore + 3))

      return {
        id: grade.id,
        studentName: grade.studentName,
        capstone1Score,
        capstone1Grade: scoreToLetterGrade(capstone1Score),
        capstone2Score,
        capstone2Grade: scoreToLetterGrade(capstone2Score),
        status: grade.status,
      }
    })
  }, [localGrades])

  const gradeColumns: Column<DashboardCapstoneGradeRow>[] = [
    { 
      key: 'studentName', header: 'Student',
      render: (g) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{g.studentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{g.studentName}</span>
        </div>
      )
    },
    {
      key: 'capstone1', header: 'Capstone I (Semester 1)',
      render: (g) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{g.capstone1Score.toFixed(1)}%</span>
            <Progress value={g.capstone1Score} className="w-16 h-1.5" />
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">{g.capstone1Grade}</Badge>
        </div>
      )
    },
    {
      key: 'capstone2', header: 'Capstone II (Semester 2)',
      render: (g) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{g.capstone2Score.toFixed(1)}%</span>
            <Progress value={g.capstone2Score} className="w-16 h-1.5" />
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">{g.capstone2Grade}</Badge>
        </div>
      )
    },
    { key: 'status', header: 'Status', render: (g) => <StatusBadge status={g.status} /> },
  ]

  const complaintColumns: Column<Complaint>[] = [
    { 
      key: 'studentName', header: 'Student',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-destructive/10 text-destructive">{c.studentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{c.studentName}</span>
        </div>
      )
    },
    { key: 'targetType', header: 'Type', render: (c) => <Badge variant="outline" className="capitalize text-xs">{c.targetType}</Badge> },
    { key: 'reason', header: 'Issue', render: (c) => <p className="max-w-[200px] truncate text-sm text-muted-foreground">{c.reason}</p> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions', header: '',
      render: (c) => (
        <Link href={`/dashboard/coordinator/complaints/${c.id}`}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" /> Review
          </Button>
        </Link>
      )
    },
  ]

  const unreadAlerts = useMemo(() => {
    const items = timelineAnnouncementsQuery.data?.items ?? []

    return items
      .map(mapAnnouncementToTimelineAlert)
      .filter((alert): alert is DashboardAnnouncementAlert => Boolean(alert))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [timelineAnnouncementsQuery.data?.items])
  const trackedTimelines = useMemo(
    () => (timelineTrackingQuery.data?.items ?? []).map(mapTrackingItemToTimelineCard),
    [timelineTrackingQuery.data?.items]
  )
  const trackedTimelineTotal = timelineTrackingQuery.data?.pagination.totalItems ?? 0
  const trackedTimelinePages = Math.max(1, timelineTrackingQuery.data?.pagination.totalPages ?? 1)

  const evaluatorMetrics = useMemo(() => evaluators.map(ev => {
    const assigned = mockProjects.filter(p => (p.evaluatorIds ?? []).includes(ev.id))
    const submitted = mockEvaluations.filter(e => e.evaluatorId === ev.id && (e.status === 'submitted' || e.status === 'reviewed')).length
    const pending = mockEvaluations.filter(e => e.evaluatorId === ev.id && e.status === 'pending').length
    const completion = assigned.length > 0 ? Math.round((submitted / assigned.length) * 100) : 0
    return { ...ev, assigned: assigned.length, submitted, pending, completion }
  }), [evaluators])

  const gradeFinalizationPct = localGrades.length > 0
    ? Math.round((localGrades.filter(g => g.status === 'final').length / localGrades.length) * 100)
    : 45

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* ── Page Header — matches student/advisor style ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingTitlesCount > 0 || openComplaints.length > 0 ? (
              <>
                <span className="font-medium text-foreground">{pendingTitlesCount}</span> pending titles,{" "}
                <span className="font-medium text-foreground">{pendingEvaluations.length}</span> evaluations and{" "}
                <span className="font-medium text-foreground">{openComplaints.length}</span> open complaints awaiting attention.
              </>
            ) : (
              "All tasks are up to date — great job keeping things running smoothly."
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0 shrink-0">
          <span className="tabular-nums text-sm font-medium text-muted-foreground" aria-live="polite">
            {dateTimeString}
          </span>
        </div>
      </div>

      {/* ── KPI Cards — all theme-reactive ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Pending Titles */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Pending Titles</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold tracking-tight">{pendingTitlesCount}</p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">From DC Committee</p>
              <div className="mt-2 sm:mt-3 h-1 rounded-full bg-muted overflow-hidden w-16 sm:w-24">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((pendingTitlesCount / 10) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Active Projects</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold tracking-tight">{activeProjectsCount}</p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">Avg {avgActiveProjectProgress}% progress</p>
              <div className="mt-2 sm:mt-3 h-1 rounded-full bg-muted overflow-hidden w-16 sm:w-24">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${avgActiveProjectProgress}%` }} />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Evaluations */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Pending Evals</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold tracking-tight">{pendingEvaluations.length}</p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">Awaiting submission</p>
              <div className="mt-2 sm:mt-3 h-1 rounded-full bg-muted overflow-hidden w-16 sm:w-24">
                <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${Math.min((pendingEvaluations.length / 15) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Open Complaints */}
        <Card className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">Open Complaints</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold tracking-tight">{openComplaints.length}</p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">Require resolution</p>
              <div className="mt-2 sm:mt-3 h-1 rounded-full bg-muted overflow-hidden w-16 sm:w-24">
                <div className="h-full rounded-full bg-destructive/60 transition-all" style={{ width: `${Math.min((openComplaints.length / 10) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-destructive/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Workflow Pipeline ── */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Project Workflow Pipeline
              </CardTitle>
              <CardDescription>Real-time status of all projects across the academic workflow</CardDescription>
            </div>
            <Link href="/dashboard/coordinator/projects">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:items-center">
            {workflowStages.map((stage, index) => (
              <React.Fragment key={stage.label}>
                <div className={`relative flex-1 rounded-xl border ${stage.border} ${stage.bg} p-3 sm:p-4 text-center transition-all hover:shadow-sm`}>
                  <stage.icon className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 ${stage.color}`} />
                  <p className={`text-xl sm:text-2xl font-bold ${stage.color}`}>{stage.count}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-tight sm:tracking-normal">{stage.label}</p>
              </div>
                {index < workflowStages.length - 1 && (
                  <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Timeline Alerts + System Overview ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {timelineAnnouncementsQuery.isLoading ? (
            <Card className="border-none shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Timeline Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="rounded-lg border bg-muted/30 p-3">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : timelineAnnouncementsQuery.isError ? (
            <Card className="border-none shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  Timeline Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">Failed to load timeline alerts from announcements.</p>
              </CardContent>
            </Card>
          ) : unreadAlerts.length > 0 ? (
            <Card className="border-none shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-destructive" />
                  </div>
                  Timeline Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6">
                {unreadAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 sm:gap-3 rounded-lg border bg-muted/30 p-2.5 sm:p-3 transition-colors hover:bg-muted/50">
                    <StatusIndicator
                      status={alert.severity === 'critical' ? 'overdue' : alert.severity === 'high' ? 'at_risk' : 'on_track'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] sm:text-xs shrink-0 capitalize px-1 sm:px-2">{alert.severity}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm h-full flex items-center justify-center">
              <CardContent className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="font-medium">All timelines on track</p>
                <p className="text-sm text-muted-foreground mt-1">No alerts to show</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Overview — all bg-primary bars */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {[
              { label: "Title Approval Rate",  value: 78 },
              { label: "Project Completion",   value: 65 },
              { label: "Evaluation Coverage",  value: 82 },
              { label: "Grade Finalization",   value: gradeFinalizationPct },
            ].map((item, i) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <div className="h-1 sm:h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.value}%`, opacity: 1 - i * 0.15 }}
                  />
                  </div>
                </div>
              ))}
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>Overall System Health</span>
              <Badge variant="secondary" className="text-[9px] sm:text-xs">Good</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Project Timelines ── */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-xl">Project Timelines</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Countdown and progress tracking</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-xs">{trackedTimelineTotal} tracked</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {timelineTrackingQuery.isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {timelineTrackingQuery.error instanceof Error ? timelineTrackingQuery.error.message : "Failed to load project timelines."}
            </div>
          ) : timelineTrackingQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="h-5 w-2/3 rounded bg-muted/60" />
                    <div className="h-2 rounded bg-muted/50" />
                    <div className="flex justify-between gap-2">
                      <div className="h-4 w-24 rounded bg-muted/50" />
                      <div className="h-5 w-20 rounded bg-muted/50" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : trackedTimelines.length > 0 ? (
            <>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {trackedTimelines.map((timeline) => (
                  <DashboardTimelineCard key={timeline.projectId} timeline={timeline} />
                ))}
              </div>
              {trackedTimelinePages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 sm:px-4 sm:py-3">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{timelinePage}</span> of {trackedTimelinePages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 text-[10px] sm:text-xs"
                      disabled={timelinePage <= 1 || timelineTrackingQuery.isFetching}
                      onClick={() => setTimelinePage((current) => Math.max(1, current - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 text-[10px] sm:text-xs"
                      disabled={timelinePage >= trackedTimelinePages || timelineTrackingQuery.isFetching}
                      onClick={() => setTimelinePage((current) => Math.min(trackedTimelinePages, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 py-10 sm:py-16 text-center">
              <Timer className="mb-3 h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30" />
              <p className="font-medium text-sm sm:text-base text-foreground">No active project timelines found</p>
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">The live tracking endpoint returned no active projects.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Main Tabs: Projects / Advisors / Evaluators / Grades / Complaints ── */}
      <Tabs defaultValue="projects" className="space-y-4">
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="h-9 sm:h-10 inline-flex w-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="projects" className="gap-1.5 text-[10px] sm:text-sm px-3 sm:px-4">
              Projects
              <Badge variant="secondary" className="ml-1 text-[9px] sm:text-xs px-1 py-0">{activeProjectsCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="advisors" className="gap-1.5 text-[10px] sm:text-sm px-3 sm:px-4">
              Advisors
              <Badge variant="secondary" className="ml-1 text-[9px] sm:text-xs px-1 py-0">{advisors.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="evaluators" className="gap-1.5 text-[10px] sm:text-sm px-3 sm:px-4">
              Evaluators
              <Badge variant="secondary" className="ml-1 text-[9px] sm:text-xs px-1 py-0">{evaluators.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="grades" className="gap-1.5 text-[10px] sm:text-sm px-3 sm:px-4">
              Grades
            </TabsTrigger>
            <TabsTrigger value="complaints" className="gap-1.5 text-[10px] sm:text-sm px-3 sm:px-4">
              Complaints
              {openComplaints.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[9px] sm:text-xs px-1 py-0">{openComplaints.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Projects */}
        <TabsContent value="projects">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-xl">Active Projects</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage assignments and monitor progress</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/dashboard/coordinator/notify-advisors" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                    <Bell className="h-3.5 w-3.5" /> Notify
                  </Button>
                </Link>
                <Link href="/dashboard/coordinator/projects" className="flex-1 sm:flex-none">
                  <Button size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {activeProjectsTableQuery.isError ? (
                <div className="px-6 py-6 text-sm text-destructive">
                  {activeProjectsTableQuery.error instanceof Error ? activeProjectsTableQuery.error.message : "Failed to load active projects."}
                </div>
              ) : (
                <div className="min-w-[600px] sm:min-w-0">
                  <DataTable data={activeProjectRows} columns={projectColumns} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advisors */}
        <TabsContent value="advisors">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-xl">Advisor Performance</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Monitor workload and metrics</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/dashboard/coordinator/notify-advisors" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                    <Send className="h-3.5 w-3.5" /> Notify
                  </Button>
                </Link>
                <Link href="/dashboard/coordinator/advisor-progress" className="flex-1 sm:flex-none">
                  <Button size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                    Analytics <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {advisorOverviewQuery.isError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                  {advisorOverviewQuery.error instanceof Error ? advisorOverviewQuery.error.message : "Failed to load advisor performance."}
                </div>
              ) : advisorOverviewQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 rounded-xl border p-3">
                      <div className="h-10 w-10 rounded-full bg-muted/60 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 rounded bg-muted/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (advisorOverviewQuery.data?.advisors.length ?? 0) > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {advisorOverviewQuery.data?.advisors.map((advisor) => {
                    const avgProg = advisor.metrics.overallProjectProgress
                    const perfLabel = performanceLabel(avgProg)
                    return (
                      <div key={advisor.advisorId} className="flex items-center gap-3 sm:gap-4 rounded-xl border p-2.5 sm:p-3 hover:bg-muted/40 transition-colors">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">{advisor.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{advisor.fullName}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{advisor.email}</p>
                        </div>
                        <div className="hidden xs:flex flex-col items-end gap-1 w-20 sm:w-28 shrink-0">
                          <div className="flex justify-between w-full text-[9px] sm:text-xs">
                            <span className="text-muted-foreground">{advisor.metrics.totalProjectsAdvising} proj</span>
                            <span className="font-medium">{avgProg}%</span>
                          </div>
                          <Progress value={avgProg} className="h-1 w-full" />
                        </div>
                        <Badge variant={avgProg >= 50 ? 'secondary' : 'outline'} className="text-[9px] sm:text-xs shrink-0 px-1.5 py-0">{perfLabel}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium text-sm">No advisor data found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluators */}
        <TabsContent value="evaluators">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-xl flex items-center gap-2">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Evaluator Progress
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Track submission status</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/dashboard/coordinator/notify-evaluators" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                    <Send className="h-3.5 w-3.5" /> Notify
                  </Button>
                </Link>
                <Link href="/dashboard/coordinator/evaluator-progress" className="flex-1 sm:flex-none">
                  <Button size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                    Full Report <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 space-y-3">
              {evaluatorMetrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Star className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium text-sm">No evaluators assigned yet</p>
                </div>
              ) : (
                evaluatorMetrics.map((ev) => {
                  const statusLabel = ev.completion >= 75 ? 'On Track' : ev.completion >= 40 ? 'In Progress' : ev.pending > 0 ? 'Pending' : 'No Tasks'
                  return (
                    <div key={ev.id} className="flex items-center gap-3 sm:gap-4 rounded-xl border p-2.5 sm:p-3 hover:bg-muted/40 transition-colors">
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">{ev.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-background border flex items-center justify-center">
                          <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-primary fill-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{ev.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{ev.email}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-4 shrink-0 text-[10px] sm:text-xs text-muted-foreground">
                        <div className="text-center">
                          <p className="font-semibold text-foreground text-xs sm:text-sm">{ev.assigned}</p>
                          <p>Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-primary text-xs sm:text-sm">{ev.submitted}</p>
                          <p>Submitted</p>
                        </div>
                      </div>
                      <div className="hidden xs:block w-16 sm:w-24 space-y-1 shrink-0">
                        <div className="flex justify-between text-[9px] sm:text-xs">
                          <span className="text-muted-foreground">Done</span>
                          <span className="font-medium">{ev.completion}%</span>
                        </div>
                        <Progress value={ev.completion} className="h-1" />
                      </div>
                      <Badge variant="secondary" className="text-[9px] sm:text-xs shrink-0 px-1.5 py-0">{statusLabel}</Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades */}
        <TabsContent value="grades">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-xl">Grade Overview</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Capstone I and II grades per student</CardDescription>
              </div>
              <Link href="/dashboard/coordinator/grade-management" className="w-full sm:w-auto">
                <Button size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                  <Calculator className="h-3.5 w-3.5" /> Manage Grades
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[600px] sm:min-w-0">
                <DataTable data={capstoneGrades.slice(0, 5)} columns={gradeColumns} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints */}
        <TabsContent value="complaints">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-xl">Complaint Management</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Review and resolve student disputes</CardDescription>
              </div>
              <Link href="/dashboard/coordinator/complaints" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-[10px] sm:text-xs h-8">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[600px] sm:min-w-0">
                <DataTable data={mockComplaints} columns={complaintColumns} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Quick Actions ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">Quick Actions</h2>
          <p className="text-[10px] sm:text-sm text-muted-foreground">Navigate to key features</p>
        </div>
        <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="group flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer h-full">
                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm">{action.label}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary p-2 sm:p-2.5 text-primary-foreground shadow-sm">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm font-semibold leading-none">DC Committee Access</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">Jump into committee review assignments.</p>
            </div>
          </div>
          <Button asChild size="sm" className="w-full gap-1.5 sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
            <Link href="/dashboard/coordinator/dc-committee">
              Access DC Committee
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>

  )
}
