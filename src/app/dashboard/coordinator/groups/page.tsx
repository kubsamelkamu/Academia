"use client"

import React, { useState, useMemo } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Eye,
  GraduationCap,
  Calendar,
  Star,
  Activity,
  Lock,
  Target,
  UserCheck,
  UserPlus,
  Send,
  X,
  Info,
  LayoutGrid,
  List,
  ExternalLink,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCoordinatorProjectTracking, useCoordinatorStudentDirectory } from "@/lib/hooks/use-coordinator-analytics"
import type { CoordinatorProjectTrackingItem, CoordinatorProjectTrackingMilestone } from "@/types/project-tracking"
import type { CoordinatorStudentDirectoryItem } from "@/types/student-analytics"

/* ─── Types ────────────────────────────────────────────────────────────── */
type ProjectStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "UNKNOWN"
type BackendProjectStatusFilter = "all" | "ACTIVE" | "COMPLETED" | "CANCELLED"

interface Activity {
  id: string
  name: string
  progress: number
  status: "completed" | "in_progress" | "pending" | "locked"
  rawStatus: string
  dueDate?: string
  submittedAt?: string | null
  approvedFileUrl?: string | null
  approvedFileName?: string | null
  approvedAt?: string | null
  approvedByName?: string | null
}

interface Student {
  id: string
  name: string
  email: string
  avatar: string
  avatarUrl?: string | null
  role: "leader" | "member"
  tasksDone: number
  tasksTotal: number
  lastActive: string
  contribution: number
}

interface Project {
  id: string
  title: string
  groupName: string
  groupId: string
  status: ProjectStatus
  dueDate: string
  startDate: string
  completionPercent: number
  scheduleVariance: number
  domain: string
  advisor: string
  evaluator: string
  description: string
  students: Student[]
  activities: Activity[]
  submissionsCount: number
  grade?: number
}

interface StudentDirectoryCardItem {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  avatar: string
  role: "leader" | "member"
  userStatus: string
  lastActive: string
  techStack: string[]
  bio: string | null
  groupName: string
  groupStatus: string | null
}

