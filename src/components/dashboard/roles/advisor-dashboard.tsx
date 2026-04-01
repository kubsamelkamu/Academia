"use client"

import * as React from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import {
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
import type {
  AdvisorAnnouncement,
  AdvisorMeeting,
  AdvisorMessageGroup,
  AdvisorProjectItem,
  AdvisorProjectMilestone,
} from "@/lib/types/advisor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Bell,
  Calendar,
  CheckCircle2,
  FolderOpen,
  Loader2,
  MessageSquare,
  Send,
  Users,
  Video,
} from "lucide-react"

function formatDate(value?: string | null) {
  if (!value) return "Not available"
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available"
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function EmptyState(props: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const { title, description, icon: Icon } = props

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
      <Icon className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StatCard(props: { title: string; value: number; helper: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{props.title}</CardDescription>
        <CardTitle className="text-2xl">{props.value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">{props.helper}</CardContent>
    </Card>
  )
}

interface AdvisorDashboardProps {
  userName?: string
}

export function AdvisorDashboard({ userName = "Advisor" }: AdvisorDashboardProps) {
  const authUser = useAuthStore((state) => state.user)
  const displayName = authUser
    ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() || userName
    : userName

  const overviewQuery = useAdvisorOverview()
  const projectsQuery = useAdvisorProjects()
  const groupsQuery = useAdvisorMessageGroups()
  const scheduleQuery = useAdvisorSchedule()
  const announcementsQuery = useAdvisorAnnouncements()

  const approveMilestoneMutation = useApproveMilestoneMutation()
  const requestRevisionMutation = useRequestRevisionMutation()
  const clearProjectMutation = useClearProjectMutation()
  const sendGroupMessageMutation = useSendGroupMessageMutation()
  const createMeetingMutation = useCreateMeetingMutation()
  const deleteMeetingMutation = useDeleteMeetingMutation()
  const createAnnouncementMutation = useCreateAnnouncementMutation()

  const projects = projectsQuery.data?.items ?? []
  const groups = groupsQuery.data?.items ?? []
  const meetings = scheduleQuery.data?.items ?? []
  const announcements = announcementsQuery.data?.items ?? []

  const [selectedGroupId, setSelectedGroupId] = React.useState("")
  const [messageDraft, setMessageDraft] = React.useState("")
  const [meetingForm, setMeetingForm] = React.useState({
    projectId: "",
    title: "",
    date: "",
    time: "",
    durationMinutes: "60",
    type: "VIRTUAL" as "VIRTUAL" | "IN_PERSON",
    location: "",
    agenda: "",
  })
  const [announcementForm, setAnnouncementForm] = React.useState({
    title: "",
    content: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    audience: "STUDENTS" as "ALL" | "STUDENTS" | "ADVISORS",
    deadlineAt: "",
    targetProjectId: "",
  })

  const effectiveSelectedGroupId = selectedGroupId || groups[0]?.id || ""
  const groupMessagesQuery = useAdvisorGroupMessages(effectiveSelectedGroupId || undefined)
  const selectedGroup =
    groupMessagesQuery.data?.group ??
    groups.find((group: AdvisorMessageGroup) => group.id === effectiveSelectedGroupId) ??
    null
  const messages = groupMessagesQuery.data?.items ?? []
  const effectiveMeetingProjectId = meetingForm.projectId || projects[0]?.id || ""

  const pendingMilestones = React.useMemo(
    () =>
      projects.flatMap((project: AdvisorProjectItem) =>
        project.milestones
          .filter((milestone: AdvisorProjectMilestone) => milestone.status === "submitted")
          .map((milestone: AdvisorProjectMilestone) => ({ project, milestone }))
      ),
    [projects]
  )

  const upcomingMeetings = React.useMemo(
    () =>
      meetings
        .filter((meeting: AdvisorMeeting) => new Date(`${meeting.date}T${meeting.time}:00`).getTime() >= new Date().getTime())
        .slice(0, 4),
    [meetings]
  )

  const stats = {
    activeProjects: projectsQuery.data?.stats?.activeProjects ?? overviewQuery.data?.stats.totalActiveProjects ?? 0,
    totalStudents: overviewQuery.data?.stats.totalAssignedStudents ?? 0,
    pendingReviews: pendingMilestones.length,
    clearedProjects: projectsQuery.data?.stats?.clearedProjects ?? 0,
  }

  async function handleApproveMilestone(project: AdvisorProjectItem, milestone: AdvisorProjectMilestone) {
    try {
      await approveMilestoneMutation.mutateAsync({
        milestoneId: milestone.id,
        dto: { status: "APPROVED" },
      })
      toast.success(`${project.groupName}: ${milestone.name} approved.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve milestone")
    }
  }

  async function handleRequestRevision(project: AdvisorProjectItem, subject: string, milestoneId?: string) {
    const feedback = window.prompt(`Revision feedback for ${subject}`, "")
    if (feedback === null) return
    if (!feedback.trim()) {
      toast.error("Revision feedback is required.")
      return
    }

    try {
      await requestRevisionMutation.mutateAsync({
        projectId: project.id,
        dto: { feedback: feedback.trim(), subject: `Revision required for ${subject}`, milestoneId },
      })
      toast.success(`Revision request sent for ${subject}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request revision")
    }
  }

  async function handleClearProject(project: AdvisorProjectItem) {
    try {
      await clearProjectMutation.mutateAsync({ projectId: project.id })
      toast.success(`${project.title} cleared for evaluation.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear project")
    }
  }

  async function handleSendMessage() {
    if (!effectiveSelectedGroupId) {
      toast.error("Choose a message group first.")
      return
    }
    if (!messageDraft.trim()) {
      toast.error("Message is required.")
      return
    }

export function AdvisorDashboard({ advisorId = "u7" }: AdvisorDashboardProps) {
  const router = useRouter()
  const [now, setNow] = useState<Date>(new Date())

  async function handleCreateMeeting() {
    if (!effectiveMeetingProjectId || !meetingForm.title || !meetingForm.date || !meetingForm.time) {
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
      setMeetingForm((current) => ({
        ...current,
        title: "",
        date: "",
        time: "",
        durationMinutes: "60",
        location: "",
        agenda: "",
      }))
      toast.success("Meeting scheduled.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create meeting")
    }
  }

  async function handleDeleteMeeting(meeting: AdvisorMeeting) {
    if (!window.confirm(`Delete "${meeting.title}"?`)) return

    try {
      await deleteMeetingMutation.mutateAsync(meeting.id)
      toast.success(`${meeting.title} deleted.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete meeting")
    }
  }

  async function handleCreateAnnouncement() {
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
      setAnnouncementForm((current) => ({
        ...current,
        title: "",
        content: "",
        deadlineAt: "",
        targetProjectId: "",
      }))
      toast.success("Announcement created.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create announcement")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advisor Workspace</h1>
          <p className="text-muted-foreground">
            Welcome back, {displayName}. Monitor assigned projects, pending reviews, and active conversations.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
          {formatDate(new Date().toISOString())}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Projects" value={stats.activeProjects} helper="Projects in progress" />
        <StatCard title="Assigned Students" value={stats.totalStudents} helper="Students under supervision" />
        <StatCard title="Pending Reviews" value={stats.pendingReviews} helper="Submitted milestones awaiting feedback" />
        <StatCard title="Cleared Projects" value={stats.clearedProjects} helper="Ready for evaluation" />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {projectsQuery.isLoading ? (
            <Card>
              <CardContent className="py-10 text-center">Loading projects...</CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects assigned"
              description="Projects will appear here once they are assigned to your advisor account."
              icon={FolderOpen}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {projects.map((project: AdvisorProjectItem) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>{project.groupName}</CardDescription>
                      </div>
                      <Badge variant="outline">{project.progress}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Members: {project.members.length}</p>
                      <p>Milestones: {project.milestones.length}</p>
                      <p>Documents: {project.documents.length}</p>
                      <p>Due: {formatDate(project.dueDate)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRequestRevision(project, project.title)}
                        disabled={requestRevisionMutation.isPending}
                      >
                        Request Revision
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleClearProject(project)}
                        disabled={clearProjectMutation.isPending}
                      >
                        Clear for Evaluation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Pending Milestone Reviews</CardTitle>
              <CardDescription>
                {pendingMilestones.length} submitted milestone{pendingMilestones.length === 1 ? "" : "s"} need action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMilestones.length === 0 ? (
                <EmptyState
                  title="All caught up"
                  description="No submitted milestones are waiting for your review."
                  icon={CheckCircle2}
                />
              ) : (
                <div className="space-y-3">
                  {pendingMilestones.map(({ project, milestone }: {
                    project: AdvisorProjectItem
                    milestone: AdvisorProjectMilestone
                  }) => (
                    <div key={`${project.id}:${milestone.id}`} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.groupName} · due {formatDate(milestone.dueDate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => void handleApproveMilestone(project, milestone)}
                            disabled={approveMilestoneMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRequestRevision(project, milestone.name, milestone.id)}
                            disabled={requestRevisionMutation.isPending}
                          >
                            Request Revision
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Group Messages</CardTitle>
                <CardDescription>Stay in sync with student project groups.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading message groups...</p>
                ) : groups.length === 0 ? (
                  <EmptyState
                    title="No message groups"
                    description="Chat groups appear once projects and students are linked."
                    icon={MessageSquare}
                  />
                ) : (
                  <>
                    <Select value={effectiveSelectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group: AdvisorMessageGroup) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
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
                      </div>
                    ) : null}

                    <ScrollArea className="h-72 rounded-lg border p-4">
                      <div className="space-y-3">
                        {groupMessagesQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground">Loading messages...</p>
                        ) : messages.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No messages yet.</p>
                        ) : (
                          messages.map((message: {
                            id: string
                            isOwn: boolean
                            sender: string
                            timestamp: string
                            content: string
                          }) => (
                            <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                                  message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
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
                      <Textarea
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        rows={4}
                        placeholder="Write a message to the selected group..."
                      />
                      <div className="flex justify-end">
                        <Button onClick={() => void handleSendMessage()} disabled={sendGroupMessageMutation.isPending}>
                          {sendGroupMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
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
                  <CardTitle>Upcoming Meetings</CardTitle>
                  <CardDescription>Recent meeting schedule and a quick create form.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingMeetings.length === 0 ? (
                    <EmptyState
                      title="No upcoming meetings"
                      description="Create a meeting and it will show up here."
                      icon={Calendar}
                    />
                  ) : (
                    upcomingMeetings.map((meeting: AdvisorMeeting) => (
                      <div key={meeting.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-muted-foreground">{meeting.project}</p>
                          </div>
                          <Badge variant="outline">{meeting.type}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {formatDateTime(`${meeting.date}T${meeting.time}:00`)}
                        </p>
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleDeleteMeeting(meeting)}
                            disabled={deleteMeetingMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="font-medium">Schedule a meeting</p>
                    <Select
                      value={effectiveMeetingProjectId}
                      onValueChange={(value) => setMeetingForm((current) => ({ ...current, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project: AdvisorProjectItem) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.groupName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={meetingForm.title}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Meeting title"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="date"
                        value={meetingForm.date}
                        onChange={(event) => setMeetingForm((current) => ({ ...current, date: event.target.value }))}
                      />
                      <Input
                        type="time"
                        value={meetingForm.time}
                        onChange={(event) => setMeetingForm((current) => ({ ...current, time: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="number"
                        min="15"
                        value={meetingForm.durationMinutes}
                        onChange={(event) =>
                          setMeetingForm((current) => ({ ...current, durationMinutes: event.target.value }))
                        }
                      />
                      <Select
                        value={meetingForm.type}
                        onValueChange={(value: "VIRTUAL" | "IN_PERSON") =>
                          setMeetingForm((current) => ({ ...current, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIRTUAL">Virtual</SelectItem>
                          <SelectItem value="IN_PERSON">In person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={meetingForm.location}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, location: event.target.value }))}
                      placeholder="Meeting link or location"
                    />
                    <Textarea
                      value={meetingForm.agenda}
                      onChange={(event) => setMeetingForm((current) => ({ ...current, agenda: event.target.value }))}
                      rows={3}
                      placeholder="Agenda"
                    />
                    <div className="flex justify-end">
                      <Button onClick={() => void handleCreateMeeting()} disabled={createMeetingMutation.isPending}>
                        {createMeetingMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Publish quick updates for your active project groups.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcements.length === 0 ? (
                    <EmptyState
                      title="No announcements yet"
                      description="Create your first advisor announcement below."
                      icon={Bell}
                    />
                  ) : (
                    announcements.slice(0, 4).map((announcement: AdvisorAnnouncement) => (
                      <div key={announcement.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-sm text-muted-foreground">{announcement.content}</p>
                          </div>
                          <Badge variant="outline">{announcement.priority}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {announcement.audience} · {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                    ))
                  )}

                  <div className="space-y-3 rounded-lg border p-4">
                    <Input
                      value={announcementForm.title}
                      onChange={(event) => setAnnouncementForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Announcement title"
                    />
                    <Textarea
                      value={announcementForm.content}
                      onChange={(event) =>
                        setAnnouncementForm((current) => ({ ...current, content: event.target.value }))
                      }
                      rows={4}
                      placeholder="Announcement content"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Select
                        value={announcementForm.priority}
                        onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                          setAnnouncementForm((current) => ({ ...current, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={announcementForm.status}
                        onValueChange={(value: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
                          setAnnouncementForm((current) => ({ ...current, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={announcementForm.audience}
                        onValueChange={(value: "ALL" | "STUDENTS" | "ADVISORS") =>
                          setAnnouncementForm((current) => ({ ...current, audience: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="STUDENTS">Students</SelectItem>
                          <SelectItem value="ADVISORS">Advisors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="date"
                        value={announcementForm.deadlineAt}
                        onChange={(event) =>
                          setAnnouncementForm((current) => ({ ...current, deadlineAt: event.target.value }))
                        }
                      />
                      <Select
                        value={announcementForm.targetProjectId || "__all__"}
                        onValueChange={(value) =>
                          setAnnouncementForm((current) => ({
                            ...current,
                            targetProjectId: value === "__all__" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Target project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All my projects</SelectItem>
                          {projects.map((project: AdvisorProjectItem) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.groupName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => void handleCreateAnnouncement()}
                        disabled={createAnnouncementMutation.isPending}
                      >
                        {createAnnouncementMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
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




