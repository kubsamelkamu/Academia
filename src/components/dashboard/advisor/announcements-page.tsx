"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Loader2, Bell, ChevronDown, AlertTriangle } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import {
  useAdvisorAnnouncements,
  useCreateAdvisorAnnouncement,
  useUpdateAdvisorAnnouncement,
  useDeleteAdvisorAnnouncement,
} from "@/lib/hooks/use-advisor-announcements"
import type {
  AdvisorAnnouncementItem,
  AnnouncementPriority,
  CreateAdvisorAnnouncementDto,
  UpdateAdvisorAnnouncementDto,
} from "@/types/announcements"

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
  })

// ── Create form ───────────────────────────────────────────────────────────────

interface CreateFormState {
  title: string
  priority: AnnouncementPriority
  message: string
  attachmentUrl: string
  deadlineAt: string
  disableAfterDeadline: boolean
}

const EMPTY_CREATE_FORM: CreateFormState = {
  title: "",
  priority: "MEDIUM",
  message: "",
  attachmentUrl: "",
  deadlineAt: "",
  disableAfterDeadline: false,
}

function AnnouncementCreateForm({
  projectId,
  onClose,
}: {
  projectId: string
  onClose: () => void
}) {
  const [form, setForm] = React.useState<CreateFormState>(EMPTY_CREATE_FORM)
  const { mutate: create, isPending } = useCreateAdvisorAnnouncement()

  const set = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    const dto: CreateAdvisorAnnouncementDto = {
      projectId,
      title: form.title.trim(),
      priority: form.priority,
      message: form.message.trim(),
      ...(form.attachmentUrl.trim() ? { attachmentUrl: form.attachmentUrl.trim() } : {}),
      ...(form.deadlineAt ? { deadlineAt: new Date(form.deadlineAt).toISOString() } : {}),
      ...(form.deadlineAt ? { disableAfterDeadline: form.disableAfterDeadline } : {}),
    }
    create(dto, {
      onSuccess: () => {
        toast.success("Announcement created")
        setForm(EMPTY_CREATE_FORM)
        onClose()
      },
      onError: (err) => toast.error(err.message ?? "Failed to create announcement"),
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogDescription>
          Set up a new announcement for the selected project group.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="c-title">Title *</Label>
            <Input
              id="c-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., Upcoming deadline"
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
          <Label htmlFor="c-message">Message *</Label>
          <Textarea
            id="c-message"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            rows={3}
            placeholder="Your announcement message..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="c-attachment">Attachment URL (optional)</Label>
          <Input
            id="c-attachment"
            type="url"
            value={form.attachmentUrl}
            onChange={(e) => set("attachmentUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="c-deadline">Deadline (optional)</Label>
          <Input
            id="c-deadline"
            type="datetime-local"
            value={form.deadlineAt}
            onChange={(e) => set("deadlineAt", e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {form.deadlineAt && (
          <div className="flex items-center gap-3">
            <Switch
              id="c-disable"
              checked={form.disableAfterDeadline}
              onCheckedChange={(v) => set("disableAfterDeadline", v)}
            />
            <Label htmlFor="c-disable" className="cursor-pointer">
              Disable announcement after deadline
            </Label>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Announcement"
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Edit form (inline dialog) ─────────────────────────────────────────────────

interface EditFormState {
  title: string
  priority: AnnouncementPriority
  message: string
  attachmentUrl: string
  removeAttachment: boolean
  deadlineAt: string
  disableAfterDeadline: boolean
}

function AnnouncementEditForm({
  item,
  projectId,
  onClose,
}: {
  item: AdvisorAnnouncementItem
  projectId: string
  onClose: () => void
}) {
  const [form, setForm] = React.useState<EditFormState>({
    title: item.title,
    priority: item.priority,
    message: item.message,
    attachmentUrl: item.attachmentType === "LINK" ? (item.attachmentUrl ?? "") : "",
    removeAttachment: false,
    deadlineAt: item.deadlineAt
      ? new Date(item.deadlineAt).toISOString().slice(0, 16)
      : "",
    disableAfterDeadline: item.disableAfterDeadline,
  })

  const { mutate: update, isPending } = useUpdateAdvisorAnnouncement()

  const set = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    const dto: UpdateAdvisorAnnouncementDto = {
      title: form.title.trim(),
      priority: form.priority,
      message: form.message.trim(),
      ...(form.deadlineAt ? { deadlineAt: new Date(form.deadlineAt).toISOString() } : {}),
      ...(form.deadlineAt ? { disableAfterDeadline: form.disableAfterDeadline } : {}),
    }
    if (form.removeAttachment) {
      dto.removeAttachment = true
    } else if (form.attachmentUrl.trim()) {
      dto.attachmentUrl = form.attachmentUrl.trim()
    }

    update(
      { announcementId: item.id, projectId, dto },
      {
        onSuccess: () => {
          toast.success("Announcement updated")
          onClose()
        },
        onError: (err) => toast.error(err.message ?? "Failed to update announcement"),
      }
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogDescription>Update the announcement details.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
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
            rows={3}
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
              set("removeAttachment", false)
            }}
            placeholder="https://..."
            disabled={form.removeAttachment}
          />
          {item.attachmentType !== "NONE" && (
            <div className="flex items-center gap-2 mt-1">
              <Switch
                id="e-remove"
                checked={form.removeAttachment}
                onCheckedChange={(v) => {
                  set("removeAttachment", v)
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
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Announcement card ─────────────────────────────────────────────────────────

function AnnouncementCard({
  item,
  projectId,
}: {
  item: AdvisorAnnouncementItem
  projectId: string
}) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const { mutate: del, isPending: isDeleting } = useDeleteAdvisorAnnouncement()

  const priorityConfig = PRIORITY_CONFIG[item.priority]

  const handleDelete = () => {
    del(
      { announcementId: item.id, projectId },
      {
        onSuccess: () => {
          toast.success("Announcement deleted")
          setDeleteOpen(false)
        },
        onError: (err) => toast.error(err.message ?? "Failed to delete"),
      }
    )
  }

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-l-4 border-l-transparent group-hover:border-l-primary transition-colors">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold leading-tight">
                  <Link
                    href={`/dashboard/advisor/announcements/${item.id}?projectId=${projectId}`}
                    className="hover:underline"
                  >
                    {item.title}
                  </Link>
                </h3>
                <Badge className={priorityConfig.badgeClass} variant="outline">
                  {priorityConfig.label}
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

              <p className="text-muted-foreground text-sm">
                <time dateTime={item.createdAt}>Posted: {formatDate(item.createdAt)}</time>
                {item.deadlineAt && (
                  <>
                    {" • "}
                    <span>Deadline: {formatDate(item.deadlineAt)}</span>
                  </>
                )}
              </p>

              <p className="text-sm leading-snug line-clamp-2">{item.message}</p>

              {item.attachmentUrl && (
                <a
                  href={item.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  View attachment
                </a>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Edit dialog */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Edit announcement">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-[95vw]">
                  <AnnouncementEditForm
                    item={item}
                    projectId={projectId}
                    onClose={() => setEditOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              {/* Delete dialog */}
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete announcement"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Announcement
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &ldquo;{item.title}&rdquo;? This action
                      cannot be undone.
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
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
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
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function AnnouncementSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="rounded-xl border border-border bg-background shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold">No announcements yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create the first announcement for this project group.
        </p>
        <Button className="mt-6 gap-2" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdvisorAnnouncementsPage() {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  const { data: projects, isLoading: projectsLoading } = useAdvisorProjects()

  React.useEffect(() => {
    if (!projects?.length) {
      setSelectedProjectId(null)
      return
    }

    setSelectedProjectId((current) => {
      if (current && projects.some((project) => project.id === current)) return current
      return projects[0]?.id ?? null
    })
  }, [projects])

  const selectedProject = React.useMemo(
    () => projects?.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  const {
    data: announcementsData,
    isLoading: listLoading,
    isError,
    error,
  } = useAdvisorAnnouncements({
    projectId: selectedProjectId,
    page: 1,
    limit: 20,
    enabled: Boolean(selectedProjectId),
  })

  const items = announcementsData?.items ?? []
  const hasProjects = (projects?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Announcements"
        description="Create and manage announcements for your project groups"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!selectedProjectId}>
                <Plus className="h-4 w-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
            {selectedProjectId && (
              <DialogContent className="max-w-2xl w-[95vw]">
                <AnnouncementCreateForm
                  projectId={selectedProjectId}
                  onClose={() => setCreateOpen(false)}
                />
              </DialogContent>
            )}
          </Dialog>
        }
      />

      {projectsLoading ? (
        <div className="flex items-center gap-3">
          <Label className="whitespace-nowrap text-sm font-medium">Project</Label>
          <div className="w-full max-w-xs">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : !hasProjects ? (
        <Card className="rounded-xl border border-border bg-background shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No supervised projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              You need at least one supervised project before you can create project-group announcements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="whitespace-nowrap text-sm font-medium">Project</Label>
            <Select
              value={selectedProjectId ?? ""}
              onValueChange={(v) => setSelectedProjectId(v || null)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {(projects ?? []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProject ? (
            <p className="text-sm text-muted-foreground">
              Posting to group <span className="font-medium text-foreground">{selectedProject.group.name}</span>.
            </p>
          ) : null}
        </div>
      )}

      {/* List */}
      <section aria-labelledby="announcements-list">
        <h2 id="announcements-list" className="sr-only">
          Announcements list
        </h2>

        {!hasProjects ? null : !selectedProjectId ? (
          <Card className="rounded-xl border border-border bg-background shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <ChevronDown className="mx-auto mb-2 h-5 w-5" />
              Select a project to view announcements.
            </CardContent>
          </Card>
        ) : listLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AnnouncementSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <Card className="rounded-xl border border-destructive/30 bg-background">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive/60" />
              <p className="font-medium text-sm">Failed to load announcements</p>
              <p className="text-xs text-muted-foreground">{error?.message}</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <Card className="rounded-xl border border-border bg-background shadow-sm">
            <CardContent className="space-y-4 pt-6">
              {items.map((item) => (
                <AnnouncementCard key={item.id} item={item} projectId={selectedProjectId} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
