"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import {
  advisorProjectGroupMeetingKeys,
  useAdvisorProjectGroupMeetingDetail,
  useAdvisorProjectGroupMeetings,
  useCancelAdvisorProjectGroupMeeting,
  useCreateAdvisorProjectGroupMeeting,
  useUpdateAdvisorProjectGroupMeeting,
} from "@/lib/hooks/use-advisor-project-group-meetings"
import { acquireNotificationsSocket, releaseNotificationsSocket } from "@/lib/realtime/notifications-socket"
import { useAuthStore } from "@/store/auth-store"
import type {
  AdvisorMeetingFilter,
  AdvisorProjectGroupMeeting,
  AdvisorProjectGroupMeetingListResponse,
  RealtimeMeetingEventType,
  ReminderWindowHours,
} from "@/lib/types/advisor"
import { cn } from "@/lib/utils"

const PAGE_LIMIT = 20

type MeetingFilterTab = "ALL" | "UPCOMING_24H" | "UPCOMING_1H" | "CANCELLED"

type CreateFormState = {
  title: string
  meetingAtLocal: string
  durationMinutes: string
  agenda: string
}

const INITIAL_CREATE_FORM: CreateFormState = {
  title: "",
  meetingAtLocal: "",
  durationMinutes: "30",
  agenda: "",
}

const EMPTY_LIST_RESULT: AdvisorProjectGroupMeetingListResponse = {
  items: [],
  pagination: {
    page: 1,
    limit: PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
}

type RealtimeMeetingEventPayload = {
  type: RealtimeMeetingEventType
  meetingId?: string
  projectId?: string
  occurredAt?: string
  meeting?: AdvisorProjectGroupMeeting
}

function toIsoFromLocalDateTime(localValue: string): string {
  return new Date(localValue).toISOString()
}

function toLocalDateTimeValue(isoValue: string): string {
  const date = new Date(isoValue)
  if (Number.isNaN(date.getTime())) return ""

  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 16)
}

function formatMeetingAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function meetingStateLabel(meeting: {
  isCancelled: boolean
  isOngoing: boolean
  isCompleted: boolean
  isUpcoming: boolean
}) {
  if (meeting.isCancelled) {
    return {
      label: "Cancelled",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      icon: XCircle,
    }
  }

  if (meeting.isOngoing) {
    return {
      label: "Ongoing",
      className: "bg-primary/10 text-primary border-primary/20",
      icon: CalendarClock,
    }
  }

  if (meeting.isCompleted) {
    return {
      label: "Completed",
      className: "bg-muted text-muted-foreground border-border",
      icon: CheckCircle2,
    }
  }

  if (meeting.isUpcoming) {
    return {
      label: "Upcoming",
      className: "bg-success/10 text-success border-success/20",
      icon: Clock3,
    }
  }

  return {
    label: "Scheduled",
    className: "bg-muted text-muted-foreground border-border",
    icon: CalendarClock,
  }
}

function resolveMeetingFilter(tab: MeetingFilterTab): {
  filter?: AdvisorMeetingFilter
  reminderWindowHours?: ReminderWindowHours
} {
  switch (tab) {
    case "UPCOMING_24H":
      return {
        filter: "UPCOMING_REMINDERS",
        reminderWindowHours: 24,
      }
    case "UPCOMING_1H":
      return {
        filter: "UPCOMING_REMINDERS",
        reminderWindowHours: 1,
      }
    case "CANCELLED":
      return {
        filter: "CANCELLED",
      }
    default:
      return {
        filter: "ALL",
      }
  }
}

