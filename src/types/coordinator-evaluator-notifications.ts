export type EvaluationStage = 'CAPSTONE_I' | 'CAPSTONE_II'

export type EvaluatorNotificationRecipientMode = 'SINGLE' | 'MULTIPLE' | 'ALL'

export type EvaluatorNotificationDeliveryMethod = 'IN_APP' | 'EMAIL' | 'BOTH'

export type EvaluatorNotificationPriority = 'INFO' | 'HIGH' | 'CRITICAL'

export type InAppStatus = 'NOT_REQUESTED' | 'DELIVERED' | 'FAILED' | string

export type EmailStatus =
  | 'NOT_REQUESTED'
  | 'QUEUED'
  | 'ACCEPTED'
  | 'DELIVERED'
  | 'FAILED'
  | string

export interface EvaluatorRecipientOption {
  evaluatorUserId: string
  fullName: string
  email: string
  avatarUrl: string | null
  assignedProjectsCount: number
  pendingEvaluationsCount: number
  submittedEvaluationsCount: number
}

export interface EvaluatorRecipientListParams {
  stage: EvaluationStage
  page?: number
  limit?: number
  search?: string
}

export interface EvaluatorRecipientListResponse {
  stage: EvaluationStage
  items: EvaluatorRecipientOption[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  summary: {
    totalEligibleEvaluators: number
  }
}

export interface SendCoordinatorEvaluatorNotificationRequest {
  recipientMode: EvaluatorNotificationRecipientMode
  evaluatorUserIds?: string[]
  stage: EvaluationStage
  priority: EvaluatorNotificationPriority
  deliveryMethod: EvaluatorNotificationDeliveryMethod
  subject: string
  message: string
}

export interface SendCoordinatorEvaluatorNotificationResponse {
  campaignId: string
  stage: EvaluationStage
  recipientMode: EvaluatorNotificationRecipientMode
  requestedRecipients: number
  inAppDelivered: number
  emailQueued: number
  emailDelivered: number
  emailFailed: number
  totalReached: number
  createdAt: string
}

export interface EvaluatorNotificationHistorySummary {
  stage: EvaluationStage | null
  totalSent: number
  delivered: number
  totalReached: number
  inAppDelivered: number
  emailQueued: number
  emailAccepted: number
  emailDelivered: number
  emailFailed: number
}

export interface EvaluatorNotificationHistoryListParams {
  page?: number
  limit?: number
  stage?: EvaluationStage
  deliveryMethod?: EvaluatorNotificationDeliveryMethod
  priority?: EvaluatorNotificationPriority
  search?: string
}

export interface CoordinatorEvaluatorNotificationHistoryItem {
  id: string
  stage: EvaluationStage
  subject: string
  message: string | null
  priority: EvaluatorNotificationPriority
  deliveryMethod: EvaluatorNotificationDeliveryMethod
  recipientMode: EvaluatorNotificationRecipientMode
  requestedRecipientsCount: number
  inAppDeliveredCount: number
  inAppFailedCount: number
  emailQueuedCount: number
  emailAcceptedCount: number
  emailDeliveredCount: number
  emailFailedCount: number
  totalReachedCount: number
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  } | null
}

export interface CoordinatorEvaluatorNotificationHistoryListResponse {
  items: CoordinatorEvaluatorNotificationHistoryItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CoordinatorEvaluatorNotificationRecipientItem {
  evaluatorUserId: string
  fullName: string
  email: string
  inAppStatus: InAppStatus
  emailStatus: EmailStatus
  emailFailureReason: string | null
  readAt: string | null
}

export interface CoordinatorEvaluatorNotificationHistoryDetail {
  id: string
  tenantId: string | null
  departmentId: string | null
  createdByUserId: string | null
  stage: EvaluationStage
  recipientMode: EvaluatorNotificationRecipientMode
  deliveryMethod: EvaluatorNotificationDeliveryMethod
  priority: EvaluatorNotificationPriority
  subject: string
  message: string | null
  requestedRecipientsCount: number
  inAppDeliveredCount: number
  inAppFailedCount: number
  emailQueuedCount: number
  emailAcceptedCount: number
  emailDeliveredCount: number
  emailFailedCount: number
  totalReachedCount: number
  createdAt: string
  updatedAt: string | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  } | null
  recipients: CoordinatorEvaluatorNotificationRecipientItem[]
}