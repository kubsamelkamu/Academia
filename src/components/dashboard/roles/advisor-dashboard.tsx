"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useMemo, useCallback, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { useAdvisorSummary } from "@/lib/hooks/use-advisor-summary"
import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import type { ApiAdvisorProject, ApiMilestoneDetail } from "@/lib/api/advisor"

import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  CheckCircle,
  Clock,
  Eye,
  FolderOpen,
  MessageSquare,
  Upload,
  Users,
  Video,
  Calendar,
  Bell,
  AlertCircle,
} from "lucide-react"

// Types
type ProjectStatus = "active" | "completed" | "on-hold" | "pending-review" | "cleared"
type MilestoneStatus = "approved" | "submitted" | "revision" | "pending"

interface ProjectMilestone {
  id: string
  name: string
  dueDate: string
  status: MilestoneStatus
  submittedAt?: string
  feedback?: string
}

interface AdvisorProject {
  id: string
  title: string
  groupName: string
  advisorId: string
  status: ProjectStatus
  progress: number
  milestones: ProjectMilestone[]
  lastUpdated?: string
}

// Constants
const MILESTONE_STATUS_CONFIG = {
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-success/20 text-success border-success/30",
    progressColor: "bg-success"
  },
  submitted: {
    label: "Submitted",
    icon: Upload,
    className: "bg-warning/20 text-warning border-warning/30",
    progressColor: "bg-warning"
  },
  revision: {
    label: "Needs Revision",
    icon: AlertCircle,
    className: "bg-destructive/20 text-destructive border-destructive/30",
    progressColor: "bg-destructive"
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-muted",
    progressColor: "bg-muted"
  }
} as const

// Utility functions
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString(undefined, { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  })
}

