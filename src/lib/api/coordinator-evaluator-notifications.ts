import apiClient from '@/lib/api/client'
import type {
  CoordinatorEvaluatorNotificationHistoryDetail,
  CoordinatorEvaluatorNotificationHistoryItem,
  CoordinatorEvaluatorNotificationHistoryListParams,
  CoordinatorEvaluatorNotificationHistoryListResponse,
  EmailStatus,
  EvaluationStage,
  EvaluatorNotificationDeliveryMethod,
  EvaluatorNotificationHistorySummary,
  EvaluatorNotificationPriority,
  EvaluatorNotificationRecipientMode,
  EvaluatorRecipientListParams,
  EvaluatorRecipientListResponse,
  InAppStatus,
  SendCoordinatorEvaluatorNotificationRequest,
  SendCoordinatorEvaluatorNotificationResponse,
} from '@/types/coordinator-evaluator-notifications'

function cleanParams(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  )
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readStage(value: unknown, fallback: EvaluationStage = 'CAPSTONE_I'): EvaluationStage {
  return value === 'CAPSTONE_II' ? 'CAPSTONE_II' : fallback
}

function normalizeRecipient(payload: unknown) {
  const data = asRecord(payload) ?? {}

  return {
    evaluatorUserId: readString(data.evaluatorUserId || data.id),
    fullName: readString(data.fullName),
    email: readString(data.email),
    avatarUrl: readNullableString(data.avatarUrl),
    assignedProjectsCount: readNumber(data.assignedProjectsCount),
    pendingEvaluationsCount: readNumber(data.pendingEvaluationsCount),
    submittedEvaluationsCount: readNumber(data.submittedEvaluationsCount),
  }
}

function normalizeRecipientsResponse(payload: unknown): EvaluatorRecipientListResponse {
  const root = asRecord(payload) ?? {}
  const data = asRecord(root.data) ?? root
  const pagination = asRecord(data.pagination) ?? {}
  const summary = asRecord(data.summary) ?? {}
  const items = Array.isArray(data.items) ? data.items.map(normalizeRecipient) : []

  return {
    stage: readStage(data.stage),
    items,
    pagination: {
      total: readNumber(pagination.total, items.length),
      page: readNumber(pagination.page, 1),
      limit: readNumber(pagination.limit, items.length || 20),
      pages: readNumber(pagination.pages, 1),
    },
    summary: {
      totalEligibleEvaluators: readNumber(summary.totalEligibleEvaluators, items.length),
    },
  }
}

function normalizeSummary(payload: unknown): EvaluatorNotificationHistorySummary {
  const data = asRecord(payload) ?? {}

  return {
    stage: data.stage ? readStage(data.stage, 'CAPSTONE_I') : null,
    totalSent: readNumber(data.totalSent),
    delivered: readNumber(data.delivered),
    totalReached: readNumber(data.totalReached),
    inAppDelivered: readNumber(data.inAppDelivered),
    emailQueued: readNumber(data.emailQueued),
    emailAccepted: readNumber(data.emailAccepted),
    emailDelivered: readNumber(data.emailDelivered),
    emailFailed: readNumber(data.emailFailed),
  }
}

function normalizeHistoryItem(payload: unknown): CoordinatorEvaluatorNotificationHistoryItem {
  const data = asRecord(payload) ?? {}
  const createdBy = asRecord(data.createdBy)

  return {
    id: readString(data.id || data.campaignId),
    stage: readStage(data.stage),
    subject: readString(data.subject),
    message: readNullableString(data.message),
    priority: readString(data.priority, 'INFO') as EvaluatorNotificationPriority,
    deliveryMethod: readString(data.deliveryMethod, 'IN_APP') as EvaluatorNotificationDeliveryMethod,
    recipientMode: readString(data.recipientMode, 'ALL') as EvaluatorNotificationRecipientMode,
    requestedRecipientsCount: readNumber(data.requestedRecipientsCount),
    inAppDeliveredCount: readNumber(data.inAppDeliveredCount),
    inAppFailedCount: readNumber(data.inAppFailedCount),
    emailQueuedCount: readNumber(data.emailQueuedCount),
    emailAcceptedCount: readNumber(data.emailAcceptedCount),
    emailDeliveredCount: readNumber(data.emailDeliveredCount),
    emailFailedCount: readNumber(data.emailFailedCount),
    totalReachedCount: readNumber(data.totalReachedCount),
    createdAt: readString(data.createdAt),
    createdBy: createdBy
      ? {
          id: readString(createdBy.id),
          firstName: readString(createdBy.firstName),
          lastName: readString(createdBy.lastName),
          avatarUrl: readNullableString(createdBy.avatarUrl),
        }
      : null,
  }
}

function normalizeHistoryList(payload: unknown): CoordinatorEvaluatorNotificationHistoryListResponse {
  if (Array.isArray(payload)) {
    return {
      items: payload.map(normalizeHistoryItem),
      pagination: {
        total: payload.length,
        page: 1,
        limit: payload.length,
        pages: 1,
      },
    }
  }

  const root = asRecord(payload) ?? {}
  const data = asRecord(root.data) ?? root
  const pagination = asRecord(data.pagination) ?? {}
  const items = Array.isArray(data.items) ? data.items.map(normalizeHistoryItem) : []

  return {
    items,
    pagination: {
      total: readNumber(pagination.total, items.length),
      page: readNumber(pagination.page, 1),
      limit: readNumber(pagination.limit, items.length || 10),
      pages: readNumber(pagination.pages, 1),
    },
  }
}

