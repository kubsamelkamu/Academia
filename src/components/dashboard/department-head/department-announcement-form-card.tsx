"use client"

import type { DepartmentAnnouncementActionType } from "@/types/department-announcements"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const departmentAnnouncementActionTypeOptions: {
  value: DepartmentAnnouncementActionType
  label: string
}[] = [
  { value: "FORM_PROJECT_GROUP", label: "Form Project Group" },
  { value: "SUBMIT_PROPOSAL", label: "Submit Proposal" },
  { value: "UPLOAD_DOCUMENT", label: "Upload Document" },
  { value: "REGISTER_PRESENTATION", label: "Register Presentation" },
  { value: "CUSTOM_ACTION", label: "Custom Action" },
]

interface DepartmentAnnouncementFormCardProps {
  title: string
  message: string
  actionType: DepartmentAnnouncementActionType
  actionLabel: string
  actionUrl: string
  deadlineAtLocal: string
  deadlineError: string | null
  actionLabelError: string | null
  actionUrlError: string | null
  onTitleChange: (value: string) => void
  onMessageChange: (value: string) => void
  onActionTypeChange: (value: DepartmentAnnouncementActionType) => void
  onActionLabelChange: (value: string) => void
  onActionUrlChange: (value: string) => void
  onDeadlineAtChange: (value: string) => void
}

export function DepartmentAnnouncementFormCard({
  title,
  message,
  actionType,
  actionLabel,
  actionUrl,
  deadlineAtLocal,
  deadlineError,
  actionLabelError,
  actionUrlError,
  onTitleChange,
  onMessageChange,
  onActionTypeChange,
  onActionLabelChange,
  onActionUrlChange,
  onDeadlineAtChange,
}: DepartmentAnnouncementFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcement Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Example: Form Project Group"
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Write your announcement message..."
            rows={7}
            maxLength={5000}
            className="resize-y"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="actionType">Action Type *</Label>
            <select
              id="actionType"
              value={actionType}
              onChange={(e) => onActionTypeChange(e.target.value as DepartmentAnnouncementActionType)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {departmentAnnouncementActionTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadlineAt">Deadline (optional)</Label>
            <Input
              id="deadlineAt"
              type="datetime-local"
              value={deadlineAtLocal}
              onChange={(e) => onDeadlineAtChange(e.target.value)}
            />
            {deadlineError ? (
              <p className="text-xs text-destructive">{deadlineError}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="actionLabel">Action Label (optional)</Label>
            <Input
              id="actionLabel"
              value={actionLabel}
              onChange={(e) => onActionLabelChange(e.target.value)}
              placeholder="Example: Form Group"
              maxLength={120}
            />
            {actionLabelError ? (
              <p className="text-xs text-destructive">{actionLabelError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionUrl">Action URL (optional)</Label>
            <Input
              id="actionUrl"
              type="url"
              value={actionUrl}
              onChange={(e) => onActionUrlChange(e.target.value)}
              placeholder="https://example.com/path"
            />
            {actionUrlError ? (
              <p className="text-xs text-destructive">{actionUrlError}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}