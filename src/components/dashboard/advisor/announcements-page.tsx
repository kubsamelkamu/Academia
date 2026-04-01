"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  useAdvisorAnnouncements,
  useAdvisorMessageGroups,
  useCreateAnnouncementMutation,
} from "@/lib/hooks/useAdvisor"
import type {
  AdvisorAnnouncement,
  AdvisorCreateAnnouncementDto,
  AdvisorMessageGroup,
} from "@/lib/types/advisor"
import { Bell, MoreVertical, Paperclip, Plus, Search } from "lucide-react"

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const PRIORITY_CONFIG: Record<string, { label: string; bgClass: string; iconClass: string; badgeClass: string }> = {
  HIGH:   { label: "High",   bgClass: "bg-red-100",    iconClass: "text-red-600",    badgeClass: "bg-red-100 text-red-800 border-red-200" },
  URGENT: { label: "Urgent", bgClass: "bg-red-100",    iconClass: "text-red-600",    badgeClass: "bg-red-100 text-red-800 border-red-200" },
  MEDIUM: { label: "Medium", bgClass: "bg-yellow-100", iconClass: "text-yellow-600", badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  LOW:    { label: "Low",    bgClass: "bg-blue-100",   iconClass: "text-blue-600",   badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
}

function getPriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority.toUpperCase()] ?? PRIORITY_CONFIG.MEDIUM
}

// ─── main page ────────────────────────────────────────────────────────────────

export function AdvisorAnnouncementsPage() {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [audienceFilter, setAudienceFilter] = React.useState("any")

  const announcementsQuery = useAdvisorAnnouncements({
    status:   statusFilter   === "all" ? undefined : statusFilter,
    audience: audienceFilter === "any" ? undefined : audienceFilter,
  })

  const announcements = React.useMemo(() => {
    const items: AdvisorAnnouncement[] = announcementsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((a: AdvisorAnnouncement) =>
      [a.title, a.content].some((v: string) => v.toLowerCase().includes(term))
    )
  }, [announcementsQuery.data?.items, searchTerm])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage announcements published to your project groups.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw]">
            <CreateAnnouncementForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_160px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search announcements…"
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any audience</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="STUDENTS">Students</SelectItem>
                <SelectItem value="ADVISORS">Advisors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {announcementsQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading announcements…
          </CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No announcements yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one to notify your students and project groups.
            </p>
            <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {announcements.map((announcement: AdvisorAnnouncement) => {
              const cfg = getPriorityConfig(announcement.priority)
              return (
                <div
                  key={announcement.id}
                  className="flex items-start border-l-4 border-l-transparent hover:border-l-primary transition-all rounded-sm"
                >
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-4">
                      {/* icon + text */}
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${cfg.bgClass}`}>
                          <Bell className={`h-5 w-5 ${cfg.iconClass}`} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm leading-tight">
                              {announcement.title}
                            </span>
                            <Badge variant="outline" className={cfg.badgeClass}>
                              {cfg.label} priority
                            </Badge>
                            <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                              {announcement.status}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                            {announcement.content}
                          </p>

                          {announcement.attachmentUrl && (
                            <a
                              href={announcement.attachmentUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
                            >
                              <Paperclip className="h-3 w-3" />
                              {announcement.attachmentFileName ?? "Open attachment"}
                            </a>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                            <span>Audience: {announcement.audience}</span>
                            <span>•</span>
                            <time dateTime={announcement.createdAt}>
                              {formatDate(announcement.createdAt)}
                            </time>
                            {announcement.deadlineAt && (
                              <>
                                <span>•</span>
                                <span>Deadline: {formatDate(announcement.deadlineAt)}</span>
                              </>
                            )}
                            {announcement.targetProjectIds.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{announcement.targetProjectIds.length} project{announcement.targetProjectIds.length !== 1 ? "s" : ""} targeted</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label="Announcement actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => toast.info("Edit coming soon")}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => toast.info("Delete coming soon")}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── create form ──────────────────────────────────────────────────────────────

function CreateAnnouncementForm({ onClose }: { onClose: () => void }) {
  const groupsQuery = useAdvisorMessageGroups()
  const groups: AdvisorMessageGroup[] = groupsQuery.data?.items ?? []

  const createMutation = useCreateAnnouncementMutation()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [priority, setPriority] = React.useState<AdvisorCreateAnnouncementDto["priority"]>("MEDIUM")
  const [status, setStatus] = React.useState<AdvisorCreateAnnouncementDto["status"]>("DRAFT")
  const [audience, setAudience] = React.useState<AdvisorCreateAnnouncementDto["audience"]>("ALL")
  const [deadline, setDeadline] = React.useState("")
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([])
  const [attachmentUrl, setAttachmentUrl] = React.useState("")
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null)

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p: string) => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and message are required")
      return
    }
    if (attachmentFile && attachmentUrl.trim()) {
      toast.error("Provide either a file or a link — not both")
      return
    }

    const dto: AdvisorCreateAnnouncementDto = {
      title: title.trim(),
      content: content.trim(),
      priority,
      status,
      audience,
      deadlineAt:      deadline || undefined,
      targetProjectIds: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
      attachmentUrl:   attachmentUrl.trim() || undefined,
    }

    try {
      await createMutation.mutateAsync({ dto, file: attachmentFile })
      toast.success("Announcement created!")
      onClose()
    } catch {
      toast.error("Failed to create announcement")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogDescription>
          Post an announcement to your assigned project groups.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        {/* Title + Priority */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title *</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Upcoming deadline"
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as AdvisorCreateAnnouncementDto["priority"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status + Audience */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AdvisorCreateAnnouncementDto["status"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as AdvisorCreateAnnouncementDto["audience"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="STUDENTS">Students</SelectItem>
                <SelectItem value="ADVISORS">Advisors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label htmlFor="ann-deadline">Deadline (optional)</Label>
          <Input
            id="ann-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        {/* Target groups */}
        {groups.length > 0 && (
          <div className="space-y-2">
            <Label>
              Target Groups{" "}
              <span className="font-normal text-muted-foreground">
                ({selectedProjectIds.length} selected — leave empty for all)
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {groups.map((g: AdvisorMessageGroup) => (
                <Button
                  key={g.id}
                  type="button"
                  variant={selectedProjectIds.includes(g.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleProject(g.id)}
                  className="justify-start truncate"
                >
                  {g.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Attachment: URL or file */}
        <div className="space-y-2">
          <Label>Attachment (optional)</Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Paste a link URL"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
            <div>
              <input
                type="file"
                id="ann-file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              />
              <Label
                htmlFor="ann-file"
                className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted text-sm hover:border-primary transition-colors px-3"
              >
                {attachmentFile ? attachmentFile.name : "Choose file"}
              </Label>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="ann-content">Message *</Label>
          <Textarea
            id="ann-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Write your announcement…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={createMutation.isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating…" : "Create Announcement"}
        </Button>
      </div>
    </>
  )
}

export default AdvisorAnnouncementsPage
