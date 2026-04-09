export type RecipientMode = 'SINGLE' | 'MULTIPLE' | 'ALL'

export type DeliveryMethod = 'IN_APP' | 'EMAIL' | 'BOTH'

export type CoordinatorAdvisorNotificationPriority = 'INFO' | 'HIGH' | 'CRITICAL'

export type EmailDeliveryStatus = 'QUEUED' | 'ACCEPTED' | 'DELIVERED' | 'FAILED' | 'NOT_REQUESTED' | string

export type InAppDeliveryStatus = 'DELIVERED' | 'PENDING' | 'FAILED' | string

export interface NotificationHistorySummary {
  totalSent: number
  delivered: number
  totalReached: number
  inAppDelivered: number
  emailQueued: number
  emailAccepted: number
  emailDelivered: number
  emailFailed: number
}

export interface CoordinatorAdvisorNotificationHistoryItem {
  campaignId: string
  subject: string
  message?: string | null
  priority: CoordinatorAdvisorNotificationPriority
  deliveryMethod: DeliveryMethod
  recipientMode: RecipientMode
  totalReachedCount: number
  inAppDeliveredCount: number
  emailAcceptedCount: number
  emailDeliveredCount: number
  emailFailedCount: number
  createdAt: string
}

export interface CoordinatorAdvisorNotificationHistoryListParams {
  page?: number
  limit?: number
  deliveryMethod?: DeliveryMethod
  priority?: CoordinatorAdvisorNotificationPriority
  search?: string
}

export interface CoordinatorAdvisorNotificationHistoryListResponse {
  items: CoordinatorAdvisorNotificationHistoryItem[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface NotificationRecipientRow {
  advisorUserId: string
  fullName: string
  email: string
  inAppStatus: InAppDeliveryStatus
  emailStatus: EmailDeliveryStatus
  emailFailureReason: string | null
  readAt: string | null
}

export interface CoordinatorAdvisorNotificationHistoryDetail extends CoordinatorAdvisorNotificationHistoryItem {
  recipients: NotificationRecipientRow[]
}

export interface SendCoordinatorAdvisorNotificationInput {
  recipientMode: RecipientMode
  advisorUserIds?: string[]
  priority: CoordinatorAdvisorNotificationPriority
  deliveryMethod: DeliveryMethod
  subject: string
  message: string
}