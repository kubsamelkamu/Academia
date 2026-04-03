"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Paperclip,
  Search,
  Send,
  Users,
  MessageSquare,
  X,
  Pin,
  SmilePlus,
  Reply,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  FolderKanban,
  MoreVertical,
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth-store"
import { useQueryClient } from "@tanstack/react-query"
import { useAdvisorProjects } from "@/lib/hooks/use-advisor-projects"
import {
  deleteChatRoomMessage,
  markChatRoomReadUpTo,
  patchChatRoomMessage,
  pinChatRoomMessage,
  removeChatRoomMessageReaction,
  setChatRoomMessageReaction,
  unpinChatRoomMessage,
  uploadChatRoomAttachment,
} from "@/lib/api/chat"
import {
  chatKeys,
  useAdvisorChatRoom,
  useInfiniteChatRoomMessages,
} from "@/lib/hooks/use-chat"
import { acquireChatSocket, releaseChatSocket } from "@/lib/realtime/chat-socket"
import type {
  ChatMessage,
  ChatMessageAttachment,
  ListChatRoomMessagesResponse,
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageNewPayload,
  MessageReadUpToPayload,
  MessageSendAckData,
  PresenceUpdatePayload,
  ReactionRemovedPayload,
  ReactionUpdatedPayload,
  SocketAck,
  TypingUpdatePayload,
} from "@/types/chat"
import type { ApiAdvisorProject } from "@/lib/api/advisor"

// ─── Local types ────────────────────────────────────────────────────────────

type MessageStatus = "sent" | "delivered" | "read"

