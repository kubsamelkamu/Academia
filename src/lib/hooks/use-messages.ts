"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { listMessages, sendMessage } from "@/lib/api/messages"
import type {
  ChatMessage,
  ListMessagesParams,
  ListMessagesResponse,
  SendMessageDto,
} from "@/types/messages"

interface UseMessagesListOptions {
  params?: ListMessagesParams
  fallbackData?: ListMessagesResponse
  queryOptions?: Omit<
    UseQueryOptions<ListMessagesResponse, Error, ListMessagesResponse>,
    "queryKey" | "queryFn"
  >
}

export function messagesKeys() {
  return {
    root: ["messages"] as const,
    list: (params: ListMessagesParams) => ["messages", "list", params] as const,
  }
}

export function useMessagesList(options: UseMessagesListOptions = {}) {
  const params = options.params ?? {}

  return useQuery({
    queryKey: messagesKeys().list(params),
    queryFn: async () => {
      try {
        return await listMessages(params)
      } catch (error) {
        if (options.fallbackData) {
          return options.fallbackData
        }
        throw error
      }
    },
    ...options.queryOptions,
  })
}

function optimisticOutgoingMessage(dto: SendMessageDto): ChatMessage {
  return {
    id: `temp-${Date.now()}`,
    sender: "You",
    body: dto.body,
    at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    direction: "outgoing",
    receiptStatus: "sent",
  }
}

export function useSendMessage(params: ListMessagesParams = {}) {
  const queryClient = useQueryClient()
  const key = messagesKeys().list(params)

  return useMutation<ChatMessage, Error, SendMessageDto, { previous?: ListMessagesResponse }>({
    mutationFn: sendMessage,
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ListMessagesResponse>(key)

      if (previous) {
        const optimistic = optimisticOutgoingMessage(dto)
        queryClient.setQueryData<ListMessagesResponse>(key, {
          ...previous,
          total: previous.total + 1,
          messages: [...previous.messages, optimistic],
        })
      }

      return { previous }
    },
    onError: (_error, _dto, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous)
      }
    },
    onSuccess: (saved) => {
      const current = queryClient.getQueryData<ListMessagesResponse>(key)
      if (!current) return

      const withoutTemps = current.messages.filter((item) => !item.id.startsWith("temp-"))
      queryClient.setQueryData<ListMessagesResponse>(key, {
        ...current,
        total: withoutTemps.length + 1,
        messages: [...withoutTemps, saved],
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
