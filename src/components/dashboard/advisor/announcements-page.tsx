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

// Constants
const PRIORITY_CONFIG = {
  high: {
    label: "High",
    className: "bg-red-500/90 text-white border-0",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-600 text-white border-0",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border border-border",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
} as const

const AUDIENCE_LABELS = {
  all: "All",
  students: "Students",
  advisors: "Advisors",
} as const

const STATUS_LABELS = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
} as const

// Utility functions
const getPriorityBadgeClass = (priority: AnnouncementPriority): string => {
  return PRIORITY_CONFIG[priority]?.badgeClass ?? PRIORITY_CONFIG.low.badgeClass
}

const getAudienceLabel = (audience: string): string => {
  return AUDIENCE_LABELS[audience as keyof typeof AUDIENCE_LABELS] ?? audience
}

const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status
}

interface AnnouncementCardProps {
  announcement: Announcement
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function AdvisorAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Announcements"
        description="Create and manage announcements for your project groups"
        actions={
          <Button asChild>
            <Link 
              href="/dashboard/advisor/announcements/new" 
              className="gap-2"
              aria-label="Create new announcement"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Announcement
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="announcements-list">
        <h2 id="announcements-list" className="sr-only">
          Announcements list
        </h2>
        
        {mockAnnouncements.length > 0 ? (
          <Card className="rounded-xl border border-border bg-background shadow-sm">
            <CardContent className="space-y-4">
              {mockAnnouncements.map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyAnnouncementsState />
        )}
      </section>
    </div>
  )
}

function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const priorityConfig = PRIORITY_CONFIG[announcement.priority]
  
  return (
    <article 
      className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      aria-labelledby={`announcement-title-${announcement.id}`}
    >
      <div className="border-l-4 border-l-transparent group-hover:border-l-primary transition-colors">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 
                  id={`announcement-title-${announcement.id}`}
                  className="text-base font-semibold leading-tight"
                >
                  <Link 
                    href={`/dashboard/advisor/announcements/${announcement.id}`}
                    className="hover:underline focus:outline-none"
                  >
                    {announcement.title}
                  </Link>
                </h3>
                
                <Badge 
                  className={getPriorityBadgeClass(announcement.priority)} 
                  variant="outline"
                >
                  {priorityConfig.label}
                </Badge>
              </div>

              <p className="text-muted-foreground text-sm">
                <time dateTime={announcement.createdAt}>
                  Posted: {formatAnnouncementDate(announcement.createdAt)}
                </time>
                {" • "}
                <span>Audience: {getAudienceLabel(announcement.audience)}</span>
              </p>

              <p className="text-sm leading-snug line-clamp-2">
                {announcement.content}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="secondary" className="uppercase tracking-wide">
                {getStatusLabel(announcement.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyAnnouncementsState() {
  return (
    <Card className="rounded-xl border border-border bg-background shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold">No announcements yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first announcement.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/advisor/announcements/new" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Announcement
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}