const getDaysRemaining = (dueDate: string) => {
  const due = new Date(dueDate).getTime()
  const now = new Date().getTime()
  const diff = due - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

const getDueDateStatus = (dueDate: string, status: MilestoneStatus) => {
  if (status === "approved" || status === "submitted") return null
  
  const daysRemaining = getDaysRemaining(dueDate)
  if (daysRemaining < 0) return { label: "Overdue", variant: "destructive" as const }
  if (daysRemaining <= 3) return { label: "Due soon", variant: "secondary" as const }
  return null
}

// Mock data (would typically come from an API)
const mockAdvisorProjects: AdvisorProject[] = [
  {
    id: "p1",
    title: "AI‑Driven Academic Assistant",
    groupName: "AI Research Group",
    advisorId: "u7",
    status: "active",
    progress: 72,
    lastUpdated: "2024-07-08T10:30:00Z",
    milestones: [
      { id: "m1", name: "Proposal Submission", dueDate: "2024-05-05", status: "approved", submittedAt: "2024-05-01" },
      { id: "m2", name: "Architecture Design", dueDate: "2024-06-02", status: "approved", submittedAt: "2024-05-31" },
      { id: "m3", name: "Working Prototype", dueDate: "2024-07-10", status: "submitted", submittedAt: "2024-07-08" },
    ],
  },
  {
    id: "p2",
    title: "Real‑Time Campus Analytics",
    groupName: "Team Atlas",
    advisorId: "u7",
    status: "pending-review",
    progress: 58,
    lastUpdated: "2024-06-24T14:15:00Z",
    milestones: [
      { id: "m1", name: "Requirements Analysis", dueDate: "2024-05-18", status: "approved", submittedAt: "2024-05-15" },
      { id: "m2", name: "Data Pipeline", dueDate: "2024-06-25", status: "submitted", submittedAt: "2024-06-24" },
      { id: "m3", name: "Dashboard MVP", dueDate: "2024-07-20", status: "pending" },
    ],
  },
  {
    id: "p3",
    title: "Secure Research Data Platform",
    groupName: "Team Nova",
    advisorId: "u7",
    status: "active",
    progress: 83,
    lastUpdated: "2024-06-30T09:45:00Z",
    milestones: [
      { id: "m1", name: "Threat Model", dueDate: "2024-05-10", status: "approved", submittedAt: "2024-05-09" },
      { id: "m2", name: "Encryption Layer", dueDate: "2024-06-14", status: "approved", submittedAt: "2024-06-13" },
      { id: "m3", name: "Audit Logging", dueDate: "2024-07-01", status: "submitted", submittedAt: "2024-06-30" },
    ],
  },
]

// Sub-components
interface MilestoneItemProps {
  milestone: ProjectMilestone
  project: AdvisorProject
  onApprove: (project: AdvisorProject, milestone: ProjectMilestone) => void
  onRequestRevision: (project: AdvisorProject, milestone: ProjectMilestone) => void
  showActions?: boolean
}

const MilestoneItem = React.memo(({ 
  milestone, 
  project, 
  onApprove, 
  onRequestRevision,
  showActions = true 
}: MilestoneItemProps) => {
  const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status]
  const StatusIcon = statusConfig.icon
  const dueDateStatus = getDueDateStatus(milestone.dueDate, milestone.status)
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.className}`}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{milestone.name}</p>
            {dueDateStatus && (
              <Badge variant={dueDateStatus.variant} className="text-xs">
                {dueDateStatus.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>Due: {formatDate(milestone.dueDate)}</span>
            {milestone.submittedAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span>Submitted: {formatDate(milestone.submittedAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-13 sm:ml-0">
        <StatusBadge status={milestone.status} />
        
        {showActions && milestone.status === "submitted" && (
          <>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onApprove(project, milestone)}
              className="shrink-0"
              aria-label={`Approve ${milestone.name}`}
            >
              <CheckCircle className="mr-1 h-3 w-3" /> 
              <span className="hidden sm:inline">Approve</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRequestRevision(project, milestone)}
              className="shrink-0"
              aria-label={`Request revision for ${milestone.name}`}
            >
              <AlertCircle className="mr-1 h-3 w-3" /> 
              <span className="hidden sm:inline">Revise</span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
})

MilestoneItem.displayName = "MilestoneItem"

interface ProjectCardProps {
  project: AdvisorProject
  onApproveMilestone: (project: AdvisorProject, milestone: ProjectMilestone) => void
  onRequestRevision: (project: AdvisorProject, milestone: ProjectMilestone) => void
  onClearForEvaluation: (project: AdvisorProject) => void
}

const ProjectCard = React.memo(({ 
  project, 
  onApproveMilestone, 
  onRequestRevision,
  onClearForEvaluation 
}: ProjectCardProps) => {
  const canClearForEvaluation = project.progress >= 80
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="font-display text-lg truncate">{project.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground truncate">{project.groupName}</p>
              {project.lastUpdated && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Updated {formatDate(project.lastUpdated)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={project.status} />
            <Badge variant="outline" className="font-mono">
              {project.progress}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress 
            value={project.progress} 
            className="h-2"
            aria-label={`Project progress: ${project.progress}%`}
          />
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
            <span>Milestones</span>
            <Badge variant="outline" className="text-xs">
              {project.milestones.filter(m => m.status === "approved").length}/{project.milestones.length} Complete
            </Badge>
          </h4>
          <div className="space-y-2">
            {project.milestones.map((milestone) => (
              <MilestoneItem
                key={milestone.id}
                milestone={milestone}
                project={project}
                onApprove={onApproveMilestone}
                onRequestRevision={onRequestRevision}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/advisor/projects/${project.id}/documents`}>
              <Eye className="mr-2 h-4 w-4" /> Documents
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/advisor/projects/${project.id}/upload`}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/advisor/messages?group=${project.id}`}>
              <MessageSquare className="mr-2 h-4 w-4" /> Message
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/advisor/announcements">
              <Bell className="mr-2 h-4 w-4" /> Announcements
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/advisor/schedule?project=${project.id}`}>
              <Video className="mr-2 h-4 w-4" /> Meeting
            </Link>
          </Button>
          {canClearForEvaluation && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onClearForEvaluation(project)}
              className="ml-auto"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Clear for Evaluation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ProjectCard.displayName = "ProjectCard"

// ── API → dashboard shape mappers ───────────────────────────────────────────

const DASH_PROJECT_STATUS: Record<string, ProjectStatus> = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "on-hold",
  IN_PROGRESS: "active",
  PENDING_REVIEW: "pending-review",
  CLEARED: "cleared",
}

const DASH_MILESTONE_STATUS: Record<string, MilestoneStatus> = {
  APPROVED: "approved",
  COMPLETED: "approved",
  SUBMITTED: "submitted",
  PENDING: "pending",
  REJECTED: "revision",
  IN_PROGRESS: "pending",
}

function mapDetailToMilestone(m: ApiMilestoneDetail): ProjectMilestone {
  return {
    id: m.id,
    name: m.title,
    dueDate: m.dueDate,
    status: DASH_MILESTONE_STATUS[m.status] ?? "pending",
    submittedAt: m.submittedAt ?? undefined,
  }
}

function mapApiToDashboardProject(p: ApiAdvisorProject): AdvisorProject {
  return {
    id: p.id,
    title: p.title,
    groupName: p.group.name,
    advisorId: "",
    status: DASH_PROJECT_STATUS[p.status] ?? "active",
    progress: p.milestones.progressPercent,
    lastUpdated: p.startedAt,
    milestones: (p.milestones.details ?? []).map(mapDetailToMilestone),
  }
}

// Main component
interface AdvisorDashboardProps {
  userName?: string
  advisorId?: string
}

export function AdvisorDashboard({ userName = "Advisor", advisorId = "u7" }: AdvisorDashboardProps) {
  const router = useRouter()
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
  const formattedTime = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  const { data: summaryData } = useAdvisorSummary()
  const { data: projectsData } = useAdvisorProjects()

  const myProjects = useMemo(() =>
    projectsData
      ? projectsData.map(mapApiToDashboardProject)
      : mockAdvisorProjects.filter((p) => p.advisorId === advisorId),
    [projectsData, advisorId]
  )
  
  const pendingMilestones = useMemo(() => 
    myProjects.flatMap((p) => 
      p.milestones
        .filter((m) => m.status === "submitted")
        .map((m) => ({ project: p, milestone: m }))
    ), 
    [myProjects]
  )

  const stats = useMemo(() => {
    const activeProjects = summaryData?.metrics.projectStatusCounts.ACTIVE ?? 0
    const totalGroups = summaryData?.metrics.totalGroupsAdvising ?? 0
    const studentsCount = summaryData?.metrics.totalStudentsAdvising ?? 0
    const clearedCount = summaryData?.metrics.projectStatusCounts.COMPLETED ?? 0

    return { activeProjects, totalGroups, studentsCount, clearedCount }
  }, [summaryData, projectsData])

  // Event handlers
  const handleApproveMilestone = useCallback((project: AdvisorProject, milestone: ProjectMilestone) => {
    toast.success("Milestone Approved", { 
      description: `${project.groupName} • ${milestone.name} has been approved.`,
      duration: 5000,
    })
    // Here you would typically update the backend
  }, [])

  const handleRequestRevision = useCallback((project: AdvisorProject, milestone: ProjectMilestone) => {
    toast.info("Revision Requested", { 
      description: `Please provide feedback for ${project.groupName} • ${milestone.name}`,
      duration: 5000,
      action: {
        label: "Add Feedback",
        onClick: () => router.push(`/dashboard/advisor/reviews`)
      }
    })
  }, [router])

  const handleClearForEvaluation = useCallback((project: AdvisorProject) => {
    toast.success("Project Cleared for Evaluation", { 
      description: `${project.title} has been marked as ready for evaluation.`,
      duration: 5000,
    })
    // Here you would typically update the backend
  }, [])

  const authUser = useAuthStore((state) => state.user)
  const displayName = authUser ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() : "Advisor"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Welcome back, {displayName || "Advisor"}!</h1>
          <p className="text-muted-foreground">
            You have {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''} and {stats.totalGroups} project group{stats.totalGroups !== 1 ? 's' : ''} under your supervision.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
            {formattedDate} {formattedTime}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle="Currently supervising"
          icon={FolderOpen}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Project Groups"
          value={stats.totalGroups}
          subtitle="Total groups assigned"
          icon={Users}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Students"
          value={stats.studentsCount}
          subtitle="Under your guidance"
          icon={Users}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatCard
          title="Cleared Projects"
          value={stats.clearedCount}
          subtitle="Ready for evaluation"
          icon={CheckCircle}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="milestones" className="relative">
            Reviews
            {pendingMilestones.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {pendingMilestones.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {myProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No projects assigned</p>
                <p className="text-sm text-muted-foreground mt-1">Projects will appear here once assigned to you.</p>
              </CardContent>
            </Card>
          ) : (
            myProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onApproveMilestone={handleApproveMilestone}
                onRequestRevision={handleRequestRevision}
                onClearForEvaluation={handleClearForEvaluation}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Pending Reviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                {pendingMilestones.length} milestone{pendingMilestones.length !== 1 ? 's' : ''} waiting for your feedback
              </p>
            </CardHeader>
            <CardContent>
              {pendingMilestones.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending milestones to review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMilestones.map(({ project, milestone }) => (
                    <div key={`${project.id}:${milestone.id}`} className="group">
                      <MilestoneItem
                        milestone={milestone}
                        project={project}
                        onApprove={handleApproveMilestone}
                        onRequestRevision={handleRequestRevision}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Recent Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {['M', 'J', 'A'][i-1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {['Maria Garcia', 'John Smith', 'Alex Chen'][i-1]}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {i*2}h ago
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {[
                            "Thank you for the feedback on our prototype!",
                            "When is the next meeting scheduled?",
                            "We've submitted the final report for review."
                          ][i-1]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/advisor/messages">
                    <MessageSquare className="mr-2 h-4 w-4" /> View All Messages
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Video className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">Weekly Progress Review</p>
                      <p className="text-sm text-muted-foreground">Team Atlas • Tomorrow, 2:00 PM</p>
                      <Badge variant="outline" className="mt-1 text-xs">30 min</Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">Final Presentation Prep</p>
                      <p className="text-sm text-muted-foreground">AI Research Group • Fri, 11:00 AM</p>
                      <Badge variant="outline" className="mt-1 text-xs">60 min</Badge>
                    </div>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/advisor/schedule">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule Meeting
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}