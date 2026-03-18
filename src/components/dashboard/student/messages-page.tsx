"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Send, 
  Phone, 
  Video, 
  Bell, 
  Users, 
  MessageSquare,
  Search,
  Paperclip,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  UserRound,
  Plus
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useQueryClient } from "@tanstack/react-query"
import { useMyGroupLeaderRequest } from "@/lib/hooks/use-group-leader-requests"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import {
  useCreateMyGroupAnnouncement,
  useDeleteMyGroupAnnouncement,
  useMyGroupAnnouncements,
  useUpdateMyGroupAnnouncement,
} from "@/lib/hooks/use-project-groups"
import {
  deleteChatRoomMessage,
  markChatRoomReadUpTo,
  patchChatRoomMessage,
  removeChatRoomMessageReaction,
  setChatRoomMessageReaction,
  uploadChatRoomAttachment,
} from "@/lib/api/chat"
import { chatKeys, useInfiniteChatRoomMessages, useMyChatRoom } from "@/lib/hooks/use-chat"
import { acquireChatSocket, releaseChatSocket } from "@/lib/realtime/chat-socket"
import {
  loadJitsiExternalApi,
  type JitsiApiOptions,
  type JitsiCallPhase,
  type JitsiExternalApi,
} from "@/lib/realtime/jitsi-loader"
import {
  announcementIdSchema,
  createMyGroupAnnouncementSchema,
  updateMyGroupAnnouncementSchema,
} from "@/validations/announcements"
import type {
  CallEndedPayload,
  CallEndEmitPayload,
  CallJoinEmitPayload,
  CallLeaveEmitPayload,
  CallParticipantChangedPayload,
  CallStartedPayload,
  CallStartEmitPayload,
  ChatMessageAttachment,
  ChatMessage,
  ListChatRoomMessagesResponse,
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageNewPayload,
  MessageReadUpToPayload,
  MessageSendAckData,
  PresenceUpdatePayload,
  ReactionRemovedPayload,
  ReactionUpdatedPayload,
  TypingUpdatePayload,
  SocketAck,
} from "@/types/chat"

type MessageStatus = 'sent' | 'delivered' | 'read'
type UserStatus = 'online' | 'away' | 'offline'

type MessageReactions = {
  items: { emoji: string; count: number }[]
  myReaction: string | null
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  status: MessageStatus
  reactions?: MessageReactions
  readBy?: string[]
  replyTo?: {
    messageId: string
    senderName: string
    content: string
  } | null
  attachments?: {
    name: string
    sizeBytes: number
    url: string
    mimeType?: string
  }[]
}

interface Conversation {
  id: string
  name: string
  type: 'group' | 'manager' | 'member'
  avatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status?: UserStatus
  participants?: {
    id: string
    name: string
    status: UserStatus
  }[]
}

interface Announcement {
  id: string
  title: string
  content: string
  date: string
  author: string
  priority: 'high' | 'medium' | 'low'

  attachmentType?: "NONE" | "FILE" | "LINK"
  attachmentUrl?: string | null
  attachmentFileName?: string | null
}

