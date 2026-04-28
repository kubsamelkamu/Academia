import type {
  ChatMessage,
  ChatMessageAttachment,
  ChatReadState,
  SocketAck,
} from "@/types/chat"

export type DirectChatRoom = {
  roomId: string
  coordinatorUserId: string
  advisorUserId: string
  departmentId: string
}

export type DirectChatMessagesResponse = {
  items: ChatMessage[]
  nextCursor: string | null
  readStates: ChatReadState[]
}

export type DirectChatPin = {
  roomId: string
  messageId: string
  pinnedByUserId: string
  pinnedAt: string
  message?: ChatMessage | null
}

export type DirectChatJoinAckData = {
  roomId: string
  coordinatorUserId: string
  advisorUserId: string
  onlineUserIds: string[]
}

export type DirectMessageSendInput = {
  roomId: string
  text?: string
  replyToMessageId?: string
  attachment?: ChatMessageAttachment | null
}

export type DirectMessageSendResponse = ChatMessage

export type DirectChatPresenceSnapshot = {
  roomId: string
  onlineUserIds: string[]
}

export type DirectChatReadUpToResponse = {
  readUpToMessageId: string
  readAt: string
}

export type DirectChatReactionResponse = {
  roomId: string
  messageId: string
  userId: string
  emoji: string
  reactedAt: string
}

export type DirectChatReactionRemovedResponse = {
  roomId: string
  messageId: string
  userId: string
  removedAt: string
}

export type DirectChatPinMutationResponse = {
  roomId: string
  messageId: string
  pinnedByUserId?: string
  pinnedAt?: string
  unpinnedByUserId?: string
  unpinnedAt?: string
}

export type DirectChatSocketAck<T> = SocketAck<T>

export type AdvisorVisibleCoordinatorItem = {
  userId: string
  firstName: string | null
  lastName: string | null
  email: string
  avatarUrl: string | null
  roleName: "COORDINATOR"
  departmentId?: string | null
  departmentName?: string | null
  isDirectChatEligible: boolean
  existingRoomId?: string | null
}

export type AdvisorVisibleCoordinatorsPagination = {
  limit: number
  nextCursor: string | null
  hasNext: boolean
  total: number
}

export type AdvisorVisibleCoordinatorsResponse = {
  items: AdvisorVisibleCoordinatorItem[]
  pagination: AdvisorVisibleCoordinatorsPagination
}