"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AnnouncementPriority, AnnouncementStatus, AnnouncementAudience } from "@/lib/mock/announcements"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const priorityOptions: { value: AnnouncementPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const statusOptions: { value: AnnouncementStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "advisors", label: "Advisors" },
]

export function AnnouncementNewPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<AnnouncementPriority>("medium")
  const [status, setStatus] = useState<AnnouncementStatus>("draft")
  const [audience, setAudience] = useState<AnnouncementAudience>("all")
  const [content, setContent] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Announcement created", {
      description: "The new announcement has been created.",
    })
    router.push("/dashboard/department-head/announcements")
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="New Announcement"
        description="Create a new department announcement"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/announcements" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Announcement Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <select
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {audienceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Announcement content..."
                rows={6}
                className="resize-y"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Create Announcement
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/department-head/announcements">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