export function StudentMessagesPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const tenantDomain = useAuthStore((s) => s.tenantDomain)
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const groupLeaderMeQuery = useMyGroupLeaderRequest(Boolean(accessToken))
  const isApprovedGroupManager = groupLeaderMeQuery.data?.status === "APPROVED"

  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken))
  const myChatRoomQuery = useMyChatRoom({ enabled: Boolean(accessToken) })

  const roomId = myChatRoomQuery.data?.roomId ?? null
  const projectGroupId = myChatRoomQuery.data?.projectGroupId ?? null

  const chatMessagesQuery = useInfiniteChatRoomMessages({
    enabled: Boolean(accessToken) && Boolean(roomId),
    roomId,
    limit: 30,
  })

  const {
    data: chatMessagesData,
    hasNextPage: chatHasNextPage,
    isFetchingNextPage: chatIsFetchingNextPage,
    fetchNextPage: chatFetchNextPage,
  } = chatMessagesQuery

  const latestMessage = chatMessagesData?.pages?.[0]?.items?.[0] ?? null
  const latestMessageId = latestMessage && roomId && latestMessage.roomId === roomId ? latestMessage.id : null

  const latestMyMessageId = useMemo(() => {
    const currentUserId = currentUser?.id
    if (!currentUserId) return null
    const itemsNewestFirst = chatMessagesData?.pages?.flatMap((p) => p.items) ?? []
    const mine = itemsNewestFirst.find((m) => m.senderUserId === currentUserId) ?? null
    return mine?.id ?? null
  }, [chatMessagesData, currentUser?.id])

  const pendingTopPaginationScrollRef = useRef<{ prevScrollHeight: number; prevScrollTop: number } | null>(null)
  const autoFillRoomIdRef = useRef<string | null>(null)
  const autoFillAttemptsRef = useRef(0)

  const findMessageInCache = useCallback((messageId: string): ChatMessage | null => {
    const pages = chatMessagesData?.pages ?? []
    for (const page of pages) {
      const hit = page.items.find((m) => m.id === messageId)
      if (hit) return hit
    }
    return null
  }, [chatMessagesData])

  const emitSocketWithTimeoutAck = useCallback(<T,>(params: {
    socket: { emit: (event: string, payload: unknown, cb?: (ack: SocketAck<T>) => void) => void }
    event: string
    payload: unknown
    timeoutMs?: number
  }): Promise<SocketAck<T> | null> => {
    return new Promise((resolve) => {
      let settled = false
      const timeout = setTimeout(() => {
        if (settled) return
        settled = true
        resolve(null)
      }, params.timeoutMs ?? 1500)

      params.socket.emit(params.event, params.payload, (ack: SocketAck<T>) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        resolve(ack)
      })
    })
  }, [])

  const updateInfiniteMessagesCache = useCallback((updater: (page: ListChatRoomMessagesResponse) => ListChatRoomMessagesResponse) => {
    if (!roomId) return

    queryClient.setQueryData(
      chatKeys().roomMessagesInfinite({ roomId, limit: 30 }),
      (previous: { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] } | undefined) => {
        if (!previous) return previous
        return {
          ...previous,
          pages: previous.pages.map(updater),
        }
      }
    )
  }, [queryClient, roomId])

  const updateInfiniteMessageById = useCallback((params: {
    messageId: string
    update: (message: ChatMessage) => ChatMessage
  }) => {
    updateInfiniteMessagesCache((page) => {
      const idx = page.items.findIndex((m) => m.id === params.messageId)
      if (idx < 0) return page
      const nextItems = [...page.items]
      nextItems[idx] = params.update(nextItems[idx]!)
      return { ...page, items: nextItems }
    })
  }, [updateInfiniteMessagesCache])

  const upsertOptimisticMessageInCache = useCallback((params: {
    roomId: string
    message: ChatMessage & { __optimistic?: true }
    limit: number
  }) => {
    queryClient.setQueryData(
      chatKeys().roomMessagesInfinite({ roomId: params.roomId, limit: params.limit }),
      (previous: { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] } | undefined) => {
        const basePage: ListChatRoomMessagesResponse =
          previous?.pages?.[0] ?? { items: [], nextCursor: null, readStates: [] }

        const nextItems = [params.message, ...basePage.items]
          .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
          .slice(0, params.limit)

        const nextFirstPage: ListChatRoomMessagesResponse = {
          ...basePage,
          items: nextItems,
        }

        if (!previous) {
          return {
            pages: [nextFirstPage],
            pageParams: [null],
          }
        }

        return {
          ...previous,
          pages: [nextFirstPage, ...previous.pages.slice(1)],
        }
      }
    )
  }, [queryClient])

  const reconcileClientMessageIdInCache = useCallback((params: {
    roomId: string
    clientMessageId?: string
    canonicalMessage: ChatMessage
    limit: number
  }) => {
    queryClient.setQueryData(
      chatKeys().roomMessagesInfinite({ roomId: params.roomId, limit: params.limit }),
      (previous: { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] } | undefined) => {
        const basePage: ListChatRoomMessagesResponse =
          previous?.pages?.[0] ?? { items: [], nextCursor: null, readStates: [] }

        const withoutOptimistic = params.clientMessageId
          ? basePage.items.filter((m) => m.id !== params.clientMessageId)
          : basePage.items

        const withoutCanonicalDup = withoutOptimistic.filter(
          (m) => m.id !== params.canonicalMessage.id
        )

        const nextFirstPage: ListChatRoomMessagesResponse = {
          ...basePage,
          items: [params.canonicalMessage, ...withoutCanonicalDup].slice(0, params.limit),
        }

        if (!previous) {
          return {
            pages: [nextFirstPage],
            pageParams: [null],
          }
        }

        return {
          ...previous,
          pages: [nextFirstPage, ...previous.pages.slice(1)],
        }
      }
    )
  }, [queryClient])

  const invalidateRoomMessages = useCallback(() => {
    if (!roomId) return
    queryClient.invalidateQueries({ queryKey: chatKeys().roomMessagesInfinite({ roomId, limit: 30 }) })
  }, [queryClient, roomId])

  const [announcementsPage, setAnnouncementsPage] = useState(1)
  const ANNOUNCEMENTS_PAGE_SIZE = 10

  const announcementsQuery = useMyGroupAnnouncements({
    enabled: Boolean(accessToken),
    page: announcementsPage,
    limit: ANNOUNCEMENTS_PAGE_SIZE,
  })

  const createAnnouncementMutation = useCreateMyGroupAnnouncement()
  const updateAnnouncementMutation = useUpdateMyGroupAnnouncement()
  const deleteAnnouncementMutation = useDeleteMyGroupAnnouncement()

  const canManageAnnouncements =
    isApprovedGroupManager && announcementsQuery.data?.items !== undefined

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const parsedId = announcementIdSchema.safeParse(announcementId)
    if (!parsedId.success) {
      toast.error(parsedId.error.issues[0]?.message ?? "Invalid announcement ID")
      return
    }

    const ok = window.confirm("Delete this announcement? This cannot be undone.")
    if (!ok) return

    try {
      await deleteAnnouncementMutation.mutateAsync({ announcementId: parsedId.data })
      toast.success("Announcement deleted")

      if (announcements.length === 1 && announcementsPage > 1) {
        setAnnouncementsPage((prev) => Math.max(1, prev - 1))
      }
    } catch {
      toast.error("Failed to delete announcement")
    }
  }

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const messageInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)

  const toggleReplyToMessage = useCallback((messageId: string, preview?: { senderName?: string; content?: string }) => {
    if (messageId.startsWith("client-")) {
      toast.error("Message is not delivered yet")
      return
    }

    setReplyToMessageId((prev) => {
      const next = prev === messageId ? null : messageId
      if (next) {
        const title = preview?.senderName ? `Replying to ${preview.senderName}` : "Replying to message"
        const body = preview?.content ? preview.content.slice(0, 80) : ""
        toast.message(title, body ? { description: body } : undefined)
      } else {
        toast.message("Reply cleared")
      }
      return next
    })
  }, [])

  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [queuedAttachment, setQueuedAttachment] = useState<ChatMessageAttachment | null>(null)

  const messagesScrollRootRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const isAtBottomRef = useRef(false)
  const lastReadUpToMessageIdRef = useRef<string | null>(null)

  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const typingUserIdsRef = useRef<Set<string>>(new Set())
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])

  const socketRef = useRef<ReturnType<typeof acquireChatSocket> | null>(null)
  const joinedRoomIdRef = useRef<string | null>(null)
  const onlineUserIdsRef = useRef<string[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  const [callPhase, setCallPhase] = useState<JitsiCallPhase>("idle")
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [videoCallError, setVideoCallError] = useState<string | null>(null)
  const [isGroupCallOngoing, setIsGroupCallOngoing] = useState(false)
  const [groupCallParticipantCount, setGroupCallParticipantCount] = useState<number | null>(null)
  const [groupCallStartedByUserId, setGroupCallStartedByUserId] = useState<string | null>(null)
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null)
  const jitsiApiRef = useRef<JitsiExternalApi | null>(null)

  const normalizedTenant = useMemo(() => {
    const value = (tenantDomain ?? "academia").toLowerCase().trim()
    return value.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
  }, [tenantDomain])

  const jitsiRoomName = useMemo(() => {
    if (!projectGroupId) return null
    const normalizedGroup = projectGroupId.toLowerCase().replace(/[^a-z0-9-]/g, "-")
    return `academia-${normalizedTenant}-${normalizedGroup}`.slice(0, 128)
  }, [normalizedTenant, projectGroupId])

  const jitsiDisplayName = useMemo(() => {
    const fullName = `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim()
    if (fullName) return fullName
    return currentUser?.email ?? "Student"
  }, [currentUser?.email, currentUser?.firstName, currentUser?.lastName])

  const editMessage = useCallback(async (params: { messageId: string; fallbackText?: string }) => {
    if (!roomId) return
    if (params.messageId.startsWith("client-")) {
      toast.error("Message is not delivered yet")
      return
    }

    const message = findMessageInCache(params.messageId)
    if (!message) return
    if (!currentUser?.id || message.senderUserId !== currentUser.id) {
      toast.error("You can only edit your own messages")
      return
    }

    const nextTextRaw = window.prompt("Edit message", message.text ?? params.fallbackText ?? "")
    if (nextTextRaw === null) return
    const nextText = nextTextRaw.trim()
    if (!nextText) {
      toast.error("Message text is required")
      return
    }

    const prevText = message.text
    const prevEditedAt = message.editedAt
    const optimisticEditedAt = new Date().toISOString()

    updateInfiniteMessageById({
      messageId: params.messageId,
      update: (currentMsg) => ({
        ...currentMsg,
        text: nextText,
        editedAt: optimisticEditedAt,
      }),
    })

    const socket = socketRef.current
    if (socket?.connected && joinedRoomIdRef.current === roomId) {
      const ack = await emitSocketWithTimeoutAck<unknown>({
        socket,
        event: "message:edit",
        payload: { roomId, messageId: params.messageId, text: nextText },
      })

      if (ack && typeof ack === "object" && "ok" in ack && ack.ok === false) {
        updateInfiniteMessageById({
          messageId: params.messageId,
          update: (currentMsg) => ({
            ...currentMsg,
            text: prevText,
            editedAt: prevEditedAt,
          }),
        })
        toast.error(ack.error?.message ?? "Failed to edit message")
        return
      }

      if (ack !== null) return
      // No ack -> fall back to REST (idempotent for same text)
    }

    try {
      await patchChatRoomMessage({ roomId, messageId: params.messageId, text: nextText })
    } catch (error) {
      updateInfiniteMessageById({
        messageId: params.messageId,
        update: (currentMsg) => ({
          ...currentMsg,
          text: prevText,
          editedAt: prevEditedAt,
        }),
      })
      const msg = error instanceof Error ? error.message : "Failed to edit message"
      toast.error(msg)
    }
  }, [currentUser?.id, emitSocketWithTimeoutAck, findMessageInCache, roomId, updateInfiniteMessageById])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!roomId) return
    if (messageId.startsWith("client-")) {
      toast.error("Message is not delivered yet")
      return
    }

    const message = findMessageInCache(messageId)
    if (!message) return
    if (!currentUser?.id || message.senderUserId !== currentUser.id) {
      toast.error("You can only delete your own messages")
      return
    }

    const ok = window.confirm("Delete this message? This cannot be undone.")
    if (!ok) return
    updateInfiniteMessagesCache((page) => {
      const nextItems = page.items.filter((m) => m.id !== messageId)
      if (nextItems.length === page.items.length) return page
      return { ...page, items: nextItems }
    })

    const socket = socketRef.current
    if (socket?.connected && joinedRoomIdRef.current === roomId) {
      const ack = await emitSocketWithTimeoutAck<unknown>({
        socket,
        event: "message:delete",
        payload: { roomId, messageId },
      })

      if (ack && typeof ack === "object" && "ok" in ack && ack.ok === false) {
        toast.error(ack.error?.message ?? "Failed to delete message")
        invalidateRoomMessages()
        return
      }

      if (ack !== null) return
      // No ack -> fall back to REST
    }

    try {
      await deleteChatRoomMessage({ roomId, messageId })
    } catch {
      // If the socket delete already succeeded, REST might 404; keep UI as-is.
    }
  }, [currentUser?.id, emitSocketWithTimeoutAck, findMessageInCache, invalidateRoomMessages, roomId, updateInfiniteMessagesCache])
  const [advisorInput, setAdvisorInput] = useState('')
  const [advisorMessages, setAdvisorMessages] = useState<Message[]>([
    {
      id: 'am1',
      senderId: 'advisor',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '/avatars/sarah.jpg',
      content: 'Hi! I\'m your project advisor. Feel free to ask about your thesis, milestones, or schedule anytime.',
      timestamp: '2024-07-23T09:00:00.000Z',
      status: 'read'
    },
    {
      id: 'am2',
      senderId: 'current',
      senderName: 'You',
      content: 'Thank you. I\'ll reach out when I have questions.',
      timestamp: '2024-07-24T09:15:00.000Z',
      status: 'read'
    },
    {
      id: 'am3',
      senderId: 'advisor',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '/avatars/sarah.jpg',
      content: 'Sounds good. Remember the design phase deliverable is due next Friday.',
      timestamp: '2024-07-25T11:20:00.000Z',
      status: 'delivered'
    }
  ])
  const advisorProfile = { name: 'Dr. Sarah Chen', role: 'Project Advisor', status: 'online' as UserStatus }

  const conversations: Conversation[] = useMemo(() => {
    const group = myProjectGroupQuery.data
    const room = myChatRoomQuery.data
    if (!group || !room) return []

    const rawItems = chatMessagesQuery.data?.pages?.[0]?.items ?? []
    const newest = rawItems[0] ?? null

    const participants = [
      {
        id: group.leader.id,
        name: `${group.leader.firstName} ${group.leader.lastName}`.trim() || group.leader.email,
        status: onlineUserIds.includes(group.leader.id) ? ("online" as const) : ("offline" as const),
      },
      ...group.members.map((m) => {
        const name = `${m.user.firstName} ${m.user.lastName}`.trim() || m.user.email
        return {
          id: m.user.id,
          name,
          status: onlineUserIds.includes(m.user.id) ? ("online" as const) : ("offline" as const),
        }
      }),
    ]

    // Remove duplicates (in case leader appears in members)
    const uniqueParticipants = Array.from(new Map(participants.map((p) => [p.id, p])).values())

    return [
      {
        id: room.roomId,
        name: group.name,
        type: "group" as const,
        lastMessage: newest?.text || (newest?.attachment?.name ? `Attachment: ${newest.attachment.name}` : ""),
        lastMessageTime: newest?.createdAt ?? group.updatedAt,
        unreadCount: 0,
        participants: uniqueParticipants,
      },
    ]
  }, [chatMessagesQuery.data, myChatRoomQuery.data, myProjectGroupQuery.data, onlineUserIds])

  const messages: Record<string, Message[]> = useMemo(() => {
    if (!roomId) return {}

    const currentUserId = currentUser?.id
    const itemsNewestFirst = chatMessagesQuery.data?.pages?.flatMap((p) => p.items) ?? []
    const itemsOldestFirst = [...itemsNewestFirst].reverse()

    const truncatePreview = (text: string, max = 80) => {
      const trimmed = text.trim()
      if (trimmed.length <= max) return trimmed
      return `${trimmed.slice(0, max).trimEnd()}…`
    }

    const messageIdToIndex = new Map<string, number>()
    for (let i = 0; i < itemsOldestFirst.length; i += 1) {
      messageIdToIndex.set(itemsOldestFirst[i]!.id, i)
    }

    const otherParticipantUserIds = (() => {
      const group = myProjectGroupQuery.data
      if (!group || !currentUserId) return []
      const ids = [group.leader.id, ...group.members.map((m) => m.user.id)].filter(
        (id) => id && id !== currentUserId
      )
      return Array.from(new Set(ids))
    })()

    const userNameById = (() => {
      const group = myProjectGroupQuery.data
      const map = new Map<string, string>()
      if (!group) return map

      const leaderName = `${group.leader.firstName} ${group.leader.lastName}`.trim() || group.leader.email
      map.set(group.leader.id, leaderName)

      for (const member of group.members) {
        const name = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email
        map.set(member.user.id, name)
      }

      return map
    })()

    const readStates = chatMessagesQuery.data?.pages?.[0]?.readStates ?? []
    const lastReadIndexByUserId = new Map<string, number>()
    for (const state of readStates) {
      const idx = messageIdToIndex.get(state.lastReadMessageId)
      lastReadIndexByUserId.set(state.userId, typeof idx === "number" ? idx : -1)
    }

    const mapped: Message[] = itemsOldestFirst.map((m, idx) => {
      const senderName = `${m.sender.firstName} ${m.sender.lastName}`.trim() || "Unknown"

      const attachments = m.attachment
        ? [
            {
              name: m.attachment.name,
              sizeBytes: m.attachment.size,
              url: m.attachment.url,
              mimeType: m.attachment.mimeType,
            },
          ]
        : undefined

      const isMine = m.senderUserId === currentUserId
      const isOptimistic = (m as { __optimistic?: boolean }).__optimistic === true
      const status: MessageStatus = (() => {
        if (!isMine) return "read"

        if (isOptimistic) return "sent"

        if (otherParticipantUserIds.length === 0) return "delivered"
        const everyoneRead = otherParticipantUserIds.every(
          (userId) => (lastReadIndexByUserId.get(userId) ?? -1) >= idx
        )

        return everyoneRead ? "read" : "delivered"
      })()

      const readBy = (() => {
        if (!isMine) return []
        if (isOptimistic) return []
        if (otherParticipantUserIds.length === 0) return []
        const readers = otherParticipantUserIds
          .filter((userId) => (lastReadIndexByUserId.get(userId) ?? -1) >= idx)
          .map((userId) => userNameById.get(userId) ?? "")
          .filter((name) => Boolean(name))
        return readers
      })()

      const replyTo = (() => {
        const referenced =
          m.replyTo ??
          (m.replyToMessageId
            ? itemsOldestFirst[messageIdToIndex.get(m.replyToMessageId) ?? -1] ?? null
            : null)

        if (!referenced) {
          return m.replyToMessageId
            ? {
                messageId: m.replyToMessageId,
                senderName: "Message",
                content: "",
              }
            : null
        }

        const referencedSenderName =
          referenced.senderUserId === currentUserId
            ? "You"
            : `${referenced.sender.firstName} ${referenced.sender.lastName}`.trim() || "Unknown"

        const referencedContent =
          referenced.text ||
          (referenced.attachment?.name ? `Attachment: ${referenced.attachment.name}` : "")

        return {
          messageId: referenced.id,
          senderName: referencedSenderName,
          content: truncatePreview(referencedContent, 80),
        }
      })()

      return {
        id: m.id,
        senderId: m.senderUserId === currentUserId ? "current" : m.senderUserId,
        senderName: m.senderUserId === currentUserId ? "You" : senderName,
        senderAvatar: m.sender.avatarUrl ?? undefined,
        content: m.text,
        timestamp: m.createdAt,
        status,
        reactions: m.reactions,
        readBy,
        replyTo,
        attachments,
      }
    })

    return {
      [roomId]: mapped,
    }
  }, [chatMessagesQuery.data, currentUser?.id, myProjectGroupQuery.data, roomId])

  const activeReplyPreview = useMemo(() => {
    if (!replyToMessageId) return null
    const target = findMessageInCache(replyToMessageId)
    if (!target) {
      return {
        senderName: "Message",
        content: "",
      }
    }

    const senderName =
      target.senderUserId === currentUser?.id
        ? "You"
        : `${target.sender.firstName} ${target.sender.lastName}`.trim() || "Unknown"

    const rawContent =
      target.text || (target.attachment?.name ? `Attachment: ${target.attachment.name}` : "")

    const content = rawContent.trim().length > 80 ? `${rawContent.trim().slice(0, 80).trimEnd()}…` : rawContent.trim()

    return {
      senderName,
      content,
    }
  }, [currentUser?.id, findMessageInCache, replyToMessageId])

  const formatBytes = useCallback((bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
    const units = ["B", "KB", "MB", "GB"] as const
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
    const value = bytes / Math.pow(1024, i)
    const digits = i === 0 ? 0 : value >= 10 ? 1 : 2
    return `${value.toFixed(digits)} ${units[i]}`
  }, [])

  const ensureFilenameHasExtension = useCallback((params: { name: string; mimeType?: string; url?: string }) => {
    const raw = (params.name || "download").trim() || "download"
    if (/\.[a-zA-Z0-9]{1,8}$/.test(raw)) return raw

    const mime = (params.mimeType || "").toLowerCase()
    const extByMime: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
      "application/vnd.ms-powerpoint": ".ppt",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "text/plain": ".txt",
      "text/csv": ".csv",
      "application/zip": ".zip",
      "application/x-zip-compressed": ".zip",
    }

    if (mime && extByMime[mime]) return `${raw}${extByMime[mime]}`

    if (params.url) {
      try {
        const u = new URL(params.url)
        const file = u.pathname.split("/").pop() ?? ""
        const m = file.match(/\.[a-zA-Z0-9]{1,8}$/)
        if (m) return `${raw}${m[0]}`
      } catch {
        // ignore
      }
    }

    return raw
  }, [])

  const downloadAttachment = useCallback(async (att: { url: string; name: string; mimeType?: string }) => {
    const filename = ensureFilenameHasExtension({ name: att.name, mimeType: att.mimeType, url: att.url })
    try {
      const response = await fetch(att.url)
      if (!response.ok) throw new Error(`Download failed (${response.status})`)

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = filename
      a.rel = "noreferrer"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download file"
      toast.error(message)
      window.open(att.url, "_blank", "noopener,noreferrer")
    }
  }, [ensureFilenameHasExtension])

  const updateReadStateInCache = useCallback((payload: {
    roomId: string
    userId: string
    readUpToMessageId: string
    readAt: string
  }) => {
    queryClient.setQueryData(
      chatKeys().roomMessagesInfinite({ roomId: payload.roomId, limit: 30 }),
      (previous: { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] } | undefined) => {
        if (!previous) return previous
        if (!previous.pages[0]) return previous

        const firstPage = previous.pages[0]
        const existing = firstPage.readStates ?? []
        const next = existing.some((s) => s.userId === payload.userId)
          ? existing.map((s) =>
              s.userId === payload.userId
                ? {
                    ...s,
                    lastReadMessageId: payload.readUpToMessageId,
                    readAt: payload.readAt,
                  }
                : s
            )
          : [
              ...existing,
              {
                userId: payload.userId,
                lastReadMessageId: payload.readUpToMessageId,
                readAt: payload.readAt,
              },
            ]

        const nextPages = [...previous.pages]
        nextPages[0] = { ...firstPage, readStates: next }

        return {
          ...previous,
          pages: nextPages,
        }
      }
    )
  }, [queryClient])

  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementContent, setAnnouncementContent] = useState("")
  const [announcementPriority, setAnnouncementPriority] = useState<Announcement["priority"]>("medium")
  const [announcementAttachmentUrl, setAnnouncementAttachmentUrl] = useState("")
  const [announcementAttachmentFile, setAnnouncementAttachmentFile] = useState<File | null>(null)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)

  const announcementItems = announcementsQuery.data?.items
  const announcementPagination = announcementsQuery.data?.pagination
  const announcementsTotalPages = announcementPagination?.pages ?? 1

  const announcements: Announcement[] = announcementItems
    ? announcementItems.map((item) => {
        const priority = item.priority === "HIGH" ? "high" : item.priority === "LOW" ? "low" : "medium"
        const authorName =
          [item.createdBy?.firstName, item.createdBy?.lastName].filter(Boolean).join(" ") || "Unknown"

        return {
          id: item.id,
          title: item.title,
          content: item.message,
          date: item.createdAt,
          author: authorName,
          priority,

          attachmentType: item.attachmentType,
          attachmentUrl: item.attachmentUrl,
          attachmentFileName: item.attachmentFileName,
        }
      })
    : []

  const isEditingAnnouncement = editingAnnouncementId !== null

  const openNewAnnouncementDialog = () => {
    setEditingAnnouncementId(null)
    setAnnouncementTitle("")
    setAnnouncementContent("")
    setAnnouncementPriority("medium")
    setAnnouncementAttachmentUrl("")
    setAnnouncementAttachmentFile(null)
    setCreateAnnouncementOpen(true)
  }

  const openEditAnnouncementDialog = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id)
    setAnnouncementTitle(announcement.title)
    setAnnouncementContent(announcement.content)
    setAnnouncementPriority(announcement.priority)
    setAnnouncementAttachmentUrl("")
    setAnnouncementAttachmentFile(null)
    setCreateAnnouncementOpen(true)
  }

  const handleAnnouncementDialogOpenChange = (open: boolean) => {
    setCreateAnnouncementOpen(open)
    if (!open) {
      setEditingAnnouncementId(null)
      setAnnouncementTitle("")
      setAnnouncementContent("")
      setAnnouncementPriority("medium")
      setAnnouncementAttachmentUrl("")
      setAnnouncementAttachmentFile(null)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const insertEmojiIntoMessageInput = useCallback((emoji: string) => {
    setMessageInput((prev) => `${prev}${emoji}`)

    requestAnimationFrame(() => {
      const el = messageInputRef.current
      if (!el) return
      try {
        const pos = el.value.length
        el.focus()
        el.setSelectionRange(pos, pos)
      } catch {
        // ignore
      }
    })
  }, [])

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const effectiveSelectedConversation = selectedConversation ?? filteredConversations[0] ?? null

  useEffect(() => {
    if (!accessToken || !projectGroupId || !roomId) {
      socketRef.current?.disconnect?.()
      socketRef.current = null
      joinedRoomIdRef.current = null
      onlineUserIdsRef.current = []
      return
    }

    const socket = acquireChatSocket({
      accessToken,
      tenantDomain,
    })

    socketRef.current = socket

    const handlePresenceUpdate = (payload: unknown) => {
      const raw = payload as PresenceUpdatePayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (!Array.isArray(raw.onlineUserIds)) return

      onlineUserIdsRef.current = raw.onlineUserIds.filter((id) => typeof id === "string")
      setOnlineUserIds(onlineUserIdsRef.current)
    }

    const handleMessageNew = (payload: unknown) => {
      const raw = payload as MessageNewPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (!raw.message || typeof raw.message !== "object") return

      reconcileClientMessageIdInCache({
        roomId,
        clientMessageId: raw.clientMessageId,
        canonicalMessage: raw.message,
        limit: 30,
      })
    }

    const handleReadUpTo = (payload: unknown) => {
      const raw = payload as MessageReadUpToPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.userId !== "string") return
      if (typeof raw.readUpToMessageId !== "string") return
      if (typeof raw.readAt !== "string") return

      updateReadStateInCache({
        roomId: raw.roomId,
        userId: raw.userId,
        readUpToMessageId: raw.readUpToMessageId,
        readAt: raw.readAt,
      })
    }

    const handleMessageEdited = (payload: unknown) => {
      const raw = payload as MessageEditedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.messageId !== "string") return
      if (!raw.message || typeof raw.message !== "object") return

      updateInfiniteMessageById({
        messageId: raw.messageId,
        update: (current) => ({
          ...current,
          editedAt:
            typeof raw.message.editedAt === "string" || raw.message.editedAt === null
              ? raw.message.editedAt
              : current.editedAt,
          ...(typeof raw.message.text === "string" ? { text: raw.message.text } : {}),
        }),
      })
    }

    const handleMessageDeleted = (payload: unknown) => {
      const raw = payload as MessageDeletedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.messageId !== "string") return

      updateInfiniteMessagesCache((page) => {
        const nextItems = page.items.filter((m) => m.id !== raw.messageId)
        if (nextItems.length === page.items.length) return page
        return { ...page, items: nextItems }
      })
    }

    const handleTypingUpdate = (payload: unknown) => {
      const raw = payload as TypingUpdatePayload
      if (!raw || typeof raw !== "object") return
      // Some backends omit extra fields for typing payloads. Be tolerant.
      const rawRoomId = (raw as { roomId?: unknown }).roomId
      if (typeof rawRoomId === "string") {
        if (rawRoomId !== roomId) return
      } else {
        // If roomId is missing, only accept when we're joined to this room.
        if (joinedRoomIdRef.current !== roomId) return
      }
      if (typeof raw.userId !== "string") return
      if (typeof raw.isTyping !== "boolean") return
      // `at` is informational; do not require it.

      // Ignore self typing updates.
      if (raw.userId === currentUser?.id) return

      if (raw.isTyping) {
        typingUserIdsRef.current.add(raw.userId)
      } else {
        typingUserIdsRef.current.delete(raw.userId)
      }

      setTypingUserIds(Array.from(typingUserIdsRef.current))
    }

    const handleReactionUpdated = (payload: unknown) => {
      const raw = payload as ReactionUpdatedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.messageId !== "string") return
      if (typeof raw.userId !== "string") return
      if (typeof raw.emoji !== "string") return
      if (typeof raw.reactedAt !== "string") return

      // We can precisely update only for current user (myReaction). For other users, refetch.
      if (raw.userId !== currentUser?.id) {
        invalidateRoomMessages()
        return
      }

      updateInfiniteMessageById({
        messageId: raw.messageId,
        update: (current) => {
          const prevEmoji = current.reactions?.myReaction
          const items = [...(current.reactions?.items ?? [])]

          const bump = (emoji: string, delta: number) => {
            const i = items.findIndex((x) => x.emoji === emoji)
            if (i < 0) {
              if (delta > 0) items.push({ emoji, count: delta })
              return
            }
            const nextCount = items[i]!.count + delta
            if (nextCount <= 0) items.splice(i, 1)
            else items[i] = { ...items[i]!, count: nextCount }
          }

          if (prevEmoji && prevEmoji !== raw.emoji) bump(prevEmoji, -1)
          bump(raw.emoji, prevEmoji === raw.emoji ? 0 : 1)

          return {
            ...current,
            reactions: {
              items,
              myReaction: raw.emoji,
            },
          }
        },
      })
    }

    const handleReactionRemoved = (payload: unknown) => {
      const raw = payload as ReactionRemovedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.messageId !== "string") return
      if (typeof raw.userId !== "string") return
      if (typeof raw.removedAt !== "string") return

      if (raw.userId !== currentUser?.id) {
        invalidateRoomMessages()
        return
      }

      updateInfiniteMessageById({
        messageId: raw.messageId,
        update: (current) => {
          const prevEmoji = current.reactions?.myReaction
          if (!prevEmoji) return current

          const items = [...(current.reactions?.items ?? [])]
          const i = items.findIndex((x) => x.emoji === prevEmoji)
          if (i >= 0) {
            const nextCount = items[i]!.count - 1
            if (nextCount <= 0) items.splice(i, 1)
            else items[i] = { ...items[i]!, count: nextCount }
          }

          return {
            ...current,
            reactions: {
              items,
              myReaction: null,
            },
          }
        },
      })
    }

    const handleCallStarted = (payload: unknown) => {
      const raw = payload as CallStartedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return

      setIsGroupCallOngoing(true)
      if (typeof raw.startedByUserId === "string") setGroupCallStartedByUserId(raw.startedByUserId)
      if (typeof raw.participantCount === "number") {
        setGroupCallParticipantCount(raw.participantCount)
      }
    }

    const handleCallParticipantChanged = (payload: unknown) => {
      const raw = payload as CallParticipantChangedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.participantCount !== "number") return

      setGroupCallParticipantCount(raw.participantCount)
      setIsGroupCallOngoing(raw.participantCount > 0)
      if (raw.participantCount <= 0) {
        setGroupCallStartedByUserId(null)
      }
    }

    const handleCallEnded = (payload: unknown) => {
      const raw = payload as CallEndedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return

      setIsGroupCallOngoing(false)
      setGroupCallParticipantCount(null)
      setGroupCallStartedByUserId(null)
    }

    socket.on("presence:update", handlePresenceUpdate)
    socket.on("message:new", handleMessageNew)
    socket.on("message:readUpTo", handleReadUpTo)
    socket.on("message:edited", handleMessageEdited)
    socket.on("message:deleted", handleMessageDeleted)
    socket.on("typing:update", handleTypingUpdate)
    socket.on("reaction:updated", handleReactionUpdated)
    socket.on("reaction:removed", handleReactionRemoved)
    socket.on("call:started", handleCallStarted)
    socket.on("call:participantChanged", handleCallParticipantChanged)
    socket.on("call:ended", handleCallEnded)

    const joinRoom = () => {
      socket.emit(
        "chat:join",
        { projectGroupId },
        (ack: SocketAck<{ roomId: string; projectGroupId: string; onlineUserIds: string[] }>) => {
          if (!ack || typeof ack !== "object") return
          if (ack.ok !== true) {
            toast.error("Failed to join chat")
            return
          }

          joinedRoomIdRef.current = ack.data.roomId
          onlineUserIdsRef.current = ack.data.onlineUserIds
          setOnlineUserIds(ack.data.onlineUserIds)

          socket.emit(
            "presence:get",
            { roomId: ack.data.roomId },
            (presenceAck: SocketAck<{ roomId: string; onlineUserIds: string[] }>) => {
              if (!presenceAck || typeof presenceAck !== "object") return
              if (presenceAck.ok !== true) return
              if (presenceAck.data.roomId !== roomId && presenceAck.data.roomId !== ack.data.roomId) return

              onlineUserIdsRef.current = presenceAck.data.onlineUserIds
              setOnlineUserIds(presenceAck.data.onlineUserIds)
            }
          )
        }
      )
    }

    const handleConnect = () => {
      joinedRoomIdRef.current = null
      joinRoom()
    }

    const handleDisconnect = () => {
      joinedRoomIdRef.current = null
      onlineUserIdsRef.current = []
      setOnlineUserIds([])

      // Clear typing state while disconnected.
      typingUserIdsRef.current.clear()
      setTypingUserIds([])

      setIsGroupCallOngoing(false)
      setGroupCallParticipantCount(null)
      setGroupCallStartedByUserId(null)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    if (socket.connected) {
      handleConnect()
    }

    return () => {
      socket.off("presence:update", handlePresenceUpdate)
      socket.off("message:new", handleMessageNew)
      socket.off("message:readUpTo", handleReadUpTo)
      socket.off("message:edited", handleMessageEdited)
      socket.off("message:deleted", handleMessageDeleted)
      socket.off("typing:update", handleTypingUpdate)
      socket.off("reaction:updated", handleReactionUpdated)
      socket.off("reaction:removed", handleReactionRemoved)
      socket.off("call:started", handleCallStarted)
      socket.off("call:participantChanged", handleCallParticipantChanged)
      socket.off("call:ended", handleCallEnded)
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      releaseChatSocket(socket)
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [
    accessToken,
    currentUser?.id,
    invalidateRoomMessages,
    projectGroupId,
    reconcileClientMessageIdInCache,
    roomId,
    tenantDomain,
    updateInfiniteMessageById,
    updateInfiniteMessagesCache,
    updateReadStateInCache,
  ])

  const emitTypingStop = useCallback(() => {
    if (!roomId) return

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = null
    }

    if (!isTypingRef.current) return
    isTypingRef.current = false

    const socket = socketRef.current
    if (!socket) return
    socket.emit("typing:stop", { roomId })
  }, [roomId])

  const emitTypingStart = useCallback(() => {
    if (!roomId) return

    const socket = socketRef.current
    if (!socket) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("typing:start", { roomId })
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
    }

    // Debounce stop: if no activity for a short window, emit typing:stop.
    typingStopTimerRef.current = setTimeout(() => {
      emitTypingStop()
    }, 1500)
  }, [emitTypingStop, roomId])

  useEffect(() => {
    return () => {
      // Best-effort: stop typing when leaving the page.
      emitTypingStop()
    }
  }, [emitTypingStop])

  const markReadUpToLatest = useCallback(async (messageId: string) => {
    if (!roomId) return
    const userId = currentUser?.id
    if (!userId) return

    // Don't mark read for optimistic client-side messages; wait for server reconciliation.
    if (messageId.startsWith("client-")) return

    if (lastReadUpToMessageIdRef.current === messageId) return
    lastReadUpToMessageIdRef.current = messageId

    const nowIso = new Date().toISOString()
    updateReadStateInCache({
      roomId,
      userId,
      readUpToMessageId: messageId,
      readAt: nowIso,
    })

    const socket = socketRef.current
    if (socket?.connected && joinedRoomIdRef.current === roomId) {
      socket.emit(
        "message:markReadUpTo",
        { roomId, messageId },
        (ack: SocketAck<unknown>) => {
          if (!ack || typeof ack !== "object") return
          if (ack.ok === false) {
            toast.error(ack.error?.message ?? "Failed to mark messages as read")
          }
        }
      )
      return
    }

    try {
      await markChatRoomReadUpTo({ roomId, messageId })
    } catch {
      // Non-fatal; UI already updated optimistically.
    }
  }, [currentUser?.id, roomId, updateReadStateInCache])

  useEffect(() => {
    const root = messagesScrollRootRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    )
    if (!viewport) return

    const thresholdPx = 24
    const computeAtBottom = () => {
      const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      return distance <= thresholdPx
    }

    const computeAtTop = () => {
      return viewport.scrollTop <= thresholdPx
    }

    const sync = () => {
      const atBottom = computeAtBottom()
      isAtBottomRef.current = atBottom
      setIsAtBottom(atBottom)
    }

    const maybeLoadOlder = () => {
      if (!roomId) return
      if (!chatHasNextPage) return
      if (chatIsFetchingNextPage) return
      if (!computeAtTop()) return

      pendingTopPaginationScrollRef.current = {
        prevScrollHeight: viewport.scrollHeight,
        prevScrollTop: viewport.scrollTop,
      }

      void chatFetchNextPage().then(() => {
        const pending = pendingTopPaginationScrollRef.current
        if (!pending) return
        pendingTopPaginationScrollRef.current = null

        requestAnimationFrame(() => {
          const nextScrollHeight = viewport.scrollHeight
          const delta = nextScrollHeight - pending.prevScrollHeight
          viewport.scrollTop = pending.prevScrollTop + delta
        })
      })
    }

    const onScroll = () => {
      sync()
      maybeLoadOlder()
    }

    viewport.addEventListener("scroll", onScroll, { passive: true })
    // Initial sync (also covers non-overflow content)
    sync()

    if (autoFillRoomIdRef.current !== roomId) {
      autoFillRoomIdRef.current = roomId
      autoFillAttemptsRef.current = 0
    }

    // If content doesn't overflow, auto-fill up to a small cap so history is reachable.
    if (
      viewport.scrollHeight <= viewport.clientHeight + 1 &&
      chatHasNextPage &&
      !chatIsFetchingNextPage &&
      autoFillAttemptsRef.current < 3
    ) {
      autoFillAttemptsRef.current += 1
      pendingTopPaginationScrollRef.current = {
        prevScrollHeight: viewport.scrollHeight,
        prevScrollTop: viewport.scrollTop,
      }
      void chatFetchNextPage().then(() => {
        const pending = pendingTopPaginationScrollRef.current
        if (!pending) return
        pendingTopPaginationScrollRef.current = null
        requestAnimationFrame(() => {
          const nextScrollHeight = viewport.scrollHeight
          const delta = nextScrollHeight - pending.prevScrollHeight
          viewport.scrollTop = pending.prevScrollTop + delta
        })
      })
    }

    return () => {
      viewport.removeEventListener("scroll", onScroll)
    }
  }, [chatFetchNextPage, chatHasNextPage, chatIsFetchingNextPage, chatMessagesData, effectiveSelectedConversation?.id, roomId])

  useEffect(() => {
    if (!roomId) return
    if (!isAtBottom) return
    if (!latestMessageId) return

    if (latestMessageId.startsWith("client-")) return

    void markReadUpToLatest(latestMessageId)
  }, [isAtBottom, latestMessageId, markReadUpToLatest, roomId])

  const handleSendMessage = () => {
    sendMessageWithOptionalAttachment({
      text: messageInput,
      attachment: queuedAttachment,
    })
  }

  const sendMessageWithOptionalAttachment = (params: {
    text: string | null
    attachment: ChatMessageAttachment | null
  }) => {
    if (!effectiveSelectedConversation) return
    if (!roomId) return

    const replyingTo = replyToMessageId
    if (replyingTo) {
      setReplyToMessageId(null)
    }

    const socket = socketRef.current
    if (!socket) {
      toast.error("Chat is not connected")
      return
    }

    const text = params.text?.trim() ?? ""
    const attachment = params.attachment

    if (!text && !attachment) return

    const clientMessageId = `client-${Date.now()}`

    if (currentUser?.id) {
      const optimisticMessage: ChatMessage & { __optimistic: true } = {
        __optimistic: true,
        id: clientMessageId,
        roomId,
        senderUserId: currentUser.id,
        sender: {
          id: currentUser.id,
          firstName: currentUser.firstName ?? "",
          lastName: currentUser.lastName ?? "",
          avatarUrl: currentUser.avatarUrl ?? null,
        },
        replyToMessageId: replyingTo ?? null,
        replyTo: null,
        text,
        attachment,
        createdAt: new Date().toISOString(),
        editedAt: null,
        isPinned: false,
        reactions: {
          items: [],
          myReaction: null,
        },
      }

      upsertOptimisticMessageInCache({
        roomId,
        message: optimisticMessage,
        limit: 30,
      })
    }

    socket.emit(
      "message:send",
      {
        roomId,
        clientMessageId,
        ...(replyingTo ? { replyToMessageId: replyingTo } : {}),
        ...(text ? { text } : {}),
        ...(attachment ? { attachment } : {}),
      },
      (ack: SocketAck<MessageSendAckData>) => {
        if (!ack || typeof ack !== "object") return
        if (ack.ok === false) {
          toast.error(ack.error?.message ?? "Failed to send message")
          return
        }

        reconcileClientMessageIdInCache({
          roomId,
          clientMessageId: ack.data.clientMessageId ?? clientMessageId,
          canonicalMessage: ack.data.message,
          limit: 30,
        })
      }
    )

    setMessageInput("")
    setQueuedAttachment(null)
    emitTypingStop()
  }

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value)

    if (!roomId) return
    if (value.trim()) {
      emitTypingStart()
    } else {
      emitTypingStop()
    }
  }

  const handlePickAttachment = () => {
    if (isUploadingAttachment) return
    attachmentInputRef.current?.click()
  }

  const handleAttachmentSelected = async (file: File | null) => {
    if (!file) return
    if (!roomId) {
      toast.error("Chat room not ready")
      return
    }

    // Keep this conservative unless/until backend limits are confirmed.
    const MAX_BYTES = 10 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      toast.error("Attachment must be 10MB or less")
      return
    }

    try {
      setIsUploadingAttachment(true)
      const uploaded = await uploadChatRoomAttachment({ roomId, file })
      setQueuedAttachment(uploaded)
      toast.success(`Attached: ${uploaded.name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload attachment"
      toast.error(message)
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const applyMyReactionOptimistic = useCallback((params: {
    messageId: string
    prevEmoji: string | null
    nextEmoji: string | null
  }) => {
    updateInfiniteMessageById({
      messageId: params.messageId,
      update: (current) => {
        const items = [...(current.reactions?.items ?? [])]
        const bump = (emoji: string, delta: number) => {
          const i = items.findIndex((x) => x.emoji === emoji)
          if (i < 0) {
            if (delta > 0) items.push({ emoji, count: delta })
            return
          }
          const nextCount = items[i]!.count + delta
          if (nextCount <= 0) items.splice(i, 1)
          else items[i] = { ...items[i]!, count: nextCount }
        }

        if (params.prevEmoji && params.prevEmoji !== params.nextEmoji) bump(params.prevEmoji, -1)
        if (params.nextEmoji && params.nextEmoji !== params.prevEmoji) bump(params.nextEmoji, 1)

        return {
          ...current,
          reactions: {
            items,
            myReaction: params.nextEmoji,
          },
        }
      },
    })
  }, [updateInfiniteMessageById])

  const setReactionOnMessage = useCallback(async (params: { messageId: string; emoji: string | null }) => {
    if (!roomId) return
    if (params.messageId.startsWith("client-")) {
      toast.error("Message is not delivered yet")
      return
    }

    const current = findMessageInCache(params.messageId)
    if (!current) return

    const prevEmoji = current.reactions?.myReaction ?? null
    const nextEmoji = params.emoji

    if (prevEmoji === nextEmoji) {
      // Toggle off (or no-op if already removed).
      if (!nextEmoji) return
      return setReactionOnMessage({ messageId: params.messageId, emoji: null })
    }

    applyMyReactionOptimistic({
      messageId: params.messageId,
      prevEmoji,
      nextEmoji,
    })

    const socket = socketRef.current
    if (socket?.connected && joinedRoomIdRef.current === roomId) {
      if (nextEmoji) socket.emit("reaction:set", { roomId, messageId: params.messageId, emoji: nextEmoji })
      else socket.emit("reaction:remove", { roomId, messageId: params.messageId })
      return
    }

    try {
      if (nextEmoji) {
        await setChatRoomMessageReaction({ roomId, messageId: params.messageId, emoji: nextEmoji })
      } else {
        await removeChatRoomMessageReaction({ roomId, messageId: params.messageId })
      }
    } catch (error) {
      // Revert.
      applyMyReactionOptimistic({
        messageId: params.messageId,
        prevEmoji: nextEmoji,
        nextEmoji: prevEmoji,
      })
      const message = error instanceof Error ? error.message : "Failed to update reaction"
      toast.error(message)
    }
  }, [applyMyReactionOptimistic, findMessageInCache, roomId])

  const toggleDefaultReactionOnMessage = useCallback(async (messageId: string) => {
    if (!roomId) return
    const DEFAULT_EMOJI = "😊"
    await setReactionOnMessage({
      messageId,
      emoji: DEFAULT_EMOJI,
    })
  }, [roomId, setReactionOnMessage])

  const handleSendAdvisorMessage = () => {
    if (!advisorInput.trim()) return
    setAdvisorMessages((prev) => [
      ...prev,
      {
        id: `am-${Date.now()}`,
        senderId: 'current',
        senderName: 'You',
        content: advisorInput.trim(),
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    ])
    setAdvisorInput('')
  }

  const disposeJitsiCall = useCallback(() => {
    if (!jitsiApiRef.current) return
    try {
      jitsiApiRef.current.dispose()
    } catch {
      // no-op
    }
    jitsiApiRef.current = null
  }, [])

  const emitCallPresence = useCallback((eventName: "call:start" | "call:join" | "call:leave" | "call:end") => {
    if (!roomId || !projectGroupId) return
    const socket = socketRef.current
    if (!socket) return

    const payload: CallStartEmitPayload | CallJoinEmitPayload | CallLeaveEmitPayload | CallEndEmitPayload = {
      roomId,
      projectGroupId,
      at: new Date().toISOString(),
    }

    socket.emit(eventName, payload)
  }, [projectGroupId, roomId])

  const endVideoCall = useCallback(() => {
    emitCallPresence("call:leave")
    setCallPhase("ending")
    disposeJitsiCall()
    setIsVideoDialogOpen(false)
    setCallPhase("idle")
  }, [disposeJitsiCall, emitCallPresence])

  const joinVideoCall = useCallback(async () => {
    if (!jitsiRoomName) {
      toast.error("Chat room is not ready for video call")
      return
    }
    if (!projectGroupId) {
      toast.error("Project group not found")
      return
    }

    if (!jitsiContainerRef.current) {
      toast.error("Video container is not ready")
      return
    }

    try {
      setVideoCallError(null)
      setCallPhase("joining")

      const ExternalApi = await loadJitsiExternalApi()
      const options: JitsiApiOptions = {
        roomName: jitsiRoomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: jitsiDisplayName,
          email: currentUser?.email,
          avatarURL: currentUser?.avatarUrl ?? undefined,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          enableWelcomePage: false,
        },
      }

      disposeJitsiCall()
      const api = new ExternalApi("meet.jit.si", options)
      jitsiApiRef.current = api

      api.addListener("videoConferenceJoined", () => {
        setCallPhase("live")
        setIsGroupCallOngoing(true)
        setGroupCallParticipantCount((prev) => (typeof prev === "number" && prev > 0 ? prev : 1))
        setGroupCallStartedByUserId((prev) => prev ?? currentUser?.id ?? null)
        emitCallPresence("call:start")
        emitCallPresence("call:join")
      })

      api.addListener("readyToClose", () => {
        endVideoCall()
      })

      api.addListener("videoConferenceLeft", () => {
        endVideoCall()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start video call"
      setVideoCallError(message)
      setCallPhase("prejoin")
      toast.error(message)
    }
  }, [
    currentUser?.avatarUrl,
    currentUser?.email,
    currentUser?.id,
    disposeJitsiCall,
    emitCallPresence,
    endVideoCall,
    jitsiDisplayName,
    jitsiRoomName,
    projectGroupId,
  ])

  const openVideoPrejoin = useCallback(() => {
    if (!effectiveSelectedConversation || effectiveSelectedConversation.type !== "group") {
      toast.error("Video call is only available for group chat")
      return
    }

    setVideoCallError(null)
    setIsVideoDialogOpen(true)
    setCallPhase("prejoin")
  }, [effectiveSelectedConversation])

  const handleCall = useCallback((type: 'audio' | 'video') => {
    if (type === "audio") {
      toast.message(`Audio call for ${effectiveSelectedConversation?.name ?? "group"} is coming soon`)
      return
    }

    if (callPhase === "live") {
      setIsVideoDialogOpen(true)
      return
    }

    openVideoPrejoin()
  }, [callPhase, effectiveSelectedConversation?.name, openVideoPrejoin])

  const handleVideoDialogOpenChange = useCallback((open: boolean) => {
    if (open) {
      setIsVideoDialogOpen(true)
      if (callPhase === "idle") setCallPhase("prejoin")
      return
    }

    endVideoCall()
  }, [callPhase, endVideoCall])

  useEffect(() => {
    return () => {
      disposeJitsiCall()
    }
  }, [disposeJitsiCall])

  const handleCreateAnnouncement = async () => {
    if (announcementAttachmentFile && announcementAttachmentUrl.trim()) {
      toast.error("Choose either an attachment file or an attachment URL")
      return
    }

    if (announcementAttachmentFile && announcementAttachmentFile.size > 5 * 1024 * 1024) {
      toast.error("Attachment must be 5MB or less")
      return
    }

    const priorityApi =
      announcementPriority === "high" ? "HIGH" : announcementPriority === "low" ? "LOW" : "MEDIUM"

    const parsed = createMyGroupAnnouncementSchema.safeParse({
      title: announcementTitle,
      priority: priorityApi,
      message: announcementContent,
      attachmentUrl: announcementAttachmentUrl.trim() ? announcementAttachmentUrl : undefined,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid announcement"
      toast.error(message)
      return
    }

    try {
      await createAnnouncementMutation.mutateAsync({
        title: parsed.data.title,
        priority: parsed.data.priority,
        message: parsed.data.message,
        attachmentUrl: parsed.data.attachmentUrl,
        attachment: announcementAttachmentFile ?? undefined,
      })

      setAnnouncementTitle("")
      setAnnouncementContent("")
      setAnnouncementPriority("medium")
      setAnnouncementAttachmentUrl("")
      setAnnouncementAttachmentFile(null)
      setCreateAnnouncementOpen(false)
      toast.success("Announcement posted")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post announcement"
      toast.error(message)
    }
  }

  const handleUpdateAnnouncement = async (announcementId: string) => {
    const parsedId = announcementIdSchema.safeParse(announcementId)
    if (!parsedId.success) {
      toast.error(parsedId.error.issues[0]?.message ?? "Invalid announcement ID")
      return
    }

    if (announcementAttachmentFile && announcementAttachmentUrl.trim()) {
      toast.error("Choose either an attachment file or an attachment URL")
      return
    }

    if (announcementAttachmentFile && announcementAttachmentFile.size > 5 * 1024 * 1024) {
      toast.error("Attachment must be 5MB or less")
      return
    }

    const priorityApi =
      announcementPriority === "high" ? "HIGH" : announcementPriority === "low" ? "LOW" : "MEDIUM"

    const parsed = updateMyGroupAnnouncementSchema.safeParse({
      title: announcementTitle,
      priority: priorityApi,
      message: announcementContent,
      attachmentUrl: announcementAttachmentUrl.trim() ? announcementAttachmentUrl : undefined,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid announcement"
      toast.error(message)
      return
    }

    try {
      await updateAnnouncementMutation.mutateAsync({
        announcementId: parsedId.data,
        dto: {
          title: parsed.data.title,
          priority: parsed.data.priority,
          message: parsed.data.message,
          attachmentUrl: parsed.data.attachmentUrl,
          attachment: announcementAttachmentFile ?? undefined,
        },
      })

      setEditingAnnouncementId(null)
      setAnnouncementTitle("")
      setAnnouncementContent("")
      setAnnouncementPriority("medium")
      setAnnouncementAttachmentUrl("")
      setAnnouncementAttachmentFile(null)
      setCreateAnnouncementOpen(false)
      toast.success("Announcement updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update announcement"
      toast.error(message)
    }
  }

  const handleSubmitAnnouncement = async () => {
    if (!isEditingAnnouncement) {
      await handleCreateAnnouncement()
      return
    }

    if (!editingAnnouncementId) return
    await handleUpdateAnnouncement(editingAnnouncementId)
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with your group leader and team members
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="chats" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chats</span>
          </TabsTrigger>
          <TabsTrigger value="advisor" className="gap-2">
            <UserRound className="h-4 w-4" />
            <span>Chat with Advisor</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Announcements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <Badge variant="outline">{filteredConversations.length} total</Badge>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0 ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            {conv.avatar ? (
                              <AvatarImage src={conv.avatar} />
                            ) : (
                              <AvatarFallback className={conv.type === 'group' ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'}>
                                {conv.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(conv.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {conv.status && (
                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(conv.status)} ring-2 ring-white`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{conv.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatMessageTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No conversations found</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 flex flex-col">
              {effectiveSelectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {effectiveSelectedConversation.avatar ? (
                              <AvatarImage src={effectiveSelectedConversation.avatar} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {effectiveSelectedConversation.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(effectiveSelectedConversation.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {effectiveSelectedConversation.status && (
                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(effectiveSelectedConversation.status)} ring-2 ring-white`} />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{effectiveSelectedConversation.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {effectiveSelectedConversation.type === 'group' 
                              ? `${effectiveSelectedConversation.participants?.length} participants` 
                              : effectiveSelectedConversation.status === 'online' ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleCall('audio')}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleCall('video')}>
                          <Video className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                            <DropdownMenuItem>Block</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Group Participants (if group chat) - Using div border instead of Separator */}
                    {effectiveSelectedConversation.type === 'group' && effectiveSelectedConversation.participants && (
                      <>
                        <div className="h-px w-full bg-border my-2" />
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {effectiveSelectedConversation.participants.map((participant) => (
                            <div key={participant.id} className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                              <span className={`h-2 w-2 rounded-full ${getStatusColor(participant.status)}`} />
                              <span className="text-xs">{participant.name.split(' ')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {(callPhase === "live" || isGroupCallOngoing) && !isVideoDialogOpen && (
                      <div className="mt-2 flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          Video call in progress
                          {typeof groupCallParticipantCount === "number" && groupCallParticipantCount > 0
                            ? ` • ${groupCallParticipantCount} participant${groupCallParticipantCount > 1 ? "s" : ""}`
                            : ""}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (callPhase === "live") {
                              setIsVideoDialogOpen(true)
                              return
                            }
                            openVideoPrejoin()
                          }}
                        >
                          {callPhase === "live" ? "Return to call" : "Join call"}
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-4">
                    <div ref={messagesScrollRootRef} className="h-full">
                      <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {messages[effectiveSelectedConversation.id]?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderId === 'current' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[70%] ${msg.senderId === 'current' ? 'flex-row-reverse' : ''}`}>
                              {msg.senderId !== 'current' && (
                                <Avatar className="h-8 w-8 mt-1">
                                  {msg.senderAvatar ? (
                                    <AvatarImage src={msg.senderAvatar} />
                                  ) : (
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(msg.senderName)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              )}
                              <div>
                                {msg.senderId !== 'current' && (
                                  <p className="text-xs font-medium mb-1 ml-1">{msg.senderName}</p>
                                )}
                                <ContextMenu>
                                  <ContextMenuTrigger asChild>
                                    <div
                                      className={`p-3 rounded-lg ${
                                        msg.senderId === 'current'
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted'
                                      }`}
                                      onContextMenu={(e) => {
                                        // Power shortcuts (optional):
                                        // - Shift + Right click: reply-to toggle
                                        // - Alt + Right click: default reaction toggle
                                        // - Ctrl/Meta + Right click: edit (sender only)
                                        // - Shift + Alt + Right click: delete (sender only)
                                        // Plain right-click opens the menu.
                                        if (e.shiftKey && e.altKey) {
                                          e.preventDefault()
                                          void deleteMessage(msg.id)
                                          return
                                        }

                                        if (e.ctrlKey || e.metaKey) {
                                          e.preventDefault()
                                          void editMessage({ messageId: msg.id, fallbackText: msg.content })
                                          return
                                        }

                                        if (e.shiftKey) {
                                          e.preventDefault()
                                          toggleReplyToMessage(msg.id, { senderName: msg.senderName, content: msg.content })
                                          return
                                        }

                                        if (e.altKey) {
                                          e.preventDefault()
                                          void toggleDefaultReactionOnMessage(msg.id)
                                        }
                                      }}
                                    >
                                      {msg.replyTo && (
                                        <div className="mb-2 rounded bg-background/20 px-2 py-1">
                                          <p className="text-xs opacity-80">
                                            Replying to {msg.replyTo.senderName}
                                          </p>
                                          {msg.replyTo.content ? (
                                            <p className="text-xs opacity-70">“{msg.replyTo.content}”</p>
                                          ) : null}
                                        </div>
                                      )}
                                      <p className="text-sm">{msg.content}</p>
                                      {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {msg.attachments.map((att, idx) => (
                                            <a
                                              key={idx}
                                              className="flex items-center gap-2 text-xs bg-background/20 rounded p-1 hover:underline"
                                              href={att.url}
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                void downloadAttachment({ url: att.url, name: att.name, mimeType: att.mimeType })
                                              }}
                                              rel="noreferrer"
                                            >
                                              {att.mimeType?.startsWith("image/") ? (
                                                <img
                                                  src={att.url}
                                                  alt={att.name}
                                                  className="h-8 w-8 rounded border object-cover"
                                                />
                                              ) : (
                                                <Paperclip className="h-3 w-3" />
                                              )}
                                              <span className="truncate">{att.name}</span>
                                              <span className="text-xs opacity-70">({formatBytes(att.sizeBytes)})</span>
                                            </a>
                                          ))}
                                        </div>
                                      )}

                                      {msg.reactions && msg.reactions.items.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {msg.reactions.items.map((r) => (
                                            <span
                                              key={r.emoji}
                                              className={
                                                "inline-flex items-center gap-1 rounded-full bg-background/20 px-2 py-0.5 text-xs" +
                                                (msg.reactions?.myReaction === r.emoji ? " ring-1 ring-border" : "")
                                              }
                                            >
                                              <span>{r.emoji}</span>
                                              <span className="opacity-80">{r.count}</span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem
                                      onSelect={() => {
                                        toggleReplyToMessage(msg.id, { senderName: msg.senderName, content: msg.content })
                                      }}
                                      disabled={msg.id.startsWith('client-')}
                                    >
                                      Reply
                                      <ContextMenuShortcut>Shift+RClick</ContextMenuShortcut>
                                    </ContextMenuItem>
                                    <ContextMenuSub>
                                      <ContextMenuSubTrigger inset disabled={msg.id.startsWith('client-')}>
                                        React
                                        <ContextMenuShortcut>Alt+RClick</ContextMenuShortcut>
                                      </ContextMenuSubTrigger>
                                      <ContextMenuSubContent>
                                        <ContextMenuItem
                                          onSelect={() => {
                                            void setReactionOnMessage({ messageId: msg.id, emoji: null })
                                          }}
                                          disabled={msg.id.startsWith('client-') || !msg.reactions?.myReaction}
                                        >
                                          Remove reaction
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <div className="grid grid-cols-5 gap-1 p-1">
                                          {[
                                            "😀",
                                            "😂",
                                            "😍",
                                            "👍",
                                            "🎉",
                                            "🙏",
                                            "😢",
                                            "😡",
                                            "😊",
                                            "🤔",
                                            "😮",
                                            "🔥",
                                            "💯",
                                            "✅",
                                            "❌",
                                            "👏",
                                            "🤝",
                                            "💪",
                                            "😎",
                                            "❤️",
                                          ].map((emoji) => (
                                            <ContextMenuItem
                                              key={emoji}
                                              className="h-9 w-9 justify-center px-0 py-0"
                                              onSelect={() => {
                                                void setReactionOnMessage({ messageId: msg.id, emoji })
                                              }}
                                              disabled={msg.id.startsWith('client-')}
                                            >
                                              <span className="text-base leading-none">{emoji}</span>
                                              {msg.reactions?.myReaction === emoji ? (
                                                <Check className="absolute right-1 top-1 h-3 w-3 opacity-70" />
                                              ) : null}
                                            </ContextMenuItem>
                                          ))}
                                        </div>
                                      </ContextMenuSubContent>
                                    </ContextMenuSub>
                                    <ContextMenuItem
                                      onSelect={() => {
                                        void editMessage({ messageId: msg.id, fallbackText: msg.content })
                                      }}
                                      disabled={msg.senderId !== 'current' || msg.id.startsWith('client-')}
                                    >
                                      Edit
                                      <ContextMenuShortcut>Ctrl+RClick</ContextMenuShortcut>
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                      variant="destructive"
                                      onSelect={() => {
                                        void deleteMessage(msg.id)
                                      }}
                                      disabled={msg.senderId !== 'current' || msg.id.startsWith('client-')}
                                    >
                                      Delete
                                      <ContextMenuShortcut>Shift+Alt+RClick</ContextMenuShortcut>
                                    </ContextMenuItem>
                                  </ContextMenuContent>
                                </ContextMenu>
                                <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                                  msg.senderId === 'current' ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span>{formatMessageTime(msg.timestamp)}</span>
                                  {msg.senderId === 'current' && (
                                    <>
                                      {msg.id.startsWith('client-') ? (
                                        <Clock className="h-3 w-3" />
                                      ) : msg.status === 'read' ? (
                                        <CheckCheck className="h-3 w-3 text-primary" />
                                      ) : msg.status === 'delivered' ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </>
                                  )}
                                </div>
                                {msg.senderId === 'current' && msg.id === latestMyMessageId && (msg.readBy?.length ?? 0) > 0 && (
                                  <div
                                    className="mt-0.5 text-xs text-muted-foreground text-right"
                                    title={`Seen by ${msg.readBy!.join(', ')}`}
                                  >
                                    Seen by {msg.readBy!.slice(0, 2).join(', ')}
                                    {msg.readBy!.length > 2 ? ` +${msg.readBy!.length - 2}` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      </ScrollArea>
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    {replyToMessageId && (
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Replying to {activeReplyPreview?.senderName ?? "message"}
                          </p>
                          {activeReplyPreview?.content ? (
                            <p className="text-xs truncate">“{activeReplyPreview.content}”</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyToMessageId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {queuedAttachment && (
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Attached file</p>
                          <p className="text-xs truncate">
                            {queuedAttachment.name}{" "}<span className="opacity-70">({formatBytes(queuedAttachment.size)})</span>
                          </p>
                          {queuedAttachment.mimeType?.startsWith("image/") ? (
                            <div className="mt-2">
                              <img
                                src={queuedAttachment.url}
                                alt={queuedAttachment.name}
                                className="max-h-40 max-w-[240px] rounded-md border object-contain"
                                onClick={() => window.open(queuedAttachment.url, "_blank", "noopener,noreferrer")}
                              />
                            </div>
                          ) : null}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setQueuedAttachment(null)}>
                          Remove
                        </Button>
                      </div>
                    )}

                    {typingUserIds.length > 0 && effectiveSelectedConversation.type === 'group' && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        {(() => {
                          const group = myProjectGroupQuery.data
                          const nameById = new Map<string, string>()

                          const participants = effectiveSelectedConversation.participants ?? []
                          for (const p of participants) {
                            nameById.set(p.id, p.name)
                          }

                          if (group) {
                            const leaderName = `${group.leader.firstName} ${group.leader.lastName}`.trim() || group.leader.email
                            nameById.set(group.leader.id, leaderName)

                            for (const member of group.members) {
                              const memberName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email
                              // Map both the membership id and the underlying user id to the same display name.
                              nameById.set(member.id, memberName)
                              nameById.set(member.user.id, memberName)
                            }
                          }

                          const names = typingUserIds
                            .map((id) => nameById.get(id))
                            .filter((n): n is string => Boolean(n))
                            .map((n) => n.split(' ')[0]!)

                          const label = names.length > 0 ? names.join(', ') : 'Someone'
                          return `${label} typing...`
                        })()}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0] ?? null
                          e.currentTarget.value = ""
                          void handleAttachmentSelected(file)
                        }}
                      />
                      <Button variant="outline" size="icon" onClick={handlePickAttachment} disabled={isUploadingAttachment}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        ref={messageInputRef}
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => handleMessageInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setReplyToMessageId(null)
                            return
                          }
                          if (e.key === 'Enter') {
                            handleSendMessage()
                          }
                        }}
                        className="flex-1"
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" type="button">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {[
                            "😀",
                            "😂",
                            "😍",
                            "👍",
                            "🎉",
                            "🙏",
                            "😢",
                            "😡",
                            "😊",
                          ].map((emoji) => (
                            <DropdownMenuItem key={emoji} onSelect={() => insertEmojiIntoMessageInput(emoji)}>
                              <span className="text-base leading-none">{emoji}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        onClick={handleSendMessage}
                        disabled={(!messageInput.trim() && !queuedAttachment) || isUploadingAttachment}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Chat with Advisor - same layout as Chats */}
        <TabsContent value="advisor" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Advisor conversation list (single item) */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Chat with Advisor</CardTitle>
                  <Badge variant="outline">1 conversation</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Private conversation with your project advisor
                </p>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="flex items-start gap-3 p-4 cursor-default bg-muted/50 border-b">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/sarah.jpg" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(advisorProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(advisorProfile.status)} ring-2 ring-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{advisorProfile.name}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {advisorMessages.length > 0
                            ? formatMessageTime(advisorMessages[advisorMessages.length - 1].timestamp)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {advisorMessages.length > 0
                            ? advisorMessages[advisorMessages.length - 1].content
                            : 'Start a conversation with your advisor'}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Advisor chat window */}
            <Card className="lg:col-span-2 flex flex-col">
              {/* Chat Header - matches Chats section */}
              <CardHeader className="border-b py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/sarah.jpg" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(advisorProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${getStatusColor(advisorProfile.status)} ring-2 ring-white`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{advisorProfile.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {advisorProfile.status === 'online' ? 'Online' : advisorProfile.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => alert(`Audio call initiated with ${advisorProfile.name}`)}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => alert(`Video call initiated with ${advisorProfile.name}`)}>
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {/* Messages - matches Chats section */}
              <CardContent className="flex-1 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {advisorMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'current' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${msg.senderId === 'current' ? 'flex-row-reverse' : ''}`}>
                          {msg.senderId !== 'current' && (
                            <Avatar className="h-8 w-8 mt-1">
                              {msg.senderAvatar ? (
                                <AvatarImage src={msg.senderAvatar} />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(msg.senderName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          )}
                          <div>
                            {msg.senderId !== 'current' && (
                              <p className="text-xs font-medium mb-1 ml-1">{msg.senderName}</p>
                            )}
                            <div
                              className={`p-3 rounded-lg ${
                                msg.senderId === 'current'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      className="flex items-center gap-2 text-xs bg-background/20 rounded p-1 hover:underline"
                                      href={att.url}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        void downloadAttachment({ url: att.url, name: att.name, mimeType: att.mimeType })
                                      }}
                                      rel="noreferrer"
                                    >
                                      {att.mimeType?.startsWith("image/") ? (
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          className="h-8 w-8 rounded border object-cover"
                                        />
                                      ) : (
                                        <Paperclip className="h-3 w-3" />
                                      )}
                                      <span className="truncate">{att.name}</span>
                                      <span className="text-xs opacity-70">({formatBytes(att.sizeBytes)})</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                              msg.senderId === 'current' ? 'justify-end' : 'justify-start'
                            }`}>
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {msg.senderId === 'current' && (
                                <>
                                  {msg.status === 'read' && <CheckCheck className="h-3 w-3 text-primary" />}
                                  {msg.status === 'delivered' && <Check className="h-3 w-3" />}
                                  {msg.status === 'sent' && <Clock className="h-3 w-3" />}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input - matches Chats section */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={advisorInput}
                    onChange={(e) => setAdvisorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAdvisorMessage()}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSendAdvisorMessage} disabled={!advisorInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Team Announcements
                  </CardTitle>
                  <CardDescription>
                    Important updates from your Group Leader
                  </CardDescription>
                </div>

                {isApprovedGroupManager && (
                  <Button className="gap-2" onClick={openNewAnnouncementDialog}>
                    <Plus className="h-4 w-4" />
                    Create Announcement
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcementsQuery.isLoading ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">Loading announcements…</p>
                  </div>
                ) : announcementsQuery.isError ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">Couldn’t load announcements</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Please try again.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" onClick={() => announcementsQuery.refetch()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (announcementPagination?.total ?? 0) === 0 ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No announcements yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isApprovedGroupManager
                        ? "Create the first announcement for your team."
                        : "Your group leader will post updates here."}
                    </p>

                    {isApprovedGroupManager && (
                      <div className="mt-4 flex justify-center">
                        <Button className="gap-2" onClick={openNewAnnouncementDialog}>
                          <Plus className="h-4 w-4" />
                          Create Announcement
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  announcements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start border-l-4 border-l-transparent hover:border-l-primary transition-all">
                        <div className="p-4 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                announcement.priority === 'high' ? 'bg-red-100' :
                                announcement.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                              }`}>
                                <Bell className={`h-5 w-5 ${
                                  announcement.priority === 'high' ? 'text-red-600' :
                                  announcement.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">{announcement.title}</h4>
                                  <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                                    {announcement.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>

                                {announcement.attachmentUrl && (
                                  <div className="mt-2">
                                    <a
                                      href={announcement.attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      Open link
                                    </a>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>Posted by {announcement.author}</span>
                                  <span>•</span>
                                  <span>{new Date(announcement.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {canManageAnnouncements && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      aria-label="Announcement actions"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      disabled={updateAnnouncementMutation.isPending}
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        openEditAnnouncementDialog(announcement)
                                      }}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={deleteAnnouncementMutation.isPending}
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        void handleDeleteAnnouncement(announcement.id)
                                      }}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}

                {announcementPagination && announcementPagination.pages > 1 && !announcementsQuery.isLoading && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setAnnouncementsPage((prev) => Math.max(1, prev - 1))}
                      disabled={announcementsPage <= 1}
                    >
                      Previous
                    </Button>

                    <p className="text-sm text-muted-foreground">
                      Page {announcementsPage} of {announcementsTotalPages}
                    </p>

                    <Button
                      variant="outline"
                      onClick={() =>
                        setAnnouncementsPage((prev) => Math.min(announcementsTotalPages, prev + 1))
                      }
                      disabled={announcementsPage >= announcementsTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isVideoDialogOpen} onOpenChange={handleVideoDialogOpenChange}>
        <DialogContent className="sm:max-w-[1100px] p-0 overflow-hidden h-[85vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Group video call</DialogTitle>
            <DialogDescription>
              Join and manage your project group video call session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Group video call</p>
                <p className="text-xs text-muted-foreground">{effectiveSelectedConversation?.name ?? "Project Group"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={endVideoCall}>
                Leave call
              </Button>
            </div>

            {(callPhase === "prejoin" || callPhase === "joining") && (
              <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Ready to join?</h3>
                    <p className="text-sm text-muted-foreground">
                      This call is for your current project group. You can return to chat anytime.
                    </p>
                    {videoCallError && (
                      <p className="text-sm text-destructive">{videoCallError}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Room</span>
                    <span className="font-mono text-xs">{jitsiRoomName ?? "Not ready"}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={endVideoCall} disabled={callPhase === "joining"}>
                      Cancel
                    </Button>
                    <Button onClick={() => void joinVideoCall()} disabled={callPhase === "joining" || !jitsiRoomName}>
                      {callPhase === "joining" ? "Joining..." : "Join call"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className={callPhase === "live" ? "flex-1" : "hidden"}>
              <div ref={jitsiContainerRef} className="h-full w-full bg-black" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createAnnouncementOpen} onOpenChange={handleAnnouncementDialogOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{isEditingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
            <DialogDescription>
              {isEditingAnnouncement
                ? "Update this announcement. Changes are visible to group members."
                : "Post an update to your team. This is visible to group members."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="e.g., Meeting moved to Friday"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <select
                id="announcement-priority"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as Announcement["priority"])}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-content">Announcement</Label>
              <Textarea
                id="announcement-content"
                placeholder="Write your announcement..."
                className="min-h-[120px]"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-attachment-url">Attachment URL (optional)</Label>
              <Input
                id="announcement-attachment-url"
                placeholder="https://..."
                value={announcementAttachmentUrl}
                onChange={(e) => setAnnouncementAttachmentUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-attachment-file">Attachment file (optional)</Label>
              <Input
                id="announcement-attachment-file"
                type="file"
                onChange={(e) => setAnnouncementAttachmentFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Choose either a file or a URL (max 5MB).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAnnouncementOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAnnouncement}>
              {isEditingAnnouncement ? "Save Changes" : "Post Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}