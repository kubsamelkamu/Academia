"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  mockAnnouncements,
  formatAnnouncementDate,
  type Announcement,
  type AnnouncementPriority,
} from "@/lib/mock/announcements"
import type { AnnouncementPriority as PriorityType } from "@/types/announcements"

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
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Announcements"
        description="Create and manage announcements for your project groups"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw]">
              <AnnouncementCreateForm open={open} onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
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

function AnnouncementCreateForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formData, setFormData] = React.useState({
    title: '',
    priority: 'MEDIUM' as PriorityType,
    deadline: '',
    content: '',
    groups: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill title and message')
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      toast.success('Announcement created!')
      setFormData({ title: '', priority: 'MEDIUM', deadline: '', content: '', groups: [] })
      onClose()
      setIsSubmitting(false)
    }, 1000)
  }

  const toggleGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter(g => g !== groupId)
        : [...prev.groups, groupId],
    }))
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogDescription>Set up a new announcement for your project team.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Upcoming deadline"
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v as PriorityType})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            min={new Date().toISOString().slice(0,10)}
          />
        </div>

        <div className="space-y-2">
          <Label>Groups ({formData.groups.length})</Label>
          <div className="grid grid-cols-2 gap-2">
            {['g1', 'g2', 'g3', 'g4'].map(id => (
              <Button
                key={id}
                variant={formData.groups.includes(id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleGroup(id)}
              >
                Group {id.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Resource (Optional)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              placeholder="Paste link URL" 
              className="max-w-md"
            />
            <div className="relative">
              <input
                type="file"
                id="resource-file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
              <Label
                htmlFor="resource-file"
                className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-muted rounded-md cursor-pointer hover:border-primary transition-colors h-full w-full"
              >
                Choose File
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Message *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            rows={3}
            placeholder="Your message..."
          />
        </div>

      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Announcement'}
        </Button>
      </div>
    </>
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