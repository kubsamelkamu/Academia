"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DepartmentAnnouncementActionType } from "@/types/department-announcements"

interface DepartmentAnnouncementPreviewCardProps {
  title?: string
  message?: string
  actionType: DepartmentAnnouncementActionType
  actionLabel?: string
  actionUrl?: string
  deadlineLabel?: string
  createdByLabel?: string
  statusLabel?: string
  createdAtLabel?: string
}

export function DepartmentAnnouncementPreviewCard({
  title,
  message,
  actionType,
  actionLabel,
  actionUrl,
  deadlineLabel,
  createdByLabel,
  statusLabel,
  createdAtLabel,
}: DepartmentAnnouncementPreviewCardProps) {
  const trimmedTitle = title?.trim() ?? ""
  const trimmedMessage = message?.trim() ?? ""
  const trimmedActionLabel = actionLabel?.trim() ?? ""
  const trimmedActionUrl = actionUrl?.trim() ?? ""

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-semibold leading-tight">{trimmedTitle || "Announcement title"}</p>
        <Badge variant="secondary">{actionType}</Badge>

        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {trimmedMessage || "Announcement message preview will appear here."}
        </p>

        {trimmedActionLabel && trimmedActionUrl ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium text-foreground">Call to action</p>
            <p className="text-sm text-foreground">{trimmedActionLabel}</p>
            <p className="text-xs text-muted-foreground break-all">{trimmedActionUrl}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No CTA set.</p>
        )}

        <p className="text-xs text-muted-foreground">
          {deadlineLabel ? `Deadline: ${deadlineLabel}` : "No deadline set."}
        </p>

        {createdByLabel || statusLabel || createdAtLabel ? (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 space-y-1">
            {createdByLabel ? <p className="text-xs text-muted-foreground">Created by: {createdByLabel}</p> : null}
            {statusLabel ? <p className="text-xs text-muted-foreground">Status: {statusLabel}</p> : null}
            {createdAtLabel ? <p className="text-xs text-muted-foreground">Created at: {createdAtLabel}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}