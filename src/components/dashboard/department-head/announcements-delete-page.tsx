"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { AlertTriangle } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAnnouncementById, formatAnnouncementDate } from "@/lib/mock/announcements"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const audienceLabel: Record<string, string> = {
  all: "All",
  students: "Students",
  advisors: "Advisors",
}

const priorityBadgeClass: Record<string, string> = {
  high: "bg-red-500/90 text-white",
  medium: "bg-amber-500/90 text-white",
  low: "bg-muted text-muted-foreground",
}

interface AnnouncementDeletePageProps {
  announcementId: string
}

export function AnnouncementDeletePage({ announcementId }: AnnouncementDeletePageProps) {
  const router = useRouter()
  const announcement = getAnnouncementById(announcementId)

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

  const handleDelete = () => {
    toast.success("Announcement deleted", {
      description: `"${announcement.title}" has been permanently deleted.`,
    })
    router.push("/dashboard/department-head/announcements")
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Delete Announcement"
        description={`Are you sure you want to delete "${announcement.title}"?`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/announcements" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Link>
          </Button>
        }
      />

      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-destructive">Delete Announcement</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  This action cannot be undone. This will permanently delete the announcement.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> {announcement.title}</p>
                <p>
                  <span className="text-muted-foreground">Audience:</span>{" "}
                  <Badge variant="secondary">
                    {audienceLabel[announcement.audience] ?? announcement.audience}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Priority:</span>{" "}
                  <Badge className={priorityBadgeClass[announcement.priority]}>
                    {announcement.priority}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Created At:</span>{" "}
                  {formatAnnouncementDate(announcement.createdAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Content:</span>{" "}
                  {announcement.content}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/department-head/announcements">Cancel</Link>
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Announcement
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
