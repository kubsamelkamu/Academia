"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useMemo, useCallback, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueries } from "@tanstack/react-query"
import { useAuthStore } from "@/store/auth-store"
import { getAdvisorProjectGroupChatRoom, listChatRoomMessages } from "@/lib/api/chat"
import { useAdvisorAddMilestoneFeedback } from "@/lib/hooks/use-advisor-add-milestone-feedback"
import { useAdvisorApproveMilestoneSubmission } from "@/lib/hooks/use-advisor-approve-milestone-submission"
import { useAdvisorMilestoneFeedbacks } from "@/lib/hooks/use-advisor-milestone-feedbacks"
import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import { useAdvisorReviewQueue } from "@/lib/hooks/use-advisor-review-queue"
import { useAdvisorSummary } from "@/lib/hooks/use-advisor-summary"
import type { ApiAdvisorProject } from "@/lib/api/advisor"
import type {
  AdvisorMilestoneReviewQueueItem,
  AdvisorMilestoneSubmissionFeedbackItem,
} from "@/lib/types/advisor"

import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileText,
  FolderOpen,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Upload,
  Users,
  Calendar,
  Bell,
  AlertCircle,
  Video,
  Shield,
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

interface AdvisorReviewQueueEntry {
  id: string
  queueItem: AdvisorMilestoneReviewQueueItem
  project: AdvisorProject
  milestone: ProjectMilestone
  feedbackCount: number
  actionLabel: string
  submissionId: string
  submissionFileName: string
  submissionUrl?: string
  latestFeedbackPreview?: string
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

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "Unknown"

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Unknown"

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

const mapReviewQueueItem = (item: AdvisorMilestoneReviewQueueItem): AdvisorReviewQueueEntry => {
  const milestone: ProjectMilestone = {
    id: item.milestone.id,
    name: item.milestone.title?.trim() || item.latestSubmission.fileName?.trim() || "Milestone Submission",
    dueDate:
      item.milestone.dueDate ??
      item.milestone.submittedAt ??
      item.latestSubmission.createdAt ??
      new Date().toISOString(),
    status: normalizeMilestoneStatus(item.milestone.status ?? item.latestSubmission.status),
    submittedAt: item.latestSubmission.createdAt ?? item.milestone.submittedAt ?? undefined,
    feedback: item.review.latestFeedback?.message?.trim() || undefined,
  }

  const project: AdvisorProject = {
    id: item.project.id,
    title: item.project.title,
    groupName: item.group.name?.trim() || "Project Group",
    advisorId: "me",
    status: normalizeProjectStatus(item.project.status),
    progress: 0,
    milestones: [milestone],
    lastUpdated: item.latestSubmission.createdAt ?? item.milestone.submittedAt ?? undefined,
  }

  const feedbackCount = Number(item.review.feedbackCount ?? 0)

  return {
    id: `${item.milestone.id}:${item.latestSubmission.id}`,
    queueItem: item,
    project,
    milestone,
    feedbackCount,
    actionLabel: feedbackCount > 0 ? "Continue Review" : "Review Submission",
    submissionId: item.latestSubmission.id,
    submissionFileName: item.latestSubmission.fileName?.trim() || "Submission file",
    submissionUrl: item.latestSubmission.fileUrl?.trim() || undefined,
    latestFeedbackPreview: item.review.latestFeedback?.message?.trim() || undefined,
  }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  return "Something went wrong while loading advisor dashboard data."
}

const getFeedbackAuthorName = (feedback: AdvisorMilestoneSubmissionFeedbackItem) => {
  const firstName = feedback.author?.firstName?.trim() ?? ""
  const lastName = feedback.author?.lastName?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || feedback.author?.email?.trim() || feedback.authorRole?.trim() || "Advisor"
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.className}`}>
          <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-xs sm:text-sm truncate">{milestone.name}</p>
            {dueDateStatus && (
              <Badge variant={dueDateStatus.variant} className="text-[9px] sm:text-xs px-1.5 h-4 sm:h-5">
                {dueDateStatus.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
            <span>Due: {formatDate(milestone.dueDate)}</span>
            {milestone.submittedAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="truncate">Sub: {formatDate(milestone.submittedAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 ml-12 sm:ml-0">
        <StatusBadge status={milestone.status} className="text-[10px] h-5" />
        
        {showActions && milestone.status === "submitted" && (
          <div className="flex items-center gap-1.5">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onApprove(project, milestone)}
              className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs shrink-0"
              aria-label={`Approve ${milestone.name}`}
            >
              <CheckCircle className="mr-1 h-3 w-3" /> 
              <span>Approve</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onRequestRevision(project, milestone)}
              className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs shrink-0"
              aria-label={`Request revision for ${milestone.name}`}
            >
              <AlertCircle className="mr-1 h-3 w-3" /> 
              <span>Revise</span>
            </Button>
          </div>
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
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="font-display text-base sm:text-lg truncate leading-tight">{project.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
              <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">{project.groupName}</p>
              {project.lastUpdated && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(project.lastUpdated)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <StatusBadge status={project.status} className="text-[10px] h-5" />
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-4">
              {project.progress}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4 sm:space-y-5">
        <div className="space-y-2 bg-muted/20 p-3 rounded-xl">
          <div className="flex items-center justify-between text-[11px] sm:text-sm">
            <span className="text-muted-foreground font-medium">Overall progress</span>
            <span className="font-bold text-primary">{project.progress}%</span>
          </div>
          <Progress 
            value={project.progress} 
            className="h-1.5 sm:h-2"
            aria-label={`Project progress: ${project.progress}%`}
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-bold flex items-center justify-between px-1">
            <span className="uppercase tracking-wider text-muted-foreground">Milestones</span>
            <Badge variant="secondary" className="text-[10px] h-5 rounded-full font-bold">
              {project.milestones.filter(m => m.status === "approved").length}/{project.milestones.length}
            </Badge>
          </h4>
          <div className="space-y-2.5">
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

        {canClearForEvaluation ? (
          <div className="flex justify-end pt-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onClearForEvaluation(project)}
              className="w-full sm:w-auto h-9 text-xs font-bold"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Clear for Evaluation
            </Button>
          </div>
        ) : null}
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
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [feedbackDraft, setFeedbackDraft] = useState("")
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const summaryQuery = useAdvisorSummary()
  const projectsQuery = useAdvisorProjects()
  const reviewQueueQuery = useAdvisorReviewQueue()
  const addFeedbackMutation = useAdvisorAddMilestoneFeedback()
  const approveSubmissionMutation = useAdvisorApproveMilestoneSubmission()

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
  
  const pendingMilestones = useMemo(
    () => (reviewQueueQuery.data ?? []).map(mapReviewQueueItem),
    [reviewQueueQuery.data]
  )

  const selectedReview = useMemo(() => {
    if (!pendingMilestones.length) return null
    return pendingMilestones.find((item) => item.id === selectedReviewId) ?? pendingMilestones[0]
  }, [pendingMilestones, selectedReviewId])

  const feedbackHistoryQuery = useAdvisorMilestoneFeedbacks({
    milestoneId: selectedReview?.milestone.id,
    submissionId: selectedReview?.submissionId,
    enabled: Boolean(selectedReview),
  })

  const handleSelectReview = useCallback((entry: AdvisorReviewQueueEntry) => {
    setSelectedReviewId(entry.id)
    setFeedbackDraft("")
    setFeedbackFile(null)
    setIsApproveDialogOpen(false)
  }, [])

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

  const handleOpenSubmission = useCallback((entry: AdvisorReviewQueueEntry) => {
    if (!entry.submissionUrl) {
      toast.info("Submission file is not available yet")
      return
    }

    window.open(entry.submissionUrl, "_blank", "noopener,noreferrer")
  }, [])

  const handleDownloadSubmission = useCallback((entry: AdvisorReviewQueueEntry) => {
    if (!entry.submissionUrl) {
      toast.info("Download is not available for this submission")
      return
    }

    const anchor = document.createElement("a")
    anchor.href = entry.submissionUrl
    anchor.target = "_blank"
    anchor.rel = "noreferrer"
    anchor.download = entry.submissionFileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }, [])

  const handleAddFeedback = useCallback(async () => {
    const message = feedbackDraft.trim()

    if (!selectedReview) {
      toast.error("Select a submission first")
      return
    }

    if (!message) {
      toast.error("Feedback message is required")
      return
    }

    try {
      await addFeedbackMutation.mutateAsync({
        milestoneId: selectedReview.milestone.id,
        submissionId: selectedReview.submissionId,
        message,
        file: feedbackFile,
      })

      setFeedbackDraft("")
      setFeedbackFile(null)
      toast.success("Feedback sent", {
        description: `${selectedReview.project.groupName} • ${selectedReview.milestone.name}`,
      })
    } catch (error) {
      toast.error("Failed to send feedback", {
        description: getErrorMessage(error),
      })
    }
  }, [addFeedbackMutation, feedbackDraft, feedbackFile, selectedReview])

  const handleApproveSubmission = useCallback(async () => {
    if (!selectedReview) {
      toast.error("Select a submission first")
      return
    }

    try {
      await approveSubmissionMutation.mutateAsync({
        milestoneId: selectedReview.milestone.id,
        submissionId: selectedReview.submissionId,
      })

      setIsApproveDialogOpen(false)
      toast.success("Submission approved", {
        description: `${selectedReview.project.groupName} • ${selectedReview.milestone.name}`,
      })
    } catch (error) {
      toast.error("Failed to approve submission", {
        description: getErrorMessage(error),
      })
    }
  }, [approveSubmissionMutation, selectedReview])

  const authUser = useAuthStore((state) => state.user)
  const displayName = authUser ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() : "Advisor"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome back, {displayName || "Advisor"}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            You have {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''} and {stats.pendingReviews} pending review{stats.pendingReviews !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-sm font-semibold text-muted-foreground">
            {formattedDate} {formattedTime}
          </div>
        </div>
      </div>

      {(summaryQuery.error || projectsQuery.error || reviewQueueQuery.error) && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-destructive">
              {getErrorMessage(summaryQuery.error ?? projectsQuery.error ?? reviewQueueQuery.error)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle="Currently supervising"
          icon={FolderOpen}
          iconClassName="bg-primary/10 text-primary"
          className="p-3 sm:p-4"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          subtitle="Milestones to review"
          icon={Clock}
          iconClassName="bg-warning/10 text-warning"
          className="p-3 sm:p-4"
        />
        <StatCard
          title="Students"
          value={stats.studentsCount}
          subtitle="Under your guidance"
          icon={Users}
          iconClassName="bg-accent/10 text-accent"
          className="p-3 sm:p-4"
        />
        <StatCard
          title="Project Groups"
          value={stats.projectGroups}
          subtitle="Groups assigned to you"
          icon={CheckCircle}
          iconClassName="bg-success/10 text-success"
          className="p-3 sm:p-4"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="flex h-auto w-full items-center justify-start gap-1 overflow-x-auto bg-muted/50 p-1 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible lg:w-auto">
          <TabsTrigger 
            value="projects" 
            className="flex min-w-[80px] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-row sm:gap-2 sm:text-xs sm:py-1.5"
          >
            <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="milestones" 
            className="relative flex min-w-[80px] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-row sm:gap-2 sm:text-xs sm:py-1.5"
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Reviews
            {stats.pendingReviews > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px] sm:static sm:ml-1.5 sm:h-5 sm:w-5 sm:text-[10px]"
              >
                {stats.pendingReviews}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            onClick={() => router.push("/dashboard/advisor/documents")}
            className="flex min-w-[80px] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-row sm:gap-2 sm:text-xs sm:py-1.5"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger 
            value="communication" 
            className="flex min-w-[80px] flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-row sm:gap-2 sm:text-xs sm:py-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Comm.
          </TabsTrigger>
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
          <Card className="border-none shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="px-0 sm:px-6">
              <CardTitle className="font-display text-lg">Pending Reviews</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {pendingMilestones.length} milestone{pendingMilestones.length !== 1 ? 's' : ''} waiting for your feedback
              </p>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {reviewQueueQuery.isLoading ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium text-muted-foreground">Loading reviews</p>
                  <p className="text-sm text-muted-foreground mt-1">Fetching milestone submissions awaiting your review.</p>
                </div>
              ) : pendingMilestones.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending milestones to review.</p>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                      <div className="space-y-3">
                        {pendingMilestones.map((entry) => {
                          const isSelected = selectedReview?.id === entry.id

                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => handleSelectReview(entry)}
                              className={`w-full rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                                  : "border-border bg-card hover:bg-muted/20"
                              }`}
                            >
                              <div className="group">
                                <MilestoneItem
                                  milestone={entry.milestone}
                                  project={entry.project}
                                  onApprove={handleApproveMilestone}
                                  onRequestRevision={handleRequestRevision}
                                  showActions={false}
                                />
                              </div>
                              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                                <div className="flex flex-col gap-2.5 rounded-lg border bg-background/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0 space-y-0.5 sm:space-y-1">
                                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">{entry.project.title}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                                      <span className="font-medium">{entry.feedbackCount} feedback entries</span>
                                      {entry.latestFeedbackPreview && (
                                        <>
                                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                          <span className="truncate italic">&ldquo;{entry.latestFeedbackPreview}&rdquo;</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                  <Button variant={isSelected ? "default" : "outline"} size="sm" className="shrink-0 h-8 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                    {entry.actionLabel}
                                  </Button>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <Card className="h-fit xl:sticky xl:top-4 overflow-hidden border-primary/20 shadow-lg">
                        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
                          <CardTitle className="font-display text-base sm:text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Review Detail
                          </CardTitle>
                          <p className="text-[11px] sm:text-sm text-muted-foreground font-medium">
                            {selectedReview
                              ? `${selectedReview.project.groupName} • ${selectedReview.milestone.name}`
                              : "Select a submission to inspect its latest version."}
                          </p>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          {selectedReview ? (
                            <div className="space-y-5">
                              <div className="rounded-xl border bg-muted/20 p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm shrink-0">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-bold text-sm sm:text-base text-foreground truncate">{selectedReview.submissionFileName}</p>
                                      <StatusBadge status={selectedReview.milestone.status} className="text-[10px] h-5" />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground font-medium">
                                      Latest submission for {selectedReview.project.title}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-2 sm:gap-3 grid-cols-2">
                                  <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Submitted</p>
                                    <p className="mt-0.5 text-xs font-bold text-foreground">
                                      {selectedReview.milestone.submittedAt ? formatDate(selectedReview.milestone.submittedAt) : "Unknown"}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Feedback</p>
                                    <p className="mt-0.5 text-xs font-bold text-foreground">{selectedReview.feedbackCount} Entries</p>
                                  </div>
                                  <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Milestone</p>
                                    <p className="mt-0.5 text-xs font-bold text-foreground truncate">{selectedReview.milestone.name}</p>
                                  </div>
                                  <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Group</p>
                                    <p className="mt-0.5 text-xs font-bold text-foreground truncate">{selectedReview.project.groupName}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Submission Access</h3>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    onClick={() => handleOpenSubmission(selectedReview)}
                                    className="flex-1 h-10 text-xs font-bold"
                                    disabled={!selectedReview.submissionUrl}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" /> Open
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownloadSubmission(selectedReview)}
                                    className="flex-1 h-10 text-xs font-bold"
                                    disabled={!selectedReview.submissionUrl}
                                  >
                                    <Download className="mr-2 h-4 w-4" /> Download
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3 rounded-xl border p-4 bg-success/5 border-success/20 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-success">Approval</h3>
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-success/10 text-success border-success/20">
                                    Final action
                                  </Badge>
                                </div>
                                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-relaxed">
                                  Approving this submission will mark the milestone as approved and remove it from the active review queue.
                                </p>
                                <div className="flex justify-end">
                                  <Button
                                    onClick={() => setIsApproveDialogOpen(true)}
                                    disabled={approveSubmissionMutation.isPending}
                                    className="h-9 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground"
                                  >
                                    Approve Submission
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3 rounded-xl border p-4 bg-primary/5 border-primary/20 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Add Feedback</h3>
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
                                    Optional File
                                  </Badge>
                                </div>
                                <Textarea
                                  value={feedbackDraft}
                                  onChange={(event) => setFeedbackDraft(event.target.value)}
                                  placeholder="Write advisor feedback for this submission..."
                                  className="min-h-[100px] text-xs sm:text-sm resize-none border-primary/20 focus-visible:ring-primary/30"
                                  disabled={addFeedbackMutation.isPending}
                                />
                                <div className="space-y-2">
                                  <div className="relative group">
                                    <Input
                                      type="file"
                                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                      onChange={(event) => setFeedbackFile(event.target.files?.[0] ?? null)}
                                      disabled={addFeedbackMutation.isPending}
                                      className="text-[10px] sm:text-xs h-9 cursor-pointer file:cursor-pointer file:font-bold file:text-[10px] file:uppercase file:tracking-wider"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                      Attach PDF or DOCX review note.
                                    </p>
                                    {feedbackFile ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[10px] font-bold text-destructive hover:bg-destructive/10"
                                        onClick={() => setFeedbackFile(null)}
                                        disabled={addFeedbackMutation.isPending}
                                      >
                                        Remove file
                                      </Button>
                                    ) : null}
                                  </div>
                                  {feedbackFile ? (
                                    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-[10px] font-medium text-foreground flex items-center gap-2">
                                      <Paperclip className="h-3 w-3 text-primary" />
                                      <span className="truncate">{feedbackFile.name}</span>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex items-center justify-between gap-3 pt-1">
                                  <p className="text-[10px] text-muted-foreground font-medium italic">
                                    Sent instantly to group.
                                  </p>
                                  <Button
                                    onClick={handleAddFeedback}
                                    disabled={addFeedbackMutation.isPending || !feedbackDraft.trim()}
                                    className="h-9 text-xs font-bold"
                                  >
                                    {addFeedbackMutation.isPending ? "Sending..." : "Send Feedback"}
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2 rounded-xl border border-dashed p-4 bg-muted/10">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest Feedback</h3>
                                <p className="text-xs text-foreground/80 leading-relaxed italic">
                                  &ldquo;{selectedReview.latestFeedbackPreview || "No feedback has been added yet for this submission."}&rdquo;
                                </p>
                              </div>

                              <div className="space-y-4 rounded-xl border p-4 bg-background shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Feedback History</h3>
                                  {!feedbackHistoryQuery.isLoading && !feedbackHistoryQuery.isError ? (
                                    <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2 rounded-full">
                                      {(feedbackHistoryQuery.data ?? []).length}
                                    </Badge>
                                  ) : null}
                                </div>

                                {feedbackHistoryQuery.isLoading ? (
                                  <div className="space-y-3">
                                    {Array.from({ length: 2 }).map((_, index) => (
                                      <div key={index} className="rounded-xl border bg-muted/20 px-4 py-3">
                                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                                        <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
                                      </div>
                                    ))}
                                  </div>
                                ) : feedbackHistoryQuery.isError ? (
                                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                        <p className="text-xs font-medium text-destructive">Unable to load feedback history</p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[10px] font-bold uppercase tracking-wider w-full"
                                        onClick={() => feedbackHistoryQuery.refetch()}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1.5" />
                                        Retry
                                      </Button>
                                    </div>
                                  </div>
                                ) : (feedbackHistoryQuery.data ?? []).length > 0 ? (
                                  <div className="space-y-3">
                                    {(feedbackHistoryQuery.data ?? []).map((feedback) => (
                                      <div key={feedback.id} className="rounded-xl border bg-muted/20 px-4 py-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground">
                                              {getFeedbackAuthorName(feedback)}
                                            </p>
                                            {feedback.authorRole ? (
                                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{feedback.authorRole}</p>
                                            ) : null}
                                          </div>
                                          <p className="text-[10px] text-muted-foreground font-medium">
                                            {formatDateTime(feedback.createdAt)}
                                          </p>
                                        </div>
                                        <p className="mt-2.5 text-xs leading-relaxed text-foreground/90 font-medium">
                                          {feedback.message?.trim() || "No message provided."}
                                        </p>
                                        {feedback.attachmentUrl ? (
                                          <div className="mt-3">
                                            <Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-[10px] font-bold gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5">
                                              <a href={feedback.attachmentUrl} target="_blank" rel="noreferrer">
                                                <Paperclip className="h-3 w-3 text-primary" />
                                                <span className="truncate max-w-[150px]">{feedback.attachmentFileName?.trim() || "Attachment"}</span>
                                              </a>
                                            </Button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground font-medium italic">
                                    No feedback history available.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed px-4 py-16 text-center text-xs text-muted-foreground font-medium bg-muted/5">
                              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                              Select a review item to inspect the current submission.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Approve Submission?</DialogTitle>
              <DialogDescription>
                {selectedReview
                  ? `This will approve ${selectedReview.milestone.name} for ${selectedReview.project.groupName} and remove it from the active review queue.`
                  : "This will approve the selected submission and remove it from the active review queue."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>
                {selectedReview
                  ? `Submission: ${selectedReview.submissionFileName}`
                  : "Select a submission before approving."}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
                disabled={approveSubmissionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveSubmission}
                disabled={approveSubmissionMutation.isPending || !selectedReview}
              >
                {approveSubmissionMutation.isPending ? "Approving..." : "Confirm Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="communication">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <CardHeader className="bg-muted/30 border-b p-4 sm:p-5">
                <CardTitle className="font-display text-base sm:text-lg flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5">
                {isRecentMessagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex gap-3 rounded-xl bg-muted/20 p-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 rounded bg-muted" />
                          <div className="h-3 w-full rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentMessages.length === 0 ? (
                  <div className="rounded-xl bg-muted/20 px-4 py-10 text-center text-xs sm:text-sm text-muted-foreground font-medium italic">
                    No current messages available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex gap-3 rounded-xl bg-muted/30 p-3 transition-all hover:bg-muted/50 hover:shadow-sm cursor-pointer border border-transparent hover:border-primary/10"
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-background shadow-sm">
                          {message.senderAvatar ? (
                            <AvatarImage src={message.senderAvatar} alt={message.sender} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {getSenderInitials(message.sender)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs sm:text-sm font-bold text-foreground">{message.sender}</p>
                            <span className="whitespace-nowrap text-[10px] text-muted-foreground font-medium">
                              {formatRelativeTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground mt-0.5 font-medium">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button asChild variant="outline" className="w-full h-9 text-xs font-bold uppercase tracking-wider">
                  <Link href="/dashboard/advisor/messages">
                    <MessageSquare className="mr-2 h-4 w-4" /> View All
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <CardHeader className="bg-muted/30 border-b p-4 sm:p-5">
                <CardTitle className="font-display text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Upcoming Meetings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-accent/20">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Video className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate text-foreground">Weekly Progress Review</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Team Atlas • Tomorrow, 2:00 PM</p>
                      <Badge variant="secondary" className="mt-1.5 text-[9px] font-bold h-4 px-1.5 rounded-full uppercase tracking-widest">30 min</Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate text-foreground">Final Presentation Prep</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">AI Research Group • Fri, 11:00 AM</p>
                      <Badge variant="secondary" className="mt-1.5 text-[9px] font-bold h-4 px-1.5 rounded-full uppercase tracking-widest">60 min</Badge>
                    </div>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full h-9 text-xs font-bold uppercase tracking-wider">
                  <Link href="/dashboard/advisor/schedule">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-md">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary p-3 text-primary-foreground shadow-lg shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold leading-none text-foreground">DC Committee Access</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">Open the committee project workspace from your advisor dashboard.</p>
            </div>
          </div>
          <Button asChild className="w-full h-10 gap-2 sm:w-auto font-bold text-xs uppercase tracking-wider shadow-sm">
            <Link href="/dashboard/advisor/dc-committee">
              Access Committee
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}