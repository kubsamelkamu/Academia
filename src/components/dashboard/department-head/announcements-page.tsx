"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  useCreateDepartmentAnnouncement,
  useDepartmentAnnouncements,
  useDeleteDepartmentAnnouncement,
  useUpdateDepartmentAnnouncement,
} from "@/lib/hooks/use-department-announcements"
import type { DepartmentAnnouncementActionType, DepartmentAnnouncementItem } from "@/types/department-announcements"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { DepartmentAnnouncementFormCard } from "@/components/dashboard/department-head/department-announcement-form-card"

function clampPage(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatCreatedBy(announcement: DepartmentAnnouncementItem): string {
  const firstName = announcement.createdBy.firstName?.trim() ?? ""
  const lastName = announcement.createdBy.lastName?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || "Unknown"
}

function formatDateTime(value: string): string {
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
  if (secondsRemaining === null || secondsRemaining < 0) return "No countdown"

  const days = Math.floor(secondsRemaining / 86_400)
  const hours = Math.floor((secondsRemaining % 86_400) / 3_600)
  const minutes = Math.floor((secondsRemaining % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${Math.max(0, minutes)}m left`
}

function mapAnnouncementError(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : fallback
  const normalized = rawMessage.toLowerCase()

  if (normalized.includes("access denied to department")) {
    return "You do not have access to this department."
  }

  return rawMessage || fallback
}

function AnnouncementCreateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
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

  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
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
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required")
      return
    }

    if (!departmentId) {
      toast.error("Department context is missing")
      return
    }

    const trimmedActionLabel = actionLabel.trim()
    const trimmedActionUrl = actionUrl.trim()
    const hasActionLabel = Boolean(trimmedActionLabel)
    const hasActionUrl = Boolean(trimmedActionUrl)

    if (hasActionLabel !== hasActionUrl) {
      setActionLabelError(!hasActionLabel ? "Action label is required when URL is set" : null)
      setActionUrlError(!hasActionUrl ? "Action URL is required when label is set" : null)
      return
    }

    if (hasActionUrl && !isValidHttpUrl(trimmedActionUrl)) {
      setActionUrlError("Action URL must be a valid URL with protocol (https://...)" )
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
          title: title.trim(),
          message: message.trim(),
          actionType,
          ...(hasActionLabel && hasActionUrl
            ? { actionLabel: trimmedActionLabel, actionUrl: trimmedActionUrl }
            : {}),
          ...(deadlineIso ? { deadlineAt: deadlineIso } : {}),
        },
      })

      toast.success("Announcement created")
      setTitle("")
      setMessage("")
      setActionType("FORM_PROJECT_GROUP")
      setActionLabel("")
      setActionUrl("")
      setDeadlineAtLocal("")
      setDeadlineError(null)
      setActionLabelError(null)
      setActionUrlError(null)

      onCreated()
      onClose()
    } catch (error) {
      const mapped = mapAnnouncementError(error, "Failed to create announcement")
      if (mapped.toLowerCase().includes("deadline")) {
        setDeadlineError(mapped)
      }
      if (mapped.toLowerCase().includes("action url")) {
        setActionUrlError(mapped)
      }
      toast.error(mapped)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogDescription>Set up a new announcement for your department.</DialogDescription>
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
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Announcement"}
        </Button>
      </div>
    </>
  )
}

function AnnouncementEditForm({
  announcement,
  departmentId,
  onClose,
  onSaved,
}: {
  announcement: DepartmentAnnouncementItem
  departmentId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  function toLocalInputValue(isoDate: string | null): string {
    if (!isoDate) return ""
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ""

    const offsetMs = date.getTimezoneOffset() * 60_000
    const local = new Date(date.getTime() - offsetMs)
    return local.toISOString().slice(0, 16)
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
  const updateMutation = useUpdateDepartmentAnnouncement()
  const [title, setTitle] = useState(announcement.title)
  const [message, setMessage] = useState(announcement.message)
  const [actionType, setActionType] = useState<DepartmentAnnouncementActionType>(announcement.actionType)
  const [actionLabel, setActionLabel] = useState(announcement.actionLabel ?? "")
  const [actionUrl, setActionUrl] = useState(announcement.actionUrl ?? "")
  const [deadlineAtLocal, setDeadlineAtLocal] = useState(toLocalInputValue(announcement.deadlineAt ?? null))

  const [deadlineError, setDeadlineError] = useState<string | null>(null)
  const [actionLabelError, setActionLabelError] = useState<string | null>(null)
  const [actionUrlError, setActionUrlError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(announcement.title)
    setMessage(announcement.message)
    setActionType(announcement.actionType)
    setActionLabel(announcement.actionLabel ?? "")
    setActionUrl(announcement.actionUrl ?? "")
    setDeadlineAtLocal(toLocalInputValue(announcement.deadlineAt ?? null))
    setDeadlineError(null)
    setActionLabelError(null)
    setActionUrlError(null)
  }, [announcement.id, announcement.title, announcement.message, announcement.actionType, announcement.actionLabel, announcement.actionUrl, announcement.deadlineAt])
  const handleSubmit = async () => {
    if (!departmentId) {
      toast.error("Department context is missing")
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

    if (hasActionUrl && !isValidHttpUrl(trimmedActionUrl)) {
      setActionUrlError("Action URL must be a valid URL with protocol (https://...)" )
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

    const dto: Record<string, unknown> = {
      title: trimmedTitle,
      message: trimmedMessage,
      actionType,
    }

    if (hasActionLabel && hasActionUrl) {
      dto.actionLabel = trimmedActionLabel
      dto.actionUrl = trimmedActionUrl
    } else {
      dto.actionLabel = null
      dto.actionUrl = null
    }

    if (deadlineIso) {
      dto.deadlineAt = deadlineIso
    } else if (announcement.deadlineAt) {
      dto.clearDeadline = true
    }

    try {
      await updateMutation.mutateAsync({
        departmentId,
        announcementId: announcement.id,
        dto,
      })

      toast.success("Announcement updated")
      onSaved()
      onClose()
    } catch (error) {
      const mapped = mapAnnouncementError(error, "Failed to update announcement")
      if (mapped.toLowerCase().includes("deadline")) {
        setDeadlineError(mapped)
      }
      if (mapped.toLowerCase().includes("action url")) {
        setActionUrlError(mapped)
      }
      toast.error(mapped)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogDescription>Edit an existing announcement for your department.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
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
        <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </>
  )
}

export function DepartmentHeadAnnouncementsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const [page, setPage] = useState(1)
  const [jumpPageInput, setJumpPageInput] = useState("1")
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<DepartmentAnnouncementItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const pageSize = 10

  const announcementsQuery = useDepartmentAnnouncements({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    page,
    limit: pageSize,
  })

  const deleteAnnouncementMutation = useDeleteDepartmentAnnouncement()

  const announcements = announcementsQuery.data?.items ?? []
  const pagination = announcementsQuery.data?.pagination

  const totalPages = pagination?.pages ?? 1
  const currentPage = pagination?.page ?? page
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
    setPage((prev) => Math.max(1, prev - 1))
  }, [announcements.length, announcementsQuery.isSuccess, page])

  useEffect(() => {
    if (totalPages < page) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setJumpPageInput(String(currentPage))
  }, [currentPage])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!accessToken || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Please log in to access announcements.</div>
        </div>
      </div>
    )
  }

  if (!departmentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Department information not available.</div>
        </div>
      </div>
    )
  }

  if (announcementsQuery.isError) {
    const error = announcementsQuery.error
    const errorMessage = error instanceof Error ? error.message : "Failed to load announcements"

    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Department Announcements" description="Create and manage announcements for your department" />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive mb-4">{errorMessage}</p>
            <Button variant="outline" onClick={() => announcementsQuery.refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDelete = async (announcement: DepartmentAnnouncementItem) => {
    if (!departmentId) {
      toast.error("Department context is missing")
      return
    }

    const isConfirmed = window.confirm("Delete this announcement?")
    if (!isConfirmed) return

    try {
      await deleteAnnouncementMutation.mutateAsync({
        departmentId,
        announcementId: announcement.id,
      })
      toast.success("Announcement deleted")
      await announcementsQuery.refetch()
    } catch (error) {
      toast.error(mapAnnouncementError(error, "Failed to delete announcement"))
    }
  }

  const handleJumpToPage = () => {
    const parsed = Number.parseInt(jumpPageInput, 10)
    if (!Number.isFinite(parsed)) {
      setJumpPageInput(String(currentPage))
      return
    }
    const nextPage = clampPage(parsed, 1, Math.max(1, totalPages))
    setPage(nextPage)
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Department Announcements"
        description="Create and manage announcements for your department"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw]">
              <AnnouncementCreateForm
                onClose={() => setCreateOpen(false)}
                onCreated={() => announcementsQuery.refetch()}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {editOpen && selectedAnnouncement && (
        <Dialog
          open={editOpen}
          onOpenChange={(nextOpen) => {
            setEditOpen(nextOpen)
            if (!nextOpen) {
              setSelectedAnnouncement(null)
            }
          }}
        >
          <DialogContent className="max-w-4xl w-[95vw]">
            <AnnouncementEditForm
              key={`${selectedAnnouncement.id}-${selectedAnnouncement.updatedAt}`}
              announcement={selectedAnnouncement}
              departmentId={departmentId}
              onClose={() => setEditOpen(false)}
              onSaved={() => announcementsQuery.refetch()}
            />
          </DialogContent>
        </Dialog>
      )}

      {announcementsQuery.isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Loading announcements...</CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        <Card className="rounded-xl border border-border bg-background shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold">No announcements yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first announcement.</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-6 gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border bg-background shadow-sm">
            <CardContent className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isDeleting={deleteAnnouncementMutation.isPending}
                  onDelete={handleDelete}
                  onEdit={(item) => {
                    setSelectedAnnouncement(item)
                    setEditOpen(true)
                  }}
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Showing {pageSummary} • {pageSize} per page</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || announcementsQuery.isFetching}
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">Page {currentPage} of {Math.max(1, totalPages)}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
      )}
    </div>
  )
}

function AnnouncementCard({
  announcement,
  isDeleting,
  onDelete,
  onEdit,
}: {
  announcement: DepartmentAnnouncementItem
  isDeleting: boolean
  onDelete: (announcement: DepartmentAnnouncementItem) => void
  onEdit: (announcement: DepartmentAnnouncementItem) => void
}) {
  const isExpired = announcement.isExpired || (announcement.secondsRemaining ?? 1) <= 0

  return (
    <article
      className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
    >
      <div className="border-l-4 border-l-transparent group-hover:border-l-primary transition-colors">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold leading-tight">{announcement.title}</h3>
                <Badge variant="secondary">{announcement.actionType}</Badge>
                {announcement.deadlineAt ? (
                  <Badge variant={isExpired ? "destructive" : "outline"}>
                    {isExpired ? "Expired" : formatCountdown(announcement.secondsRemaining)}
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">
                Created by {formatCreatedBy(announcement)} • {formatDateTime(announcement.createdAt)}
              </p>
              <p className="text-sm leading-snug line-clamp-2">{announcement.message}</p>
              {announcement.actionLabel && announcement.actionUrl ? (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  <p className="text-xs font-medium text-foreground">Call to action</p>
                  <a
                    href={announcement.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {announcement.actionLabel}
                  </a>
                  <p className="text-xs text-muted-foreground break-all">{announcement.actionUrl}</p>
                </div>
              ) : null}
              {announcement.deadlineAt ? (
                <p className="text-xs text-muted-foreground">Deadline: {formatDateTime(announcement.deadlineAt)}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="icon" title="Edit" onClick={() => onEdit(announcement)} disabled={isDeleting}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  title="Delete"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(announcement)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
