"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ArrowLeft, Send, Users, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"

import type { AnnouncementPriority, AnnouncementStatus } from "@/types/announcements"

const GROUP_OPTIONS = [
  { id: "g1", name: "AI Research Group", memberCount: 8 },
  { id: "g2", name: "Team Atlas", memberCount: 5 },
  { id: "g3", name: "Team Nova", memberCount: 6 },
  { id: "g4", name: "Quantum Computing", memberCount: 4 },
]

type AnnouncementFormData = {
  title: string
  priority: AnnouncementPriority
  content: string
  selectedGroupIds: string[]
  deadline: string
  resourceLink: string
  resourceFile: File | null
  status: AnnouncementStatus
}

export function AdvisorAnnouncementNewPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState<AnnouncementFormData>({
    title: "",
    priority: "MEDIUM",
    content: "",
    selectedGroupIds: [],
    deadline: "",
    resourceLink: "",
    resourceFile: null,
    status: "published",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleFieldChange = <K extends keyof AnnouncementFormData>(field: K, value: AnnouncementFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleGroup = (id: string) => {
    const current = formData.selectedGroupIds
    const next = current.includes(id) 
      ? current.filter(g => g !== id) 
      : [...current, id]
    handleFieldChange("selectedGroupIds" as keyof AnnouncementFormData, next)
  }

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim() || formData.selectedGroupIds.length === 0 || !formData.deadline) {
      toast.error("Missing required fields")
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      toast.success("Announcement created!")
      router.push("/dashboard/advisor/announcements")
      setIsSubmitting(false)
    }, 1500)
  }

  const priorityLabel = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  }[formData.priority]

  return (
    <>
      {/* Page Header */}
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Create Announcement</CardTitle>
            <CardDescription>Set up a new announcement for your project team.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Form - Matching schedule layout */}
            <div className="grid gap-4 py-2">
              
              {/* Row 1: Title + Priority (like title + project) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Upcoming Project Deadline"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title" as const, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => handleFieldChange("priority" as const, v as AnnouncementPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="capitalize mt-1">{priorityLabel}</Badge>
                </div>
              </div>

              {/* Row 2: Deadline + Groups (like date + time) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => handleFieldChange("deadline" as const, e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Recipient Groups *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {GROUP_OPTIONS.map((group) => {
                      const isSelected = formData.selectedGroupIds.includes(group.id)
                      return (
                        <Button
                          key={group.id}
                          variant={isSelected ? "default" : "outline"}
                          className="justify-start h-auto p-3"
                          onClick={() => toggleGroup(group.id)}
                        >
                          <Users className="mr-2 h-4 w-4 shrink-0" />
                          {group.name} ({group.memberCount})
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Full width Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement message..."
                  value={formData.content}
                  onChange={(e) => handleFieldChange("content" as const, e.target.value)}
                  rows={4}
                />
              </div>

              {/* Resource field (Optional link and/or file) */}
              <div className="space-y-2">
                <Label htmlFor="resource-link">Resource URL (Optional)</Label>
                <Input
                  id="resource-link"
                  type="url"
                  placeholder="https://..."
                  value={formData.resourceLink}
                  onChange={(e) => handleFieldChange("resourceLink" as const, e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-file">Upload File (Optional)</Label>
                <Input
                  id="resource-file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    handleFieldChange("resourceFile" as const, file)
                  }}
                />
                {formData.resourceFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected file: {formData.resourceFile.name} ({(formData.resourceFile.size / 1024 / 1024).toFixed(2)} MB)
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-3"
                      onClick={() => handleFieldChange("resourceFile" as const, null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Optionally provide a link, a file, or both as additional announcement resources.
              </p>
            </div>

            {/* Buttons - matching schedule */}
            <div className="flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Publish Announcement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

