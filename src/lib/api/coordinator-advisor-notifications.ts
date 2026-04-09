import apiClient from '@/lib/api/client'
import type {
  CoordinatorAdvisorNotificationHistoryDetail,
  CoordinatorAdvisorNotificationHistoryItem,
  CoordinatorAdvisorNotificationHistoryListParams,
  CoordinatorAdvisorNotificationHistoryListResponse,
  DeliveryMethod,
  NotificationHistorySummary,
  RecipientMode,
  SendCoordinatorAdvisorNotificationInput,
} from '@/types/coordinator-advisor-notifications'

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

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeSummary(payload: unknown): NotificationHistorySummary {
  const data = asRecord(payload) ?? {}

  return {
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

function normalizeHistoryItem(payload: unknown): CoordinatorAdvisorNotificationHistoryItem {
  const data = asRecord(payload) ?? {}

  return {
    campaignId: readString(data.campaignId || data.id),
    subject: readString(data.subject),
    message: readNullableString(data.message),
    priority: readString(data.priority, 'INFO') as CoordinatorAdvisorNotificationHistoryItem['priority'],
    deliveryMethod: readString(data.deliveryMethod, 'IN_APP') as DeliveryMethod,
    recipientMode: readString(data.recipientMode, 'ALL') as RecipientMode,
    totalReachedCount: readNumber(data.totalReachedCount),
    inAppDeliveredCount: readNumber(data.inAppDeliveredCount),
    emailAcceptedCount: readNumber(data.emailAcceptedCount),
    emailDeliveredCount: readNumber(data.emailDeliveredCount),
    emailFailedCount: readNumber(data.emailFailedCount),
    createdAt: readString(data.createdAt),
  }
}

function normalizeHistoryList(payload: unknown): CoordinatorAdvisorNotificationHistoryListResponse {
  if (Array.isArray(payload)) {
    return {
      items: payload.map(normalizeHistoryItem),
      pagination: {
        page: 1,
        limit: payload.length,
        totalItems: payload.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
  }

  const root = asRecord(payload) ?? {}
  const nested = asRecord(root.data) ?? root

  const rawItems =
    nested.items ??
    nested.campaigns ??
    nested.history ??
    nested.rows ??
    []

  const rawPagination =
    asRecord(nested.pagination) ??
    asRecord(nested.pageInfo) ??
    {}

  const items = Array.isArray(rawItems) ? rawItems.map(normalizeHistoryItem) : []

  const totalItemsFallback = readNumber(rawPagination.totalItems, readNumber(rawPagination.total, readNumber(rawPagination.totalCount, items.length)))
  const totalPagesFallback = readNumber(rawPagination.totalPages, readNumber(rawPagination.pages, readNumber(rawPagination.pageCount, items.length > 0 ? 1 : 0)))

  return {
    items,
    pagination: {
      page: readNumber(rawPagination.page, 1),
      limit: readNumber(rawPagination.limit, items.length || 10),
      totalItems: totalItemsFallback,
      totalPages: totalPagesFallback,
      hasNextPage: readBoolean(rawPagination.hasNextPage, readBoolean(rawPagination.nextPage)),
      hasPreviousPage: readBoolean(rawPagination.hasPreviousPage, readBoolean(rawPagination.prevPage)),
    },
  }
}

function normalizeSendResponse(payload: unknown): { campaignId: string } {
  const data = asRecord(payload) ?? {}
  const nestedCampaign = asRecord(data.campaign)

  const campaignId =
    readString(data.campaignId) ||
    readString(data.id) ||
    readString(nestedCampaign?.id) ||
    readString(nestedCampaign?.campaignId)

  return { campaignId }
}

export async function getCoordinatorAdvisorNotificationHistorySummary(): Promise<NotificationHistorySummary> {
  const response = await apiClient.get<unknown>('/coordinator/advisors/notifications/history/summary')
  return normalizeSummary(response.data)
}

export async function getCoordinatorAdvisorNotificationHistory(
  params: CoordinatorAdvisorNotificationHistoryListParams = {}
): Promise<CoordinatorAdvisorNotificationHistoryListResponse> {
  const response = await apiClient.get<unknown>('/coordinator/advisors/notifications/history', {
    params: cleanParams({
      page: params.page,
      limit: params.limit,
      deliveryMethod: params.deliveryMethod,
      priority: params.priority,
      search: params.search,
    }),
  })

  return normalizeHistoryList(response.data)
}

export async function getCoordinatorAdvisorNotificationDetail(
  campaignId: string
): Promise<CoordinatorAdvisorNotificationHistoryDetail> {
  const response = await apiClient.get<CoordinatorAdvisorNotificationHistoryDetail>(
    `/coordinator/advisors/notifications/history/${campaignId}`
  )
  return response.data
}

export async function sendCoordinatorAdvisorNotification(
  payload: SendCoordinatorAdvisorNotificationInput
): Promise<{ campaignId: string }> {
  const response = await apiClient.post<unknown>(
    '/coordinator/advisors/notifications',
    payload
  )
  return normalizeSendResponse(response.data)
}