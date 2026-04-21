import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCoordinatorEvaluatorNotificationDetail,
  getCoordinatorEvaluatorNotificationHistory,
  getCoordinatorEvaluatorNotificationHistorySummary,
  getCoordinatorEvaluatorNotificationRecipients,
  sendCoordinatorEvaluatorNotification,
} from '@/lib/api/coordinator-evaluator-notifications'
import type {
  CoordinatorEvaluatorNotificationHistoryDetail,
  CoordinatorEvaluatorNotificationHistoryListParams,
  CoordinatorEvaluatorNotificationHistoryListResponse,
  EvaluationStage,
  EvaluatorNotificationHistorySummary,
  EvaluatorRecipientListParams,
  EvaluatorRecipientListResponse,
  SendCoordinatorEvaluatorNotificationRequest,
  SendCoordinatorEvaluatorNotificationResponse,
} from '@/types/coordinator-evaluator-notifications'

export function coordinatorEvaluatorNotificationsKeys() {
  return {
    root: ['coordinator-evaluator-notifications'] as const,
    recipients: (params: EvaluatorRecipientListParams) =>
      [
        ...coordinatorEvaluatorNotificationsKeys().root,
        'recipients',
        params.stage,
        params.page ?? 1,
        params.limit ?? 20,
        params.search ?? '',
      ] as const,
    summary: (stage?: EvaluationStage) =>
      [...coordinatorEvaluatorNotificationsKeys().root, 'summary', stage ?? 'ALL_STAGES'] as const,
    history: (params: CoordinatorEvaluatorNotificationHistoryListParams) =>
      [
        ...coordinatorEvaluatorNotificationsKeys().root,
        'history',
        params.page ?? 1,
        params.limit ?? 10,
        params.stage ?? 'ALL_STAGES',
        params.deliveryMethod ?? '',
        params.priority ?? '',
        params.search ?? '',
      ] as const,
    detail: (campaignId: string) =>
      [...coordinatorEvaluatorNotificationsKeys().root, 'detail', campaignId] as const,
  }
}

export function useCoordinatorEvaluatorNotificationRecipients(
  params: EvaluatorRecipientListParams,
  enabled = true
) {
  return useQuery<EvaluatorRecipientListResponse, Error>({
    queryKey: coordinatorEvaluatorNotificationsKeys().recipients(params),
    queryFn: () => getCoordinatorEvaluatorNotificationRecipients(params),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorEvaluatorNotificationHistorySummary(
  stage?: EvaluationStage,
  enabled = true
) {
  return useQuery<EvaluatorNotificationHistorySummary, Error>({
    queryKey: coordinatorEvaluatorNotificationsKeys().summary(stage),
    queryFn: () => getCoordinatorEvaluatorNotificationHistorySummary(stage),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorEvaluatorNotificationHistory(
  params: CoordinatorEvaluatorNotificationHistoryListParams,
  enabled = true
) {
  return useQuery<CoordinatorEvaluatorNotificationHistoryListResponse, Error>({
    queryKey: coordinatorEvaluatorNotificationsKeys().history(params),
    queryFn: () => getCoordinatorEvaluatorNotificationHistory(params),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCoordinatorEvaluatorNotificationDetail(
  campaignId?: string,
  enabled = true,
  refetchInterval: number | false = false
) {
  return useQuery<CoordinatorEvaluatorNotificationHistoryDetail, Error>({
    queryKey: coordinatorEvaluatorNotificationsKeys().detail(campaignId ?? ''),
    queryFn: () => getCoordinatorEvaluatorNotificationDetail(campaignId as string),
    enabled: enabled && Boolean(campaignId),
    refetchInterval,
    staleTime: 10_000,
    retry: false,
  })
}

export function useSendCoordinatorEvaluatorNotification() {
  const queryClient = useQueryClient()

  return useMutation<
    SendCoordinatorEvaluatorNotificationResponse,
    Error,
    SendCoordinatorEvaluatorNotificationRequest
  >({
    mutationFn: sendCoordinatorEvaluatorNotification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: coordinatorEvaluatorNotificationsKeys().root,
      })
    },
  })
}