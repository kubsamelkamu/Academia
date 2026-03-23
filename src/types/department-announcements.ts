export type DepartmentAnnouncementActionType =
  | "FORM_PROJECT_GROUP"
  | "SUBMIT_PROPOSAL"
  | "UPLOAD_DOCUMENT"
  | "REGISTER_PRESENTATION"
  | "CUSTOM_ACTION"
  | string

export type DepartmentAnnouncementItem = {
  id: string
  departmentId: string
  title: string
  message: string
  actionType: DepartmentAnnouncementActionType
  actionLabel: string | null
  actionUrl: string | null
  deadlineAt: string | null
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

export type DepartmentAnnouncementsListData = {
  items: DepartmentAnnouncementItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export type DepartmentAnnouncementDetails = DepartmentAnnouncementItem

export type CreateDepartmentAnnouncementDto = {
  title: string
  message: string
  actionType: DepartmentAnnouncementActionType
  actionLabel?: string | null
  actionUrl?: string | null
  deadlineAt?: string
}

export type UpdateDepartmentAnnouncementDto = Partial<
  Pick<CreateDepartmentAnnouncementDto, "title" | "message" | "actionType" | "deadlineAt">
> & {
  clearDeadline?: boolean
}

export type DeleteDepartmentAnnouncementResult = {
  id: string
}
