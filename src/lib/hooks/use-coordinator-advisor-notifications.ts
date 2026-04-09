import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCoordinatorAdvisorNotificationDetail,
  getCoordinatorAdvisorNotificationHistory,
  getCoordinatorAdvisorNotificationHistorySummary,
  sendCoordinatorAdvisorNotification,
} from '@/lib/api/coordinator-advisor-notifications'
import type {
  CoordinatorAdvisorNotificationHistoryDetail,
  CoordinatorAdvisorNotificationHistoryListParams,
  CoordinatorAdvisorNotificationHistoryListResponse,
  NotificationHistorySummary,
  SendCoordinatorAdvisorNotificationInput,
} from '@/types/coordinator-advisor-notifications'

export function coordinatorAdvisorNotificationsKeys() {
  return {
    root: ['coordinator-advisor-notifications'] as const,
    summary: () => [...coordinatorAdvisorNotificationsKeys().root, 'summary'] as const,
    history: (params: CoordinatorAdvisorNotificationHistoryListParams) =>
      [
        ...coordinatorAdvisorNotificationsKeys().root,
        'history',
        params.page ?? 1,
        params.limit ?? 10,
        params.deliveryMethod ?? '',
        params.priority ?? '',
        params.search ?? '',
      ] as const,
    detail: (campaignId: string) => [...coordinatorAdvisorNotificationsKeys().root, 'detail', campaignId] as const,
  }
}

export function useCoordinatorAdvisorNotificationHistorySummary(enabled = true) {
  return useQuery<NotificationHistorySummary, Error>({
    queryKey: coordinatorAdvisorNotificationsKeys().summary(),
    queryFn: getCoordinatorAdvisorNotificationHistorySummary,
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorAdvisorNotificationHistory(
  params: CoordinatorAdvisorNotificationHistoryListParams,
  enabled = true
) {
  return useQuery<CoordinatorAdvisorNotificationHistoryListResponse, Error>({
    queryKey: coordinatorAdvisorNotificationsKeys().history(params),
    queryFn: () => getCoordinatorAdvisorNotificationHistory(params),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorAdvisorNotificationDetail(
  campaignId?: string,
  enabled = true,
  refetchInterval: number | false = false
) {
  return useQuery<CoordinatorAdvisorNotificationHistoryDetail, Error>({
    queryKey: coordinatorAdvisorNotificationsKeys().detail(campaignId ?? ''),
    queryFn: () => getCoordinatorAdvisorNotificationDetail(campaignId as string),
    enabled: enabled && Boolean(campaignId),
    refetchInterval,
    staleTime: 10_000,
    retry: false,
  })
}

export function useSendCoordinatorAdvisorNotification() {
  const queryClient = useQueryClient()

  return useMutation<{ campaignId: string }, Error, SendCoordinatorAdvisorNotificationInput>({
    mutationFn: sendCoordinatorAdvisorNotification,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: coordinatorAdvisorNotificationsKeys().summary() }),
        queryClient.invalidateQueries({ queryKey: coordinatorAdvisorNotificationsKeys().root }),
      ])
    },
  })
}