"use client"

import React, { useState } from "react"
import { Save } from "lucide-react"
import { DashboardBackButton } from "@/components/dashboard/dashboard-back"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useCreateDepartmentAnnouncement } from "@/lib/hooks/use-department-announcements"
import type { DepartmentAnnouncementActionType } from "@/types/department-announcements"
import { DepartmentAnnouncementFormCard } from "@/components/dashboard/department-head/department-announcement-form-card"

function toIsoFromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function mapCreateError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Failed to create announcement"
  const normalized = message.toLowerCase()

  if (normalized.includes("access denied to department")) {
    return "You do not have access to this department."
  }

  if (normalized.includes("deadlineat must be in the future")) {
    return "Deadline must be in the future."
  }

  if (normalized.includes("actionurl must be a valid url")) {
    return "Action URL must be a valid URL with protocol (https://...)."
  }

  return message
}

export function AnnouncementNewPage() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null

  const createMutation = useCreateDepartmentAnnouncement()

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [actionType, setActionType] = useState<DepartmentAnnouncementActionType>("FORM_PROJECT_GROUP")
  const [actionLabel, setActionLabel] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [deadlineAtLocal, setDeadlineAtLocal] = useState("")
  const [deadlineError, setDeadlineError] = useState<string | null>(null)
  const [actionLabelError, setActionLabelError] = useState<string | null>(null)
  const [actionUrlError, setActionUrlError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!departmentId || !accessToken) {
      toast.error("Department context is missing")
      return
    }

    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    const trimmedActionLabel = actionLabel.trim()
    const trimmedActionUrl = actionUrl.trim()

    if (!trimmedTitle || !trimmedMessage) {
      toast.error("Title and message are required")
      return
    }

    const hasActionLabel = Boolean(trimmedActionLabel)
    const hasActionUrl = Boolean(trimmedActionUrl)

    if (hasActionLabel !== hasActionUrl) {
      setActionLabelError(!hasActionLabel ? "Action label is required when URL is set" : null)
      setActionUrlError(!hasActionUrl ? "Action URL is required when label is set" : null)
      return
    }

    if (hasActionUrl && !isValidHttpUrl(trimmedActionUrl)) {
      setActionUrlError("Action URL must be a valid URL with protocol (https://...)")
      return
    }

    setActionLabelError(null)
    setActionUrlError(null)

    const deadlineIso = toIsoFromDatetimeLocal(deadlineAtLocal)
    if (deadlineAtLocal && !deadlineIso) {
      setDeadlineError("Enter a valid date and time")
      return
    }

    if (deadlineIso && new Date(deadlineIso).getTime() <= Date.now()) {
      setDeadlineError("Deadline must be in the future")
      return
    }

    setDeadlineError(null)

    try {
      await createMutation.mutateAsync({
        departmentId,
        dto: {
          title: trimmedTitle,
          message: trimmedMessage,
          actionType,
          ...(hasActionLabel && hasActionUrl
            ? {
                actionLabel: trimmedActionLabel,
                actionUrl: trimmedActionUrl,
              }
            : null),
          ...(deadlineIso ? { deadlineAt: deadlineIso } : null),
        },
      })

      toast.success("Announcement created")
      router.push("/dashboard/department-head/announcements")
    } catch (error) {
      const mapped = mapCreateError(error)
      if (mapped.toLowerCase().includes("deadline")) {
        setDeadlineError(mapped)
      }
      if (mapped.toLowerCase().includes("action url")) {
        setActionUrlError(mapped)
      }
      toast.error(mapped)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardBackButton onClick={() => router.back()} className="mb-4 -ml-2" />

      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Create Announcement</CardTitle>
          <CardDescription>Set up a new department announcement.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DepartmentAnnouncementFormCard
              title={title}
              message={message}
              actionType={actionType}
              actionLabel={actionLabel}
              actionUrl={actionUrl}
              deadlineAtLocal={deadlineAtLocal}
              deadlineError={deadlineError}
              actionLabelError={actionLabelError}
              actionUrlError={actionUrlError}
              onTitleChange={setTitle}
              onMessageChange={setMessage}
              onActionTypeChange={setActionType}
              onActionLabelChange={(value) => {
                setActionLabel(value)
                setActionLabelError(null)
              }}
              onActionUrlChange={(value) => {
                setActionUrl(value)
                setActionUrlError(null)
              }}
              onDeadlineAtChange={(value) => {
                setDeadlineAtLocal(value)
                setDeadlineError(null)
              }}
              showCard={false}
            />

            <div className="flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
                <Save className="h-4 w-4" />
                {createMutation.isPending ? "Creating..." : "Create Announcement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
