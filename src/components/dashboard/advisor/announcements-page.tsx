"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default AdvisorAnnouncementsPage