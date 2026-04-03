"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useMemo, useCallback, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueries } from "@tanstack/react-query"
import { useAuthStore } from "@/store/auth-store"
import { getAdvisorProjectGroupChatRoom, listChatRoomMessages } from "@/lib/api/chat"
import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import { useAdvisorSummary } from "@/lib/hooks/use-advisor-summary"
import type { ApiAdvisorProject } from "@/lib/api/advisor"

import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
type ProjectStatus = "active" | "completed" | "on-hold" | "cancelled" | "cleared" | "in-progress"
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

const formatRelativeTime = (iso?: string | null) => {
  if (!iso) return ""

  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return ""

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const getSenderInitials = (name?: string | null) => {
  if (!name) return "?"

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return initials || "?"
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

const normalizeProjectStatus = (status?: string | null): ProjectStatus => {
  const normalized = status?.trim().toUpperCase()

  switch (normalized) {
    case "ACTIVE":
      return "active"
    case "IN_PROGRESS":
    case "IN-PROGRESS":
    case "IN PROGRESS":
      return "in-progress"
    case "COMPLETED":
      return "completed"
    case "CLEARED":
      return "cleared"
    case "CANCELLED":
      return "cancelled"
    case "ON_HOLD":
    case "ON-HOLD":
    case "ON HOLD":
      return "on-hold"
    default:
      return "active"
  }
}

const normalizeMilestoneStatus = (status?: string | null): MilestoneStatus => {
  const normalized = status?.trim().toUpperCase()

  switch (normalized) {
    case "APPROVED":
    case "COMPLETED":
      return "approved"
    case "SUBMITTED":
      return "submitted"
    case "REJECTED":
    case "REVISION":
    case "REVISION_REQUIRED":
      return "revision"
    default:
      return "pending"
  }
}

const mapApiProject = (project: ApiAdvisorProject): AdvisorProject => ({
  id: project.id,
  title: project.title,
  groupName: project.group.name,
  advisorId: "me",
  status: normalizeProjectStatus(project.status),
  progress: project.milestones.progressPercent,
  lastUpdated: project.startedAt,
  milestones: project.milestones.details.map((milestone) => ({
    id: milestone.id,
    name: milestone.title,
    dueDate: milestone.dueDate,
    status: normalizeMilestoneStatus(milestone.status),
    submittedAt: milestone.submittedAt ?? undefined,
  })),
})

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  return "Something went wrong while loading advisor dashboard data."
}

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

// Main component
interface AdvisorDashboardProps {
  userName?: string
  advisorId?: string
}

export function AdvisorDashboard({ userName = "Advisor", advisorId = "u7" }: AdvisorDashboardProps) {
  const router = useRouter()
  const [now, setNow] = useState<Date>(new Date())
  const summaryQuery = useAdvisorSummary()
  const projectsQuery = useAdvisorProjects()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
  const formattedTime = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  const myProjects = useMemo(
    () => (projectsQuery.data ?? []).map(mapApiProject),
    [projectsQuery.data]
  )

  const advisorProjects = projectsQuery.data ?? []

  const chatRoomQueries = useQueries({
    queries: advisorProjects.map((project) => ({
      queryKey: ["chat", "advisor-dashboard", "room", project.id],
      queryFn: () => getAdvisorProjectGroupChatRoom(project.id),
      enabled: Boolean(project.id),
      staleTime: 30_000,
      retry: false,
    })),
  })

  const latestMessageQueries = useQueries({
    queries: advisorProjects.map((project, index) => {
      const roomId = chatRoomQueries[index]?.data?.roomId ?? null

      return {
        queryKey: ["chat", "advisor-dashboard", "latest-message", project.id, roomId],
        queryFn: () => {
          if (!roomId) throw new Error("roomId is required")
          return listChatRoomMessages({ roomId, limit: 3 })
        },
        enabled: Boolean(roomId),
        staleTime: 5_000,
        retry: false,
      }
    }),
  })
  
  const pendingMilestones = useMemo(() => 
    myProjects.flatMap((p) => 
      p.milestones
        .filter((m) => m.status === "submitted")
        .map((m) => ({ project: p, milestone: m }))
    ), 
    [myProjects]
  )

  const recentMessages = useMemo(() => {
    return advisorProjects
      .flatMap((project, index) => {
        const items = latestMessageQueries[index]?.data?.items ?? []

        return items.map((message) => {
          const senderName = `${message.sender.firstName} ${message.sender.lastName}`.trim() || "Unknown user"

          return {
            id: message.id,
            sender: senderName,
            senderAvatar: message.sender.avatarUrl,
            content: message.text || message.attachment?.name || "Attachment sent",
            timestamp: message.createdAt,
            projectId: project.id,
          }
        })
      })
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      )
      .slice(0, 3)
  }, [advisorProjects, latestMessageQueries])

  const isRecentMessagesLoading =
    projectsQuery.isLoading ||
    chatRoomQueries.some((query) => query.isLoading) ||
    latestMessageQueries.some((query) => query.isLoading)

  const stats = useMemo(() => {
    const metrics = summaryQuery.data?.metrics
    const activeProjects = metrics?.projectStatusCounts?.ACTIVE ?? myProjects.filter(
      (project) => project.status === "active" || project.status === "in-progress"
    ).length
    const projectGroups = metrics?.totalGroupsAdvising ?? myProjects.length
    const studentsCount = metrics?.totalStudentsAdvising ?? 0
    
    return {
      studentsCount,
      activeProjects,
      projectGroups,
      pendingReviews: pendingMilestones.length
    }
  }, [myProjects, pendingMilestones.length, summaryQuery.data])

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
            You have {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''} and {stats.pendingReviews} pending review{stats.pendingReviews !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
            {formattedDate} {formattedTime}
          </div>
        </div>
      </div>

      {(summaryQuery.error || projectsQuery.error) && (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">
              {getErrorMessage(summaryQuery.error ?? projectsQuery.error)}
            </p>
          </CardContent>
        </Card>
      )}

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
          title="Pending Reviews"
          value={stats.pendingReviews}
          subtitle="Milestones to review"
          icon={Clock}
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
          title="Project Groups"
          value={stats.projectGroups}
          subtitle="Groups assigned to you"
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
            {stats.pendingReviews > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {stats.pendingReviews}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {projectsQuery.isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4 animate-pulse" />
                <p className="text-lg font-medium text-muted-foreground">Loading projects</p>
                <p className="text-sm text-muted-foreground mt-1">Fetching your current advisor assignments.</p>
              </CardContent>
            </Card>
          ) : myProjects.length === 0 ? (
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
                {isRecentMessagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex gap-3 rounded-lg bg-muted/20 p-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/3 rounded bg-muted" />
                          <div className="h-4 w-full rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentMessages.length === 0 ? (
                  <div className="rounded-lg bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    No current messages available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          {message.senderAvatar ? (
                            <AvatarImage src={message.senderAvatar} alt={message.sender} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                            {getSenderInitials(message.sender)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">{message.sender}</p>
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatRelativeTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
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