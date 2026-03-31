"use client"

import { useAuthStore } from "@/store/auth-store"
import * as React from "react"
import { useEffect, useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  advisorKeys,
  useAdvisorAnnouncements,
  useAdvisorGroupMessages,
  useAdvisorMessageGroups,
  useAdvisorOverview,
  useAdvisorProjects,
  useAdvisorSchedule,
  useApproveMilestoneMutation,
  useClearProjectMutation,
  useCreateAnnouncementMutation,
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useRequestRevisionMutation,
  useSendGroupMessageMutation,
} from "@/lib/hooks/useAdvisor"
import type { AdvisorAnnouncement, AdvisorMeeting, AdvisorMessageGroup } from "@/lib/types/advisor"
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FolderOpen,
  Loader2,
  MessageSquare,
  Send,
  Users,
  Video,
} from "lucide-react"

type ProjectStatus = "active" | "completed" | "on-hold" | "pending-review" | "cleared" | "in-progress"
type MilestoneStatus = "approved" | "submitted" | "overdue" | "completed" | "pending"

interface ProjectMilestone {
  id: string
  name: string
  dueDate: string
  status: MilestoneStatus
  submittedAt?: string
}

interface AdvisorProject {
  id: string
  title: string
  groupName: string
  status: ProjectStatus
  progress: number
  milestones: ProjectMilestone[]
  lastUpdated?: string
  members?: Array<{ id: string; name: string; email?: string }>
}

interface ProjectCardProps {
  project: AdvisorProject
  onApproveMilestone: (project: AdvisorProject, milestone: ProjectMilestone) => void
  onRequestMilestoneRevision: (project: AdvisorProject, milestone: ProjectMilestone) => void
  onRequestProjectRevision: (project: AdvisorProject) => void
  onClearForEvaluation: (project: AdvisorProject) => void
}

const MILESTONE_STATUS_CONFIG = {
  approved: { icon: CheckCircle, tone: "bg-success/20 text-success border-success/30" },
  submitted: { icon: Clock, tone: "bg-warning/20 text-warning border-warning/30" },
  overdue: { icon: AlertCircle, tone: "bg-destructive/20 text-destructive border-destructive/30" },
  completed: { icon: CheckCircle, tone: "bg-primary/10 text-primary border-primary/20" },
  pending: { icon: Clock, tone: "bg-muted text-muted-foreground border-muted" },
} as const

const formatDate = (iso?: string) => {
  if (!iso) return "No date"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const formatDateTime = (iso?: string) => {
  if (!iso) return "No schedule"
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getDaysRemaining = (dueDate: string) => Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

const getDueDateStatus = (dueDate: string, status: MilestoneStatus) => {
  if (status === "approved" || status === "submitted" || status === "completed") return null
  const daysRemaining = getDaysRemaining(dueDate)
  if (daysRemaining < 0) return { label: "Overdue", variant: "destructive" as const }
  if (daysRemaining <= 3) return { label: "Due soon", variant: "secondary" as const }
  return null
}

function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <Icon className="mb-4 h-10 w-10 text-muted-foreground/50" />
      <p className="text-base font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

const MilestoneItem = React.memo(function MilestoneItem({
  milestone,
  project,
  onApprove,
  onRequestRevision,
}: {
  milestone: ProjectMilestone
  project: AdvisorProject
  onApprove: (project: AdvisorProject, milestone: ProjectMilestone) => void
  onRequestRevision: (project: AdvisorProject, milestone: ProjectMilestone) => void
}) {
  const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status]
  const StatusIcon = statusConfig.icon
  const dueDateStatus = getDueDateStatus(milestone.dueDate, milestone.status)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${statusConfig.tone}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{milestone.name}</p>
              {dueDateStatus ? <Badge variant={dueDateStatus.variant}>{dueDateStatus.label}</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(milestone.dueDate)}</p>
          </div>
        </div>
        <StatusBadge status={milestone.status} />
      </div>
      {milestone.status === "submitted" ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onApprove(project, milestone)}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => onRequestRevision(project, milestone)}>Request Revision</Button>
        </div>
      ) : null}
    </div>
  )
})

