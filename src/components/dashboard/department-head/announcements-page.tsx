"use client"

import React from "react"
import Link from "next/link"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  mockAnnouncements,
  formatAnnouncementDate,
  type Announcement,
  type AnnouncementPriority,
} from "@/lib/mock/announcements"

const priorityVariant: Record<AnnouncementPriority, string> = {
  high: "bg-red-500/90 text-white border-0",
  medium: "bg-blue-600 text-white border-0",
  low: "bg-muted text-muted-foreground border border-border",
}

const audienceLabel: Record<string, string> = {
  all: "All",
  students: "Students",
  advisors: "Advisors",
}

export function DepartmentHeadAnnouncementsPage() {
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

      <div className="space-y-4">
        {mockAnnouncements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>
    </div>
  )
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight">
                {announcement.title}
              </h3>
              <Badge
                className={priorityVariant[announcement.priority]}
                variant="secondary"
              >
                {announcement.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Posted: {formatAnnouncementDate(announcement.createdAt)} • Audience:{" "}
              {audienceLabel[announcement.audience] ?? announcement.audience}
            </p>
            <p className="text-sm leading-snug">{announcement.content}</p>
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
              asChild
            >
              <Link href={`/dashboard/department-head/announcements/delete/${announcement.id}`}>
                <Trash2 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
