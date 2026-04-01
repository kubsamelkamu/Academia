"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ArrowLeft, Send, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import { useCreateAdvisorAnnouncement } from "@/lib/hooks/use-advisor-announcements"
import type { AnnouncementPriority } from "@/types/announcements"

type FormData = {
  projectId: string
  title: string
  priority: AnnouncementPriority
  message: string
  attachmentUrl: string
  deadlineAt: string
  disableAfterDeadline: boolean
}

const INITIAL_FORM: FormData = {
  projectId: "",
  title: "",
  priority: "MEDIUM",
  message: "",
  attachmentUrl: "",
  deadlineAt: "",
  disableAfterDeadline: false,
}

export function AdvisorAnnouncementNewPage() {
  const router = useRouter()
  const [form, setForm] = React.useState<FormData>(INITIAL_FORM)

  const { data: projects, isLoading: projectsLoading } = useAdvisorProjects()
  const { mutate: create, isPending } = useCreateAdvisorAnnouncement()

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    if (!form.projectId) {
      toast.error("Please select a project")
      return
    }
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.message.trim()) {
      toast.error("Message is required")
      return
    }

    create(
      {
        projectId: form.projectId,
        title: form.title.trim(),
        priority: form.priority,
        message: form.message.trim(),
        ...(form.attachmentUrl.trim() ? { attachmentUrl: form.attachmentUrl.trim() } : {}),
        ...(form.deadlineAt
          ? { deadlineAt: new Date(form.deadlineAt).toISOString() }
          : {}),
        ...(form.deadlineAt
          ? { disableAfterDeadline: form.disableAfterDeadline }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success("Announcement published!")
          router.push("/dashboard/advisor/announcements")
        },
        onError: (err) => toast.error(err.message ?? "Failed to publish announcement"),
      }
    )
  }

  const priorityLabel = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" }[form.priority]

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Create Announcement
          </CardTitle>
          <CardDescription>Set up a new announcement for a project group.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 py-2">

            {/* Row 1: Project selector */}
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              {projectsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={form.projectId}
                  onValueChange={(v) => set("projectId", v)}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                The announcement will be sent to the approved project group linked to this project.
              </p>
            </div>

            {/* Row 2: Title + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Upcoming Project Deadline"
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
                <Badge variant="outline" className="capitalize mt-1">
                  {priorityLabel}
                </Badge>
              </div>
            </div>

            {/* Row 3: Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (optional)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={form.deadlineAt}
                onChange={(e) => set("deadlineAt", e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Disable after deadline toggle — only when deadline is set */}
            {form.deadlineAt && (
              <div className="flex items-center gap-3">
                <Switch
                  id="disable-after"
                  checked={form.disableAfterDeadline}
                  onCheckedChange={(v) => set("disableAfterDeadline", v)}
                />
                <Label htmlFor="disable-after" className="cursor-pointer">
                  Disable announcement after deadline
                </Label>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Write your announcement message..."
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                rows={4}
              />
            </div>

            {/* Attachment URL */}
            <div className="space-y-2">
              <Label htmlFor="attachment-url">Attachment URL (optional)</Label>
              <Input
                id="attachment-url"
                type="url"
                placeholder="https://..."
                value={form.attachmentUrl}
                onChange={(e) => set("attachmentUrl", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Link to a document, slide deck, or any external resource.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="min-w-[180px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Announcement
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
