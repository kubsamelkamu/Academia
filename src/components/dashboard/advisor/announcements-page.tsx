"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Loader2, Bell, ChevronDown, AlertTriangle, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
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
    <article className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-sm transition-all hover:shadow-md">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
      <div className="p-4 sm:p-5 pl-5 sm:pl-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold leading-tight text-foreground">
                <Link
                  href={`/dashboard/advisor/announcements/${item.id}?projectId=${projectId}`}
                  className="hover:text-primary transition-colors"
                >
                  {item.title}
                </Link>
              </h3>
              <Badge className={cn("text-[10px] font-bold uppercase tracking-wider h-5", priorityConfig.badgeClass)} variant="outline">
                {priorityConfig.label}
              </Badge>
              {item.isExpired && (
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider h-5 bg-muted/50">
                  Expired
                </Badge>
              )}
              {item.isDisabled && !item.isExpired && (
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider h-5 bg-muted/50">
                  Disabled
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-primary/70" />
                <time dateTime={item.createdAt}>Posted: {formatDate(item.createdAt)}</time>
              </div>
              {item.deadlineAt && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    <span>Deadline: {formatDate(item.deadlineAt)}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-sm leading-relaxed text-foreground/80 font-medium line-clamp-3">{item.message}</p>

            {item.attachmentUrl && (
              <div className="pt-1">
                <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5">
                  <a
                    href={item.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    View Attachment
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:flex-col sm:gap-2">
            {/* Edit dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" aria-label="Edit announcement">
                  <Pencil className="h-4 w-4 text-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-2xl">
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
                  className="h-9 w-9 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive font-bold">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Announcement
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium pt-2">
                    Are you sure you want to delete &ldquo;<span className="font-bold text-foreground">{item.title}</span>&rdquo;? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 pt-4">
                  <Button
                    variant="outline"
                    className="h-10 text-xs font-bold uppercase tracking-wider"
                    onClick={() => setDeleteOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-10 text-xs font-bold uppercase tracking-wider"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Confirm Delete"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Announcements</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Create and manage announcements for your project groups.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-10 text-xs font-bold uppercase tracking-wider" disabled={!selectedProjectId}>
              <Plus className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </DialogTrigger>
          {selectedProjectId && (
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <AnnouncementCreateForm
                projectId={selectedProjectId}
                onClose={() => setCreateOpen(false)}
              />
            </DialogContent>
          )}
        </Dialog>
      </div>

      {/* Project Selector */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-6 bg-muted/30">
          {projectsLoading ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Skeleton className="h-10 w-full sm:w-[300px] rounded-xl" />
              <Skeleton className="h-4 w-40 rounded-full" />
            </div>
          ) : !hasProjects ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <h3 className="text-sm font-bold uppercase tracking-widest">No projects found</h3>
              <p className="mt-1 text-xs text-muted-foreground">You need a supervised project to post announcements.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-[300px] space-y-2">
                <Label htmlFor="announcement-project-selector" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Project</Label>
                <Select
                  value={selectedProjectId ?? ""}
                  onValueChange={(v) => setSelectedProjectId(v || null)}
                >
                  <SelectTrigger id="announcement-project-selector" className="h-10 border-primary/20 bg-background">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-sm font-medium">
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/10 bg-background/50 shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Group</p>
                    <p className="text-xs font-bold text-foreground truncate">{selectedProject.group.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* List Section */}
      <section aria-labelledby="announcements-list" className="space-y-4">
        <h2 id="announcements-list" className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Recent Announcements</h2>

        {!hasProjects ? null : !selectedProjectId ? (
          <div className="py-20 text-center bg-muted/10 rounded-2xl border border-dashed">
            <ChevronDown className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select a project</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a project above to view its announcements.</p>
          </div>
        ) : listLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <AnnouncementSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-destructive/5 rounded-2xl border border-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive/30 mb-3" />
            <p className="text-sm font-bold text-destructive uppercase tracking-widest">Failed to load</p>
            <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <AnnouncementCard key={item.id} item={item} projectId={selectedProjectId} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
