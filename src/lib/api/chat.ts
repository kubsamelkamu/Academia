import apiClient from "@/lib/api/client"

import type {
  ChatPin,
  ChatRoomMe,
  ListChatRoomMessagesResponse,
  UploadChatAttachmentResponse,
} from "@/types/chat"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

export async function getMyProjectGroupChatRoom(): Promise<ChatRoomMe> {
  const response = await apiClient.get<ChatRoomMe>("/project-groups/me/chat-room")
  return response.data
}

export async function listChatRoomMessages(params: {
  roomId: string
  limit?: number
  cursor?: string | null
}): Promise<ListChatRoomMessagesResponse> {
  const roomId = params.roomId.trim()
  if (!roomId) {
    throw new Error("roomId is required")
  }

  const limit = params.limit ?? 30

  const response = await apiClient.get<ListChatRoomMessagesResponse>(
    `/chat-rooms/${encodeURIComponent(roomId)}/messages`,
    {
      params: {
        limit,
        ...(params.cursor ? { cursor: params.cursor } : null),
      },
    }
  )

  return response.data
}

export async function uploadChatRoomAttachment(params: {
  roomId: string
  file: File
}): Promise<UploadChatAttachmentResponse> {
  const roomId = params.roomId.trim()
  if (!roomId) {
    throw new Error("roomId is required")
  }

  const file = params.file
  if (!file) {
    throw new Error("file is required")
  }

  const formData = new FormData()
  formData.append("file", file)

  const response = await apiClient.post<UploadChatAttachmentResponse>(
    `/chat-rooms/${encodeURIComponent(roomId)}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function markChatRoomReadUpTo(params: {
  roomId: string
  messageId: string
}): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()
  if (!roomId) {
    throw new Error("roomId is required")
  }
  if (!messageId) {
    throw new Error("messageId is required")
  }

  await apiClient.post(`/chat-rooms/${encodeURIComponent(roomId)}/read-up-to`, {
    messageId,
  })
}

export async function patchChatRoomMessage(params: {
  roomId: string
  messageId: string
  text: string
}): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()
  const text = params.text.trim()

  if (!roomId) throw new Error("roomId is required")
  if (!messageId) throw new Error("messageId is required")
  if (!text) throw new Error("text is required")

  await apiClient.patch(`/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, {
    text,
  })
}

export async function deleteChatRoomMessage(params: {
  roomId: string
  messageId: string
}): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()

  if (!roomId) throw new Error("roomId is required")
  if (!messageId) throw new Error("messageId is required")

  await apiClient.delete(
    `/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`
  )
}

export async function setChatRoomMessageReaction(params: {
  roomId: string
  messageId: string
  emoji: string
}): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()
  const emoji = params.emoji.trim()

  if (!roomId) throw new Error("roomId is required")
  if (!messageId) throw new Error("messageId is required")
  if (!emoji) throw new Error("emoji is required")

  await apiClient.post(
    `/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/reaction`,
    { emoji }
  )
}

export async function removeChatRoomMessageReaction(params: {
  roomId: string
  messageId: string
}): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()

  if (!roomId) throw new Error("roomId is required")
  if (!messageId) throw new Error("messageId is required")

  await apiClient.delete(
    `/chat-rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/reaction`
  )
}

export async function listChatRoomPins(params: { roomId: string }): Promise<ChatPin[]> {
  const roomId = params.roomId.trim()
  if (!roomId) throw new Error("roomId is required")

  const response = await apiClient.get<unknown>(`/chat-rooms/${encodeURIComponent(roomId)}/pins`)
  const data = response.data

  if (Array.isArray(data)) {
    return data as ChatPin[]
  }

  if (isRecord(data) && Array.isArray(data.items)) {
    return data.items as ChatPin[]
  }

  return []
}

export async function pinChatRoomMessage(params: { roomId: string; messageId: string }): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()

  if (!roomId) throw new Error("roomId is required")
  if (!messageId) throw new Error("messageId is required")

  await apiClient.post(`/chat-rooms/${encodeURIComponent(roomId)}/pins`, {
    messageId,
  })
}

export async function unpinChatRoomMessage(params: { roomId: string; messageId: string }): Promise<void> {
  const roomId = params.roomId.trim()
  const messageId = params.messageId.trim()

  if (!roomId) throw new Error("roomId is required")
  if (!messageId) throw new Error("messageId is required")

  await apiClient.delete(`/chat-rooms/${encodeURIComponent(roomId)}/pins/${encodeURIComponent(messageId)}`)
}
