"use client"

import React, { useId, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AnnouncementPriority, AnnouncementStatus } from "@/lib/mock/announcements"

const priorityOptions: { value: AnnouncementPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const statusOptions: { value: AnnouncementStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

const mockAdvisorGroups = [
  { id: "g1", name: "AI Research Group" },
  { id: "g2", name: "Team Atlas" },
  { id: "g3", name: "Team Nova" },
] as const

export function AdvisorAnnouncementNewPage() {
  const router = useRouter()
  const groupLegendId = useId()
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<AnnouncementPriority>("medium")
  const [status, setStatus] = useState<AnnouncementStatus>("draft")
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([mockAdvisorGroups[0]?.id ?? ""])
  const [content, setContent] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)

  const selectedGroupsLabel = useMemo(() => {
    const selected = new Set(selectedGroupIds.filter(Boolean))
    const names = mockAdvisorGroups.filter((g) => selected.has(g.id)).map((g) => g.name)
    return names.length ? names.join(", ") : "None selected"
  }, [selectedGroupIds])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const groups = selectedGroupIds.filter(Boolean)
    if (groups.length === 0) {
      toast.error("Select at least one group", {
        description: "Please choose which project group(s) should receive this announcement.",
      })
      return
    }

    toast.success("Announcement created", {
      description: `Saved • Groups: ${selectedGroupsLabel}${attachment ? ` • File: ${attachment.name}` : ""}`,
    })
    router.push("/dashboard/advisor/announcements")
  }

  const groupOptions = useMemo(() => mockAdvisorGroups, [])

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="New Announcement"
        description="Create an announcement for your project groups"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/advisor/announcements" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {priorityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write the announcement message..."
                    rows={8}
                    className="resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attachment (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="attachment">Upload file</Label>
                  <Input
                    id="attachment"
                    type="file"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {attachment ? `Selected: ${attachment.name}` : "No file selected."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Target Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <fieldset className="space-y-2" aria-labelledby={groupLegendId}>
                  <p id={groupLegendId} className="text-sm font-medium">
                    Select group(s)
                  </p>
                  <div className="space-y-2">
                    {groupOptions.map((g) => {
                      const checked = selectedGroupIds.includes(g.id)
                      return (
                        <label key={g.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedGroupIds((prev) => {
                                const set = new Set(prev.filter(Boolean))
                                if (e.target.checked) set.add(g.id)
                                else set.delete(g.id)
                                return Array.from(set)
                              })
                            }}
                          />
                          <span>{g.name}</span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Selected: {selectedGroupsLabel}</p>
                </fieldset>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  Create Announcement
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/advisor/announcements">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

