"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAdvisorProjects, useCreateAnnouncementMutation } from "@/lib/hooks/useAdvisor"
import { ArrowLeft, Loader2, Send } from "lucide-react"

export function AdvisorAnnouncementNewPage() {
  const router = useRouter()
  const projectsQuery = useAdvisorProjects()
  const createAnnouncementMutation = useCreateAnnouncementMutation()

  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED")
  const [audience, setAudience] = React.useState<"ALL" | "STUDENTS" | "ADVISORS">("STUDENTS")
  const [deadlineAt, setDeadlineAt] = React.useState("")
  const [targetProjectId, setTargetProjectId] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)

  const projects = projectsQuery.data?.items ?? []

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.")
      return
    }

    try {
      await createAnnouncementMutation.mutateAsync({
        dto: {
          title: title.trim(),
          content: content.trim(),
          priority,
          status,
          audience,
          deadlineAt: deadlineAt || undefined,
          targetProjectIds: targetProjectId ? [targetProjectId] : undefined,
        },
        file,
      })
      toast.success("Announcement created.")
      router.push("/dashboard/advisor/announcements")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create announcement")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Announcement</h1>
          <p className="text-sm text-muted-foreground">Publish a real advisor announcement backed by the API.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/advisor/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Announcements
          </Link>
        </Button>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Announcement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Final review deadline" />
            </div>
            <div className="space-y-2">
              <Label>Target Project</Label>
              <Select value={targetProjectId || "__all__"} onValueChange={(value) => setTargetProjectId(value === "__all__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All my projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All my projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.groupName} - {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => setPriority(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value: "DRAFT" | "PUBLISHED" | "ARCHIVED") => setStatus(value)}>
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
              <Select value={audience} onValueChange={(value: "ALL" | "STUDENTS" | "ADVISORS") => setAudience(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="STUDENTS">Students</SelectItem>
                  <SelectItem value="ADVISORS">Advisors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input id="deadline" type="datetime-local" value={deadlineAt} onChange={(event) => setDeadlineAt(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea id="content" rows={6} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your announcement..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Attachment (optional)</Label>
            <Input id="file" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} accept=".pdf,.docx,.jpg,.jpeg,.png,.webp" />
            {file ? <p className="text-xs text-muted-foreground">Selected: {file.name}</p> : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/advisor/announcements">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={createAnnouncementMutation.isPending || projectsQuery.isLoading}>
              {createAnnouncementMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publish Announcement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvisorAnnouncementNewPage