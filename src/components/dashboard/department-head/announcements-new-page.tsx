"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useCreateDepartmentAnnouncement } from "@/lib/hooks/use-department-announcements"
import type { DepartmentAnnouncementActionType } from "@/types/department-announcements"
import { DepartmentAnnouncementFormCard } from "@/components/dashboard/department-head/department-announcement-form-card"
import { DepartmentAnnouncementPreviewCard } from "@/components/dashboard/department-head/department-announcement-preview-card"

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
      <DashboardPageHeader
        title="New Announcement"
        description="Create a new department announcement"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/department-head/announcements" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Announcements
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
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
          />

          <div className="flex gap-2">
            <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
              <Save className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create Announcement"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/department-head/announcements">Cancel</Link>
            </Button>
          </div>
        </div>

        <DepartmentAnnouncementPreviewCard
          title={title}
          message={message}
          actionType={actionType}
          actionLabel={actionLabel}
          actionUrl={actionUrl}
          deadlineLabel={deadlineAtLocal ? deadlineAtLocal.replace("T", " ") : undefined}
        />
      </form>
    </div>
  )
}
