export type AnnouncementPriority = "HIGH" | "MEDIUM" | "LOW"
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
