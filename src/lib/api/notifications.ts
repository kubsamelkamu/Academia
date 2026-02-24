import apiClient from "@/lib/api/client"
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  MarkAllReadResponse,
  MarkOneReadResponse,
  NotificationSummaryResponse,
  NotificationUnreadCountResponse,
} from "@/types/notifications"

export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<ListNotificationsResponse> {
  const response = await apiClient.get<ListNotificationsResponse>("/notifications", {
    params,
  })
  return response.data
}

export async function getUnreadCount(): Promise<NotificationUnreadCountResponse> {
  const response = await apiClient.get<NotificationUnreadCountResponse>("/notifications/unread-count")
  return response.data
}

export async function getNotificationSummary(): Promise<NotificationSummaryResponse> {
  const response = await apiClient.get<NotificationSummaryResponse>("/notifications/summary")
  return response.data
}

export async function markNotificationRead(id: string): Promise<MarkOneReadResponse> {
  const response = await apiClient.patch<MarkOneReadResponse>(`/notifications/${id}/read`)
  return response.data
}

export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  const response = await apiClient.patch<MarkAllReadResponse>("/notifications/mark-all-read")
  return response.data
}