function validateCreateOrUpdateForm(form: CreateFormState, mode: "create" | "update") {
  if (!form.title.trim()) {
    return "Meeting title is required."
  }

  if (!form.agenda.trim()) {
    return "Agenda is required."
  }

  if (!form.meetingAtLocal.trim()) {
    return "Meeting date and time is required."
  }

  const durationMinutes = Number(form.durationMinutes)
  if (!Number.isFinite(durationMinutes) || durationMinutes < 15) {
    return "Duration must be at least 15 minutes."
  }

  const meetingDate = new Date(form.meetingAtLocal)
  if (Number.isNaN(meetingDate.getTime())) {
    return "Meeting date and time is invalid."
  }

  if (mode === "create" && meetingDate.getTime() <= Date.now()) {
    return "Meeting date and time must be in the future."
  }

  return null
}

function shouldIncludeMeetingInTab(meeting: AdvisorProjectGroupMeeting, tab: MeetingFilterTab) {
  if (tab === "ALL") return true
  if (tab === "CANCELLED") return meeting.isCancelled
  if (meeting.isCancelled) return false

  const meetingTime = new Date(meeting.meetingAt).getTime()
  if (Number.isNaN(meetingTime)) {
    return false
  }

  const now = Date.now()
  const diffMs = meetingTime - now
  if (diffMs <= 0) {
    return false
  }

  const windowHours = tab === "UPCOMING_24H" ? 24 : 1
  const maxMs = windowHours * 60 * 60 * 1000

  return diffMs <= maxMs
}

function readListParamsFromKey(queryKey: readonly unknown[]): {
  projectId: string
  page: number
  limit: number
  filter?: AdvisorMeetingFilter
  reminderWindowHours?: ReminderWindowHours
} | null {
  if (!Array.isArray(queryKey) || queryKey.length < 3) return null
  if (queryKey[0] !== "advisor" || queryKey[1] !== "project-group-meetings") return null

  const params = queryKey[2]
  if (!params || typeof params !== "object") return null
  const raw = params as Record<string, unknown>

  if (typeof raw.projectId !== "string") return null

  const page = typeof raw.page === "number" && Number.isFinite(raw.page) ? raw.page : 1
  const limit = typeof raw.limit === "number" && Number.isFinite(raw.limit) ? raw.limit : PAGE_LIMIT
  const filter = typeof raw.filter === "string" ? (raw.filter as AdvisorMeetingFilter) : undefined
  const reminderWindowHours =
    raw.reminderWindowHours === 24 || raw.reminderWindowHours === 1
      ? (raw.reminderWindowHours as ReminderWindowHours)
      : undefined

  return {
    projectId: raw.projectId,
    page,
    limit,
    filter,
    reminderWindowHours,
  }
}

function parseRealtimeMeetingPayload(value: unknown): RealtimeMeetingEventPayload | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>

  const type = raw.type
  if (type !== "scheduled" && type !== "updated" && type !== "cancelled") {
    return null
  }

  const meetingRaw =
    raw.meeting && typeof raw.meeting === "object"
      ? (raw.meeting as Record<string, unknown>)
      : raw.data && typeof raw.data === "object"
        ? (raw.data as Record<string, unknown>)
        : null

  const meetingIdFromPayload = typeof raw.meetingId === "string" ? raw.meetingId.trim() : ""
  const projectIdFromPayload = typeof raw.projectId === "string" ? raw.projectId.trim() : ""

  const meetingIdFromMeeting =
    meetingRaw && typeof meetingRaw.id === "string" ? meetingRaw.id.trim() : ""
  const projectIdFromMeeting =
    meetingRaw && typeof meetingRaw.projectId === "string" ? meetingRaw.projectId.trim() : ""

  const meetingId = meetingIdFromPayload || meetingIdFromMeeting || undefined
  const projectId = projectIdFromPayload || projectIdFromMeeting || undefined

  const meeting: AdvisorProjectGroupMeeting | undefined =
    meetingRaw && meetingIdFromMeeting && projectIdFromMeeting && typeof meetingRaw.meetingAt === "string"
      ? {
          id: meetingIdFromMeeting,
          projectId: projectIdFromMeeting,
          projectGroupId: typeof meetingRaw.projectGroupId === "string" ? meetingRaw.projectGroupId : undefined,
          title: typeof meetingRaw.title === "string" ? meetingRaw.title : "",
          meetingAt: meetingRaw.meetingAt,
          durationMinutes:
            typeof meetingRaw.durationMinutes === "number" && Number.isFinite(meetingRaw.durationMinutes)
              ? meetingRaw.durationMinutes
              : 0,
          agenda: typeof meetingRaw.agenda === "string" ? meetingRaw.agenda : "",
          isUpcoming: Boolean(meetingRaw.isUpcoming),
          isOngoing: Boolean(meetingRaw.isOngoing),
          isCompleted: Boolean(meetingRaw.isCompleted),
          isCancelled: Boolean(meetingRaw.isCancelled),
          cancelledAt: typeof meetingRaw.cancelledAt === "string" ? meetingRaw.cancelledAt : null,
          cancellationReason:
            typeof meetingRaw.cancellationReason === "string" ? meetingRaw.cancellationReason : null,
          createdAt: typeof meetingRaw.createdAt === "string" ? meetingRaw.createdAt : undefined,
          updatedAt: typeof meetingRaw.updatedAt === "string" ? meetingRaw.updatedAt : undefined,
        }
      : undefined

  return {
    type,
    meetingId,
    projectId,
    occurredAt: typeof raw.occurredAt === "string" ? raw.occurredAt : undefined,
    meeting,
  }
}

