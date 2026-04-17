"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Megaphone,
  Send,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle2,
  FolderKanban,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  Award,
  Activity,
  Star,
  GraduationCap,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { useCoordinatorAdvisorOverview } from '@/lib/hooks/use-coordinator-analytics'
import type {
  CoordinatorAdvisorOverviewAdvisor,
  CoordinatorAdvisorOverviewProject,
} from '@/types/advisor-analytics'

/* ─── Types ───────────────────────────────────────────────────────────── */
interface AdvisorMetrics {
  id: string
  advisorProfileId: string
  name: string
  email: string
  totalProjects: number
  activeProjects: number
  completedProjects: number
  avgProgress: number
  pendingEvaluations: number
  overdueTasks: number
  lastActivity: string
  performance: 'excellent' | 'good' | 'needs_attention'
  currentLoad: number
  loadLimit: number
  availableCapacity: number
  projects: {
    id: string
    title: string
    groupName: string
    progress: number
    description: string | null
    status: string
    objectives: string | null
    technologies: string[]
    totalMembers: number
    members: {
      id: string
      fullName: string
      email: string
      role: 'leader' | 'member'
    }[]
    milestones: {
      id: string
      title: string
      description: string | null
      status: string
      dueDate: string
      submittedAt: string | null
      feedback: string | null
    }[]
    pendingMilestones: number
    overdueMilestones: number
  }[]
}

function formatDisplayDate(value?: string | null) {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
}

function milestoneBadgeClass(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'SUBMITTED':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    case 'REJECTED':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function normalizeMilestoneStatus(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'SUBMITTED':
    case 'REJECTED':
      return status
    default:
      return 'PENDING'
  }
}

function milestoneSectionTitle(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'Approved'
    case 'SUBMITTED':
      return 'Submitted'
    case 'REJECTED':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

function formatRelativeTime(value?: string | null) {
  if (!value) return 'No recent activity'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'No recent activity'

  const diffMs = timestamp - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, 'day')
  }

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) {
    return formatter.format(diffMonths, 'month')
  }

  const diffYears = Math.round(diffDays / 365)
  return formatter.format(diffYears, 'year')
}

function getProjectOverdueMilestones(project: CoordinatorAdvisorOverviewProject) {
  const now = Date.now()

  return project.milestones.filter((milestone) => {
    if (milestone.status !== 'PENDING') return false
    const dueAt = new Date(milestone.dueDate).getTime()
    return !Number.isNaN(dueAt) && dueAt < now
  }).length
}

function mapAdvisorPerformance(avgProgress: number, overdueTasks: number): AdvisorMetrics['performance'] {
  if (avgProgress >= 75 && overdueTasks === 0) return 'excellent'
  if (avgProgress < 50 || overdueTasks > 1) return 'needs_attention'
  return 'good'
}

function mapAdvisorMetrics(advisor: CoordinatorAdvisorOverviewAdvisor): AdvisorMetrics {
  const projects = advisor.projects.map((project) => ({
    id: project.id,
    title: project.title,
    groupName: project.group.name,
    progress: project.progress.percentage,
    description: project.description,
    status: project.status,
    objectives: project.group.objectives,
    technologies: project.group.technologies,
    totalMembers: project.group.totalMembers,
    members: [
      ...(project.group.leader
        ? [{
            id: project.group.leader.id,
            fullName: project.group.leader.fullName,
            email: project.group.leader.email,
            role: 'leader' as const,
          }]
        : []),
      ...project.group.members.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        role: 'member' as const,
      })),
    ],
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      dueDate: milestone.dueDate,
      submittedAt: milestone.submittedAt,
      feedback: milestone.feedback,
    })),
    pendingMilestones: project.progress.pendingMilestones,
    overdueMilestones: getProjectOverdueMilestones(project),
  }))

  const pendingEvaluations = advisor.projects.reduce(
    (sum, project) => sum + project.progress.pendingMilestones + project.progress.submittedMilestones,
    0
  )
  const overdueTasks = projects.reduce((sum, project) => sum + project.overdueMilestones, 0)
  const latestProjectUpdate = advisor.projects
    .map((project) => project.updatedAt)
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null

  return {
    id: advisor.advisorId,
    advisorProfileId: advisor.advisorProfileId,
    name: advisor.fullName.trim() || [advisor.firstName, advisor.lastName].filter(Boolean).join(' ').trim() || 'Advisor',
    email: advisor.email,
    totalProjects: advisor.metrics.totalProjectsAdvising,
    activeProjects: advisor.metrics.activeProjectsCount,
    completedProjects: advisor.metrics.completedProjectsCount,
    avgProgress: advisor.metrics.overallProjectProgress,
    pendingEvaluations,
    overdueTasks,
    lastActivity: formatRelativeTime(latestProjectUpdate),
    performance: mapAdvisorPerformance(advisor.metrics.overallProjectProgress, overdueTasks),
    currentLoad: advisor.currentLoad,
    loadLimit: advisor.loadLimit,
    availableCapacity: advisor.availableCapacity,
    projects,
  }
}

