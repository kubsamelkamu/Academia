export type MessageDirection = "incoming" | "outgoing"

export type MessageReceiptStatus = "sent" | "delivered" | "read"

export type MessageReadState = "Unread" | "Read"

export interface ChatMessage {
  id: string
  sender: string
  body: string
  at: string
  direction: MessageDirection
  readState?: MessageReadState
  receiptStatus?: MessageReceiptStatus
  readBy?: string[]
  conversationId?: string
  createdAt?: string
}

export interface ListMessagesParams {
  conversationId?: string
  limit?: number
}

export interface ListMessagesResponse {
  messages: ChatMessage[]
  unreadCount: number
  total: number
  typingUsers: string[]
}

export interface SendMessageDto {
  conversationId?: string
  body: string
}
