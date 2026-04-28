import apiClient from "@/lib/api/client"
import type {
  AdvisorVisibleCoordinatorsResponse,
  DirectChatMessagesResponse,
  DirectChatPin,
  DirectChatPinMutationResponse,
  DirectChatReactionRemovedResponse,
  DirectChatReactionResponse,
  DirectChatReadUpToResponse,
  DirectChatRoom,
  DirectMessageSendInput,
  DirectMessageSendResponse,
} from "@/types/direct-chat"
import type { UploadChatAttachmentResponse } from "@/types/chat"

function trimRequired(value: string, fieldName: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${fieldName} is required`)
  }

  return trimmed
}

function encodeId(value: string, fieldName: string): string {
  return encodeURIComponent(trimRequired(value, fieldName))
}

export async function listAdvisorVisibleCoordinators(params?: {
  search?: string
  limit?: number
  cursor?: string | null
}): Promise<AdvisorVisibleCoordinatorsResponse> {
  const response = await apiClient.get<AdvisorVisibleCoordinatorsResponse>(
    "/coordinator-advisor-chat/advisors/me/coordinators",
    {
      params: {
        ...(params?.search?.trim() ? { search: params.search.trim() } : null),
        limit: params?.limit ?? 20,
        ...(params?.cursor ? { cursor: params.cursor } : null),
      },
    }
  )

  return response.data
}

export async function getOrCreateDirectChatRoom(counterpartUserId: string): Promise<DirectChatRoom> {
  const response = await apiClient.get<DirectChatRoom>("/coordinator-advisor-chat/room", {
    params: {
      counterpartUserId: trimRequired(counterpartUserId, "counterpartUserId"),
    },
  })

  return response.data
}

export async function listDirectChatMessages(params: {
  roomId: string
  limit?: number
  cursor?: string | null
}): Promise<DirectChatMessagesResponse> {
  const response = await apiClient.get<DirectChatMessagesResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/messages`,
    {
      params: {
        limit: params.limit ?? 30,
        ...(params.cursor ? { cursor: params.cursor } : null),
      },
    }
  )

  return response.data
}

export async function uploadDirectChatAttachment(params: {
  roomId: string
  file: File
}): Promise<UploadChatAttachmentResponse> {
  trimRequired(params.roomId, "roomId")
  if (!params.file) {
    throw new Error("file is required")
  }

  const formData = new FormData()
  formData.append("file", params.file)

  const response = await apiClient.post<UploadChatAttachmentResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function sendDirectChatMessage(params: DirectMessageSendInput): Promise<DirectMessageSendResponse> {
  const roomId = trimRequired(params.roomId, "roomId")
  const text = params.text?.trim() ?? ""
  const replyToMessageId = params.replyToMessageId?.trim() || undefined
  const attachment = params.attachment ?? undefined

  if (!text && !attachment) {
    throw new Error("Either text or attachment is required")
  }

  const response = await apiClient.post<DirectMessageSendResponse>(
    `/direct-chat-rooms/${encodeURIComponent(roomId)}/messages`,
    {
      ...(text ? { text } : null),
      ...(replyToMessageId ? { replyToMessageId } : null),
      ...(attachment ? { attachment } : null),
    }
  )

  return response.data
}

export async function editDirectChatMessage(params: {
  roomId: string
  messageId: string
  text: string
}): Promise<void> {
  await apiClient.patch(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/messages/${encodeId(params.messageId, "messageId")}`,
    {
      text: trimRequired(params.text, "text"),
    }
  )
}

export async function deleteDirectChatMessage(params: {
  roomId: string
  messageId: string
}): Promise<void> {
  await apiClient.delete(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/messages/${encodeId(params.messageId, "messageId")}`
  )
}

export async function markDirectChatReadUpTo(params: {
  roomId: string
  messageId: string
}): Promise<DirectChatReadUpToResponse> {
  const response = await apiClient.post<DirectChatReadUpToResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/read-up-to`,
    {
      messageId: trimRequired(params.messageId, "messageId"),
    }
  )

  return response.data
}

export async function setDirectChatReaction(params: {
  roomId: string
  messageId: string
  emoji: string
}): Promise<DirectChatReactionResponse> {
  const response = await apiClient.post<DirectChatReactionResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/messages/${encodeId(params.messageId, "messageId")}/reaction`,
    {
      emoji: trimRequired(params.emoji, "emoji"),
    }
  )

  return response.data
}

export async function removeDirectChatReaction(params: {
  roomId: string
  messageId: string
}): Promise<DirectChatReactionRemovedResponse> {
  const response = await apiClient.delete<DirectChatReactionRemovedResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/messages/${encodeId(params.messageId, "messageId")}/reaction`
  )

  return response.data
}

export async function listDirectChatPins(params: { roomId: string }): Promise<DirectChatPin[]> {
  const response = await apiClient.get<{ roomId: string; items: DirectChatPin[] }>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/pins`
  )

  return Array.isArray(response.data.items) ? response.data.items : []
}

export async function pinDirectChatMessage(params: {
  roomId: string
  messageId: string
}): Promise<DirectChatPinMutationResponse> {
  const response = await apiClient.post<DirectChatPinMutationResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/pins`,
    {
      messageId: trimRequired(params.messageId, "messageId"),
    }
  )

  return response.data
}

export async function unpinDirectChatMessage(params: {
  roomId: string
  messageId: string
}): Promise<DirectChatPinMutationResponse> {
  const response = await apiClient.delete<DirectChatPinMutationResponse>(
    `/direct-chat-rooms/${encodeId(params.roomId, "roomId")}/pins/${encodeId(params.messageId, "messageId")}`
  )

  return response.data
}