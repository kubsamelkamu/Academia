"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Save } from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import {
  useDepartmentAnnouncementById,
  useUpdateDepartmentAnnouncement,
} from "@/lib/hooks/use-department-announcements"
import type { DepartmentAnnouncementActionType } from "@/types/department-announcements"
import { DepartmentAnnouncementFormCard } from "@/components/dashboard/department-head/department-announcement-form-card"

function toLocalInputValue(isoDate: string | null): string {
  if (!isoDate) return ""
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ""

  const offsetMs = date.getTimezoneOffset() * 60_000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

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

function mapEditError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Failed to update announcement"
  const normalized = message.toLowerCase()

  if (normalized.includes("access denied to department")) {
    return "You do not have access to this department."
  }

  if (normalized.includes("announcement not found")) {
    return "Announcement no longer exists"
  }

  if (normalized.includes("deadlineat must be in the future")) {
    return "Deadline must be in the future."
  }

  if (normalized.includes("actionurl must be a valid url")) {
    return "Action URL must be a valid URL with protocol (https://...)."
  }

  return message
}

interface AnnouncementEditPageProps {
  announcementId: string
}

export function AnnouncementEditPage({ announcementId }: AnnouncementEditPageProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null

  const announcementQuery = useDepartmentAnnouncementById({
    enabled: Boolean(accessToken) && Boolean(departmentId),
    departmentId,
    announcementId,
  })
  const updateMutation = useUpdateDepartmentAnnouncement()

  const announcement = announcementQuery.data ?? null

  const [draft, setDraft] = useState<{
    title?: string
    message?: string
    actionType?: DepartmentAnnouncementActionType
    actionLabel?: string
    actionUrl?: string
    deadlineAtLocal?: string
  } | null>(null)
  const [deadlineError, setDeadlineError] = useState<string | null>(null)
  const [actionLabelError, setActionLabelError] = useState<string | null>(null)
  const [actionUrlError, setActionUrlError] = useState<string | null>(null)

  const title = draft?.title ?? announcement?.title ?? ""
  const message = draft?.message ?? announcement?.message ?? ""
  const actionType = draft?.actionType ?? announcement?.actionType ?? "FORM_PROJECT_GROUP"
  const actionLabel = draft?.actionLabel ?? announcement?.actionLabel ?? ""
  const actionUrl = draft?.actionUrl ?? announcement?.actionUrl ?? ""
  const deadlineAtLocal = draft?.deadlineAtLocal ?? toLocalInputValue(announcement?.deadlineAt ?? null)
  const initialDeadlineAtIso = announcement?.deadlineAt ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!departmentId) {
      toast.error("Department context is missing")
      return
    }

    if (!announcement) {
      toast.error("Announcement no longer exists")
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

    const nextDeadlineIso = toIsoFromDatetimeLocal(deadlineAtLocal)
    if (deadlineAtLocal && !nextDeadlineIso) {
      setDeadlineError("Enter a valid date and time")
      return
    }

    if (nextDeadlineIso && new Date(nextDeadlineIso).getTime() <= Date.now()) {
      setDeadlineError("Deadline must be in the future")
      return
    }

    setDeadlineError(null)

    const dto: {
      title?: string
      message?: string
      actionType?: DepartmentAnnouncementActionType
      actionLabel?: string | null
      actionUrl?: string | null
      deadlineAt?: string
      clearDeadline?: boolean
    } = {}

    if (trimmedTitle !== announcement.title) {
      dto.title = trimmedTitle
    }

    if (trimmedMessage !== announcement.message) {
      dto.message = trimmedMessage
    }

    if (actionType !== announcement.actionType) {
      dto.actionType = actionType
    }

    const initialActionLabel = announcement.actionLabel?.trim() ?? ""
    const initialActionUrl = announcement.actionUrl?.trim() ?? ""
    const hasInitialCta = Boolean(initialActionLabel) && Boolean(initialActionUrl)
    const hasNextCta = hasActionLabel && hasActionUrl

    if (!hasNextCta && hasInitialCta) {
      dto.actionLabel = null
      dto.actionUrl = null
    } else if (
      hasNextCta &&
      (trimmedActionLabel !== initialActionLabel || trimmedActionUrl !== initialActionUrl)
    ) {
      dto.actionLabel = trimmedActionLabel
      dto.actionUrl = trimmedActionUrl
    }

    const deadlineChanged = nextDeadlineIso !== initialDeadlineAtIso
    if (deadlineChanged) {
      if (nextDeadlineIso) {
        dto.deadlineAt = nextDeadlineIso
      } else if (initialDeadlineAtIso) {
        dto.clearDeadline = true
      }
    }

    if (Object.keys(dto).length === 0) {
      toast.message("No changes to save")
      return
    }

    try {
      await updateMutation.mutateAsync({
        departmentId,
        announcementId: announcement.id,
        dto,
      })

      toast.success("Changes saved")
      setDraft(null)
      await announcementQuery.refetch()
    } catch (error) {
      const mapped = mapEditError(error)
      if (mapped.toLowerCase().includes("deadline")) {
        setDeadlineError(mapped)
      }
      if (mapped.toLowerCase().includes("action url")) {
        setActionUrlError(mapped)
      }
      toast.error(mapped)
    }
  }

  if (announcementQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Edit Announcement" description="Loading announcement..." />
      </div>
    )
  }

  if (announcementQuery.isError || !announcement) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Announcement not found"
          description="The requested announcement could not be found."
        />
        <DashboardBackLink href="/dashboard/department-head/announcements" variant="outline" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Edit Announcement"
        description={`Edit information for ${announcement.title}`}
        actions={<DashboardBackLink href="/dashboard/department-head/announcements" variant="outline" />}
      />

      <form
        id="announcement-edit-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
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
          onTitleChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), title: value }))
          }}
          onMessageChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), message: value }))
          }}
          onActionTypeChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), actionType: value }))
          }}
          onActionLabelChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), actionLabel: value }))
            setActionLabelError(null)
          }}
          onActionUrlChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), actionUrl: value }))
            setActionUrlError(null)
          }}
          onDeadlineAtChange={(value) => {
            setDraft((previous) => ({ ...(previous ?? {}), deadlineAtLocal: value }))
            setDeadlineError(null)
          }}
        />
      </form>

      <div className="flex justify-center gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/department-head/announcements">Cancel</Link>
        </Button>
        <Button
          type="submit"
          form="announcement-edit-form"
          className="gap-2"
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