function normalizeDetailRecipient(payload: unknown) {
  const data = asRecord(payload) ?? {}

  return {
    evaluatorUserId: readString(data.evaluatorUserId),
    fullName: readString(data.fullName),
    email: readString(data.email),
    inAppStatus: readString(data.inAppStatus, 'NOT_REQUESTED') as InAppStatus,
    emailStatus: readString(data.emailStatus, 'NOT_REQUESTED') as EmailStatus,
    emailFailureReason: readNullableString(data.emailFailureReason),
    readAt: readNullableString(data.readAt),
  }
}

function normalizeDetail(payload: unknown): CoordinatorEvaluatorNotificationHistoryDetail {
  const data = asRecord(payload) ?? {}
  const createdBy = asRecord(data.createdBy)
  const recipients = Array.isArray(data.recipients)
    ? data.recipients.map(normalizeDetailRecipient)
    : []

  return {
    id: readString(data.id || data.campaignId),
    tenantId: readNullableString(data.tenantId),
    departmentId: readNullableString(data.departmentId),
    createdByUserId: readNullableString(data.createdByUserId),
    stage: readStage(data.stage),
    recipientMode: readString(data.recipientMode, 'ALL') as EvaluatorNotificationRecipientMode,
    deliveryMethod: readString(data.deliveryMethod, 'IN_APP') as EvaluatorNotificationDeliveryMethod,
    priority: readString(data.priority, 'INFO') as EvaluatorNotificationPriority,
    subject: readString(data.subject),
    message: readNullableString(data.message),
    requestedRecipientsCount: readNumber(data.requestedRecipientsCount),
    inAppDeliveredCount: readNumber(data.inAppDeliveredCount),
    inAppFailedCount: readNumber(data.inAppFailedCount),
    emailQueuedCount: readNumber(data.emailQueuedCount),
    emailAcceptedCount: readNumber(data.emailAcceptedCount),
    emailDeliveredCount: readNumber(data.emailDeliveredCount),
    emailFailedCount: readNumber(data.emailFailedCount),
    totalReachedCount: readNumber(data.totalReachedCount),
    createdAt: readString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
    createdBy: createdBy
      ? {
          id: readString(createdBy.id),
          firstName: readString(createdBy.firstName),
          lastName: readString(createdBy.lastName),
          avatarUrl: readNullableString(createdBy.avatarUrl),
        }
      : null,
    recipients,
  }
}

function normalizeSendResponse(payload: unknown): SendCoordinatorEvaluatorNotificationResponse {
  const data = asRecord(payload) ?? {}

  return {
    campaignId: readString(data.campaignId || data.id),
    stage: readStage(data.stage),
    recipientMode: readString(data.recipientMode, 'ALL') as EvaluatorNotificationRecipientMode,
    requestedRecipients: readNumber(data.requestedRecipients),
    inAppDelivered: readNumber(data.inAppDelivered),
    emailQueued: readNumber(data.emailQueued),
    emailDelivered: readNumber(data.emailDelivered),
    emailFailed: readNumber(data.emailFailed),
    totalReached: readNumber(data.totalReached),
    createdAt: readString(data.createdAt),
  }
}

export async function getCoordinatorEvaluatorNotificationRecipients(
  params: EvaluatorRecipientListParams
): Promise<EvaluatorRecipientListResponse> {
  const response = await apiClient.get<unknown>('/coordinator/evaluators/notifications/recipients', {
    params: cleanParams({
      stage: params.stage,
      page: params.page,
      limit: params.limit,
      search: params.search,
    }),
  })

  return normalizeRecipientsResponse(response.data)
}

export async function sendCoordinatorEvaluatorNotification(
  payload: SendCoordinatorEvaluatorNotificationRequest
): Promise<SendCoordinatorEvaluatorNotificationResponse> {
  const response = await apiClient.post<unknown>('/coordinator/evaluators/notifications', payload)
  return normalizeSendResponse(response.data)
}

export async function getCoordinatorEvaluatorNotificationHistorySummary(
  stage?: EvaluationStage
): Promise<EvaluatorNotificationHistorySummary> {
  const response = await apiClient.get<unknown>('/coordinator/evaluators/notifications/history/summary', {
    params: cleanParams({ stage }),
  })

  return normalizeSummary(response.data)
}

export async function getCoordinatorEvaluatorNotificationHistory(
  params: CoordinatorEvaluatorNotificationHistoryListParams = {}
): Promise<CoordinatorEvaluatorNotificationHistoryListResponse> {
  const response = await apiClient.get<unknown>('/coordinator/evaluators/notifications/history', {
    params: cleanParams({
      page: params.page,
      limit: params.limit,
      stage: params.stage,
      deliveryMethod: params.deliveryMethod,
      priority: params.priority,
      search: params.search,
    }),
  })

  return normalizeHistoryList(response.data)
}

export async function getCoordinatorEvaluatorNotificationDetail(
  campaignId: string
): Promise<CoordinatorEvaluatorNotificationHistoryDetail> {
  const response = await apiClient.get<unknown>(`/coordinator/evaluators/notifications/history/${campaignId}`)
  return normalizeDetail(response.data)
}