"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, LoaderCircle, Megaphone, Pencil, Plus, RefreshCcw, Trash2, UserRound } from "lucide-react"
import { DepartmentAnnouncementFormCard } from "@/components/dashboard/department-head/department-announcement-form-card"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  useCreateDepartmentAnnouncement,
  useDeleteDepartmentAnnouncement,
  useDepartmentAnnouncementById,
  useDepartmentAnnouncements,
  useUpdateDepartmentAnnouncement,
} from "@/lib/hooks/use-department-announcements"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import type {
  DepartmentAnnouncementActionType,
  DepartmentAnnouncementItem,
  UpdateDepartmentAnnouncementDto,
} from "@/types/department-announcements"

function clampPage(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function toIsoFromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function toLocalInputValue(isoDate: string | null): string {
  if (!isoDate) return ""
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ""

  const offsetMs = date.getTimezoneOffset() * 60_000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

function mapAnnouncementError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback
  const normalized = message.toLowerCase()

  if (normalized.includes("access denied to department")) {
    return "You do not have access to this department."
  }

  if (normalized.includes("deadlineat must be in the future") || normalized.includes("deadline")) {
    return "Deadline must be in the future."
  }

  if (normalized.includes("actionurl must be a valid url") || normalized.includes("action url")) {
    return "Action URL must be a valid URL with protocol (https://...)."
  }

  if (normalized.includes("announcement not found")) {
    return "Announcement not found."
  }

  return message || fallback
}

function formatCreatedBy(announcement: DepartmentAnnouncementItem): string {
  const firstName = announcement.createdBy.firstName?.trim() ?? ""
  const lastName = announcement.createdBy.lastName?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || "Unknown"
}

function formatDateTime(value: string | null): string {
  if (!value) return "No deadline"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCountdown(secondsRemaining: number | null): string {
  if (secondsRemaining === null || secondsRemaining < 0) return "No deadline"

  const days = Math.floor(secondsRemaining / 86_400)
  const hours = Math.floor((secondsRemaining % 86_400) / 3_600)
  const minutes = Math.floor((secondsRemaining % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${Math.max(0, minutes)}m left`
}

function getAnnouncementStatus(announcement: DepartmentAnnouncementItem): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
} {
  if (announcement.isExpired) {
    return { label: "Expired", variant: "destructive" }
  }

  if (announcement.isDisabled) {
    return { label: "Disabled", variant: "secondary" }
  }

  return { label: "Active", variant: "outline" }
}

function AnnouncementCreateDialogContent({
  departmentId,
  onClose,
  onCreated,
}: {
  departmentId: string
  onClose: () => void
  onCreated: () => Promise<unknown>
}) {
  const createMutation = useCreateDepartmentAnnouncement()

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [actionType, setActionType] = useState<DepartmentAnnouncementActionType>("FORM_PROJECT_GROUP")
  const [actionLabel, setActionLabel] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [deadlineAtLocal, setDeadlineAtLocal] = useState("")
  const [deadlineError, setDeadlineError] = useState<string | null>(null)
  const [actionLabelError, setActionLabelError] = useState<string | null>(null)
  const [actionUrlError, setActionUrlError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    const trimmedActionLabel = actionLabel.trim()
    const trimmedActionUrl = actionUrl.trim()

    if (!trimmedTitle || !trimmedMessage) {
      toast.error("Title and message are required")
      return
    }

    const hasActionLabel = Boolean(trimmedActionLabel)
    const hasActionUrl = Boolean(trimmedActionUrl)

    if (hasActionLabel !== hasActionUrl) {
      setActionLabelError(!hasActionLabel ? "Action label is required when URL is set" : null)
      setActionUrlError(!hasActionUrl ? "Action URL is required when label is set" : null)
      return
    }

    if (hasActionLabel && trimmedActionLabel.length > 120) {
      setActionLabelError("Action label must be 120 characters or fewer")
      return
    }

    if (hasActionUrl && !isValidHttpUrl(trimmedActionUrl)) {
      setActionUrlError("Action URL must be a valid URL with protocol (https://...)")
      return
    }

    setActionLabelError(null)
    setActionUrlError(null)

    const deadlineIso = toIsoFromDatetimeLocal(deadlineAtLocal)
    if (deadlineAtLocal && !deadlineIso) {
      setDeadlineError("Enter a valid date and time")
      return
    }

    if (deadlineIso && new Date(deadlineIso).getTime() <= Date.now()) {
      setDeadlineError("Deadline must be in the future")
      return
    }

    setDeadlineError(null)

    try {
      await createMutation.mutateAsync({
        departmentId,
        dto: {
          title: trimmedTitle,
          message: trimmedMessage,
          actionType,
          ...(hasActionLabel && hasActionUrl
            ? { actionLabel: trimmedActionLabel, actionUrl: trimmedActionUrl }
            : {}),
          ...(deadlineIso ? { deadlineAt: deadlineIso } : {}),
        },
      })

      toast.success("Announcement created")
      await onCreated()
      onClose()
    } catch (error) {
      const mapped = mapAnnouncementError(error, "Failed to create announcement")
      if (mapped.toLowerCase().includes("deadline")) setDeadlineError(mapped)
      if (mapped.toLowerCase().includes("action url")) setActionUrlError(mapped)
      toast.error(mapped)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogDescription>Create a new department announcement from the coordinator dashboard.</DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <DepartmentAnnouncementFormCard
          title={title}
          message={message}
          actionType={actionType}
          actionLabel={actionLabel}
          actionUrl={actionUrl}
          deadlineAtLocal={deadlineAtLocal}
          deadlineError={deadlineError}
          actionLabelError={actionLabelError}
          actionUrlError={actionUrlError}
          onTitleChange={setTitle}
          onMessageChange={setMessage}
          onActionTypeChange={setActionType}
          onActionLabelChange={(value) => {
            setActionLabel(value)
            setActionLabelError(null)
          }}
          onActionUrlChange={(value) => {
            setActionUrl(value)
            setActionUrlError(null)
          }}
          onDeadlineAtChange={(value) => {
            setDeadlineAtLocal(value)
            setDeadlineError(null)
          }}
          showCard={false}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Announcement"}
        </Button>
      </div>
    </>
  )
}

function AnnouncementEditDialogContent({
  departmentId,
  announcementId,
  onClose,
  onSaved,
}: {
  departmentId: string
  announcementId: string
  onClose: () => void
  onSaved: () => Promise<unknown>
}) {
  const announcementQuery = useDepartmentAnnouncementById({
    enabled: true,
    departmentId,
    announcementId,
  })
  const updateMutation = useUpdateDepartmentAnnouncement()

  const announcement = announcementQuery.data ?? null

  const [draft, setDraft] = useState<{
    title?: string
    message?: string
    actionType?: DepartmentAnnouncementActionType
    actionLabel?: string
    actionUrl?: string
    deadlineAtLocal?: string
  } | null>(null)
  const [deadlineError, setDeadlineError] = useState<string | null>(null)
  const [actionLabelError, setActionLabelError] = useState<string | null>(null)
  const [actionUrlError, setActionUrlError] = useState<string | null>(null)

  const title = draft?.title ?? announcement?.title ?? ""
  const message = draft?.message ?? announcement?.message ?? ""
  const actionType = draft?.actionType ?? announcement?.actionType ?? "FORM_PROJECT_GROUP"
  const actionLabel = draft?.actionLabel ?? announcement?.actionLabel ?? ""
  const actionUrl = draft?.actionUrl ?? announcement?.actionUrl ?? ""
  const deadlineAtLocal = draft?.deadlineAtLocal ?? toLocalInputValue(announcement?.deadlineAt ?? null)

  const handleSubmit = async () => {
    if (!announcement) {
      toast.error("Announcement not found")
      return
    }

    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    const trimmedActionLabel = actionLabel.trim()
    const trimmedActionUrl = actionUrl.trim()

    if (!trimmedTitle || !trimmedMessage) {
      toast.error("Title and message are required")
      return
    }

    const hasActionLabel = Boolean(trimmedActionLabel)
    const hasActionUrl = Boolean(trimmedActionUrl)

    if (hasActionLabel !== hasActionUrl) {
      setActionLabelError(!hasActionLabel ? "Action label is required when URL is set" : null)
      setActionUrlError(!hasActionUrl ? "Action URL is required when label is set" : null)
      return
    }

    if (hasActionLabel && trimmedActionLabel.length > 120) {
      setActionLabelError("Action label must be 120 characters or fewer")
      return
    }

    if (hasActionUrl && !isValidHttpUrl(trimmedActionUrl)) {
      setActionUrlError("Action URL must be a valid URL with protocol (https://...)")
      return
    }

    setActionLabelError(null)
    setActionUrlError(null)

    const nextDeadlineIso = toIsoFromDatetimeLocal(deadlineAtLocal)
    if (deadlineAtLocal && !nextDeadlineIso) {
      setDeadlineError("Enter a valid date and time")
      return
    }

    if (nextDeadlineIso && new Date(nextDeadlineIso).getTime() <= Date.now()) {
      setDeadlineError("Deadline must be in the future")
      return
    }

    setDeadlineError(null)

    const dto: UpdateDepartmentAnnouncementDto = {}

    if (trimmedTitle !== announcement.title) dto.title = trimmedTitle
    if (trimmedMessage !== announcement.message) dto.message = trimmedMessage
    if (actionType !== announcement.actionType) dto.actionType = actionType

    const initialActionLabel = announcement.actionLabel?.trim() ?? ""
    const initialActionUrl = announcement.actionUrl?.trim() ?? ""
    const hadInitialCta = Boolean(initialActionLabel) && Boolean(initialActionUrl)
    const hasNextCta = hasActionLabel && hasActionUrl

    if (!hasNextCta && hadInitialCta) {
      dto.actionLabel = null
      dto.actionUrl = null
    } else if (hasNextCta && (trimmedActionLabel !== initialActionLabel || trimmedActionUrl !== initialActionUrl)) {
      dto.actionLabel = trimmedActionLabel
      dto.actionUrl = trimmedActionUrl
    }

    const initialDeadlineIso = announcement.deadlineAt ?? null
    const deadlineChanged = nextDeadlineIso !== initialDeadlineIso
    if (deadlineChanged) {
      if (nextDeadlineIso) {
        dto.deadlineAt = nextDeadlineIso
      } else if (initialDeadlineIso) {
        dto.clearDeadline = true
      }
    }

    if (Object.keys(dto).length === 0) {
      toast.message("No changes to save")
      return
    }

    try {
      await updateMutation.mutateAsync({
        departmentId,
        announcementId,
        dto,
      })

      toast.success("Announcement updated")
      await onSaved()
      onClose()
    } catch (error) {
      const mapped = mapAnnouncementError(error, "Failed to update announcement")
      if (mapped.toLowerCase().includes("deadline")) setDeadlineError(mapped)
      if (mapped.toLowerCase().includes("action url")) setActionUrlError(mapped)
      toast.error(mapped)
    }
  }

  if (announcementQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading announcement...
      </div>
    )
  }

  if (announcementQuery.isError || !announcement) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Announcement not found</DialogTitle>
          <DialogDescription>The selected announcement could not be loaded.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogDescription>Editing uses a fresh fetch so the latest backend state is loaded first.</DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <DepartmentAnnouncementFormCard
          title={title}
          message={message}
          actionType={actionType}
          actionLabel={actionLabel}
          actionUrl={actionUrl}
          deadlineAtLocal={deadlineAtLocal}
          deadlineError={deadlineError}
          actionLabelError={actionLabelError}
          actionUrlError={actionUrlError}
          onTitleChange={(value) => setDraft((previous) => ({ ...(previous ?? {}), title: value }))}
          onMessageChange={(value) => setDraft((previous) => ({ ...(previous ?? {}), message: value }))}
          onActionTypeChange={(value) => setDraft((previous) => ({ ...(previous ?? {}), actionType: value }))}
          onActionLabelChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), actionLabel: value }))
            setActionLabelError(null)
          }}
          onActionUrlChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), actionUrl: value }))
            setActionUrlError(null)
          }}
          onDeadlineAtChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), deadlineAtLocal: value }))
            setDeadlineError(null)
          }}
          showCard={false}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </>
  )
}

function AnnouncementDeleteDialogContent({
  departmentId,
  announcement,
  onClose,
  onDeleted,
}: {
  departmentId: string
  announcement: DepartmentAnnouncementItem
  onClose: () => void
  onDeleted: () => Promise<unknown>
}) {
  const deleteMutation = useDeleteDepartmentAnnouncement()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        departmentId,
        announcementId: announcement.id,
      })

      toast.success("Announcement deleted")
      await onDeleted()
      onClose()
    } catch (error) {
      toast.error(mapAnnouncementError(error, "Failed to delete announcement"))
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete Announcement</DialogTitle>
        <DialogDescription>
          This will permanently delete the announcement from the department feed.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-foreground">{announcement.title}</p>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{announcement.message}</p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? "Deleting..." : "Delete Announcement"}
        </Button>
      </div>
    </>
  )
}

function AnnouncementRow({
  announcement,
  onEdit,
  onDelete,
}: {
  announcement: DepartmentAnnouncementItem
  onEdit: (announcementId: string) => void
  onDelete: (announcement: DepartmentAnnouncementItem) => void
}) {
  const status = getAnnouncementStatus(announcement)
  const countdown = announcement.deadlineAt
    ? announcement.isExpired
      ? "Expired"
      : formatCountdown(announcement.secondsRemaining)
    : "No deadline"

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-tight">{announcement.title}</h3>
            <Badge variant="secondary">{announcement.actionType}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{announcement.message}</p>

          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CTA</p>
              <p className="mt-1 font-medium">{announcement.actionLabel?.trim() || "No CTA label"}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                {announcement.actionUrl?.trim() || "No CTA URL"}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deadline</p>
              <p className="mt-1 font-medium">{formatDateTime(announcement.deadlineAt)}</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Countdown</p>
              <p className="mt-1 font-medium">{countdown}</p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created By</p>
              <p className="mt-1 font-medium">{formatCreatedBy(announcement)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(announcement.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 lg:pl-4">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => onEdit(announcement.id)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(announcement)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  )
}

export function CoordinatorAnnouncementsManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const authIsLoading = useAuthStore((state) => state.isLoading)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null

  const [page, setPage] = useState(1)
  const [jumpPageInput, setJumpPageInput] = useState("1")
  const [createOpen, setCreateOpen] = useState(false)
  const [editAnnouncementId, setEditAnnouncementId] = useState<string | null>(null)
  const [deleteAnnouncement, setDeleteAnnouncement] = useState<DepartmentAnnouncementItem | null>(null)

  const pageSize = 10

  const announcementsQuery = useDepartmentAnnouncements({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    page: Math.max(1, page),
    limit: pageSize,
  })

  const announcements = announcementsQuery.data?.items ?? []
  const pagination = announcementsQuery.data?.pagination
  const totalPages = Math.max(1, pagination?.pages ?? 1)
  const currentPage = Math.max(1, pagination?.page ?? page)
  const totalItems = pagination?.total ?? announcements.length

  const pageSummary = useMemo(() => {
    if (totalItems === 0) return "0 of 0"
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)
    return `${start}-${end} of ${totalItems}`
  }, [currentPage, pageSize, totalItems])

  useEffect(() => {
    if (!announcementsQuery.isSuccess) return
    if (page === 1) return
    if (announcements.length > 0) return
    setPage((previous) => Math.max(1, previous - 1))
  }, [announcements.length, announcementsQuery.isSuccess, page])

  useEffect(() => {
    if (totalPages < page) {
      setPage(Math.max(1, totalPages))
    }
  }, [page, totalPages])

  useEffect(() => {
    setJumpPageInput(String(currentPage))
  }, [currentPage])

  const handleJumpToPage = () => {
    const parsed = Number.parseInt(jumpPageInput, 10)
    if (!Number.isFinite(parsed)) {
      setJumpPageInput(String(currentPage))
      return
    }

    const nextPage = clampPage(parsed, 1, Math.max(1, totalPages))
    setPage(nextPage)
  }

  if (authIsLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Coordinator Announcements"
          description="Loading coordinator announcement management..."
        />
      </div>
    )
  }

  if (!accessToken || !user) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Coordinator Announcements"
          description="You need to be signed in to manage department announcements."
        />
      </div>
    )
  }

  if (!departmentId) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Coordinator Announcements"
          description="Department context is required before announcements can be loaded."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Coordinator Announcements"
        description="Create, edit, and remove department announcements from one coordinator workspace."
        actions={
          <>
            <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Announcement
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => announcementsQuery.refetch()}
              disabled={announcementsQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <AnnouncementCreateDialogContent
            departmentId={departmentId}
            onClose={() => setCreateOpen(false)}
            onCreated={() => announcementsQuery.refetch()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editAnnouncementId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditAnnouncementId(null)
        }}
      >
        {editAnnouncementId ? (
          <DialogContent className="max-w-2xl w-[95vw]">
            <AnnouncementEditDialogContent
              departmentId={departmentId}
              announcementId={editAnnouncementId}
              onClose={() => setEditAnnouncementId(null)}
              onSaved={() => announcementsQuery.refetch()}
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleteAnnouncement)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteAnnouncement(null)
        }}
      >
        {deleteAnnouncement ? (
          <DialogContent className="max-w-md">
            <AnnouncementDeleteDialogContent
              departmentId={departmentId}
              announcement={deleteAnnouncement}
              onClose={() => setDeleteAnnouncement(null)}
              onDeleted={() => announcementsQuery.refetch()}
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <Card className="border-border/70">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-primary" />
              Department Announcement Feed
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This view is now backed by the real department announcements endpoint.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              Showing {pageSummary}
            </span>
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {pageSize} per page
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcementsQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <p className="font-medium">Failed to load announcements</p>
              <p className="mt-1">{announcementsQuery.error?.message || "Unknown error"}</p>
            </div>
          ) : announcementsQuery.isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium">No announcements found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a coordinator announcement to populate this feed.
              </p>
              <Button type="button" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={setEditAnnouncementId}
                  onDelete={setDeleteAnnouncement}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Page {currentPage} of {Math.max(1, totalPages)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage <= 1 || announcementsQuery.isFetching}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPage >= totalPages || announcementsQuery.isFetching}
          >
            Next
          </Button>
          <div className="flex items-center gap-1 pl-1">
            <Input
              type="number"
              min={1}
              max={Math.max(1, totalPages)}
              value={jumpPageInput}
              onChange={(event) => setJumpPageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleJumpToPage()
                }
              }}
              className="h-8 w-16"
              aria-label="Jump to page"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              disabled={announcementsQuery.isFetching || totalPages <= 1}
            >
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}