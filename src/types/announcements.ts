export type AnnouncementPriority = "HIGH" | "MEDIUM" | "LOW"
export type AnnouncementStatus = "published" | "draft"
export type AttachmentType = "NONE" | "FILE" | "LINK"
export type AttachmentResourceType = "image" | "raw"

export type CreateMyGroupAnnouncementDto = {
  title: string
  priority: AnnouncementPriority
  message: string
  attachment?: File
  attachmentUrl?: string
}

export type UpdateMyGroupAnnouncementDto = {
  title?: string
  priority?: AnnouncementPriority
  message?: string

  attachment?: File
  attachmentUrl?: string
  removeAttachment?: boolean
}

export type AnnouncementItem = {
  id: string
  projectGroupId: string
  title: string
  priority: AnnouncementPriority
  message: string

  attachmentType: AttachmentType
  attachmentUrl: string | null
  attachmentFileName: string | null
  attachmentMimeType: string | null
  attachmentSizeBytes: number | null

  // Deadline / countdown fields (present on student endpoint responses)
  deadlineAt: string | null
  disableAfterDeadline: boolean
  isExpired: boolean
  isDisabled: boolean
  secondsRemaining: number | null

  createdAt: string
  updatedAt: string

  createdBy: {
    id: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
}

export type AnnouncementDetails = AnnouncementItem & {
  tenantId: string
  departmentId: string
  createdByUserId: string

  attachmentPublicId: string | null
  attachmentResourceType: AttachmentResourceType | null
}

export type ListAnnouncementsData = {
  items: AnnouncementItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export type DeleteAnnouncementResult = {
  deleted: boolean
}

// ── Advisor-scoped announcement types ────────────────────────────────────────

export type AdvisorAnnouncementItem = {
  id: string
  title: string
  priority: AnnouncementPriority
  message: string
  attachmentType: AttachmentType
  attachmentUrl: string | null
  deadlineAt: string | null
  disableAfterDeadline: boolean
  isExpired: boolean
  isDisabled: boolean
  secondsRemaining: number | null
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
}

export type CreateAdvisorAnnouncementDto = {
  projectId: string
  title: string
  priority: AnnouncementPriority
  message: string
  attachmentUrl?: string
  deadlineAt?: string
  disableAfterDeadline?: boolean
}

export type UpdateAdvisorAnnouncementDto = {
  title?: string
  priority?: AnnouncementPriority
  message?: string
  attachmentUrl?: string
  removeAttachment?: boolean
  deadlineAt?: string
  disableAfterDeadline?: boolean
}

export type ListAdvisorAnnouncementsData = {
  items: AdvisorAnnouncementItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}
