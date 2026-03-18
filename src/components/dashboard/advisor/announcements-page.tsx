"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

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

const getPriorityStyle = (priority: AnnouncementPriority) => {
  return priority === "high"
    ? "bg-red-100 text-red-800 border-red-200"
    : priority === "medium"
    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-blue-100 text-blue-800 border-blue-200"
}

export function AdvisorAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Announcements"
        description="Create and manage announcements for your project groups"
        actions={
          <Button asChild>
            <Link href="/dashboard/advisor/announcements/new" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Announcement
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
        <div className="flex items-start border-l-4 border-l-transparent hover:border-l-primary transition-all">
          <div className="p-5 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold leading-tight">{announcement.title}</h3>
                  <Badge className={getPriorityStyle(announcement.priority)} variant="outline">
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Posted: {formatAnnouncementDate(announcement.createdAt)} • Audience: {audienceLabel[announcement.audience] ?? announcement.audience}
                </p>
                <p className="text-sm leading-snug">{announcement.content}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span className="uppercase tracking-wide">{announcement.status}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