function ProjectDetailDialog({
  project,
  open,
  onClose,
}: {
  project: AdvisorMetrics['projects'][number] | null
  open: boolean
  onClose: () => void
}) {
  if (!project) return null

  const milestoneSections = [
    { status: 'APPROVED', items: project.milestones.filter((milestone) => normalizeMilestoneStatus(milestone.status) === 'APPROVED') },
    { status: 'PENDING', items: project.milestones.filter((milestone) => normalizeMilestoneStatus(milestone.status) === 'PENDING') },
    { status: 'SUBMITTED', items: project.milestones.filter((milestone) => normalizeMilestoneStatus(milestone.status) === 'SUBMITTED') },
    { status: 'REJECTED', items: project.milestones.filter((milestone) => normalizeMilestoneStatus(milestone.status) === 'REJECTED') },
  ].filter((section) => section.items.length > 0)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> {project.title}
          </DialogTitle>
          <DialogDescription>
            {project.groupName} • {project.totalMembers} member{project.totalMembers !== 1 ? 's' : ''} • {project.progress}% progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Status</p>
              <p className="mt-1 text-sm font-semibold">{project.status}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Milestones</p>
              <p className="mt-1 text-sm font-semibold">{project.pendingMilestones}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Overdue Milestones</p>
              <p className="mt-1 text-sm font-semibold">{project.overdueMilestones}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Group Summary</p>
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Objectives</p>
                <p className="text-sm text-muted-foreground">{project.objectives?.trim() || 'No objectives provided.'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Technologies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.technologies.length > 0 ? (
                    project.technologies.map((technology) => (
                      <Badge key={technology} variant="outline" className="text-xs">{technology}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No technologies listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Group Members</p>
            <div className="grid gap-3 md:grid-cols-2">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {getInitials(member.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{member.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant={member.role === 'leader' ? 'default' : 'outline'} className="shrink-0 text-xs capitalize">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Milestones</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Approved', value: milestoneSections.find((section) => section.status === 'APPROVED')?.items.length ?? 0, tone: 'text-primary' },
                { label: 'Pending', value: milestoneSections.find((section) => section.status === 'PENDING')?.items.length ?? 0, tone: 'text-muted-foreground' },
                { label: 'Submitted', value: milestoneSections.find((section) => section.status === 'SUBMITTED')?.items.length ?? 0, tone: 'text-amber-700' },
                { label: 'Rejected', value: milestoneSections.find((section) => section.status === 'REJECTED')?.items.length ?? 0, tone: 'text-destructive' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className={`mt-1 text-lg font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              {milestoneSections.map((section) => (
                <div key={section.status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{milestoneSectionTitle(section.status)}</p>
                    <Badge variant="outline" className={`text-xs ${milestoneBadgeClass(section.status)}`}>
                      {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((milestone) => (
                      <div key={milestone.id} className="rounded-xl border bg-card p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{milestone.title}</p>
                            <p className="text-sm text-muted-foreground">{milestone.description?.trim() || 'No description provided.'}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs ${milestoneBadgeClass(milestone.status)}`}>
                            {milestone.status}
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-lg bg-muted/40 px-3 py-2">
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="mt-1 font-medium text-foreground">{formatDisplayDate(milestone.dueDate)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/40 px-3 py-2">
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="mt-1 font-medium text-foreground">{formatDisplayDate(milestone.submittedAt)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/40 px-3 py-2">
                            <p className="text-muted-foreground">Feedback</p>
                            <p className="mt-1 font-medium text-foreground">{milestone.feedback?.trim() || 'No feedback yet.'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function buildVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
}

/* ─── Config ──────────────────────────────────────────────────────────── */
const PERF_CONFIG = {
  excellent:      { label: 'Excellent',      dot: 'bg-primary',            badge: 'bg-primary/10 text-primary border-primary/20',            bar: 'bg-primary' },
  good:           { label: 'Good',           dot: 'bg-primary/50',          badge: 'bg-primary/[0.06] text-primary/80 border-primary/10',    bar: 'bg-primary/60' },
  needs_attention:{ label: 'Needs Attention',dot: 'bg-destructive',         badge: 'bg-destructive/10 text-destructive border-destructive/20',bar: 'bg-destructive' },
} as const

const PAGE_SIZE = 10

/* ─── Advisor Detail Sheet ────────────────────────────────────────────── */
function AdvisorSheet({
  advisor,
  open,
  onClose,
}: {
  advisor: AdvisorMetrics | null
  open: boolean
  onClose: () => void
}) {
  const [selectedProject, setSelectedProject] = useState<AdvisorMetrics['projects'][number] | null>(null)

  if (!advisor) return null

  const pc = PERF_CONFIG[advisor.performance]
  const projects = advisor.projects

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 gap-0">

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                {advisor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-base truncate">{advisor.name}</SheetTitle>
              <SheetDescription className="text-xs truncate">{advisor.email}</SheetDescription>
            </div>
            <Badge className={`ml-auto shrink-0 text-xs ${pc.badge}`}>{pc.label}</Badge>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">

          {/* KPI pills */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Total',     value: advisor.totalProjects,     color: 'text-primary' },
              { label: 'Active',    value: advisor.activeProjects,    color: 'text-foreground' },
              { label: 'Done',      value: advisor.completedProjects, color: 'text-foreground' },
              { label: 'Pending',   value: advisor.pendingEvaluations,color: advisor.pendingEvaluations > 0 ? 'text-destructive' : 'text-muted-foreground' },
            ].map(k => (
              <div key={k.label} className="rounded-xl bg-muted/40 py-2.5 px-1 space-y-0.5">
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg project progress</span>
              <span className="font-semibold">{advisor.avgProgress}%</span>
            </div>
            <Progress value={advisor.avgProgress} className="h-2" />
          </div>

          <Separator />

          {/* Projects breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5" /> Assigned Projects
            </p>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No projects assigned</p>
            ) : (
              <div className="space-y-2">
                {projects.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:border-primary/20 hover:bg-muted/30"
                    onClick={() => setSelectedProject(p)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.groupName}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      <p className="text-xs font-semibold text-primary">{p.progress}%</p>
                      <Progress value={p.progress} className="h-1 w-16" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Performance detail */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Performance Detail
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Overdue Tasks',    value: advisor.overdueTasks,         warn: advisor.overdueTasks > 0 },
                { label: 'Last Activity',    value: advisor.lastActivity,         warn: false },
                { label: 'Eval Pending',     value: `${advisor.pendingEvaluations}`, warn: advisor.pendingEvaluations > 0 },
                { label: 'Completed Proj.',  value: advisor.completedProjects,    warn: false },
              ].map(row => (
                <div key={row.label} className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                  <p className="text-muted-foreground">{row.label}</p>
                  <p className={`font-semibold text-sm ${row.warn ? 'text-destructive' : 'text-foreground'}`}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProjectDetailDialog
          project={selectedProject}
          open={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
        />
      </SheetContent>
    </Sheet>
  )
}

/* ─── Advisor Card ────────────────────────────────────────────────────── */
function AdvisorCard({
  advisor,
  onView,
}: {
  advisor: AdvisorMetrics
  onView: (a: AdvisorMetrics) => void
}) {
  const pc = PERF_CONFIG[advisor.performance]

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20 space-y-4">

      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base transition-transform group-hover:scale-110">
              {advisor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{advisor.name}</p>
            <p className="text-xs text-muted-foreground truncate">{advisor.email}</p>
          </div>
        </div>
        <Badge className={`shrink-0 text-xs ${pc.badge}`}>{pc.label}</Badge>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
          <FolderKanban className="h-3 w-3" /> {advisor.totalProjects} projects
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted text-foreground px-2.5 py-0.5 text-xs font-medium">
          <Activity className="h-3 w-3" /> {advisor.activeProjects} active
        </div>
        {advisor.completedProjects > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs">
            <CheckCircle2 className="h-3 w-3" /> {advisor.completedProjects} done
          </div>
        )}
        {advisor.pendingEvaluations > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-medium">
            <AlertTriangle className="h-3 w-3" /> {advisor.pendingEvaluations} pending
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Avg progress</span>
          <span className="font-semibold text-primary">{advisor.avgProgress}%</span>
        </div>
        <Progress value={advisor.avgProgress} className="h-1.5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> {advisor.lastActivity}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
          onClick={() => onView(advisor)}
        >
          View Details <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function AdvisorProgressPage() {
  const [sheetAdvisor, setSheetAdvisor] = useState<AdvisorMetrics | null>(null)
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [search, setSearch]             = useState('')
  const [perfFilter, setPerfFilter]     = useState('all')
  const [page, setPage]                 = useState(1)
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const normalizedSearch = search.trim()

  const advisorOverviewQuery = useCoordinatorAdvisorOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
    page,
    limit: PAGE_SIZE,
    search: normalizedSearch || undefined,
  })

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handlePerfFilterChange = (value: string) => {
    setPerfFilter(value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearch("")
    setPerfFilter("all")
    setPage(1)
  }

  const advisorMetrics: AdvisorMetrics[] = useMemo(() => {
    return (advisorOverviewQuery.data?.advisors ?? []).map(mapAdvisorMetrics)
  }, [advisorOverviewQuery.data?.advisors])

  const filtered = useMemo(() => {
    return advisorMetrics.filter(a => {
      const matchPerf   = perfFilter === 'all' || a.performance === perfFilter
      return matchPerf
    })
  }, [advisorMetrics, perfFilter])

  const openSheet = (a: AdvisorMetrics) => { setSheetAdvisor(a); setSheetOpen(true) }

  /* Summary stats */
  const summary = advisorOverviewQuery.data?.summary
  const totalAdvisors     = summary?.totalAdvisors ?? advisorMetrics.length
  const avgAll            = totalAdvisors > 0 ? Math.round(advisorMetrics.reduce((s, a) => s + a.avgProgress, 0) / totalAdvisors) : 0
  const totalPending      = advisorMetrics.reduce((s, a) => s + a.pendingEvaluations, 0)
  const excellentCount    = advisorMetrics.filter(a => a.performance === 'excellent').length
  const attentionCount    = advisorMetrics.filter(a => a.performance === 'needs_attention').length
  const isLoading = advisorOverviewQuery.isLoading
  const loadError = advisorOverviewQuery.error?.message
  const pagination = advisorOverviewQuery.data?.pagination

  const avgDepartmentProgress = summary?.overallDepartmentProjectProgress ?? avgAll
  const totalActiveProjects = summary?.projectStatusCounts.ACTIVE ?? advisorMetrics.reduce((s, a) => s + a.activeProjects, 0)
  const totalCompletedProjects = summary?.projectStatusCounts.COMPLETED ?? advisorMetrics.reduce((s, a) => s + a.completedProjects, 0)
  const totalItems = pagination?.totalItems ?? advisorMetrics.length
  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.totalPages ?? 1
  const visiblePageNumbers = buildVisiblePageNumbers(currentPage, totalPages)
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = totalItems === 0 ? 0 : Math.min((currentPage - 1) * PAGE_SIZE + (advisorOverviewQuery.data?.advisors.length ?? 0), totalItems)
  const isFilteringCurrentPage = perfFilter !== 'all'

  const kpi = [
    { label: 'Total Advisors',      value: totalAdvisors,   icon: Users,        bg: 'bg-primary/10',     color: 'text-primary'     },
    { label: 'Avg Progress',        value: `${avgAll}%`,    icon: TrendingUp,   bg: 'bg-primary/[0.06]', color: 'text-primary/80'  },
    { label: 'Pending Evaluations', value: totalPending,    icon: AlertTriangle,bg: 'bg-destructive/10', color: 'text-destructive' },
    { label: 'Excellent Advisors',  value: excellentCount,  icon: Award,        bg: 'bg-muted',          color: 'text-foreground'  },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

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
              Advisor Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor performance, project progress, and communicate with advisors
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
          <Link href="/dashboard/coordinator/notify-advisors">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bell className="h-4 w-4" /> Notify All
            </Button>
          </Link>
          {attentionCount > 0 && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> {attentionCount} need attention
            </Badge>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map(s => (
          <Card key={s.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-11 w-11 rounded-full ${s.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall progress bar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Department-wide Average Progress</p>
            <span className="text-sm font-bold text-primary">{avgDepartmentProgress}%</span>
          </div>
          <Progress value={avgDepartmentProgress} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{totalActiveProjects} active projects</span>
            <span>{totalCompletedProjects} completed</span>
          </div>
        </CardContent>
      </Card>

      {!departmentId && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Your account is missing a department assignment, so advisor analytics cannot be loaded yet.
          </CardContent>
        </Card>
      )}

      {loadError && (
        <Card className="border-none shadow-sm border border-destructive/20">
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load advisor analytics: {loadError}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="overview"     className="gap-2 shrink-0"><Users className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="performance"  className="gap-2 shrink-0"><BarChart3 className="h-4 w-4" /> Performance</TabsTrigger>
          <TabsTrigger value="communication"className="gap-2 shrink-0"><MessageSquare className="h-4 w-4" /> Communication</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">

          {/* Search + filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search advisor by name or email…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={perfFilter} onValueChange={handlePerfFilterChange}>
              <SelectTrigger className="h-10 w-48 shrink-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advisors</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
              </SelectContent>
            </Select>
            {(search || perfFilter !== 'all') && (
              <Button variant="ghost" size="sm" className="h-10 text-xs"
                onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Results label */}
          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              {isFilteringCurrentPage
                ? `${filtered.length} advisor${filtered.length !== 1 ? 's' : ''} shown on this page`
                : `Showing ${rangeStart}-${rangeEnd} of ${totalItems} advisor${totalItems !== 1 ? 's' : ''}`}
            </p>
            {isFilteringCurrentPage && (
              <p className="text-xs text-muted-foreground">
                Performance filter is applied to the current backend page.
              </p>
            )}
          </div>

          {/* Cards grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="h-5 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-2 w-full rounded bg-muted animate-pulse" />
                    <div className="h-8 w-28 rounded bg-muted animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No advisors match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting the search or filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(a => (
                  <AdvisorCard key={a.id} advisor={a} onView={openSheet} />
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.max(totalPages, 1)}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setPage((value) => Math.max(value - 1, 1))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {visiblePageNumbers.map((pageNumber, index) => {
                      const previousPage = visiblePageNumbers[index - 1]
                      const showLeadingGap = index > 0 && previousPage !== undefined && pageNumber - previousPage > 1

                      return (
                        <React.Fragment key={pageNumber}>
                          {showLeadingGap && (
                            <span className="px-1 text-xs text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={pageNumber === currentPage ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-9 px-0"
                            disabled={isLoading}
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        </React.Fragment>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Performance Tab ── */}
        <TabsContent value="performance">
          <div className="grid gap-6 md:grid-cols-2">

            {/* Distribution */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Performance Distribution
                </CardTitle>
                <CardDescription>Advisor performance breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(['excellent', 'good', 'needs_attention'] as const).map(p => {
                  const count = advisorMetrics.filter(a => a.performance === p).length
                  const pct   = advisorMetrics.length > 0 ? Math.round((count / advisorMetrics.length) * 100) : 0
                  const pc    = PERF_CONFIG[p]
                  return (
                    <div key={p} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${pc.dot}`} />
                          <span>{pc.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{count} advisor{count !== 1 ? 's' : ''}</span>
                          <Badge variant="outline" className="text-xs">{pct}%</Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Progress Insights
                </CardTitle>
                <CardDescription>Key metrics across all advisors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Highest Avg Progress',  value: `${advisorMetrics.length > 0 ? Math.max(...advisorMetrics.map(a => a.avgProgress)) : 0}%` },
                  { label: 'Lowest Avg Progress',   value: `${advisorMetrics.length > 0 ? Math.min(...advisorMetrics.map(a => a.avgProgress)) : 0}%` },
                  { label: 'Total Active Projects',  value: advisorMetrics.reduce((s, a) => s + a.activeProjects, 0) },
                  { label: 'Total Completed',        value: advisorMetrics.reduce((s, a) => s + a.completedProjects, 0) },
                  { label: 'Total Overdue Tasks',    value: advisorMetrics.reduce((s, a) => s + a.overdueTasks, 0) },
                  { label: 'Total Pending Evals',    value: totalPending },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-bold text-sm">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Per-advisor progress chart */}
            <Card className="border-none shadow-sm md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Per-Advisor Progress
                </CardTitle>
                <CardDescription>Visual comparison of progress across all advisors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {advisorMetrics.map(a => {
                  const pc = PERF_CONFIG[a.performance]
                  return (
                    <div key={a.id} className="flex items-center gap-4">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {a.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{a.name}</p>
                          <span className="text-xs font-semibold ml-2 shrink-0 text-primary">{a.avgProgress}%</span>
                        </div>
                        <Progress value={a.avgProgress} className="h-1.5" />
                      </div>
                      <Badge className={`shrink-0 text-xs ${pc.badge}`}>{pc.label}</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Communication Tab ── */}
        <TabsContent value="communication">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: '/dashboard/coordinator/notify-advisors',
                  icon: Bell,
                  title: 'Broadcast Notification',
                  desc: 'Send a notification or announcement to all advisors at once.',
                  cta: 'Notify All Advisors',
                },
                {
                  href: '/dashboard/coordinator/notify-advisors',
                  icon: Send,
                  title: 'Send Reminders',
                  desc: 'Remind advisors who have pending evaluations or overdue tasks.',
                  cta: 'Send Reminders',
                },
                {
                  href: '/dashboard/coordinator/announcement',
                  icon: Megaphone,
                  title: 'Announcement Center',
                  desc: 'Open coordinator announcements to publish updates and reminders for advisors.',
                  cta: 'Open Announcements',
                },
                {
                  href: '/dashboard/coordinator/reports',
                  icon: BarChart3,
                  title: 'Performance Reports',
                  desc: 'Generate and download detailed performance reports for advisors.',
                  cta: 'View Reports',
                },
              ].map(item => (
                <Card key={item.title} className="border-none shadow-sm group transition-all hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-5 flex flex-col gap-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{item.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">{item.desc}</p>
                    <Link href={item.href}>
                      <Button variant="outline" size="sm" className="w-full gap-1.5 hover:border-primary hover:text-primary">
                        {item.cta} <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Advisors needing attention */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Advisors Needing Attention
              </h3>
              {advisorMetrics.filter(a => a.performance === 'needs_attention' || a.pendingEvaluations > 0).length === 0 ? (
                <div className="rounded-xl border border-dashed flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary/40 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">All advisors on track</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No immediate action needed</p>
                </div>
              ) : (
                advisorMetrics
                  .filter(a => a.performance === 'needs_attention' || a.pendingEvaluations > 0)
                  .map(a => (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm hover:border-primary/20 transition-all">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-destructive/10 text-destructive font-semibold text-sm">
                          {a.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.pendingEvaluations > 0 ? `${a.pendingEvaluations} eval pending` : 'Low progress'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs shrink-0"
                        onClick={() => openSheet(a)}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advisor detail sheet — no navigation, no auth issue */}
      <AdvisorSheet
        advisor={sheetAdvisor}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
