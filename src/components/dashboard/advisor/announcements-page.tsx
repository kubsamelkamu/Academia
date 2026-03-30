"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
=======
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdvisorAnnouncements } from "@/lib/hooks/useAdvisor"
import { Bell, Plus, Search } from "lucide-react"

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdvisorAnnouncementsPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [audience, setAudience] = React.useState("any")

  const announcementsQuery = useAdvisorAnnouncements({
    status: status === "all" ? undefined : status,
    audience: audience === "any" ? undefined : audience,
  })

  const announcements = React.useMemo(() => {
    const items = announcementsQuery.data?.items ?? []
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((announcement) =>
      [announcement.title, announcement.content].some((value) => value.toLowerCase().includes(term)),
    )
  }, [announcementsQuery.data?.items, searchTerm])

  return (
<<<<<<< HEAD
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Manage advisor announcements published to your assigned groups.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/advisor/announcements/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Link>
        </Button>
      </div>
=======
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
              <AnnouncementCreateForm onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />
>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search announcements..." className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any audience</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="advisors">Advisors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {announcementsQuery.isLoading ? (
        <Card><CardContent className="py-12 text-center">Loading announcements...</CardContent></Card>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No announcements yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create one to notify your students and project groups.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{announcement.priority}</p>
                    <p>{announcement.status}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Audience: {announcement.audience}</p>
                <p>Created: {formatDate(announcement.createdAt)}</p>
                {announcement.deadlineAt ? <p>Deadline: {formatDate(announcement.deadlineAt)}</p> : null}
                {announcement.targetProjectIds.length ? <p>Targeted projects: {announcement.targetProjectIds.length}</p> : <p>Targeted projects: all</p>}
                {announcement.attachmentUrl ? (
                  <p>
                    Attachment: <a href={announcement.attachmentUrl} className="text-primary underline" target="_blank" rel="noreferrer">Open attachment</a>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

<<<<<<< HEAD
export default AdvisorAnnouncementsPage
=======
function AnnouncementCreateForm({ onClose }: { onClose: () => void }) {
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
>>>>>>> 07a2570ae68450a4a6f54472eb0a28472d2b7faa