const ProjectCard = React.memo(function ProjectCard({
  project,
  onApproveMilestone,
  onRequestMilestoneRevision,
  onRequestProjectRevision,
  onClearForEvaluation,
}: ProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription className="mt-1">{project.groupName}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <Badge variant="outline">{project.progress}%</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <div className="space-y-2">
          {project.milestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              project={project}
              onApprove={onApproveMilestone}
              onRequestRevision={onRequestMilestoneRevision}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onRequestProjectRevision(project)}>Project Revision</Button>
          <Button size="sm" onClick={() => onClearForEvaluation(project)}>Clear for Evaluation</Button>
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
}

export function AdvisorDashboard({ userName = "Advisor" }: AdvisorDashboardProps) {
  const [now, setNow] = useState(new Date())
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [messageDraft, setMessageDraft] = useState("")
  const [meetingForm, setMeetingForm] = useState({
    projectId: "",
    title: "",
    date: "",
    time: "",
    durationMinutes: "60",
    type: "VIRTUAL" as "VIRTUAL" | "IN_PERSON",
    location: "",
    agenda: "",
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    audience: "STUDENTS" as "ALL" | "STUDENTS" | "ADVISORS",
    deadlineAt: "",
    targetProjectId: "",
  })

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const overviewQuery = useAdvisorOverview()
  const projectsQuery = useAdvisorProjects()
  const messageGroupsQuery = useAdvisorMessageGroups()
  const scheduleQuery = useAdvisorSchedule()
  const announcementsQuery = useAdvisorAnnouncements()

  const myProjects = projectsQuery.data?.items ?? []
  const messageGroups = messageGroupsQuery.data?.items ?? []
  const meetings = scheduleQuery.data?.items ?? []
  const announcements = announcementsQuery.data?.items ?? []

  const effectiveSelectedGroupId = selectedGroupId || messageGroups[0]?.id || ""
  const effectiveMeetingProjectId = meetingForm.projectId || myProjects[0]?.id || ""

  const groupMessagesQuery = useAdvisorGroupMessages(effectiveSelectedGroupId || undefined)
  const selectedGroup = groupMessagesQuery.data?.group ?? messageGroups.find((group) => group.id === effectiveSelectedGroupId) ?? null
  const messages = groupMessagesQuery.data?.items ?? []
  const pendingMilestones: Array<{ project: AdvisorProject; milestone: ProjectMilestone }> = myProjects.flatMap((project: AdvisorProject) => (project.milestones ?? []).filter((milestone: ProjectMilestone) => milestone.status === "submitted").map((milestone: ProjectMilestone) => ({ project, milestone })))
  const stats = {
    studentsCount: overviewQuery.data?.stats?.totalAssignedStudents ?? 0,
    clearedCount: projectsQuery.data?.stats?.clearedProjects ?? 0,
    activeProjects: projectsQuery.data?.stats?.activeProjects ?? 0,
    pendingReviews: overviewQuery.data?.stats?.pendingMilestoneReviews ?? pendingMilestones.length,
    unreadGroups: messageGroupsQuery.data?.stats?.unreadGroups ?? 0,
    upcomingMeetings: meetings.filter((meeting: AdvisorMeeting) => new Date(`${meeting.date}T${meeting.time}:00`).getTime() >= now.getTime()).length,
  }

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

    try {
      await requestRevisionMutation.mutateAsync({
        projectId: project.id,
        dto: { milestoneId: milestone.id, feedback: feedback.trim(), subject: `Revision required for ${milestone.name}` },
      })
      toast.success(`${project.groupName}: revision requested for ${milestone.name}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request milestone revision")
    }
  }

  const handleRequestProjectRevision = async (project: AdvisorProject) => {
    const feedback = window.prompt(`Revision feedback for ${project.title}`, "")
    if (feedback === null) return
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }

    try {
      await requestRevisionMutation.mutateAsync({
        projectId: project.id,
        dto: { feedback: feedback.trim(), subject: `Revision required for ${project.title}` },
      })
      toast.success(`${project.title}: revision requested.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request project revision")
    }
  }

  const handleClearForEvaluation = async (project: AdvisorProject) => {
    const notes = window.prompt("Optional clearance notes", "")
    if (notes === null) return

    try {
      await clearMutation.mutateAsync({ projectId: project.id, notes: notes.trim() || undefined })
      toast.success(`${project.title} cleared for evaluation.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear project")
    }
  }

  const handleSendMessage = async () => {
    if (!effectiveSelectedGroupId) {
      toast.error("Choose a message group first.")
      return
    }
    if (!messageDraft.trim()) {
      toast.error("Message is required.")
      return
    }

    try {
      await sendGroupMessageMutation.mutateAsync({ groupId: effectiveSelectedGroupId, dto: { content: messageDraft.trim() } })
      setMessageDraft("")
      toast.success("Message sent.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    }
  }

  const handleCreateMeeting = async () => {
    if (!effectiveMeetingProjectId || !meetingForm.title.trim() || !meetingForm.date || !meetingForm.time) {
      toast.error("Project, title, date, and time are required.")
      return
    }

    try {
      await createMeetingMutation.mutateAsync({
        projectId: effectiveMeetingProjectId,
        title: meetingForm.title.trim(),
        date: meetingForm.date,
        time: meetingForm.time,
        durationMinutes: Number(meetingForm.durationMinutes) || 60,
        type: meetingForm.type,
        location: meetingForm.location.trim() || undefined,
        agenda: meetingForm.agenda.trim() || undefined,
      })
      setMeetingForm((current) => ({ ...current, title: "", date: "", time: "", durationMinutes: "60", location: "", agenda: "" }))
      toast.success("Meeting scheduled.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting")
    }
  }

  const handleDeleteMeeting = async (meetingId: string, title: string) => {
    const confirmed = window.confirm(`Delete \"${title}\"?`)
    if (!confirmed) return

    try {
      await deleteMeetingMutation.mutateAsync(meetingId)
      toast.success(`${title} deleted.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete meeting")
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error("Announcement title and content are required.")
      return
    }

    try {
      await createAnnouncementMutation.mutateAsync({
        dto: {
          title: announcementForm.title.trim(),
          content: announcementForm.content.trim(),
          priority: announcementForm.priority,
          status: announcementForm.status,
          audience: announcementForm.audience,
          deadlineAt: announcementForm.deadlineAt || undefined,
          targetProjectIds: announcementForm.targetProjectId ? [announcementForm.targetProjectId] : undefined,
        },
      })
      setAnnouncementForm((current) => ({ ...current, title: "", content: "", deadlineAt: "", targetProjectId: "" }))
      toast.success("Announcement created.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create announcement")
    }
  }

  const authUser = useAuthStore((state) => state.user)
  const displayName = authUser ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() : userName
  const formattedDate = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
  const formattedTime = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const upcomingMeetings = meetings.filter((meeting: AdvisorMeeting) => new Date(`${meeting.date}T${meeting.time}:00`).getTime() >= now.getTime()).slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Advisor Workspace</h1>
          <p className="text-muted-foreground">
            You have {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''} and {stats.totalGroups} project group{stats.totalGroups !== 1 ? 's' : ''} under your supervision.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
          {formattedDate} {formattedTime}
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
          {projectsQuery.isLoading ? (
            <Card><CardContent className="py-12 text-center">Loading projects...</CardContent></Card>
          ) : myProjects.length === 0 ? (
            <EmptyState title="No projects assigned" description="Projects will appear here once assigned to you." icon={FolderOpen} />
          ) : (
            myProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onApproveMilestone={handleApproveMilestone}
                onRequestMilestoneRevision={handleRequestMilestoneRevision}
                onRequestProjectRevision={handleRequestProjectRevision}
                onClearForEvaluation={handleClearForEvaluation}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Milestone Reviews</CardTitle>
              <CardDescription>{pendingMilestones.length} milestone review{pendingMilestones.length !== 1 ? "s" : ""} waiting for your feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMilestones.length === 0 ? (
                <EmptyState title="All caught up" description="No submitted milestones are waiting for review." icon={CheckCircle} />
              ) : (
                <div className="space-y-3">
                  {pendingMilestones.map(({ project, milestone }) => (
                    <MilestoneItem
                      key={`${project.id}:${milestone.id}`}
                      milestone={milestone}
                      project={project}
                      onApprove={handleApproveMilestone}
                      onRequestRevision={handleRequestMilestoneRevision}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Groups</CardTitle>
                <CardDescription>Real advisor chat groups generated from your backend project assignments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {messageGroupsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading message groups...</p>
                ) : messageGroups.length === 0 ? (
                  <EmptyState title="No message groups" description="Project chat groups will appear here once projects are linked to your advisor account." icon={MessageSquare} />
                ) : (
                  <>
                    <Select value={effectiveSelectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {messageGroups.map((group: AdvisorMessageGroup) => (
                          <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedGroup ? (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{selectedGroup.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedGroup.project}</p>
                          </div>
                          <Badge variant="outline">{selectedGroup.members.length} members</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {selectedGroup.members.map((member) => (
                            <span key={member.id} className="rounded-full bg-muted px-2 py-1">{member.name}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <ScrollArea className="h-80 rounded-lg border p-4">
                      <div className="space-y-3">
                        {groupMessagesQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground">Loading messages...</p>
                        ) : messages.length === 0 ? (
                          <EmptyState title="No messages yet" description="Start the conversation below." icon={MessageSquare} />
                        ) : (
                          messages.map((message) => (
                            <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                <div className="mb-1 flex items-center justify-between gap-3 text-xs opacity-80">
                                  <span>{message.sender}</span>
                                  <span>{formatDateTime(message.timestamp)}</span>
                                </div>
                                <p>{message.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    <div className="space-y-3 rounded-lg border p-4">
                      <Textarea value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} rows={4} placeholder="Write a message to the selected group..." />
                      <div className="flex justify-end">
                        <Button onClick={handleSendMessage} disabled={sendGroupMessageMutation.isPending}>
                          {sendGroupMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
                  <CardDescription>Schedule and manage advisor meetings without leaving the dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scheduleQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading meetings...</p>
                  ) : upcomingMeetings.length === 0 ? (
                    <EmptyState title="No upcoming meetings" description="Schedule a new meeting below and it will appear here immediately." icon={Calendar} />
                  ) : (
                    upcomingMeetings.map((meeting: AdvisorMeeting) => (
                      <div key={meeting.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-muted-foreground">{meeting.project}</p>
                          </div>
                          <StatusBadge status={meeting.status} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(`${meeting.date}T${meeting.time}:00`)}</p>
                        <p className="text-sm text-muted-foreground capitalize">{meeting.type}{meeting.location ? ` - ${meeting.location}` : ""}</p>
                        <div className="mt-3 flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleDeleteMeeting(meeting.id, meeting.title)} disabled={deleteMeetingMutation.isPending}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="font-medium">Schedule a meeting</p>
                    <Select value={effectiveMeetingProjectId} onValueChange={(value) => setMeetingForm((current) => ({ ...current, projectId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose project" />
                      </SelectTrigger>
                      <SelectContent>
                        {myProjects.map((project: AdvisorProject) => (
                          <SelectItem key={project.id} value={project.id}>{project.groupName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={meetingForm.title} onChange={(event) => setMeetingForm((current) => ({ ...current, title: event.target.value }))} placeholder="Meeting title" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input type="date" value={meetingForm.date} onChange={(event) => setMeetingForm((current) => ({ ...current, date: event.target.value }))} />
                      <Input type="time" value={meetingForm.time} onChange={(event) => setMeetingForm((current) => ({ ...current, time: event.target.value }))} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input type="number" min="15" value={meetingForm.durationMinutes} onChange={(event) => setMeetingForm((current) => ({ ...current, durationMinutes: event.target.value }))} />
                      <Select value={meetingForm.type} onValueChange={(value: "VIRTUAL" | "IN_PERSON") => setMeetingForm((current) => ({ ...current, type: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIRTUAL">Virtual</SelectItem>
                          <SelectItem value="IN_PERSON">In person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={meetingForm.location} onChange={(event) => setMeetingForm((current) => ({ ...current, location: event.target.value }))} placeholder="Meeting link or location" />
                    <Textarea value={meetingForm.agenda} onChange={(event) => setMeetingForm((current) => ({ ...current, agenda: event.target.value }))} rows={3} placeholder="Agenda" />
                    <div className="flex justify-end">
                      <Button onClick={handleCreateMeeting} disabled={createMeetingMutation.isPending}>
                        {createMeetingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Announcements</CardTitle>
                  <CardDescription>Create advisor announcements and target them to your projects.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcementsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading announcements...</p>
                  ) : announcements.length === 0 ? (
                    <EmptyState title="No announcements yet" description="Create your first advisor announcement below." icon={Bell} />
                  ) : (
                    announcements.slice(0, 4).map((announcement: AdvisorAnnouncement) => (
                      <div key={announcement.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                          </div>
                          <Badge variant="outline">{announcement.priority}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{announcement.audience} - {formatDate(announcement.createdAt)}</p>
                      </div>
                    ))
                  )}

                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="font-medium">Create announcement</p>
                    <Input value={announcementForm.title} onChange={(event) => setAnnouncementForm((current) => ({ ...current, title: event.target.value }))} placeholder="Announcement title" />
                    <Textarea value={announcementForm.content} onChange={(event) => setAnnouncementForm((current) => ({ ...current, content: event.target.value }))} rows={4} placeholder="Announcement content" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Select value={announcementForm.priority} onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => setAnnouncementForm((current) => ({ ...current, priority: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={announcementForm.status} onValueChange={(value: "DRAFT" | "PUBLISHED" | "ARCHIVED") => setAnnouncementForm((current) => ({ ...current, status: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={announcementForm.audience} onValueChange={(value: "ALL" | "STUDENTS" | "ADVISORS") => setAnnouncementForm((current) => ({ ...current, audience: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="STUDENTS">Students</SelectItem>
                          <SelectItem value="ADVISORS">Advisors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input type="date" value={announcementForm.deadlineAt} onChange={(event) => setAnnouncementForm((current) => ({ ...current, deadlineAt: event.target.value }))} />
                      <Select value={announcementForm.targetProjectId || "__all__"} onValueChange={(value) => setAnnouncementForm((current) => ({ ...current, targetProjectId: value === "__all__" ? "" : value }))}>
                        <SelectTrigger><SelectValue placeholder="Target project" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All my projects</SelectItem>
                          {myProjects.map((project: AdvisorProject) => (
                            <SelectItem key={project.id} value={project.id}>{project.groupName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleCreateAnnouncement} disabled={createAnnouncementMutation.isPending}>
                        {createAnnouncementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                        Create Announcement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}




