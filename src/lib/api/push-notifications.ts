import apiClient from "@/lib/api/client"
import type {
  PushSubscriptionPayload,
  PushVapidPublicKeyResponse,
} from "@/types/push-notifications"

export async function getPushVapidPublicKey(): Promise<PushVapidPublicKeyResponse> {
  const response = await apiClient.get<PushVapidPublicKeyResponse>("/notifications/push/vapid-public-key")
  return response.data
}

export async function subscribePushNotifications(
  payload: PushSubscriptionPayload
): Promise<{ success: boolean } | void> {
  const response = await apiClient.post<{ success: boolean } | void>(
    "/notifications/push/subscribe",
    payload
  )
  return response.data
}

export async function unsubscribePushNotifications(endpoint?: string): Promise<{ success: boolean } | void> {
  const response = await apiClient.delete<{ success: boolean } | void>(
    "/notifications/push/unsubscribe",
    endpoint
      ? {
          params: { endpoint },
        }
      : undefined
  )
  return response.data
}