export function AdvisorSchedulePage() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  const accessToken = useAuthStore((state) => state.accessToken)
  const tenantDomain = useAuthStore((state) => state.tenantDomain)

  const projectsQuery = useAdvisorProjects()
  const createMeetingMutation = useCreateAdvisorProjectGroupMeeting()
  const updateMeetingMutation = useUpdateAdvisorProjectGroupMeeting()
  const cancelMeetingMutation = useCancelAdvisorProjectGroupMeeting()

  const [selectedProjectId, setSelectedProjectId] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [activeFilter, setActiveFilter] = React.useState<MeetingFilterTab>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<CreateFormState>(INITIAL_CREATE_FORM)
  const [updateForm, setUpdateForm] = React.useState<CreateFormState>(INITIAL_CREATE_FORM)
  const [cancelReason, setCancelReason] = React.useState("")
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<string | null>(null)

  const projects = projectsQuery.data ?? []
  const selectedProject = React.useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const deepLinkHandledRef = React.useRef(false)

  const deepLinkProjectId = searchParams.get("projectId")?.trim() ?? ""
  const deepLinkMeetingId = searchParams.get("meetingId")?.trim() ?? ""

  React.useEffect(() => {
    if (projects.length === 0) return

    if (!deepLinkHandledRef.current && deepLinkProjectId) {
      const exists = projects.some((project) => project.id === deepLinkProjectId)
      if (exists) {
        setSelectedProjectId(deepLinkProjectId)
        setCurrentPage(1)
        if (deepLinkMeetingId) {
          setSelectedMeetingId(deepLinkMeetingId)
        }
        deepLinkHandledRef.current = true
        return
      }
    }

    if (selectedProjectId) return

    setSelectedProjectId(projects[0].id)
    setCurrentPage(1)
    deepLinkHandledRef.current = true
  }, [deepLinkMeetingId, deepLinkProjectId, projects, selectedProjectId])

  const filterParams = React.useMemo(() => resolveMeetingFilter(activeFilter), [activeFilter])

  const meetingsQuery = useAdvisorProjectGroupMeetings({
    projectId: selectedProjectId,
    page: currentPage,
    limit: PAGE_LIMIT,
    filter: filterParams.filter,
    reminderWindowHours: filterParams.reminderWindowHours,
  })

  const detailQuery = useAdvisorProjectGroupMeetingDetail({
    meetingId: selectedMeetingId ?? undefined,
    projectId: selectedProjectId || undefined,
  })

  const meetings = meetingsQuery.data?.items ?? []
  const pagination = meetingsQuery.data?.pagination ?? {
    page: currentPage,
    limit: PAGE_LIMIT,
    totalItems: meetings.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: currentPage > 1,
  }

  const hasProjectSelection = Boolean(selectedProjectId)

  const detailMeeting = detailQuery.data

  React.useEffect(() => {
    if (!detailMeeting) return

    setUpdateForm({
      title: detailMeeting.title,
      meetingAtLocal: toLocalDateTimeValue(detailMeeting.meetingAt),
      durationMinutes: String(Math.max(15, detailMeeting.durationMinutes || 15)),
      agenda: detailMeeting.agenda ?? "",
    })
    setCancelReason(detailMeeting.cancellationReason ?? "")
  }, [detailMeeting])

  const patchMeetingInCaches = React.useCallback(
    (meeting: AdvisorProjectGroupMeeting, action: RealtimeMeetingEventType) => {
      const listQueries = queryClient.getQueriesData<AdvisorProjectGroupMeetingListResponse>({
        queryKey: advisorProjectGroupMeetingKeys.root,
      })

      for (const [key, previous] of listQueries) {
        if (!previous) continue
        if (!Array.isArray(key)) continue

        const listParams = readListParamsFromKey(key)
        if (!listParams) continue
        if (listParams.projectId !== meeting.projectId) continue

        const tabLike: MeetingFilterTab =
          listParams.filter === "CANCELLED"
            ? "CANCELLED"
            : listParams.filter === "UPCOMING_REMINDERS" && listParams.reminderWindowHours === 1
              ? "UPCOMING_1H"
              : listParams.filter === "UPCOMING_REMINDERS" && listParams.reminderWindowHours === 24
                ? "UPCOMING_24H"
                : "ALL"

        queryClient.setQueryData<AdvisorProjectGroupMeetingListResponse>(key, (current) => {
          const base = current ?? EMPTY_LIST_RESULT
          const existingIndex = base.items.findIndex((item) => item.id === meeting.id)

          if (action === "scheduled") {
            if (!shouldIncludeMeetingInTab(meeting, tabLike)) {
              return existingIndex >= 0
                ? {
                    ...base,
                    items: base.items.filter((item) => item.id !== meeting.id),
                    pagination: {
                      ...base.pagination,
                      totalItems: Math.max(0, base.pagination.totalItems - 1),
                    },
                  }
                : base
            }

            if (existingIndex >= 0) {
              const nextItems = base.items.map((item) => (item.id === meeting.id ? meeting : item))
              return { ...base, items: nextItems }
            }

            if (listParams.page === 1) {
              const nextItems = [meeting, ...base.items].slice(0, base.pagination.limit)
              return {
                ...base,
                items: nextItems,
                pagination: {
                  ...base.pagination,
                  totalItems: base.pagination.totalItems + 1,
                  totalPages: Math.max(
                    base.pagination.totalPages,
                    Math.ceil((base.pagination.totalItems + 1) / Math.max(base.pagination.limit, 1)),
                  ),
                },
              }
            }

            return {
              ...base,
              pagination: {
                ...base.pagination,
                totalItems: base.pagination.totalItems + 1,
                totalPages: Math.max(
                  base.pagination.totalPages,
                  Math.ceil((base.pagination.totalItems + 1) / Math.max(base.pagination.limit, 1)),
                ),
              },
            }
          }

          if (existingIndex < 0) {
            return base
          }

          if (!shouldIncludeMeetingInTab(meeting, tabLike)) {
            return {
              ...base,
              items: base.items.filter((item) => item.id !== meeting.id),
              pagination: {
                ...base.pagination,
                totalItems: Math.max(0, base.pagination.totalItems - 1),
              },
            }
          }

          const nextItems = base.items.map((item) => (item.id === meeting.id ? meeting : item))
          return {
            ...base,
            items: nextItems,
          }
        })
      }

      const detailQueries = queryClient.getQueriesData<AdvisorProjectGroupMeeting>({
        queryKey: ["advisor", "project-group-meeting-detail"],
      })

      for (const [key] of detailQueries) {
        if (!Array.isArray(key) || key.length < 3) continue
        if (key[0] !== "advisor" || key[1] !== "project-group-meeting-detail") continue

        const params = key[2]
        if (!params || typeof params !== "object") continue
        const raw = params as Record<string, unknown>
        if (raw.meetingId !== meeting.id) continue

        queryClient.setQueryData<AdvisorProjectGroupMeeting>(key, meeting)
      }
    },
    [queryClient],
  )

  React.useEffect(() => {
    if (!accessToken) return

    const socket = acquireNotificationsSocket({
      accessToken,
      tenantDomain,
    })

    const seen = new Set<string>()

    const onProjectGroupMeeting = (payload: unknown) => {
      const event = parseRealtimeMeetingPayload(payload)
      if (!event) return

      const dedupeId = `${event.type}:${event.meetingId ?? ""}:${event.projectId ?? ""}:${event.occurredAt ?? ""}`
      if (seen.has(dedupeId)) return
      seen.add(dedupeId)

      if (event.meeting) {
        patchMeetingInCaches(event.meeting, event.type)
      } else {
        void queryClient.invalidateQueries({ queryKey: advisorProjectGroupMeetingKeys.root })
      }

      if (event.meetingId) {
        void queryClient.invalidateQueries({
          queryKey: ["advisor", "project-group-meeting-detail", { meetingId: event.meetingId, projectId: event.projectId ?? "" }],
        })
      }
    }

    socket.on("project-group-meeting", onProjectGroupMeeting)

    return () => {
      socket.off("project-group-meeting", onProjectGroupMeeting)
      releaseNotificationsSocket(socket)
    }
  }, [accessToken, patchMeetingInCaches, queryClient, tenantDomain])

  function handleProjectChange(value: string) {
    setSelectedProjectId(value)
    setCurrentPage(1)
    setSelectedMeetingId(null)
  }

  function handleFilterChange(value: string) {
    setActiveFilter(value as MeetingFilterTab)
    setCurrentPage(1)
  }

  function handleCreateInputChange<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setCreateForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleUpdateInputChange<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setUpdateForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreateMeeting() {
    if (!selectedProjectId) {
      toast.error("Select a project before scheduling a meeting.")
      return
    }

    const validationError = validateCreateOrUpdateForm(createForm, "create")
    if (validationError) {
      toast.error(validationError)
      return
    }

    const durationMinutes = Number(createForm.durationMinutes)

    try {
      const created = await createMeetingMutation.mutateAsync({
        projectId: selectedProjectId,
        title: createForm.title.trim(),
        meetingAt: toIsoFromLocalDateTime(createForm.meetingAtLocal),
        durationMinutes,
        agenda: createForm.agenda.trim(),
      })

      patchMeetingInCaches(created, "scheduled")

      setCurrentPage(1)
      setIsCreateDialogOpen(false)
      setCreateForm(INITIAL_CREATE_FORM)
      toast.success("Meeting scheduled successfully.")

      void queryClient.invalidateQueries({ queryKey: advisorProjectGroupMeetingKeys.root })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to schedule meeting."
      toast.error(message)
    }
  }

  async function handleUpdateMeeting() {
    if (!detailMeeting || !selectedProjectId) {
      toast.error("Meeting detail is not loaded.")
      return
    }

    if (detailMeeting.isCancelled) {
      toast.error("Cancelled meetings cannot be updated.")
      return
    }

    const validationError = validateCreateOrUpdateForm(updateForm, "update")
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const updated = await updateMeetingMutation.mutateAsync({
        meetingId: detailMeeting.id,
        projectId: selectedProjectId,
        dto: {
          title: updateForm.title.trim(),
          meetingAt: toIsoFromLocalDateTime(updateForm.meetingAtLocal),
          durationMinutes: Number(updateForm.durationMinutes),
          agenda: updateForm.agenda.trim(),
        },
      })

      patchMeetingInCaches(updated, "updated")
      toast.success("Meeting updated successfully.")

      void queryClient.invalidateQueries({ queryKey: advisorProjectGroupMeetingKeys.root })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update meeting."
      toast.error(message)
    }
  }

  async function handleCancelMeeting() {
    if (!detailMeeting || !selectedProjectId) {
      toast.error("Meeting detail is not loaded.")
      return
    }

    if (detailMeeting.isCancelled) {
      toast.error("Meeting is already cancelled.")
      return
    }

    try {
      const cancelled = await cancelMeetingMutation.mutateAsync({
        meetingId: detailMeeting.id,
        projectId: selectedProjectId,
        dto: {
          reason: cancelReason.trim() || undefined,
        },
      })

      patchMeetingInCaches(cancelled, "cancelled")
      toast.success("Meeting cancelled.")

      void queryClient.invalidateQueries({ queryKey: advisorProjectGroupMeetingKeys.root })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel meeting."
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meeting Scheduler</h1>
          <p className="text-muted-foreground">Schedule, update, cancel, and monitor project-group meetings.</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!hasProjectSelection}>Schedule Meeting</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                This posts to the advisor meeting scheduler endpoint and prepends the new record in list.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Title</Label>
                <Input
                  id="meeting-title"
                  value={createForm.title}
                  onChange={(event) => handleCreateInputChange("title", event.target.value)}
                  placeholder="Weekly milestone checkpoint"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-at">Meeting at</Label>
                <Input
                  id="meeting-at"
                  type="datetime-local"
                  value={createForm.meetingAtLocal}
                  onChange={(event) => handleCreateInputChange("meetingAtLocal", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Duration (minutes)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  min={15}
                  step={5}
                  value={createForm.durationMinutes}
                  onChange={(event) => handleCreateInputChange("durationMinutes", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-agenda">Agenda</Label>
                <Textarea
                  id="meeting-agenda"
                  value={createForm.agenda}
                  onChange={(event) => handleCreateInputChange("agenda", event.target.value)}
                  placeholder="Topics and expected outcomes"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreateMeeting()} disabled={createMeetingMutation.isPending}>
                {createMeetingMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </span>
                ) : (
                  "Create Meeting"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,420px)_1fr] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="advisor-project-selector">Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={handleProjectChange}
                disabled={projectsQuery.isLoading || projects.length === 0}
              >
                <SelectTrigger id="advisor-project-selector">
                  <SelectValue
                    placeholder={projectsQuery.isLoading ? "Loading projects..." : "Select project"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {selectedProject ? (
                <>
                  <span className="font-medium text-foreground">{selectedProject.title}</span>
                  <span className="ml-2">Meeting history and upcoming schedules.</span>
                </>
              ) : (
                <span>Select a project to load meetings.</span>
              )}
            </div>
          </div>

          <Tabs value={activeFilter} onValueChange={handleFilterChange}>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="UPCOMING_24H">Upcoming 24h</TabsTrigger>
              <TabsTrigger value="UPCOMING_1H">Upcoming 1h</TabsTrigger>
              <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {projectsQuery.isError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Could not load advisor projects: {projectsQuery.error.message}
            </div>
          )}

          {hasProjectSelection && meetingsQuery.isError && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Could not load meetings: {meetingsQuery.error.message}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cancellation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasProjectSelection && !projectsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No project selected.
                  </TableCell>
                </TableRow>
              )}

              {projectsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading advisor projects...
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {hasProjectSelection && meetingsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading meetings...
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {hasProjectSelection && !meetingsQuery.isLoading && meetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No meetings found for this project and filter.
                  </TableCell>
                </TableRow>
              )}

              {meetings.map((meeting) => {
                const state = meetingStateLabel(meeting)
                const StateIcon = state.icon

                return (
                  <TableRow
                    key={meeting.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedMeetingId(meeting.id)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{meeting.title || "Untitled meeting"}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {meeting.agenda || "No agenda provided."}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatMeetingAt(meeting.meetingAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {meeting.durationMinutes > 0 ? `${meeting.durationMinutes} min` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("inline-flex items-center gap-1", state.className)}>
                        <StateIcon className="h-3.5 w-3.5" />
                        {state.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {meeting.isCancelled ? (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{meeting.cancellationReason || "No reason provided"}</p>
                          {meeting.cancelledAt && <p>{formatMeetingAt(meeting.cancelledAt)}</p>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Active</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              <span className="ml-2">({pagination.totalItems} total)</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPreviousPage || meetingsQuery.isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage || meetingsQuery.isLoading}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              Step status
            </span>
            <span className="ml-2">
              Step 4 update/cancel, Step 5 realtime sync, and Step 6 deep-link opening are integrated.
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedMeetingId)}
        onOpenChange={(open) => {
          if (!open) setSelectedMeetingId(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
            <DialogDescription>
              Manage update/reschedule and cancellation from this detail view.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading meeting details...
              </span>
            </div>
          )}

          {detailQuery.isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Could not load details: {detailQuery.error.message}
            </div>
          )}

          {!detailQuery.isLoading && !detailQuery.isError && detailMeeting && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p>{meetingStateLabel(detailMeeting).label}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Meeting ID</p>
                  <p className="truncate">{detailMeeting.id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-title">Title</Label>
                <Input
                  id="update-title"
                  value={updateForm.title}
                  onChange={(event) => handleUpdateInputChange("title", event.target.value)}
                  disabled={detailMeeting.isCancelled || updateMeetingMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-at">Meeting at</Label>
                <Input
                  id="update-at"
                  type="datetime-local"
                  value={updateForm.meetingAtLocal}
                  onChange={(event) => handleUpdateInputChange("meetingAtLocal", event.target.value)}
                  disabled={detailMeeting.isCancelled || updateMeetingMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-duration">Duration (minutes)</Label>
                <Input
                  id="update-duration"
                  type="number"
                  min={15}
                  step={5}
                  value={updateForm.durationMinutes}
                  onChange={(event) => handleUpdateInputChange("durationMinutes", event.target.value)}
                  disabled={detailMeeting.isCancelled || updateMeetingMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-agenda">Agenda</Label>
                <Textarea
                  id="update-agenda"
                  value={updateForm.agenda}
                  onChange={(event) => handleUpdateInputChange("agenda", event.target.value)}
                  rows={4}
                  disabled={detailMeeting.isCancelled || updateMeetingMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Cancellation reason (optional)</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  rows={3}
                  disabled={detailMeeting.isCancelled || cancelMeetingMutation.isPending}
                />
              </div>

              {detailMeeting.isCancelled && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="font-medium text-destructive">Cancelled</p>
                  <p className="text-muted-foreground">Reason: {detailMeeting.cancellationReason || "No reason provided"}</p>
                  {detailMeeting.cancelledAt && (
                    <p className="text-muted-foreground">Cancelled at: {formatMeetingAt(detailMeeting.cancelledAt)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void handleUpdateMeeting()}
              disabled={
                !detailMeeting ||
                detailMeeting.isCancelled ||
                detailQuery.isLoading ||
                updateMeetingMutation.isPending
              }
            >
              {updateMeetingMutation.isPending ? "Updating..." : "Update / Reschedule"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancelMeeting()}
              disabled={
                !detailMeeting ||
                detailMeeting.isCancelled ||
                detailQuery.isLoading ||
                cancelMeetingMutation.isPending
              }
            >
              {cancelMeetingMutation.isPending ? "Cancelling..." : "Cancel Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvisorSchedulePage
