"use client"

import React from "react"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { AlertTriangle } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import {
  useDeleteDepartmentAnnouncement,
  useDepartmentAnnouncementById,
} from "@/lib/hooks/use-department-announcements"

function mapDeleteError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Failed to delete announcement"
  const normalized = message.toLowerCase()

  if (normalized.includes("access denied to department")) {
    return "You do not have access to this department."
  }

  if (normalized.includes("announcement not found")) {
    return "Announcement no longer exists"
  }

  return message
}

interface AnnouncementDeletePageProps {
  announcementId: string
}

export function AnnouncementDeletePage({ announcementId }: AnnouncementDeletePageProps) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null

  const announcementQuery = useDepartmentAnnouncementById({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    announcementId,
  })
  const deleteMutation = useDeleteDepartmentAnnouncement()

  const announcement = announcementQuery.data ?? null

  if (announcementQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Delete Announcement"
          description="Loading announcement details..."
        />
      </div>
    )
  }

  if (announcementQuery.isError || !announcement) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Announcement not found"
          description="The requested announcement could not be found."
        />
        <DashboardBackLink href="/dashboard/department-head/announcements" variant="outline" />
      </div>
    )
  }

  const handleDelete = async () => {
    if (!departmentId) {
      toast.error("Department context is missing")
      return
    }

    try {
      await deleteMutation.mutateAsync({
        departmentId,
        announcementId: announcement.id,
      })

      toast.success("Announcement deleted", {
        description: `"${announcement.title}" has been permanently deleted.`,
      })
      router.push("/dashboard/department-head/announcements")
    } catch (error) {
      toast.error(mapDeleteError(error))
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Delete Announcement"
        description={`Are you sure you want to delete "${announcement.title}"?`}
        actions={<DashboardBackLink href="/dashboard/department-head/announcements" variant="outline" />}
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
                  <span className="text-muted-foreground">Action Type:</span>{" "}
                  <Badge variant="secondary">{announcement.actionType}</Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge variant={announcement.isExpired ? "destructive" : "outline"}>
                    {announcement.isExpired ? "Expired" : "Active"}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Created At:</span>{" "}
                  {new Date(announcement.createdAt).toLocaleString()}
                </p>
                {announcement.deadlineAt ? (
                  <p>
                    <span className="text-muted-foreground">Deadline:</span>{" "}
                    {new Date(announcement.deadlineAt).toLocaleString()}
                  </p>
                ) : null}
                <p>
                  <span className="text-muted-foreground">Message:</span>{" "}
                  {announcement.message}
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
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete Announcement"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
