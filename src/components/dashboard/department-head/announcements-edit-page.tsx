"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getAnnouncementById,
  formatAnnouncementDate,
  type AnnouncementPriority,
  type AnnouncementStatus,
} from "@/lib/mock/announcements"
import { Megaphone } from "lucide-react"
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

const audienceLabel: Record<string, string> = {
  all: "All",
  students: "Students",
  advisors: "Advisors",
}

const priorityBadgeClass: Record<AnnouncementPriority, string> = {
  high: "bg-red-500/90 text-white",
  medium: "bg-amber-500/90 text-white",
  low: "bg-muted text-muted-foreground",
}

interface AnnouncementEditPageProps {
  announcementId: string
}

export function AnnouncementEditPage({ announcementId }: AnnouncementEditPageProps) {
  const announcement = getAnnouncementById(announcementId)
  const [title, setTitle] = useState(announcement?.title ?? "")
  const [priority, setPriority] = useState<AnnouncementPriority>(
    announcement?.priority ?? "medium"
  )
  const [status, setStatus] = useState<AnnouncementStatus>(
    announcement?.status ?? "published"
  )
  const [content, setContent] = useState(announcement?.content ?? "")

  if (!announcement) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Announcement not found"
          description="The requested announcement could not be found."
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/department-head/announcements">Back to Announcements</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Changes saved", {
      description: "The announcement has been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit Announcement"
        description={`Edit information for ${announcement.title}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/announcements" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Link>
          </Button>
        }
      />

      <form
        id="announcement-edit-form"
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr,320px]"
      >
        <Card>
          <CardHeader>
            <CardTitle>Announcement Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium">{announcement.title}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Current Audience</Label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {audienceLabel[announcement.audience] ?? announcement.audience}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Current Priority</Label>
              <div className="mt-1">
                <Badge className={priorityBadgeClass[announcement.priority]}>
                  {announcement.priority}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Current Status</Label>
              <div className="mt-1">
                <Badge className="bg-emerald-500/90 text-white capitalize">
                  {announcement.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Created At</Label>
              <p className="mt-1 text-sm font-medium">
                {formatAnnouncementDate(announcement.createdAt)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Content Preview</Label>
              <p className="mt-1 text-sm leading-snug">{announcement.content}</p>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="flex justify-center gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/department-head/announcements">Cancel</Link>
        </Button>
        <Button type="submit" form="announcement-edit-form" className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