/* ─── Config ─────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<ProjectStatus, { label: string; cls: string; dot: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Active", cls: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary", icon: Activity },
  COMPLETED: { label: "Completed", cls: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", cls: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive", icon: AlertTriangle },
  UNKNOWN: { label: "Unknown", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", icon: Clock },
}

const ACTIVITY_CFG = {
  completed:   { cls: "bg-primary/10 text-primary",               dot: "bg-primary" },
  in_progress: { cls: "bg-amber-500/10 text-amber-600",           dot: "bg-amber-500" },
  pending:     { cls: "bg-muted text-muted-foreground",           dot: "bg-muted-foreground" },
  locked:      { cls: "bg-muted/50 text-muted-foreground/60",     dot: "bg-muted-foreground/30" },
}

const BACKEND_PROJECT_STATUS_OPTIONS: Array<{
  value: BackendProjectStatusFilter
  label: string
}> = [
  { value: "all", label: "All Backend Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

const MILESTONE_BADGE_CFG: Record<string, string> = {
  APPROVED: "bg-primary/10 text-primary border-primary/20",
  SUBMITTED: "bg-amber-500/10 text-amber-700 border-amber-400/30",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  PENDING: "bg-muted text-muted-foreground border-border",
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.round(diff / 86400000)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

function formatLastLogin(value?: string | null) {
  if (!value) return "Never logged in"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Never logged in"

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function normalizeRole(value?: string | null): "leader" | "member" {
  return value?.trim().toUpperCase() === "LEADER" ? "leader" : "member"
}

function mapDirectoryItemToStudentCard(item: CoordinatorStudentDirectoryItem): StudentDirectoryCardItem {
  const fullName = [item.student.firstName, item.student.lastName].filter(Boolean).join(" ").trim()
  const displayName = fullName || item.student.email || "Student"

  return {
    id: item.student.id,
    name: displayName,
    email: item.student.email,
    avatarUrl: item.student.avatarUrl,
    avatar: initials(displayName),
    role: normalizeRole(item.group.role),
    userStatus: item.student.userStatus,
    lastActive: formatLastLogin(item.student.lastLoginAt),
    techStack: item.profile.techStack ?? [],
    bio: item.profile.bio,
    groupName: item.group.name || "No group yet",
    groupStatus: item.group.status,
  }
}

function normalizeMilestoneStatus(milestone: CoordinatorProjectTrackingMilestone): Activity["status"] {
  const status = milestone.status.trim().toUpperCase()
  if (status === "APPROVED") return "completed"
  if (status === "SUBMITTED" || status === "REJECTED") return "in_progress"
  if (status === "PENDING") return new Date(milestone.dueDate).getTime() > Date.now() ? "pending" : "locked"
  return "pending"
}

function normalizeProjectStatus(projectStatus?: string | null): ProjectStatus {
  const status = projectStatus?.trim().toUpperCase()
  if (status === "ACTIVE" || status === "COMPLETED" || status === "CANCELLED") {
    return status
  }

  return "UNKNOWN"
}

function getMilestoneProgress(milestone: CoordinatorProjectTrackingMilestone): number {
  const status = milestone.status.trim().toUpperCase()
  if (status === "APPROVED") return 100
  if (status === "SUBMITTED") return 80
  if (status === "REJECTED") return 55
  if (status === "PENDING") return new Date(milestone.dueDate).getTime() > Date.now() ? 20 : 0
  return 0
}

function toStudentFromMember(
  member: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    avatarUrl: string | null
    status: string
  },
  role: "leader" | "member",
  totalMilestones: number,
  approvedMilestones: number,
  index: number
): Student {
  const name = member.fullName?.trim() || [member.firstName, member.lastName].filter(Boolean).join(" ").trim() || member.email
  return {
    id: member.id,
    name,
    email: member.email,
    avatar: initials(name),
    avatarUrl: member.avatarUrl,
    role,
    tasksDone: approvedMilestones,
    tasksTotal: totalMilestones,
    lastActive: member.status,
    contribution: Math.max(10, Math.round(100 / Math.max(index + 1, 2))),
  }
}

function deriveScheduleVariance(item: CoordinatorProjectTrackingItem): number {
  const overdueCount = item.milestones.filter((milestone) => {
    const milestoneStatus = milestone.status.trim().toUpperCase()
    return milestoneStatus !== "APPROVED" && new Date(milestone.dueDate).getTime() < Date.now()
  }).length

  if (overdueCount > 0) {
    return -Math.min(90, overdueCount * 20)
  }

  if (item.milestoneProgress.approved === item.milestoneProgress.total && item.milestoneProgress.total > 0) {
    return 10
  }

  if (item.milestoneProgress.percentage === 0) {
    return 0
  }

  return Math.min(25, Math.round(item.milestoneProgress.percentage / 10))
}

function mapTrackingProjectToUiProject(item: CoordinatorProjectTrackingItem): Project {
  const milestones = [...item.milestones].sort(
    (left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
  )
  const activities: Activity[] = milestones.map((milestone) => ({
    id: milestone.id,
    name: milestone.title,
    progress: getMilestoneProgress(milestone),
    status: normalizeMilestoneStatus(milestone),
    rawStatus: milestone.status.trim().toUpperCase(),
    dueDate: milestone.dueDate,
    submittedAt: milestone.submittedAt,
    approvedFileUrl: milestone.approvedSubmissionFile?.fileUrl ?? null,
    approvedFileName: milestone.approvedSubmissionFile?.fileName ?? null,
    approvedAt: milestone.approvedSubmissionFile?.approvedAt ?? null,
    approvedByName: milestone.approvedSubmissionFile?.approvedBy?.fullName ?? null,
  }))

  const totalMilestones = item.milestoneProgress.total
  const approvedMilestones = item.milestoneProgress.approved
  const leader = item.group?.leader
    ? [toStudentFromMember(item.group.leader, "leader", totalMilestones, approvedMilestones, 0)]
    : []
  const members = (item.group?.members ?? []).map((member, index) =>
    toStudentFromMember(member, "member", totalMilestones, approvedMilestones, index + 1)
  )
  const students = [...leader, ...members]
  const dueDate = milestones[milestones.length - 1]?.dueDate ?? item.updatedAt
  const domain = item.group?.technologies?.length
    ? item.group.technologies.slice(0, 2).join(" / ")
    : "Project Tracking"

  return {
    id: item.projectId,
    title: item.projectTitle,
    groupName: item.group?.name ?? "Unassigned Group",
    groupId: item.group?.id ?? item.projectId,
    status: normalizeProjectStatus(item.projectStatus),
    dueDate,
    startDate: item.createdAt,
    completionPercent: item.milestoneProgress.percentage,
    scheduleVariance: deriveScheduleVariance(item),
    domain,
    advisor: item.advisor?.fullName ?? "Not assigned",
    evaluator: "Not assigned",
    description:
      item.projectDescription?.trim() ||
      item.group?.objectives?.trim() ||
      item.proposal?.title?.trim() ||
      "No project description available.",
    students,
    activities,
    submissionsCount: milestones.filter((milestone) => milestone.approvedSubmissionFile !== null).length,
  }
}

/* ─── Activity Item ─────────────────────────────────────────────────── */
function ActivityItem({ act, onClick }: { act: Activity; onClick: () => void }) {
  const cfg = ACTIVITY_CFG[act.status]
  const isLocked = act.status === "locked"
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/40 py-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 last:border-0"
    >
      <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", isLocked ? "bg-muted/50" : "bg-muted")}>
        {isLocked ? <Lock className="h-3 w-3 text-muted-foreground/40" /> : <Activity className="h-3 w-3 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn("block text-sm font-medium truncate", isLocked && "text-muted-foreground/60")}>{act.name}</span>
        {act.dueDate ? (
          <span className="text-[10px] text-muted-foreground">Due {fmtDate(act.dueDate)}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] h-5 px-1.5",
            isLocked ? "bg-muted/50 text-muted-foreground border-border" : MILESTONE_BADGE_CFG[act.rawStatus] ?? "bg-muted text-muted-foreground border-border"
          )}
        >
          {act.rawStatus}
        </Badge>
        <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      </div>
    </button>
  )
}

