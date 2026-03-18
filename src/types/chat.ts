export type ChatRoomMe = {
  roomId: string
  projectGroupId: string
}

export type ChatMessageAttachment = {
  url: string
  publicId: string
  resourceType: string
  name: string
  mimeType: string
  size: number
}

export type ChatMessageSender = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export type ChatMessageReactionSummary = {
  emoji: string
  count: number
}

export type ChatMessageReactions = {
  items: ChatMessageReactionSummary[]
  myReaction: string | null
}

export type ChatMessage = {
  id: string
  roomId: string
  senderUserId: string
  sender: ChatMessageSender
  replyToMessageId: string | null
  replyTo: ChatMessage | null
  text: string
  attachment: ChatMessageAttachment | null
  createdAt: string
  editedAt: string | null
  isPinned: boolean
  reactions: ChatMessageReactions
}

export type ChatReadState = {
  userId: string
  lastReadMessageId: string
  readAt: string
}

export type ListChatRoomMessagesResponse = {
  items: ChatMessage[]
  nextCursor: string | null
  readStates: ChatReadState[]
}

export type UploadChatAttachmentResponse = ChatMessageAttachment

export type SocketOk<T> = {
  ok: true
  data: T
}

export type SocketError = {
  ok: false
  error: {
    code: string
    message: string
  }
}

export type SocketAck<T> = SocketOk<T> | SocketError

export type ChatJoinAckData = {
  roomId: string
  projectGroupId: string
  onlineUserIds: string[]
}

export type PresenceUpdatePayload = {
  roomId: string
  onlineUserIds: string[]
}

export type MessageNewPayload = {
  roomId: string
  clientMessageId?: string
  message: ChatMessage
  deliveredAt: string
}

export type MessageSendAckData = {
  roomId: string
  clientMessageId?: string
  message: ChatMessage
  deliveredAt: string
}

export type MessageReadUpToPayload = {
  roomId: string
  userId: string
  readUpToMessageId: string
  readAt: string
}

export type MessageEditedPayload = {
  roomId: string
  messageId: string
  message: {
    id: string
    editedAt: string | null
    text?: string
  }
}

export type MessageDeletedPayload = {
  roomId: string
  messageId: string
}

export type TypingUpdatePayload = {
  roomId: string
  userId: string
  isTyping: boolean
  at: string
}

export type ReactionUpdatedPayload = {
  roomId: string
  messageId: string
  userId: string
  emoji: string
  reactedAt: string
}

export type ReactionRemovedPayload = {
  roomId: string
  messageId: string
  userId: string
  removedAt: string
}

export type ChatPin = {
  roomId: string
  messageId: string
  pinnedByUserId: string
  pinnedAt: string
}

export type PinAddedPayload = {
  roomId: string
  messageId: string
  pinnedByUserId: string
  pinnedAt: string
}

export type PinRemovedPayload = {
  roomId: string
  messageId: string
  unpinnedByUserId: string
  unpinnedAt: string
}

export type CallStartEmitPayload = {
  roomId: string
  projectGroupId: string
  at: string
}

export type CallJoinEmitPayload = {
  roomId: string
  projectGroupId: string
  at: string
}

export type CallLeaveEmitPayload = {
  roomId: string
  projectGroupId: string
  at: string
}

export type CallEndEmitPayload = {
  roomId: string
  projectGroupId: string
  at: string
}

export type CallStartedPayload = {
  roomId: string
  startedByUserId: string
  startedAt: string
  participantCount: number
}

export type CallParticipantChangedPayload = {
  roomId: string
  participantCount: number
}

export type CallEndedPayload = {
  roomId: string
  endedByUserId: string
  endedAt: string
}