interface DisplayMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  status: MessageStatus
  reactions?: { items: { emoji: string; count: number }[]; myReaction: string | null }
  readBy?: string[]
  replyTo?: { messageId: string; senderName: string; content: string } | null
  attachments?: { name: string; sizeBytes: number; url: string; mimeType?: string }[]
  isPinned?: boolean
  editedAt?: string | null
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (days === 1) return "Yesterday"
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" })
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"] as const
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  const digits = i === 0 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${units[i]}`
}

function truncate(text: string, max = 80): string {
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdvisorMessagesPage() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const tenantDomain = useAuthStore((s) => s.tenantDomain)
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const advisorProjectsQuery = useAdvisorProjects()
  const projects = advisorProjectsQuery.data ?? []

  // Read ?group=<projectId> from the URL on the client only — avoids useSearchParams and SSR mismatch
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectSearch, setProjectSearch] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const id = new URLSearchParams(window.location.search).get("group")
    if (id) setSelectedProjectId(id)
  }, [])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  const handleSelectProject = useCallback(
    (project: ApiAdvisorProject) => {
      setSelectedProjectId(project.id)
      router.replace(`?group=${encodeURIComponent(project.id)}`, { scroll: false })
    },
    [router]
  )

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
          p.group.name.toLowerCase().includes(projectSearch.toLowerCase())
      ),
    [projects, projectSearch]
  )

  // ── Chat room for the selected project ────────────────────────────────────
  const chatRoomQuery = useAdvisorChatRoom({
    projectId: selectedProjectId,
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
  })

  const roomId = chatRoomQuery.data?.roomId ?? null
  const projectGroupId = chatRoomQuery.data?.projectGroupId ?? null

  // ── Infinite messages ─────────────────────────────────────────────────────
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
  const latestMessageId =
    latestMessage && roomId && latestMessage.roomId === roomId ? latestMessage.id : null

  // ── Cache helpers ──────────────────────────────────────────────────────────

  const updateInfiniteMessagesCache = useCallback(
    (updater: (page: ListChatRoomMessagesResponse) => ListChatRoomMessagesResponse) => {
      if (!roomId) return
      queryClient.setQueryData(
        chatKeys().roomMessagesInfinite({ roomId, limit: 30 }),
        (
          previous:
            | { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] }
            | undefined
        ) => {
          if (!previous) return previous
          return { ...previous, pages: previous.pages.map(updater) }
        }
      )
    },
    [queryClient, roomId]
  )

  const updateInfiniteMessageById = useCallback(
    (params: { messageId: string; update: (m: ChatMessage) => ChatMessage }) => {
      updateInfiniteMessagesCache((page) => {
        const idx = page.items.findIndex((m) => m.id === params.messageId)
        if (idx < 0) return page
        const nextItems = [...page.items]
        nextItems[idx] = params.update(nextItems[idx]!)
        return { ...page, items: nextItems }
      })
    },
    [updateInfiniteMessagesCache]
  )

  const upsertOptimisticMessageInCache = useCallback(
    (params: { roomId: string; message: ChatMessage & { __optimistic?: true }; limit: number }) => {
      queryClient.setQueryData(
        chatKeys().roomMessagesInfinite({ roomId: params.roomId, limit: params.limit }),
        (
          previous:
            | { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] }
            | undefined
        ) => {
          const basePage: ListChatRoomMessagesResponse =
            previous?.pages?.[0] ?? { items: [], nextCursor: null, readStates: [] }
          const nextItems = [params.message, ...basePage.items]
            .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx)
            .slice(0, params.limit)
          const nextFirstPage: ListChatRoomMessagesResponse = { ...basePage, items: nextItems }
          if (!previous) return { pages: [nextFirstPage], pageParams: [null] }
          return { ...previous, pages: [nextFirstPage, ...previous.pages.slice(1)] }
        }
      )
    },
    [queryClient]
  )

  const reconcileClientMessageIdInCache = useCallback(
    (params: {
      roomId: string
      clientMessageId?: string
      canonicalMessage: ChatMessage
      limit: number
    }) => {
      queryClient.setQueryData(
        chatKeys().roomMessagesInfinite({ roomId: params.roomId, limit: params.limit }),
        (
          previous:
            | { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] }
            | undefined
        ) => {
          const basePage: ListChatRoomMessagesResponse =
            previous?.pages?.[0] ?? { items: [], nextCursor: null, readStates: [] }
          const withoutOptimistic = params.clientMessageId
            ? basePage.items.filter((m) => m.id !== params.clientMessageId)
            : basePage.items
          const withoutDup = withoutOptimistic.filter((m) => m.id !== params.canonicalMessage.id)
          const nextFirstPage: ListChatRoomMessagesResponse = {
            ...basePage,
            items: [params.canonicalMessage, ...withoutDup].slice(0, params.limit),
          }
          if (!previous) return { pages: [nextFirstPage], pageParams: [null] }
          return { ...previous, pages: [nextFirstPage, ...previous.pages.slice(1)] }
        }
      )
    },
    [queryClient]
  )

  const invalidateRoomMessages = useCallback(() => {
    if (!roomId) return
    queryClient.invalidateQueries({
      queryKey: chatKeys().roomMessagesInfinite({ roomId, limit: 30 }),
    })
  }, [queryClient, roomId])

  const updateReadStateInCache = useCallback(
    (payload: { roomId: string; userId: string; readUpToMessageId: string; readAt: string }) => {
      queryClient.setQueryData(
        chatKeys().roomMessagesInfinite({ roomId: payload.roomId, limit: 30 }),
        (
          previous:
            | { pages: ListChatRoomMessagesResponse[]; pageParams: unknown[] }
            | undefined
        ) => {
          if (!previous?.pages[0]) return previous
          const firstPage = previous.pages[0]
          const existing = firstPage.readStates ?? []
          const next = existing.some((s) => s.userId === payload.userId)
            ? existing.map((s) =>
                s.userId === payload.userId
                  ? { ...s, lastReadMessageId: payload.readUpToMessageId, readAt: payload.readAt }
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
          return { ...previous, pages: nextPages }
        }
      )
    },
    [queryClient]
  )

  const findMessageInCache = useCallback(
    (messageId: string): ChatMessage | null => {
      const pages = chatMessagesData?.pages ?? []
      for (const page of pages) {
        const hit = page.items.find((m) => m.id === messageId)
        if (hit) return hit
      }
      return null
    },
    [chatMessagesData]
  )

  const emitSocketWithTimeoutAck = useCallback(
    <T,>(params: {
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
    },
    []
  )

  // ── Socket ─────────────────────────────────────────────────────────────────

  const socketRef = useRef<ReturnType<typeof acquireChatSocket> | null>(null)
  const joinedRoomIdRef = useRef<string | null>(null)
  const onlineUserIdsRef = useRef<string[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const typingUserIdsRef = useRef<Set<string>>(new Set())
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])

  useEffect(() => {
    if (!accessToken || !projectGroupId || !roomId) {
      socketRef.current?.disconnect?.()
      socketRef.current = null
      joinedRoomIdRef.current = null
      onlineUserIdsRef.current = []
      setOnlineUserIds([])
      typingUserIdsRef.current.clear()
      setTypingUserIds([])
      return
    }

    const socket = acquireChatSocket({ accessToken, tenantDomain })
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
        const next = page.items.filter((m) => m.id !== raw.messageId)
        if (next.length === page.items.length) return page
        return { ...page, items: next }
      })
    }

    const handleTypingUpdate = (payload: unknown) => {
      const raw = payload as TypingUpdatePayload
      if (!raw || typeof raw !== "object") return
      const rawRoomId = (raw as { roomId?: unknown }).roomId
      if (typeof rawRoomId === "string" && rawRoomId !== roomId) return
      if (typeof raw.userId !== "string") return
      if (typeof raw.isTyping !== "boolean") return
      if (raw.userId === currentUser?.id) return
      if (raw.isTyping) typingUserIdsRef.current.add(raw.userId)
      else typingUserIdsRef.current.delete(raw.userId)
      setTypingUserIds(Array.from(typingUserIdsRef.current))
    }

    const handleReactionUpdated = (payload: unknown) => {
      const raw = payload as ReactionUpdatedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.messageId !== "string") return
      if (typeof raw.userId !== "string") return
      if (typeof raw.emoji !== "string") return

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
          return { ...current, reactions: { items, myReaction: raw.emoji } }
        },
      })
    }

    const handleReactionRemoved = (payload: unknown) => {
      const raw = payload as ReactionRemovedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.messageId !== "string") return
      if (typeof raw.userId !== "string") return

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
          return { ...current, reactions: { items, myReaction: null } }
        },
      })
    }

    const joinRoom = () => {
      socket.emit(
        "chat:join",
        { projectGroupId },
        (ack: SocketAck<{ roomId: string; projectGroupId: string; onlineUserIds: string[] }>) => {
          if (!ack || typeof ack !== "object") return
          if (ack.ok !== true) {
            toast.error("Failed to join group chat")
            return
          }
          joinedRoomIdRef.current = ack.data.roomId
          onlineUserIdsRef.current = ack.data.onlineUserIds
          setOnlineUserIds(ack.data.onlineUserIds)

          socket.emit(
            "presence:get",
            { roomId: ack.data.roomId },
            (pAck: SocketAck<{ roomId: string; onlineUserIds: string[] }>) => {
              if (!pAck || pAck.ok !== true) return
              onlineUserIdsRef.current = pAck.data.onlineUserIds
              setOnlineUserIds(pAck.data.onlineUserIds)
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
      typingUserIdsRef.current.clear()
      setTypingUserIds([])
    }

    socket.on("presence:update", handlePresenceUpdate)
    socket.on("message:new", handleMessageNew)
    socket.on("message:readUpTo", handleReadUpTo)
    socket.on("message:edited", handleMessageEdited)
    socket.on("message:deleted", handleMessageDeleted)
    socket.on("typing:update", handleTypingUpdate)
    socket.on("reaction:updated", handleReactionUpdated)
    socket.on("reaction:removed", handleReactionRemoved)
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    if (socket.connected) handleConnect()

    return () => {
      socket.off("presence:update", handlePresenceUpdate)
      socket.off("message:new", handleMessageNew)
      socket.off("message:readUpTo", handleReadUpTo)
      socket.off("message:edited", handleMessageEdited)
      socket.off("message:deleted", handleMessageDeleted)
      socket.off("typing:update", handleTypingUpdate)
      socket.off("reaction:updated", handleReactionUpdated)
      socket.off("reaction:removed", handleReactionRemoved)
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      releaseChatSocket(socket)
      if (socketRef.current === socket) socketRef.current = null
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

  // ── Typing ────────────────────────────────────────────────────────────────

  const emitTypingStop = useCallback(() => {
    if (!roomId) return
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = null
    }
    if (!isTypingRef.current) return
    isTypingRef.current = false
    socketRef.current?.emit("typing:stop", { roomId })
  }, [roomId])

  const emitTypingStart = useCallback(() => {
    if (!roomId) return
    const socket = socketRef.current
    if (!socket) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("typing:start", { roomId })
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current)
    typingStopTimerRef.current = setTimeout(() => emitTypingStop(), 1500)
  }, [emitTypingStop, roomId])

  useEffect(() => {
    return () => { emitTypingStop() }
  }, [emitTypingStop])

  // ── Read receipts ─────────────────────────────────────────────────────────

  const lastReadUpToMessageIdRef = useRef<string | null>(null)
  const isAtBottomRef = useRef(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [openMessageActionsId, setOpenMessageActionsId] = useState<string | null>(null)
  const messagesScrollRootRef = useRef<HTMLDivElement | null>(null)
  const pendingTopPaginationScrollRef = useRef<{
    prevScrollHeight: number
    prevScrollTop: number
  } | null>(null)
  const autoFillRoomIdRef = useRef<string | null>(null)
  const autoFillAttemptsRef = useRef(0)

  const markReadUpToLatest = useCallback(
    async (messageId: string) => {
      if (!roomId) return
      const userId = currentUser?.id
      if (!userId) return
      if (messageId.startsWith("client-")) return
      if (lastReadUpToMessageIdRef.current === messageId) return
      lastReadUpToMessageIdRef.current = messageId

      const nowIso = new Date().toISOString()
      updateReadStateInCache({ roomId, userId, readUpToMessageId: messageId, readAt: nowIso })

      const socket = socketRef.current
      if (socket?.connected && joinedRoomIdRef.current === roomId) {
        socket.emit(
          "message:markReadUpTo",
          { roomId, messageId },
          (ack: SocketAck<unknown>) => {
            if (ack?.ok === false) toast.error(ack.error?.message ?? "Failed to mark read")
          }
        )
        return
      }

      try {
        await markChatRoomReadUpTo({ roomId, messageId })
      } catch {
        // non-fatal
      }
    },
    [currentUser?.id, roomId, updateReadStateInCache]
  )

  // Auto mark-read when at bottom
  useEffect(() => {
    if (!roomId || !isAtBottom || !latestMessageId) return
    if (latestMessageId.startsWith("client-")) return
    void markReadUpToLatest(latestMessageId)
  }, [isAtBottom, latestMessageId, markReadUpToLatest, roomId])

  // ── Scroll listener ───────────────────────────────────────────────────────

  useEffect(() => {
    const root = messagesScrollRootRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLDivElement>('[data-slot="scroll-area-viewport"]')
    if (!viewport) return

    const thresholdPx = 24
    const computeAtBottom = () =>
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= thresholdPx
    const computeAtTop = () => viewport.scrollTop <= thresholdPx

    const sync = () => {
      const atBottom = computeAtBottom()
      isAtBottomRef.current = atBottom
      setIsAtBottom(atBottom)
    }

    const maybeLoadOlder = () => {
      if (!roomId || !chatHasNextPage || chatIsFetchingNextPage || !computeAtTop()) return
      pendingTopPaginationScrollRef.current = {
        prevScrollHeight: viewport.scrollHeight,
        prevScrollTop: viewport.scrollTop,
      }
      void chatFetchNextPage().then(() => {
        const pending = pendingTopPaginationScrollRef.current
        if (!pending) return
        pendingTopPaginationScrollRef.current = null
        requestAnimationFrame(() => {
          const delta = viewport.scrollHeight - pending.prevScrollHeight
          viewport.scrollTop = pending.prevScrollTop + delta
        })
      })
    }

    const onScroll = () => { sync(); maybeLoadOlder() }
    viewport.addEventListener("scroll", onScroll, { passive: true })
    const rafId = requestAnimationFrame(() => { sync() })

    if (autoFillRoomIdRef.current !== roomId) {
      autoFillRoomIdRef.current = roomId
      autoFillAttemptsRef.current = 0
    }

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
          const delta = viewport.scrollHeight - pending.prevScrollHeight
          viewport.scrollTop = pending.prevScrollTop + delta
        })
      })
    }

    return () => {
      cancelAnimationFrame(rafId)
      viewport.removeEventListener("scroll", onScroll)
    }
  }, [chatFetchNextPage, chatHasNextPage, chatIsFetchingNextPage, chatMessagesData, roomId])

  // ── Message input & send ──────────────────────────────────────────────────

  const messageInputRef = useRef<HTMLInputElement | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [queuedAttachment, setQueuedAttachment] = useState<ChatMessageAttachment | null>(null)

  // Reset input state when switching rooms
  useEffect(() => {
    setMessageInput("")
    setReplyToMessageId(null)
    setQueuedAttachment(null)
    lastReadUpToMessageIdRef.current = null
  }, [roomId])

  const toggleReplyTo = useCallback(
    (messageId: string, preview?: { senderName?: string; content?: string }) => {
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
    },
    []
  )

  const activeReplyPreview = useMemo(() => {
    if (!replyToMessageId) return null
    const target = findMessageInCache(replyToMessageId)
    if (!target) return { senderName: "Message", content: "" }
    const senderName =
      target.senderUserId === currentUser?.id
        ? "You"
        : `${target.sender.firstName} ${target.sender.lastName}`.trim() || "Unknown"
    const rawContent =
      target.text || (target.attachment?.name ? `Attachment: ${target.attachment.name}` : "")
    return { senderName, content: truncate(rawContent, 80) }
  }, [currentUser?.id, findMessageInCache, replyToMessageId])

  const sendMessage = useCallback(
    (params: { text: string | null; attachment: ChatMessageAttachment | null }) => {
      if (!roomId) return
      const socket = socketRef.current
      if (!socket) {
        toast.error("Chat is not connected")
        return
      }

      const text = params.text?.trim() ?? ""
      const attachment = params.attachment
      if (!text && !attachment) return

      const replyingTo = replyToMessageId
      setReplyToMessageId(null)

      const clientMessageId = `client-${Date.now()}`

      if (currentUser?.id) {
        const optimistic: ChatMessage & { __optimistic: true } = {
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
          reactions: { items: [], myReaction: null },
        }
        upsertOptimisticMessageInCache({ roomId, message: optimistic, limit: 30 })
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
    },
    [
      currentUser,
      emitTypingStop,
      reconcileClientMessageIdInCache,
      replyToMessageId,
      roomId,
      upsertOptimisticMessageInCache,
    ]
  )

  const handleSendMessage = () => {
    sendMessage({ text: messageInput, attachment: queuedAttachment })
  }

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value)
    if (!roomId) return
    if (value.trim()) emitTypingStart()
    else emitTypingStop()
  }

  const handlePickAttachment = () => {
    if (isUploadingAttachment) return
    attachmentInputRef.current?.click()
  }

  const handleAttachmentSelected = async (file: File | null) => {
    if (!file || !roomId) return
    const MAX_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      toast.error("Attachment must be 5 MB or less")
      return
    }
    try {
      setIsUploadingAttachment(true)
      const uploaded = await uploadChatRoomAttachment({ roomId, file })
      setQueuedAttachment(uploaded)
      toast.success(`Attached: ${uploaded.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload attachment")
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  // ── Reactions ─────────────────────────────────────────────────────────────

  const applyMyReactionOptimistic = useCallback(
    (params: { messageId: string; prevEmoji: string | null; nextEmoji: string | null }) => {
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
          return { ...current, reactions: { items, myReaction: params.nextEmoji } }
        },
      })
    },
    [updateInfiniteMessageById]
  )

  const setReactionOnMessage = useCallback(
    async (params: { messageId: string; emoji: string | null }) => {
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
        if (!nextEmoji) return
        return setReactionOnMessage({ messageId: params.messageId, emoji: null })
      }
      applyMyReactionOptimistic({ messageId: params.messageId, prevEmoji, nextEmoji })
      const socket = socketRef.current
      if (socket?.connected && joinedRoomIdRef.current === roomId) {
        if (nextEmoji) socket.emit("reaction:set", { roomId, messageId: params.messageId, emoji: nextEmoji })
        else socket.emit("reaction:remove", { roomId, messageId: params.messageId })
        return
      }
      try {
        if (nextEmoji) await setChatRoomMessageReaction({ roomId, messageId: params.messageId, emoji: nextEmoji })
        else await removeChatRoomMessageReaction({ roomId, messageId: params.messageId })
      } catch (error) {
        applyMyReactionOptimistic({ messageId: params.messageId, prevEmoji: nextEmoji, nextEmoji: prevEmoji })
        toast.error(error instanceof Error ? error.message : "Failed to update reaction")
      }
    },
    [applyMyReactionOptimistic, findMessageInCache, roomId]
  )

  // ── Edit / Delete ─────────────────────────────────────────────────────────

  const editMessage = useCallback(
    async (params: { messageId: string; fallbackText?: string }) => {
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
      updateInfiniteMessageById({
        messageId: params.messageId,
        update: (m) => ({ ...m, text: nextText, editedAt: new Date().toISOString() }),
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
            update: (m) => ({ ...m, text: prevText, editedAt: prevEditedAt }),
          })
          toast.error((ack as { error?: { message?: string } }).error?.message ?? "Failed to edit message")
          return
        }
        if (ack !== null) return
      }
      try {
        await patchChatRoomMessage({ roomId, messageId: params.messageId, text: nextText })
      } catch (error) {
        updateInfiniteMessageById({
          messageId: params.messageId,
          update: (m) => ({ ...m, text: prevText, editedAt: prevEditedAt }),
        })
        toast.error(error instanceof Error ? error.message : "Failed to edit message")
      }
    },
    [currentUser?.id, emitSocketWithTimeoutAck, findMessageInCache, roomId, updateInfiniteMessageById]
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
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
      updateInfiniteMessagesCache((page) => ({
        ...page,
        items: page.items.filter((m) => m.id !== messageId),
      }))
      const socket = socketRef.current
      if (socket?.connected && joinedRoomIdRef.current === roomId) {
        const ack = await emitSocketWithTimeoutAck<unknown>({
          socket,
          event: "message:delete",
          payload: { roomId, messageId },
        })
        if (ack && typeof ack === "object" && "ok" in ack && ack.ok === false) {
          toast.error((ack as { error?: { message?: string } }).error?.message ?? "Failed to delete message")
          invalidateRoomMessages()
          return
        }
        if (ack !== null) return
      }
      try {
        await deleteChatRoomMessage({ roomId, messageId })
      } catch {
        // message was already removed from cache; REST may 404 but that's fine
      }
    },
    [
      currentUser?.id,
      emitSocketWithTimeoutAck,
      findMessageInCache,
      invalidateRoomMessages,
      roomId,
      updateInfiniteMessagesCache,
    ]
  )

  // ── Pin / Unpin ────────────────────────────────────────────────────────────

  const togglePinMessage = useCallback(
    async (messageId: string) => {
      if (!roomId) return
      if (messageId.startsWith("client-")) {
        toast.error("Message is not delivered yet")
        return
      }
      const message = findMessageInCache(messageId)
      if (!message) return
      const isPinned = message.isPinned

      updateInfiniteMessageById({
        messageId,
        update: (m) => ({ ...m, isPinned: !isPinned }),
      })

      const socket = socketRef.current
      if (socket?.connected && joinedRoomIdRef.current === roomId) {
        const event = isPinned ? "pin:remove" : "pin:add"
        socket.emit(event, { roomId, messageId })
        return
      }

      try {
        if (isPinned) await unpinChatRoomMessage({ roomId, messageId })
        else await pinChatRoomMessage({ roomId, messageId })
      } catch (error) {
        updateInfiniteMessageById({
          messageId,
          update: (m) => ({ ...m, isPinned }),
        })
        toast.error(error instanceof Error ? error.message : "Failed to update pin")
      }
    },
    [findMessageInCache, roomId, updateInfiniteMessageById]
  )

  // ── Download attachment ───────────────────────────────────────────────────

  const downloadAttachment = useCallback(
    async (att: { url: string; name: string; mimeType?: string }) => {
      try {
        const response = await fetch(att.url)
        if (!response.ok) throw new Error(`Download failed (${response.status})`)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = objectUrl
        a.download = att.name
        a.rel = "noreferrer"
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(objectUrl)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to download file")
        window.open(att.url, "_blank", "noopener,noreferrer")
      }
    },
    []
  )

  // ── Derive display messages ───────────────────────────────────────────────

  const displayMessages: DisplayMessage[] = useMemo(() => {
    if (!roomId) return []

    const currentUserId = currentUser?.id
    const itemsNewestFirst = chatMessagesData?.pages?.flatMap((p) => p.items) ?? []
    const itemsOldestFirst = [...itemsNewestFirst].reverse()

    const firstAdvisorMessageIndex = currentUserId
      ? itemsOldestFirst.findIndex((message) => message.senderUserId === currentUserId)
      : -1

    const advisorScopedItems =
      firstAdvisorMessageIndex >= 0
        ? itemsOldestFirst.slice(firstAdvisorMessageIndex)
        : []

    const messageIdToIndex = new Map<string, number>()
    advisorScopedItems.forEach((m, i) => messageIdToIndex.set(m.id, i))

    const groupMembers = selectedProject?.group
      ? [
          selectedProject.group.leader,
          ...selectedProject.group.members,
        ]
      : []

    const otherParticipantUserIds = groupMembers
      .filter((m) => m.id && m.id !== currentUserId)
      .map((m) => m.id)
      .filter((id, i, arr) => arr.indexOf(id) === i)

    const userNameById = new Map<string, string>(
      groupMembers.map((m) => [
        m.id,
        `${m.firstName} ${m.lastName}`.trim() || m.email,
      ])
    )

    const readStates = chatMessagesData?.pages?.[0]?.readStates ?? []
    const lastReadIndexByUserId = new Map<string, number>()
    for (const state of readStates) {
      const idx = messageIdToIndex.get(state.lastReadMessageId)
      lastReadIndexByUserId.set(state.userId, typeof idx === "number" ? idx : -1)
    }

    return advisorScopedItems.map((m, idx) => {
      const senderName = `${m.sender.firstName} ${m.sender.lastName}`.trim() || "Unknown"
      const isMine = m.senderUserId === currentUserId
      const isOptimistic = (m as { __optimistic?: boolean }).__optimistic === true

      const status: MessageStatus = (() => {
        if (!isMine) return "read"
        if (isOptimistic) return "sent"
        if (otherParticipantUserIds.length === 0) return "delivered"
        const everyoneRead = otherParticipantUserIds.every(
          (uid) => (lastReadIndexByUserId.get(uid) ?? -1) >= idx
        )
        return everyoneRead ? "read" : "delivered"
      })()

      const readBy = (() => {
        if (!isMine || isOptimistic || otherParticipantUserIds.length === 0) return []
        return otherParticipantUserIds
          .filter((uid) => (lastReadIndexByUserId.get(uid) ?? -1) >= idx)
          .map((uid) => userNameById.get(uid) ?? "")
          .filter(Boolean)
      })()

      const replyTo = (() => {
        const referenced =
          m.replyTo ??
          (m.replyToMessageId
            ? (advisorScopedItems[messageIdToIndex.get(m.replyToMessageId) ?? -1] ?? null)
            : null)
        if (!referenced) {
          return m.replyToMessageId
            ? { messageId: m.replyToMessageId, senderName: "Message", content: "" }
            : null
        }
        const refSenderName =
          referenced.senderUserId === currentUserId
            ? "You"
            : `${referenced.sender.firstName} ${referenced.sender.lastName}`.trim() || "Unknown"
        const refContent =
          referenced.text || (referenced.attachment?.name ? `Attachment: ${referenced.attachment.name}` : "")
        return { messageId: referenced.id, senderName: refSenderName, content: truncate(refContent, 80) }
      })()

      return {
        id: m.id,
        senderId: isMine ? "current" : m.senderUserId,
        senderName: isMine ? "You" : senderName,
        senderAvatar: m.sender.avatarUrl ?? undefined,
        content: m.text,
        timestamp: m.createdAt,
        status,
        reactions: m.reactions,
        readBy,
        replyTo,
        attachments: m.attachment
          ? [{ name: m.attachment.name, sizeBytes: m.attachment.size, url: m.attachment.url, mimeType: m.attachment.mimeType }]
          : undefined,
        isPinned: m.isPinned,
        editedAt: m.editedAt,
      }
    })
  }, [chatMessagesData, currentUser?.id, roomId, selectedProject])


  const typingLabel = useMemo(() => {
    if (typingUserIds.length === 0) return null
    const groupMembers = selectedProject?.group
      ? [selectedProject.group.leader, ...selectedProject.group.members]
      : []
    const nameById = new Map<string, string>(
      groupMembers.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim() || m.email])
    )
    const names = typingUserIds
      .map((id) => nameById.get(id) ?? "Someone")
      .slice(0, 3)
    if (names.length === 1) return `${names[0]} is typing…`
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
    return `${names[0]}, ${names[1]} and others are typing…`
  }, [selectedProject, typingUserIds])


  const isConnected = socketRef.current?.connected ?? false
  const memberCount = selectedProject
    ? 1 + (selectedProject.group.members?.length ?? 0)
    : 0
  const onlineCount = onlineUserIds.length

  const groupMembersForHeader = useMemo(() => {
    if (!selectedProject) return []
    return [selectedProject.group.leader, ...selectedProject.group.members]
  }, [selectedProject])

  return (
    <div className="flex h-auto min-h-[60vh] sm:h-[calc(100vh-8rem)] sm:min-h-[500px] flex-col sm:flex-row overflow-hidden rounded-lg border bg-background shadow-sm">

      <div className="flex min-h-0 w-full sm:w-80 flex-shrink-0 flex-col border-b sm:border-b-0 sm:border-r">
        <div className="border-b p-4">
          <h2 className="mb-3 text-lg font-semibold">Group Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search projects…"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {advisorProjectsQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {advisorProjectsQuery.isError && (
            <div className="px-4 py-8 text-center text-sm text-destructive">
              Failed to load projects.
            </div>
          )}

          {!advisorProjectsQuery.isLoading && filteredProjects.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No supervised groups found.
            </div>
          )}

          <div className="space-y-0.5 p-2">
            {filteredProjects.map((project) => {
              const isSelected = project.id === selectedProjectId
              const newest =
                isSelected && displayMessages.length > 0
                  ? displayMessages[displayMessages.length - 1]
                  : null

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelectProject(project)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60 ${
                    isSelected ? "bg-muted" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-medium">{project.group.name}</span>
                      {newest && (
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {formatMessageTime(newest.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{project.title}</p>
                    {newest && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {newest.content || (newest.attachments?.[0] ? `📎 ${newest.attachments[0].name}` : "")}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* ── Main chat area ─── */}
      {!selectedProject ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
          <MessageSquare className="h-16 w-16 opacity-30" />
          <p className="text-lg font-medium">Select a project group to start chatting</p>
          <p className="text-sm">Choose a supervised group from the left panel.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* ── Chat header ── */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedProject.group.name}</span>
                  {chatRoomQuery.isLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedProject.title}</span>
                  <span>·</span>
                  <span>{memberCount} members</span>
                  {onlineCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                        {onlineCount} online
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Member avatars */}
            <div className="flex -space-x-2">
              {groupMembersForHeader.slice(0, 5).map((member) => {
                const name = `${member.firstName} ${member.lastName}`.trim() || member.email
                const isOnline = onlineUserIds.includes(member.id)
                return (
                  <div key={member.id} className="relative" title={name}>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={name} />}
                      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background bg-green-500" />
                    )}
                  </div>
                )
              })}
              {groupMembersForHeader.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                  +{groupMembersForHeader.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* ── Chat room loading / error states ── */}
          {chatRoomQuery.isError && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-destructive">
              <p className="font-medium">Could not load chat room</p>
              <p className="text-sm text-muted-foreground">
                {chatRoomQuery.error instanceof Error
                  ? chatRoomQuery.error.message
                  : "The group may not be approved yet."}
              </p>
              <Button variant="outline" size="sm" onClick={() => chatRoomQuery.refetch()}>
                Retry
              </Button>
            </div>
          )}

          {chatRoomQuery.isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {chatRoomQuery.isSuccess && roomId && (
            <>
              {/* ── Message list ── */}
              <div ref={messagesScrollRootRef} className="relative min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full min-h-0 px-4 py-2">
                {/* Load more indicator */}
                {(chatHasNextPage || chatIsFetchingNextPage) && (
                  <div className="flex justify-center py-2">
                    {chatIsFetchingNextPage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => void chatFetchNextPage()}
                      >
                        <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        Load older messages
                      </Button>
                    )}
                  </div>
                )}

                {chatMessagesQuery.isLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!chatMessagesQuery.isLoading && displayMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                )}

                <div className="space-y-1 pb-2">
                  {displayMessages.map((msg, idx) => {
                    const isMine = msg.senderId === "current"
                    const prevMsg = idx > 0 ? displayMessages[idx - 1] : null
                    const isGrouped = prevMsg?.senderId === msg.senderId
                    const showAvatar = !isMine && !isGrouped

                    return (
                      <div
                        key={msg.id}
                        className={`group flex ${isMine ? "justify-end" : "justify-start"} ${
                          isGrouped ? "mt-0.5" : "mt-3"
                        }`}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setOpenMessageActionsId(msg.id)
                        }}
                      >
                            {/* Avatar (other user) */}
                            {!isMine && (
                              <div className="mr-2 mt-auto w-8 flex-shrink-0">
                                {showAvatar && (
                                  <Avatar className="h-8 w-8">
                                    {msg.senderAvatar && (
                                      <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                                    )}
                                    <AvatarFallback className="text-xs">
                                      {getInitials(msg.senderName)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}

                            <div className={`max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                              {/* Sender name */}
                              {!isMine && !isGrouped && (
                                <span className="mb-0.5 ml-1 text-xs font-medium text-muted-foreground">
                                  {msg.senderName}
                                </span>
                              )}

                              {/* Reply-to preview */}
                              {msg.replyTo && (
                                <div
                                  className={`mb-1 max-w-full rounded border-l-2 border-primary/60 bg-muted/60 px-2 py-1 text-xs ${
                                    isMine ? "self-end" : "self-start"
                                  }`}
                                >
                                  <span className="font-medium text-primary/80">
                                    {msg.replyTo.senderName}
                                  </span>
                                  {msg.replyTo.content && (
                                    <p className="text-muted-foreground line-clamp-1">
                                      {msg.replyTo.content}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Bubble + actions (dropdown, not context menu — avoids React 19 portal crashes) */}
                              <div
                                className={
                                  "flex items-start gap-1 " + (isMine ? "flex-row-reverse" : "")
                                }
                              >
                                <div
                                  className={`relative min-w-0 flex-1 rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                    isMine
                                      ? "rounded-br-sm bg-primary text-primary-foreground"
                                      : "rounded-bl-sm bg-muted"
                                  } ${msg.isPinned ? "ring-1 ring-yellow-400/70" : ""}`}
                                >
                                  {msg.isPinned && (
                                    <Pin className="absolute -top-2 right-1 h-3 w-3 text-yellow-500" />
                                  )}

                                  {msg.attachments?.[0] && (
                                    <div
                                      className={`mb-1 flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs ${
                                        isMine ? "bg-primary-foreground/10" : "bg-background/60"
                                      }`}
                                      onClick={() => {
                                        const att = msg.attachments![0]!
                                        void downloadAttachment({
                                          url: att.url,
                                          name: att.name,
                                          mimeType: att.mimeType,
                                        })
                                      }}
                                    >
                                      <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="truncate font-medium">{msg.attachments[0].name}</p>
                                        <p className="text-muted-foreground">
                                          {formatBytes(msg.attachments[0].sizeBytes)}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {msg.content && <span className="break-words">{msg.content}</span>}

                                  {msg.editedAt && (
                                    <span className="ml-1 text-xs opacity-60">(edited)</span>
                                  )}
                                </div>

                                <DropdownMenu
                                  open={openMessageActionsId === msg.id}
                                  onOpenChange={(open) => {
                                    setOpenMessageActionsId((id) => {
                                      if (open) return msg.id
                                      return id === msg.id ? null : id
                                    })
                                  }}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className={
                                        "h-7 w-7 shrink-0 " +
                                        (isMine
                                          ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                                          : "")
                                      }
                                      aria-label="Message actions"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-48" align="start">
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        toggleReplyTo(msg.id, {
                                          senderName: msg.senderName,
                                          content: msg.content || msg.attachments?.[0]?.name,
                                        })
                                      }
                                    >
                                      <Reply className="mr-2 h-4 w-4" />
                                      Reply
                                    </DropdownMenuItem>

                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <SmilePlus className="mr-2 h-4 w-4" />
                                        React
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <div className="flex flex-wrap gap-1 p-1">
                                          {COMMON_EMOJIS.map((emoji) => (
                                            <button
                                              key={emoji}
                                              type="button"
                                              className={`rounded p-1 text-base hover:bg-muted ${
                                                msg.reactions?.myReaction === emoji ? "bg-primary/10" : ""
                                              }`}
                                              onClick={() => {
                                                void setReactionOnMessage({ messageId: msg.id, emoji })
                                              }}
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                        {msg.reactions?.myReaction && (
                                          <DropdownMenuItem
                                            onSelect={() =>
                                              void setReactionOnMessage({ messageId: msg.id, emoji: null })
                                            }
                                          >
                                            Remove my reaction
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>

                                    <DropdownMenuItem onSelect={() => void togglePinMessage(msg.id)}>
                                      <Pin className="mr-2 h-4 w-4" />
                                      {msg.isPinned ? "Unpin" : "Pin"}
                                    </DropdownMenuItem>

                                    {msg.senderId === "current" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onSelect={() =>
                                            void editMessage({
                                              messageId: msg.id,
                                              fallbackText: msg.content,
                                            })
                                          }
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onSelect={() => void deleteMessage(msg.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Reactions */}
                              {msg.reactions && msg.reactions.items.length > 0 && (
                                <div
                                  className={`mt-0.5 flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                  {msg.reactions.items.map((r) => (
                                    <button
                                      key={r.emoji}
                                      type="button"
                                      onClick={() =>
                                        void setReactionOnMessage({ messageId: msg.id, emoji: r.emoji })
                                      }
                                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-muted ${
                                        msg.reactions?.myReaction === r.emoji
                                          ? "border-primary/50 bg-primary/10"
                                          : "border-border bg-background"
                                      }`}
                                    >
                                      <span>{r.emoji}</span>
                                      <span>{r.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Timestamp + status */}
                              <div
                                className={`mt-0.5 flex items-center gap-1 text-xs text-muted-foreground ${
                                  isMine ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span>{formatMessageTime(msg.timestamp)}</span>
                                {isMine && (
                                  <span>
                                    {msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </div>

                              {/* Read by */}
                              {isMine && msg.readBy && msg.readBy.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Read by {msg.readBy.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                    )
                  })}
                </div>

                {/* Scroll to bottom button */}
                {!isAtBottom && displayMessages.length > 0 && (
                  <div className="sticky bottom-0 flex justify-center pb-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 gap-1 rounded-full shadow-md text-xs"
                      onClick={() => {
                        const root = messagesScrollRootRef.current
                        const viewport = root?.querySelector<HTMLDivElement>(
                          '[data-slot="scroll-area-viewport"]'
                        )
                        viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
                      }}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                      Scroll to bottom
                    </Button>
                  </div>
                )}
              </ScrollArea>
              </div>

              {/* ── Typing indicator ── */}
              {typingLabel && (
                <div className="px-4 pb-1 text-xs text-muted-foreground italic">{typingLabel}</div>
              )}

              {/* ── Reply preview banner ── */}
              {activeReplyPreview && replyToMessageId && (
                <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2 text-sm">
                  <Reply className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-primary">{activeReplyPreview.senderName}</span>
                    {activeReplyPreview.content && (
                      <p className="truncate text-xs text-muted-foreground">
                        {activeReplyPreview.content}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setReplyToMessageId(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* ── Queued attachment banner ── */}
              {queuedAttachment && (
                <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium">{queuedAttachment.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {formatBytes(queuedAttachment.size)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setQueuedAttachment(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* ── Connection status banner ── */}
              {!isConnected && roomId && (
                <div className="flex items-center justify-center gap-1.5 border-t bg-yellow-50 px-4 py-1.5 text-xs text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Reconnecting…
                </div>
              )}

              {/* ── Message input ── */}
              <div className="border-t px-4 py-3">
                {/* Hidden file input */}
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.xlsx,.zip,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    void handleAttachmentSelected(file)
                    e.target.value = ""
                  }}
                />

                <div className="flex items-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    disabled={isUploadingAttachment || !roomId}
                    onClick={handlePickAttachment}
                    title="Attach file (PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG — max 5 MB)"
                  >
                    {isUploadingAttachment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>

                  <Input
                    ref={messageInputRef}
                    className="flex-1"
                    placeholder={`Message ${selectedProject.group.name}…`}
                    value={messageInput}
                    disabled={!roomId || chatRoomQuery.isLoading}
                    onChange={(e) => handleMessageInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />

                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    disabled={
                      (!messageInput.trim() && !queuedAttachment) ||
                      !roomId ||
                      chatRoomQuery.isLoading
                    }
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Online / connection pill */}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isConnected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span>
                        {onlineCount > 0 ? `${onlineCount} online` : "Connected"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      <span>Connecting…</span>
                    </>
                  )}
                  <span>· Press Enter to send</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