function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/60">
      <div className="h-1 w-full bg-muted" />
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-5 w-2/3 rounded bg-muted/70" />
          <div className="h-4 w-1/2 rounded bg-muted/50" />
        </div>
        <div className="h-10 rounded-lg bg-muted/40" />
        <div className="space-y-2">
          <div className="h-4 w-1/3 rounded bg-muted/50" />
          <div className="h-2.5 rounded-full bg-muted/50" />
          <div className="h-3 w-1/2 rounded bg-muted/40" />
        </div>
        <div className="space-y-2 rounded-lg border border-border/50 px-3 py-3">
          <div className="h-4 w-1/3 rounded bg-muted/50" />
          <div className="h-10 rounded bg-muted/40" />
          <div className="h-10 rounded bg-muted/40" />
          <div className="h-10 rounded bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Project Card (matches screenshot style) ───────────────────────── */
function ProjectCard({ project, onView, onSelectMilestone }: { project: Project; onView: () => void; onSelectMilestone: (milestoneId: string) => void }) {
  const sc = STATUS_CFG[project.status]

  return (
    <Card className="group border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Top stripe by status */}
      <div className={cn("h-1 w-full", project.status === "COMPLETED" ? "bg-primary/70" : project.status === "CANCELLED" ? "bg-destructive" : project.status === "ACTIVE" ? "bg-primary" : "bg-muted-foreground")} />

      <CardContent className="p-5 space-y-4">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[0.95rem] leading-snug mb-1 group-hover:text-primary transition-colors">{project.title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {project.groupName} · {project.domain}
            </p>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0 flex items-center gap-1", sc.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
            {sc.label}
          </Badge>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", sc.cls)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                {sc.label}
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground">{project.completionPercent}% complete</span>
          </div>
          <Progress
            value={project.completionPercent}
            className="h-2.5 rounded-full"
          />
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <TrendingUp className="h-3 w-3" /> Milestones
          </div>
          <div className="rounded-lg border border-border/50 px-3 overflow-hidden">
            {project.activities.slice(0, 3).map(act => (
              <ActivityItem key={act.id} act={act} onClick={() => onSelectMilestone(act.id)} />
            ))}
          </div>
          {project.activities.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1.5 text-center">+{project.activities.length - 3} more milestones</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex -space-x-2">
            {project.students.map(s => (
              <Avatar key={s.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={s.avatarUrl ?? undefined} alt={s.name} />
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{s.avatar}</AvatarFallback>
              </Avatar>
            ))}
            <span className="ml-2.5 text-xs text-muted-foreground self-center">{project.students.length} students</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors" onClick={onView}>
            <Eye className="h-3 w-3" /> View Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Student Row (in detail sheet) ─────────────────────────────────── */
function StudentRow({ student }: { student: Student }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{student.avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{student.name}</span>
            {student.role === "leader" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/5 text-primary border-primary/20">
                <Star className="h-2.5 w-2.5 mr-0.5" /> Leader
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{student.email}</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Activity className="h-3 w-3" /> Last active {student.lastActive}
      </p>
    </div>
  )
}

/* ─── Project Detail Sheet ───────────────────────────────────────────── */
function ProjectDetailSheet({
  project,
  open,
  onClose,
  selectedMilestoneId,
}: {
  project: Project | null
  open: boolean
  onClose: () => void
  selectedMilestoneId?: string | null
}) {
  const [activeTab, setActiveTab]   = useState("overview")
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    if (selectedMilestoneId) {
      setActiveTab("activities")
      setExpandedMilestoneId(selectedMilestoneId)
      return
    }

    setActiveTab("overview")
    setExpandedMilestoneId(null)
  }, [open, project?.id, selectedMilestoneId])

  if (!project) return null

  const sc = STATUS_CFG[project.status]
  const days = daysUntil(project.dueDate)
  const overdue = days < 0

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs", sc.cls)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
                    {sc.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">{project.domain}</Badge>
                </div>
                <SheetTitle className="text-base leading-tight">{project.title}</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">{project.groupName} · {project.students.length} students</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
                <TabsTrigger value="overview" className="text-xs shrink-0">Overview</TabsTrigger>
                <TabsTrigger value="students" className="text-xs shrink-0">Students</TabsTrigger>
                <TabsTrigger value="activities" className="text-xs shrink-0">Milestones</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Description */}
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{project.description}</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Progress</p>
                    <p className="text-2xl font-bold text-primary">{project.completionPercent}%</p>
                    <Progress value={project.completionPercent} className="h-1.5 mt-2" />
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Schedule</p>
                    <p className={cn("text-2xl font-bold", overdue ? "text-destructive" : project.scheduleVariance < 0 ? "text-amber-600" : "text-primary")}>
                      {overdue ? `${Math.abs(days)}d` : project.scheduleVariance < 0 ? `${Math.abs(project.scheduleVariance)}%` : `+${project.scheduleVariance}%`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{overdue ? "days overdue" : project.scheduleVariance < 0 ? "behind schedule" : "ahead of schedule"}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Submissions</p>
                    <p className="text-2xl font-bold">{project.submissionsCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">documents submitted</p>
                  </div>
                  {project.grade && (
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Final Grade</p>
                      <p className="text-2xl font-bold text-primary">{project.grade}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">out of 100</p>
                    </div>
                  )}
                  {!project.grade && (
                    <div className="rounded-xl border bg-card p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
                      <p className="text-sm font-bold">{fmtDate(project.dueDate)}</p>
                      <p className={cn("text-[10px] mt-1", overdue ? "text-destructive" : "text-muted-foreground")}>
                        {overdue ? `${Math.abs(days)} days overdue` : `${days} days remaining`}
                      </p>
                    </div>
                  )}
                </div>

                {/* People */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">People</p>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Advisor</p>
                      <p className="text-sm font-medium">{project.advisor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Group</p>
                      <p className="text-sm font-medium">{project.groupName}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">{project.students.length} students in this group</p>
                {project.students.map(s => (
                  <StudentRow key={s.id} student={s} />
                ))}
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="activities" className="mt-4">
                <div className="rounded-xl border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                    <p className="text-xs font-semibold">{project.activities.length} Total Milestones</p>
                    <p className="text-xs text-muted-foreground">
                      {project.activities.filter(a => a.status === "completed").length} completed
                    </p>
                  </div>
                  <div className="px-4 divide-y divide-border/40">
                    {project.activities.map((act, i) => {
                      const isExpanded = expandedMilestoneId === act.id

                      return (
                      <button
                        type="button"
                        key={act.id}
                        onClick={() => setExpandedMilestoneId((current) => current === act.id ? null : act.id)}
                        className={cn(
                          "block w-full py-3 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                          isExpanded && "bg-muted/20"
                        )}
                      >
                        <div className="flex items-start gap-3">
                        <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          act.status === "completed" ? "bg-primary/10 text-primary" : act.status === "locked" ? "bg-muted/50 text-muted-foreground/40" : "bg-amber-500/10 text-amber-600")}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn("text-sm font-medium", act.status === "locked" && "text-muted-foreground/60")}>{act.name}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] h-5 px-1.5",
                                MILESTONE_BADGE_CFG[act.rawStatus] ?? "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {act.rawStatus}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            {act.dueDate ? <span>Due {fmtDate(act.dueDate)}</span> : null}
                            {act.submittedAt ? <span>Submitted {fmtDate(act.submittedAt)}</span> : null}
                            {act.approvedAt ? <span>Approved {fmtDateTime(act.approvedAt)}</span> : null}
                            {act.approvedByName ? <span>By {act.approvedByName}</span> : null}
                          </div>
                          {isExpanded ? (
                            <div className="mt-2 rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs text-muted-foreground">
                              <p>
                                Milestone status: <span className="font-medium text-foreground">{act.rawStatus}</span>
                              </p>
                              {act.approvedFileName ? <p className="mt-1">Approved file: <span className="font-medium text-foreground">{act.approvedFileName}</span></p> : null}
                            </div>
                          ) : null}
                          {isExpanded && act.approvedFileUrl && act.approvedFileName ? (
                            <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1 font-medium text-primary">
                                  <FileText className="h-3.5 w-3.5" />
                                  Approved file attached
                                </span>
                                <span>{act.approvedFileName}</span>
                              </div>
                              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" asChild>
                                <a href={act.approvedFileUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open Approved File
                                </a>
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <div className={cn("h-2 w-2 rounded-full shrink-0", ACTIVITY_CFG[act.status].dot)} />
                        </div>
                      </button>
                    )})}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ─── All-Students Card ─────────────────────────────────────────────── */
function AllStudentCard({ student, project }: {
  student: StudentDirectoryCardItem
  project: { title: string; groupName: string; status: string | null }
}) {
  const groupStatus = (project.status ?? "UNKNOWN").trim().toUpperCase()
  const statusTone =
    groupStatus === "APPROVED"
      ? "bg-primary/10 text-primary border-primary/20"
      : groupStatus === "REJECTED"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-muted text-muted-foreground border-border"

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{student.avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{student.name}</span>
            {student.role === "leader" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/5 text-primary border-primary/20">
                <Star className="h-2.5 w-2.5 mr-0.5" />Leader
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{student.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {project.title}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className="text-xs font-bold">{student.techStack.length}</p>
          <p className="text-[9px] text-muted-foreground">Skills</p>
        </div>
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className="text-xs font-bold">{student.userStatus}</p>
          <p className="text-[9px] text-muted-foreground">Account</p>
        </div>
        <div className="rounded-lg bg-muted/50 py-1.5">
          <p className={cn("text-xs font-bold", groupStatus === "APPROVED" ? "text-primary" : groupStatus === "REJECTED" ? "text-destructive" : "text-foreground")}>{groupStatus === "UNKNOWN" ? "None" : groupStatus}</p>
          <p className="text-[9px] text-muted-foreground">Group</p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
        {student.bio?.trim() || "Profile not completed"}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Activity className="h-2.5 w-2.5" />{student.lastActive}</span>
        <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{project.groupName}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(student.techStack.length > 0 ? student.techStack : ["No stack yet"]).slice(0, 3).map((item) => (
          <Badge key={item} variant="outline" className="text-[10px] h-5 px-1.5">
            {item}
          </Badge>
        ))}
        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", statusTone)}>
          {project.status ?? "No group yet"}
        </Badge>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function GroupsPage() {
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const initialSearch = searchParams.get("search")?.trim() ?? ""
  const [search, setSearch]         = useState(initialSearch)
  const [statusFilter, setStatus]   = useState<BackendProjectStatusFilter>("all")
  const [domainFilter, setDomain]   = useState("all")
  const [projectPage, setProjectPage] = useState(1)
  const [projectPageInput, setProjectPageInput] = useState("1")
  const [selected, setSelected]     = useState<Project | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen]   = useState(false)

  const [stuView, setStuView]       = useState<"grid" | "table">("grid")
  const [stuSearch, setStuSearch]   = useState("")
  const [studentUserStatus, setStudentUserStatus] = useState("all")
  const [studentGroupStatus, setStudentGroupStatus] = useState("all")

  /* Chat / email from students tab */
  const [chatOpen2, setChatOpen2]   = useState(false)
  const [chatStu2, setChatStu2]     = useState<{ student: Student; project: Project } | null>(null)
  const [chatMsg2, setChatMsg2]     = useState("")
  const [sending2, setSending2]     = useState(false)

  const [studentPage, setStudentPage] = useState(1)
  const studentPageSize = 9
  const projectPageSize = 9

  const departmentId = user?.departmentId ?? user?.department?.id ?? null

  const projectTrackingQuery = useCoordinatorProjectTracking({
    departmentId,
    search: search.trim() || undefined,
    projectStatus: statusFilter !== "all" ? statusFilter : undefined,
    page: projectPage,
    limit: projectPageSize,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const studentDirectoryQuery = useCoordinatorStudentDirectory({
    departmentId,
    search: stuSearch.trim() || undefined,
    userStatus: studentUserStatus !== "all" ? studentUserStatus : undefined,
    groupStatus: studentGroupStatus !== "all" ? studentGroupStatus : undefined,
    hasGroup: true,
    page: studentPage,
    limit: studentPageSize,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const projectItems = useMemo(
    () => (projectTrackingQuery.data?.items ?? []).map(mapTrackingProjectToUiProject),
    [projectTrackingQuery.data?.items]
  )

  const domains = useMemo(
    () => Array.from(new Set(projectItems.map((project) => project.domain))).sort(),
    [projectItems]
  )

  const filtered = useMemo(() => projectItems.filter(p => {
    const mD  = domainFilter === "all" || p.domain === domainFilter
    return mD
  }), [domainFilter, projectItems])

  const allStudents = useMemo(
    () => (studentDirectoryQuery.data?.items ?? []).map((item) => ({
      student: mapDirectoryItemToStudentCard(item),
      project: {
        title: item.group.name || "No group yet",
        groupName: item.group.name || "No group yet",
        status: item.group.status,
      },
    })),
    [studentDirectoryQuery.data?.items]
  )

  const studentSummary = studentDirectoryQuery.data?.summary
  const studentPagination = studentDirectoryQuery.data?.pagination

  const kpi = [
    { label: "Total Groups", value: studentSummary?.totalProjectGroups ?? 0,        icon: BookOpen,      bg: "bg-primary/10",     color: "text-primary" },
    { label: "Approved",     value: studentSummary?.approvedProjectGroups ?? 0,     icon: CheckCircle2,  bg: "bg-primary/10",     color: "text-primary" },
    { label: "Rejected",     value: studentSummary?.rejectedProjectGroups ?? 0,     icon: AlertTriangle, bg: "bg-destructive/10", color: "text-destructive" },
    { label: "Total Students", value: studentSummary?.totalStudents ?? 0,           icon: Users,         bg: "bg-muted",          color: "text-foreground" },
    { label: "Filtered Results", value: studentPagination?.total ?? 0,               icon: Filter,        bg: "bg-amber-500/10",   color: "text-amber-600" },
    { label: "This Page", value: allStudents.length,                                 icon: List,          bg: "bg-muted",          color: "text-foreground" },
  ]

  const totalStudentResults = studentDirectoryQuery.data?.pagination.total ?? 0
  const studentPages = studentDirectoryQuery.data?.pagination.pages ?? 1
  const projectPagination = projectTrackingQuery.data?.pagination
  const totalProjectResults = projectPagination?.totalItems ?? 0
  const totalProjectPages = Math.max(1, projectPagination?.totalPages ?? 1)
  const projectGeneratedAt = projectTrackingQuery.data?.generatedAt ?? null

  React.useEffect(() => {
    setStudentPage(1)
  }, [stuSearch, studentGroupStatus, studentUserStatus])

  React.useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  React.useEffect(() => {
    setProjectPage(1)
  }, [search, statusFilter])

  React.useEffect(() => {
    setProjectPageInput(String(projectPage))
  }, [projectPage])

  const handleProjectPageJump = () => {
    const parsed = Number.parseInt(projectPageInput, 10)
    if (!Number.isFinite(parsed)) {
      setProjectPageInput(String(projectPage))
      return
    }

    setProjectPage(Math.min(totalProjectPages, Math.max(1, parsed)))
  }

  const openDetail = (p: Project, milestoneId?: string | null) => {
    setSelected(p)
    setSelectedMilestoneId(milestoneId ?? null)
    setSheetOpen(true)
  }

  const handleStudentChat = async () => {
    if (!chatMsg2.trim() || !chatStu2) return
    setSending2(true)
    await new Promise(r => setTimeout(r, 600))
    setSending2(false)
    toast.success(`Message sent to ${chatStu2.student.name}`)
    setChatMsg2("")
    setChatOpen2(false)
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Groups & Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor all project groups, track progress, and coordinate with students
            </p>
          </div>
        </div>
        <div className="pl-11 sm:pl-0 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">
            {studentSummary?.totalProjectGroups ?? 0} groups
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
            {studentDirectoryQuery.data?.summary.totalStudents ?? 0} students
          </Badge>
          <Link href="/dashboard/coordinator/groups/approvals">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-primary/20 text-primary hover:bg-primary/10">
              <CheckCircle2 className="h-3.5 w-3.5" /> Group Approval
            </Button>
          </Link>
          <Link href="/dashboard/coordinator/groups/applications">
            <Button size="sm" className="gap-1.5 h-8 text-xs">
              <UserPlus className="h-3.5 w-3.5" /> Group Leader Applications
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpi.map(s => (
          <Card key={s.label} className="group border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Page Tabs */}
      <Tabs defaultValue="projects">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="projects" className="gap-1.5 shrink-0 text-sm">
            <BookOpen className="h-4 w-4" /> All Projects
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5 shrink-0 text-sm">
            <GraduationCap className="h-4 w-4" /> All Students
          </TabsTrigger>
        </TabsList>

        {/* ── Projects Tab ── */}
        <TabsContent value="projects" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title, group, or domain…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-40 shrink-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {BACKEND_PROJECT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={domainFilter} onValueChange={setDomain}>
              <SelectTrigger className="h-10 w-44 shrink-0">
                <Target className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all" || domainFilter !== "all") && (
              <Button variant="ghost" size="sm" className="h-10 shrink-0 text-xs"
                onClick={() => { setSearch(""); setStatus("all"); setDomain("all") }}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Cards Grid */}
          {projectTrackingQuery.isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {projectTrackingQuery.error instanceof Error ? projectTrackingQuery.error.message : "Failed to load project tracking."}
            </div>
          ) : projectTrackingQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: projectPageSize }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </div>
          ) : projectItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 py-20 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No tracked projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The department tracking endpoint returned no projects for the current scope.
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onView={() => openDetail(p)}
                  onSelectMilestone={(milestoneId) => openDetail(p, milestoneId)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 py-20 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No projects match this view</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try clearing the domain filter or choose a different backend status.
              </p>
            </div>
          )}

          {totalProjectPages > 1 ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-semibold text-foreground">{projectPage}</span> of {totalProjectPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={projectPage <= 1 || projectTrackingQuery.isFetching}
                  onClick={() => setProjectPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={projectPage >= totalProjectPages || projectTrackingQuery.isFetching}
                  onClick={() => setProjectPage((current) => Math.min(totalProjectPages, current + 1))}
                >
                  Next
                </Button>
                <div className="flex items-center gap-1 pl-1">
                  <Input
                    type="number"
                    min={1}
                    max={totalProjectPages}
                    value={projectPageInput}
                    onChange={(event) => setProjectPageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleProjectPageJump()
                      }
                    }}
                    className="h-8 w-16"
                    aria-label="Jump to project page"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={projectTrackingQuery.isFetching}
                    onClick={handleProjectPageJump}
                  >
                    Go
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Students Tab ── */}
        <TabsContent value="students" className="mt-4 space-y-4">
          {/* Controls row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, email, or group…"
                value={stuSearch}
                onChange={e => setStuSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={studentUserStatus} onValueChange={setStudentUserStatus}>
              <SelectTrigger className="h-10 w-40 shrink-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="User status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={studentGroupStatus} onValueChange={setStudentGroupStatus}>
              <SelectTrigger className="h-10 w-44 shrink-0">
                <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Group status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Group Statuses</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            {(stuSearch || studentUserStatus !== "all" || studentGroupStatus !== "all") && (
              <Button variant="ghost" size="sm" className="h-10 shrink-0 text-xs"
                onClick={() => {
                  setStuSearch("")
                  setStudentUserStatus("all")
                  setStudentGroupStatus("all")
                }}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 shrink-0">
              <Button
                variant={stuView === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setStuView("grid")}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={stuView === "table" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setStuView("table")}
                title="Table view"
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {studentDirectoryQuery.isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {studentDirectoryQuery.error instanceof Error ? studentDirectoryQuery.error.message : "Failed to load students."}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{allStudents.length}</span> of {totalStudentResults} students
              </p>

              {studentDirectoryQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GraduationCap className="h-8 w-8 text-muted-foreground/30 mb-2 animate-pulse" />
                  <p className="text-sm font-medium text-muted-foreground">Loading students</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Fetching department student directory.</p>
                </div>
              ) : stuView === "grid" ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {allStudents.map(({ student, project }) => (
                      <AllStudentCard
                        key={student.id}
                        student={student}
                        project={project}
                      />
                    ))}
                  </div>
                  {allStudents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No students found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No students matched your search.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Student</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Email</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Account Status</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Last Login</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Group</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Group Role</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Group Review Status</th>
                          <th className="text-right px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {allStudents.map(({ student, project }) => (
                          <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{student.avatar}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm leading-tight truncate max-w-[180px]">{student.name}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {student.role === "leader" && (
                                      <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-primary/5 text-primary border-primary/20 leading-none">
                                        Leader
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-muted-foreground">{student.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">{student.userStatus}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{student.lastActive}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-xs font-medium">{project.groupName}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                                  {student.bio?.trim() || "Profile not completed"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {student.role === "leader" ? "LEADER" : "MEMBER"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  project.status === "APPROVED"
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : project.status === "REJECTED"
                                      ? "bg-destructive/10 text-destructive border-destructive/20"
                                      : "bg-muted text-muted-foreground border-border"
                                )}
                              >
                                {project.status ?? "No group yet"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                  title="Chat"
                                  onClick={() => { setChatStu2({ student, project }); setChatOpen2(true) }}>
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost"
                                  className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                  title="Email"
                                  onClick={() => {
                                    window.open(`mailto:${student.email}?subject=Re: ${project.title}`)
                                    toast.success("Email client opened", { description: `Composing to ${student.name}` })
                                  }}>
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {allStudents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No students found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No students matched your search.</p>
                    </div>
                  )}
                </div>
              )}

              {studentPages > 1 ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{studentPage}</span> of {studentPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={studentPage <= 1 || studentDirectoryQuery.isFetching}
                      onClick={() => setStudentPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={studentPage >= studentPages || studentDirectoryQuery.isFetching}
                      onClick={() => setStudentPage((current) => Math.min(studentPages, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Detail Sheet */}
      <ProjectDetailSheet
        project={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selectedMilestoneId={selectedMilestoneId}
      />

      {/* Students Tab Chat Dialog */}
      <Dialog open={chatOpen2} onOpenChange={v => !v && setChatOpen2(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Avatar className="h-7 w-7">
                <AvatarImage src={chatStu2?.student.avatarUrl ?? undefined} alt={chatStu2?.student.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{chatStu2?.student.avatar}</AvatarFallback>
              </Avatar>
              {chatStu2?.student.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Re: <span className="font-medium text-foreground">{chatStu2?.project.title}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Textarea
              placeholder={`Hi ${chatStu2?.student.name.split(" ")[0]}, I wanted to follow up on…`}
              value={chatMsg2}
              onChange={e => setChatMsg2(e.target.value)}
              className="resize-none min-h-[100px] text-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setChatOpen2(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" disabled={sending2 || !chatMsg2.trim()} onClick={handleStudentChat}>
                {sending2 ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
