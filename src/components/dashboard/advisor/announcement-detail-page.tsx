"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Clock,
  CheckCircle,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  useAdvisorAnnouncementById,
  useUpdateAdvisorAnnouncement,
  useDeleteAdvisorAnnouncement,
} from "@/lib/hooks/use-advisor-announcements"
import type { AnnouncementPriority, UpdateAdvisorAnnouncementDto } from "@/types/announcements"

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  HIGH: {
    label: "High",
    badgeClass: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  LOW: {
    label: "Low",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
} as const

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const formatCountdown = (seconds: number): string => {
  if (seconds <= 0) return "Expired"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  return parts.length ? parts.join(" ") + " remaining" : "Less than a minute remaining"
}

// ── Edit form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  announcementId: string
  projectId: string
  initial: {
    title: string
    priority: AnnouncementPriority
    message: string
    attachmentUrl: string
    hasAttachment: boolean
    deadlineAt: string
    disableAfterDeadline: boolean
  }
  onCancel: () => void
  onSaved: () => void
}

function EditForm({ announcementId, projectId, initial, onCancel, onSaved }: EditFormProps) {
  const [form, setForm] = React.useState(initial)
  const [removeAttachment, setRemoveAttachment] = React.useState(false)
  const { mutate: update, isPending } = useUpdateAdvisorAnnouncement()

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    const dto: UpdateAdvisorAnnouncementDto = {
      title: form.title.trim(),
      priority: form.priority,
      message: form.message.trim(),
      ...(form.deadlineAt
        ? {
            deadlineAt: new Date(form.deadlineAt).toISOString(),
            disableAfterDeadline: form.disableAfterDeadline,
          }
        : {}),
    }
    if (removeAttachment) {
      dto.removeAttachment = true
    } else if (form.attachmentUrl.trim()) {
      dto.attachmentUrl = form.attachmentUrl.trim()
    }

    update(
      { announcementId, projectId, dto },
      {
        onSuccess: () => {
          toast.success("Announcement updated")
          onSaved()
        },
        onError: (err) => toast.error(err.message ?? "Failed to update"),
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="e-title">Title *</Label>
          <Input
            id="e-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => set("priority", v as AnnouncementPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="e-message">Message *</Label>
        <Textarea
          id="e-message"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="e-attachment">Attachment URL</Label>
        <Input
          id="e-attachment"
          type="url"
          value={form.attachmentUrl}
          onChange={(e) => {
            set("attachmentUrl", e.target.value)
            setRemoveAttachment(false)
          }}
          placeholder="https://..."
          disabled={removeAttachment}
        />
        {form.hasAttachment && (
          <div className="flex items-center gap-2">
            <Switch
              id="e-remove"
              checked={removeAttachment}
              onCheckedChange={(v) => {
                setRemoveAttachment(v)
                if (v) set("attachmentUrl", "")
              }}
            />
            <Label htmlFor="e-remove" className="cursor-pointer text-sm text-muted-foreground">
              Remove existing attachment
            </Label>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="e-deadline">Deadline</Label>
        <Input
          id="e-deadline"
          type="datetime-local"
          value={form.deadlineAt}
          onChange={(e) => set("deadlineAt", e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>

      {form.deadlineAt && (
        <div className="flex items-center gap-3">
          <Switch
            id="e-disable"
            checked={form.disableAfterDeadline}
            onCheckedChange={(v) => set("disableAfterDeadline", v)}
          />
          <Label htmlFor="e-disable" className="cursor-pointer">
            Disable announcement after deadline
          </Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Main detail page ──────────────────────────────────────────────────────────

interface AnnouncementDetailPageProps {
  announcementId: string
  projectId: string
}

export function AdvisorAnnouncementDetailPage({
  announcementId,
  projectId,
}: AnnouncementDetailPageProps) {
  const router = useRouter()
  const [editMode, setEditMode] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const {
    data: item,
    isLoading,
    isError,
    error,
  } = useAdvisorAnnouncementById({
    announcementId,
    projectId,
    enabled: Boolean(announcementId) && Boolean(projectId),
  })

  const { mutate: del, isPending: isDeleting } = useDeleteAdvisorAnnouncement()

  const handleDelete = () => {
    del(
      { announcementId, projectId },
      {
        onSuccess: () => {
          toast.success("Announcement deleted")
          router.push("/dashboard/advisor/announcements")
        },
        onError: (err) => toast.error(err.message ?? "Failed to delete"),
      }
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/dashboard/advisor/announcements")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Announcements
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertTriangle className="h-10 w-10 text-destructive/60" />
            <p className="font-medium">Failed to load announcement</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/advisor/announcements")}
            >
              Go back
            </Button>
          </CardContent>
        </Card>
      ) : item ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                  <Badge
                    className={PRIORITY_CONFIG[item.priority].badgeClass}
                    variant="outline"
                  >
                    {PRIORITY_CONFIG[item.priority].label}
                  </Badge>
                  {item.isExpired && (
                    <Badge variant="secondary" className="text-xs">
                      Expired
                    </Badge>
                  )}
                  {item.isDisabled && !item.isExpired && (
                    <Badge variant="secondary" className="text-xs">
                      Disabled
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Posted by {item.createdBy.firstName} {item.createdBy.lastName}
                  {" · "}
                  <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                </p>
              </div>

              {!editMode && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    aria-label="Edit announcement"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {editMode ? (
              <EditForm
                announcementId={announcementId}
                projectId={projectId}
                initial={{
                  title: item.title,
                  priority: item.priority,
                  message: item.message,
                  attachmentUrl: item.attachmentType === "LINK" ? (item.attachmentUrl ?? "") : "",
                  hasAttachment: item.attachmentType !== "NONE",
                  deadlineAt: item.deadlineAt
                    ? new Date(item.deadlineAt).toISOString().slice(0, 16)
                    : "",
                  disableAfterDeadline: item.disableAfterDeadline,
                }}
                onCancel={() => setEditMode(false)}
                onSaved={() => setEditMode(false)}
              />
            ) : (
              <>
                {/* Message */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Message
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
                </div>

                {/* Deadline / countdown */}
                {item.deadlineAt && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Deadline
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(item.deadlineAt)}</span>
                      {item.secondsRemaining !== null && (
                        <Badge
                          variant={item.isExpired ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {item.isExpired
                            ? "Expired"
                            : formatCountdown(item.secondsRemaining)}
                        </Badge>
                      )}
                    </div>
                    {item.disableAfterDeadline && (
                      <p className="text-xs text-muted-foreground">
                        This announcement will be disabled after the deadline.
                      </p>
                    )}
                  </div>
                )}

                {/* Attachment */}
                {item.attachmentUrl && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Attachment
                    </p>
                    <a
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View attachment
                    </a>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4 text-xs text-muted-foreground flex flex-wrap gap-4">
                  <span>Created: {formatDate(item.createdAt)}</span>
                  <span>Updated: {formatDate(item.updatedAt)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Announcement
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{item?.title}&rdquo;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
