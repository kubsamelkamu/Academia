"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import {
  getOrCreateDirectChatRoom,
  listAdvisorVisibleCoordinators,
  listDirectChatMessages,
  listDirectChatPins,
} from "@/lib/api/direct-chat"
import type {
  AdvisorVisibleCoordinatorsResponse,
  DirectChatMessagesResponse,
  DirectChatPin,
  DirectChatRoom,
} from "@/types/direct-chat"

export function directChatKeys() {
  return {
    root: ["direct-chat"] as const,
    room: (counterpartUserId: string) =>
      [...directChatKeys().root, "room", counterpartUserId] as const,
    messages: (params: { roomId: string; limit: number; cursor?: string | null }) =>
      [...directChatKeys().root, "rooms", params.roomId, "messages", params] as const,
    messagesInfinite: (params: { roomId: string; limit: number }) =>
      [...directChatKeys().root, "rooms", params.roomId, "messages", "infinite", params] as const,
    pins: (roomId: string) => [...directChatKeys().root, "rooms", roomId, "pins"] as const,
    advisorVisibleCoordinators: (params: { search: string; limit: number }) =>
      [...directChatKeys().root, "advisor-visible-coordinators", params] as const,
  }
}

export function useInfiniteAdvisorVisibleCoordinators(params: {
  enabled: boolean
  search?: string
  limit?: number
}) {
  const search = params.search?.trim() ?? ""
  const limit = params.limit ?? 20

  return useInfiniteQuery<AdvisorVisibleCoordinatorsResponse, Error>({
    queryKey: directChatKeys().advisorVisibleCoordinators({ search, limit }),
    queryFn: ({ pageParam }) =>
      listAdvisorVisibleCoordinators({
        search,
        limit,
        cursor: typeof pageParam === "string" ? pageParam : null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? undefined,
    enabled: params.enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useDirectChatRoom(params: {
  counterpartUserId: string | null
  enabled: boolean
}) {
  const counterpartUserId = params.counterpartUserId?.trim() || null

  return useQuery<DirectChatRoom, Error>({
    queryKey: directChatKeys().room(counterpartUserId ?? ""),
    queryFn: () => {
      if (!counterpartUserId) {
        throw new Error("counterpartUserId is required")
      }

      return getOrCreateDirectChatRoom(counterpartUserId)
    },
    enabled: params.enabled && Boolean(counterpartUserId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useDirectChatMessages(params: {
  roomId: string | null
  enabled: boolean
  limit?: number
  cursor?: string | null
}) {
  const roomId = params.roomId?.trim() || null
  const limit = params.limit ?? 30

  return useQuery<DirectChatMessagesResponse, Error>({
    queryKey: directChatKeys().messages({
      roomId: roomId ?? "",
      limit,
      ...(params.cursor ? { cursor: params.cursor } : null),
    }),
    queryFn: () => {
      if (!roomId) {
        throw new Error("roomId is required")
      }

      return listDirectChatMessages({
        roomId,
        limit,
        cursor: params.cursor,
      })
    },
    enabled: params.enabled && Boolean(roomId),
    staleTime: 5_000,
    retry: false,
  })
}

export function useInfiniteDirectChatMessages(params: {
  roomId: string | null
  enabled: boolean
  limit?: number
}) {
  const roomId = params.roomId?.trim() || null
  const limit = params.limit ?? 30

  return useInfiniteQuery<DirectChatMessagesResponse, Error>({
    queryKey: directChatKeys().messagesInfinite({ roomId: roomId ?? "", limit }),
    queryFn: ({ pageParam }) => {
      if (!roomId) {
        throw new Error("roomId is required")
      }

      return listDirectChatMessages({
        roomId,
        limit,
        cursor: typeof pageParam === "string" ? pageParam : null,
      })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: params.enabled && Boolean(roomId),
    staleTime: 5_000,
    retry: false,
  })
}

export function useDirectChatPins(params: {
  roomId: string | null
  enabled: boolean
}) {
  const roomId = params.roomId?.trim() || null

  return useQuery<DirectChatPin[], Error>({
    queryKey: directChatKeys().pins(roomId ?? ""),
    queryFn: () => {
      if (!roomId) {
        throw new Error("roomId is required")
      }

      return listDirectChatPins({ roomId })
    },
    enabled: params.enabled && Boolean(roomId),
    staleTime: 30_000,
    retry: false,
  })
}