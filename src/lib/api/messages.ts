import apiClient from "@/lib/api/client"
import type {
  ChatMessage,
  ListMessagesParams,
  ListMessagesResponse,
  SendMessageDto,
} from "@/types/messages"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toDirection(value: unknown): ChatMessage["direction"] {
  return value === "outgoing" ? "outgoing" : "incoming"
}

function toReadState(value: unknown): ChatMessage["readState"] {
  return value === "Unread" ? "Unread" : "Read"
}

function toReceiptStatus(value: unknown): ChatMessage["receiptStatus"] {
  if (value === "read" || value === "delivered" || value === "sent") {
    return value
  }
  return undefined
}

function normalizeMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) {
    return null
  }

  const id = String(value.id ?? "")
  const body = String(value.body ?? value.message ?? "")

  if (!id || !body) {
    return null
  }

  const sender = String(value.sender ?? value.senderName ?? "Unknown")
  const at = String(value.at ?? value.time ?? "")
  const readByRaw = Array.isArray(value.readBy) ? value.readBy : []

  return {
    id,
    sender,
    body,
    at,
    direction: toDirection(value.direction),
    readState: toReadState(value.readState),
    receiptStatus: toReceiptStatus(value.receiptStatus),
    readBy: readByRaw.map((entry) => String(entry)),
    conversationId: typeof value.conversationId === "string" ? value.conversationId : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
  }
}

function normalizeListPayload(payload: unknown): ListMessagesResponse {
  if (!isRecord(payload)) {
    return { messages: [], unreadCount: 0, total: 0, typingUsers: [] }
  }

  const messagesRaw = Array.isArray(payload.messages)
    ? payload.messages
    : Array.isArray(payload.items)
      ? payload.items
      : []

  const messages = messagesRaw
    .map((item) => normalizeMessage(item))
    .filter((item): item is ChatMessage => item !== null)

  const unreadCount = typeof payload.unreadCount === "number" ? payload.unreadCount : 0
  const total = typeof payload.total === "number" ? payload.total : messages.length
  const typingUsers = Array.isArray(payload.typingUsers)
    ? payload.typingUsers.map((entry) => String(entry))
    : []

  return {
    messages,
    unreadCount,
    total,
    typingUsers,
  }
}

export async function listMessages(params: ListMessagesParams = {}): Promise<ListMessagesResponse> {
  const response = await apiClient.get<unknown>("/messages", { params })
  return normalizeListPayload(response.data)
}

export async function sendMessage(dto: SendMessageDto): Promise<ChatMessage> {
  const response = await apiClient.post<unknown>("/messages", dto)
  const normalized = normalizeMessage(response.data)

  if (!normalized) {
    throw new Error("Invalid message payload from server")
  }

  return normalized
}
