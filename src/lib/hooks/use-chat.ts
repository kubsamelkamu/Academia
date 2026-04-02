"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { getAdvisorProjectGroupChatRoom, getMyProjectGroupChatRoom, listChatRoomMessages, listChatRoomPins } from "@/lib/api/chat"
import type { ChatPin, ChatRoomMe, ListChatRoomMessagesResponse } from "@/types/chat"

export function chatKeys() {
  return {
    root: ["chat"] as const,
    roomMe: () => [...chatKeys().root, "room", "me"] as const,
    advisorRoomMe: (projectId: string) => [...chatKeys().root, "advisor-room", projectId] as const,
    roomMessages: (params: { roomId: string; limit: number; cursor?: string | null }) =>
      [...chatKeys().root, "rooms", params.roomId, "messages", params] as const,
    roomMessagesInfinite: (params: { roomId: string; limit: number }) =>
      [...chatKeys().root, "rooms", params.roomId, "messages", "infinite", params] as const,
    roomPins: (params: { roomId: string }) => [...chatKeys().root, "rooms", params.roomId, "pins"] as const,
  }
}

export function useMyChatRoom(params: { enabled: boolean }) {
  return useQuery<ChatRoomMe, Error>({
    queryKey: chatKeys().roomMe(),
    queryFn: () => getMyProjectGroupChatRoom(),
    enabled: params.enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAdvisorChatRoom(params: { projectId: string | null; enabled: boolean }) {
  const projectId = params.projectId?.trim() ? params.projectId.trim() : null

  return useQuery<ChatRoomMe, Error>({
    queryKey: chatKeys().advisorRoomMe(projectId ?? ""),
    queryFn: () => {
      if (!projectId) throw new Error("projectId is required")
      return getAdvisorProjectGroupChatRoom(projectId)
    },
    enabled: params.enabled && Boolean(projectId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useChatRoomMessages(params: { enabled: boolean; roomId: string | null; limit?: number; cursor?: string | null }) {
  const roomId = params.roomId?.trim() ? params.roomId.trim() : null
  const limit = params.limit ?? 30

  return useQuery<ListChatRoomMessagesResponse, Error>({
    queryKey: chatKeys().roomMessages({
      roomId: roomId ?? "",
      limit,
      ...(params.cursor ? { cursor: params.cursor } : null),
    }),
    queryFn: () => {
      if (!roomId) throw new Error("roomId is required")
      return listChatRoomMessages({
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

export function useInfiniteChatRoomMessages(params: { enabled: boolean; roomId: string | null; limit?: number }) {
  const roomId = params.roomId?.trim() ? params.roomId.trim() : null
  const limit = params.limit ?? 30

  return useInfiniteQuery<ListChatRoomMessagesResponse, Error>({
    queryKey: chatKeys().roomMessagesInfinite({ roomId: roomId ?? "", limit }),
    queryFn: ({ pageParam }) => {
      if (!roomId) throw new Error("roomId is required")
      return listChatRoomMessages({
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

export function useChatRoomPins(params: { enabled: boolean; roomId: string | null }) {
  const roomId = params.roomId?.trim() ? params.roomId.trim() : null

  return useQuery<ChatPin[], Error>({
    queryKey: chatKeys().roomPins({ roomId: roomId ?? "" }),
    queryFn: () => {
      if (!roomId) throw new Error("roomId is required")
      return listChatRoomPins({ roomId })
    },
    enabled: params.enabled && Boolean(roomId),
    staleTime: 30_000,
    retry: false,
  })
}
