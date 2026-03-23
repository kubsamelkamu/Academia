"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDepartmentAnnouncements, useDeleteDepartmentAnnouncement } from "@/lib/hooks/use-department-announcements"
import type { DepartmentAnnouncementItem } from "@/types/department-announcements"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"

function clampPage(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatCreatedBy(announcement: DepartmentAnnouncementItem): string {
  const firstName = announcement.createdBy.firstName?.trim() ?? ""
  const lastName = announcement.createdBy.lastName?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || "Unknown"
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCountdown(secondsRemaining: number | null): string {
  if (secondsRemaining === null || secondsRemaining < 0) return "No countdown"

  const days = Math.floor(secondsRemaining / 86_400)
  const hours = Math.floor((secondsRemaining % 86_400) / 3_600)
  const minutes = Math.floor((secondsRemaining % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${Math.max(0, minutes)}m left`
}

function mapAnnouncementError(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : fallback
  const normalized = rawMessage.toLowerCase()

  if (normalized.includes("access denied to department")) {
    return "You do not have access to this department."
  }

  return rawMessage || fallback
}

export function DepartmentHeadAnnouncementsPage() {
  const pageSize = 10
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const [page, setPage] = useState(1)
  const [jumpPageInput, setJumpPageInput] = useState("1")

  const announcementsQuery = useDepartmentAnnouncements({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    page,
    limit: pageSize,
  })

  const deleteAnnouncementMutation = useDeleteDepartmentAnnouncement()

  const handleDelete = async (announcement: DepartmentAnnouncementItem) => {
    if (!departmentId) {
      toast.error("Department context is missing")
      return
    }

    const isConfirmed = window.confirm("Delete this announcement?")
    if (!isConfirmed) return

    try {
      await deleteAnnouncementMutation.mutateAsync({
        departmentId,
        announcementId: announcement.id,
      })

      toast.success("Announcement deleted")
    } catch (error) {
      toast.error(mapAnnouncementError(error, "Failed to delete announcement"))
    }
  }

  const announcements = announcementsQuery.data?.items ?? []
  const pagination = announcementsQuery.data?.pagination

  const totalPages = pagination?.pages ?? 1
  const currentPage = pagination?.page ?? page
  const totalItems = pagination?.total ?? announcements.length

  const pageSummary = useMemo(() => {
    if (totalItems === 0) return "0 of 0"
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)
    return `${start}-${end} of ${totalItems}`
  }, [currentPage, pageSize, totalItems])

  useEffect(() => {
    if (!announcementsQuery.isSuccess) return
    if (page === 1) return
    if (announcements.length > 0) return

    setPage((prev) => Math.max(1, prev - 1))
  }, [announcements.length, announcementsQuery.isSuccess, page])

  useEffect(() => {
    if (totalPages < page) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setJumpPageInput(String(currentPage))
  }, [currentPage])

  const handleJumpToPage = () => {
    const parsed = Number.parseInt(jumpPageInput, 10)
    if (!Number.isFinite(parsed)) {
      setJumpPageInput(String(currentPage))
      return
    }

    const nextPage = clampPage(parsed, 1, Math.max(1, totalPages))
    setPage(nextPage)
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Department Announcements"
        description="Create and manage announcements for your department"
        actions={
          <Button asChild>
            <Link href="/dashboard/department-head/announcements/new" className="gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Link>
          </Button>
        }
      />

      {announcementsQuery.isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Loading announcements...
          </CardContent>
        </Card>
      ) : announcementsQuery.isError ? (
        <Card>
          <CardContent className="space-y-3 py-8">
            <p className="text-sm text-destructive">
              {mapAnnouncementError(announcementsQuery.error, "Failed to load announcements")}
            </p>
            <Button variant="outline" onClick={() => announcementsQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No announcements yet. Create your first announcement.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isDeleting={deleteAnnouncementMutation.isPending}
              onDelete={handleDelete}
            />
          ))}

          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {pageSummary} • {pageSize} per page
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || announcementsQuery.isFetching}
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {Math.max(1, totalPages)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || announcementsQuery.isFetching}
              >
                Next
              </Button>
              <div className="flex items-center gap-1 pl-1">
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, totalPages)}
                  value={jumpPageInput}
                  onChange={(event) => setJumpPageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleJumpToPage()
                    }
                  }}
                  className="h-8 w-16"
                  aria-label="Jump to page"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleJumpToPage}
                  disabled={announcementsQuery.isFetching || totalPages <= 1}
                >
                  Go
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({
  announcement,
  isDeleting,
  onDelete,
}: {
  announcement: DepartmentAnnouncementItem
  isDeleting: boolean
  onDelete: (announcement: DepartmentAnnouncementItem) => void
}) {
  const isExpired = announcement.isExpired || (announcement.secondsRemaining ?? 1) <= 0

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight">{announcement.title}</h3>
              <Badge variant="secondary">{announcement.actionType}</Badge>
              {announcement.deadlineAt ? (
                <Badge variant={isExpired ? "destructive" : "outline"}>
                  {isExpired ? "Expired" : formatCountdown(announcement.secondsRemaining)}
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              Created by {formatCreatedBy(announcement)} • {formatDateTime(announcement.createdAt)}
            </p>
            <p className="text-sm leading-snug whitespace-pre-wrap">{announcement.message}</p>
            {announcement.actionLabel && announcement.actionUrl ? (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium text-foreground">Call to action</p>
                <a
                  href={announcement.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {announcement.actionLabel}
                </a>
                <p className="text-xs text-muted-foreground break-all">{announcement.actionUrl}</p>
              </div>
            ) : null}
            {announcement.deadlineAt ? (
              <p className="text-xs text-muted-foreground">
                Deadline: {formatDateTime(announcement.deadlineAt)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="icon" title="Edit" asChild>
              <Link href={`/dashboard/department-head/announcements/edit/${announcement.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Delete"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(announcement)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
