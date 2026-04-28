"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, MessageSquare, MoreHorizontal, Paperclip, Pencil, Pin, Reply, Search, Send, ShieldAlert, SmilePlus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteDirectChatMessage,
  editDirectChatMessage,
  markDirectChatReadUpTo,
  pinDirectChatMessage,
  removeDirectChatReaction,
  sendDirectChatMessage,
  setDirectChatReaction,
  unpinDirectChatMessage,
  uploadDirectChatAttachment,
} from "@/lib/api/direct-chat"
import {
  directChatKeys,
  useDirectChatPins,
  useDirectChatRoom,
  useInfiniteAdvisorVisibleCoordinators,
  useInfiniteDirectChatMessages,
} from "@/lib/hooks/use-direct-chat"
import { useDepartmentProjectAdvisors } from "@/lib/hooks/use-projects"
import { acquireChatSocket, releaseChatSocket } from "@/lib/realtime/chat-socket"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type {
  AdvisorVisibleCoordinatorItem,
  ChatMessage,
  MessageDeletedPayload,
  MessageEditedPayload,
  MessageNewPayload,
  PresenceUpdatePayload,
  SocketAck,
  TypingUpdatePayload,
} from "@/types/chat"
import type { DirectChatJoinAckData } from "@/types/direct-chat"
import type { DepartmentProjectAdvisorDirectoryItem } from "@/types/projects"

type ActorRole = "advisor" | "coordinator"

type CounterpartOption = {
  userId: string
  displayName: string
  email: string
  avatarUrl?: string | null
  roleLabel: string
  existingRoomId?: string | null
}

const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
])

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getDisplayName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
  return fullName || email?.trim() || "Unknown user"
}

function formatMessageTimestamp(value: string) {
  const timestamp = new Date(value)
  return timestamp.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  const power = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, power)

  return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`
}

function mapAdvisorOption(item: DepartmentProjectAdvisorDirectoryItem): CounterpartOption | null {
  const userId = item.userId?.trim()
  if (!userId) {
    return null
  }

  return {
    userId,
    displayName: getDisplayName(item.user?.firstName, item.user?.lastName, item.user?.email),
    email: item.user?.email?.trim() || "No email",
    avatarUrl: item.user?.avatarUrl ?? null,
    roleLabel: "Advisor",
    existingRoomId: null,
  }
}

function mapCoordinatorOption(item: AdvisorVisibleCoordinatorItem): CounterpartOption | null {
  const userId = item.userId?.trim()
  if (!userId || item.isDirectChatEligible !== true) {
    return null
  }

  return {
    userId,
    displayName: getDisplayName(item.firstName, item.lastName, item.email),
    email: item.email?.trim() || "No email",
    avatarUrl: item.avatarUrl ?? null,
    roleLabel: "Coordinator",
    existingRoomId: item.existingRoomId ?? null,
  }
}

function flattenMessages(pages: Array<{ items: ChatMessage[] }> | undefined) {
  const orderedNewestFirst = pages?.flatMap((page) => page.items) ?? []
  const seen = new Set<string>()

  return orderedNewestFirst
    .filter((message) => {
      if (seen.has(message.id)) {
        return false
      }

      seen.add(message.id)
      return true
    })
    .reverse()
}

export function CoordinatorAdvisorDirectChatPage({ actorRole }: { actorRole: ActorRole }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const tenantDomain = useAuthStore((state) => state.tenantDomain)

  const [counterpartSearch, setCounterpartSearch] = useState("")
  const [selectedCounterpartUserId, setSelectedCounterpartUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null
    }

    return new URLSearchParams(window.location.search).get("user")
  })
  const [draftMessage, setDraftMessage] = useState("")
  const [pendingAttachment, setPendingAttachment] = useState<File | null>(null)
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [isSocketReady, setIsSocketReady] = useState(false)
  const [isPinnedTrayOpen, setIsPinnedTrayOpen] = useState(false)

  const socketRef = useRef<ReturnType<typeof acquireChatSocket> | null>(null)
  const joinedRoomIdRef = useRef<string | null>(null)
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const lastReadUpToMessageIdRef = useRef<string | null>(null)

  const advisorsQuery = useDepartmentProjectAdvisors({
    departmentId: currentUser?.departmentId,
    enabled: actorRole === "coordinator" && Boolean(accessToken) && Boolean(currentUser?.departmentId),
  })

  const advisorVisibleCoordinatorsQuery = useInfiniteAdvisorVisibleCoordinators({
    enabled: actorRole === "advisor" && Boolean(accessToken),
    search: counterpartSearch,
    limit: 20,
  })

  const advisorVisibleCoordinators = useMemo(() => {
    const seen = new Set<string>()
    const items = advisorVisibleCoordinatorsQuery.data?.pages.flatMap((page) => page.items) ?? []

    return items.filter((item) => {
      if (!item?.userId || seen.has(item.userId)) {
        return false
      }

      seen.add(item.userId)
      return true
    })
  }, [advisorVisibleCoordinatorsQuery.data?.pages])

  const counterpartOptions = useMemo(() => {
    const search = counterpartSearch.trim().toLowerCase()

    const rawOptions = actorRole === "coordinator"
      ? (advisorsQuery.data ?? []).map(mapAdvisorOption).filter((item): item is CounterpartOption => item !== null)
      : advisorVisibleCoordinators.map(mapCoordinatorOption).filter((item): item is CounterpartOption => item !== null)

    return rawOptions
      .filter((item) => item.userId !== currentUser?.id)
      .filter((item) => {
        if (!search) return true
        return (
          item.displayName.toLowerCase().includes(search) ||
          item.email.toLowerCase().includes(search)
        )
      })
  }, [actorRole, advisorVisibleCoordinators, advisorsQuery.data, counterpartSearch, currentUser?.id])

  const effectiveSelectedCounterpartUserId = selectedCounterpartUserId ?? counterpartOptions[0]?.userId ?? null

  const selectedCounterpart = useMemo(
    () => {
      const matchedCounterpart = counterpartOptions.find((item) => item.userId === effectiveSelectedCounterpartUserId) ?? null
      if (matchedCounterpart) {
        return matchedCounterpart
      }

      if (actorRole === "advisor" && effectiveSelectedCounterpartUserId) {
        return {
          userId: effectiveSelectedCounterpartUserId,
          displayName: "Coordinator",
          email: "Open from a shared direct-chat link",
          avatarUrl: null,
          roleLabel: "Coordinator",
          existingRoomId: null,
        }
      }

      return null
    },
    [actorRole, counterpartOptions, effectiveSelectedCounterpartUserId]
  )

  const handleSelectCounterpart = useCallback(
    (userId: string) => {
      setDraftMessage("")
      setPendingAttachment(null)
      setReplyToMessageId(null)
      lastReadUpToMessageIdRef.current = null
      setSelectedCounterpartUserId(userId)

      if (typeof window === "undefined") {
        return
      }

      const params = new URLSearchParams(window.location.search)
      params.set("user", userId)
      const query = params.toString()
      router.replace(query ? `?${query}` : "?", { scroll: false })
    },
    [router]
  )

  const directRoomQuery = useDirectChatRoom({
    counterpartUserId: effectiveSelectedCounterpartUserId,
    enabled: Boolean(accessToken) && Boolean(effectiveSelectedCounterpartUserId) && !selectedCounterpart?.existingRoomId,
  })

  const roomId = selectedCounterpart?.existingRoomId ?? directRoomQuery.data?.roomId ?? null

  const directMessagesQuery = useInfiniteDirectChatMessages({
    roomId,
    enabled: Boolean(accessToken) && Boolean(roomId),
    limit: 30,
  })

  const directPinsQuery = useDirectChatPins({
    roomId,
    enabled: Boolean(accessToken) && Boolean(roomId),
  })

  const directMessagesQueryKey = useMemo(
    () => directChatKeys().messagesInfinite({ roomId: roomId ?? "", limit: 30 }),
    [roomId]
  )

  const messages = useMemo(
    () => flattenMessages(directMessagesQuery.data?.pages),
    [directMessagesQuery.data?.pages]
  )

  const readStates = directMessagesQuery.data?.pages?.[0]?.readStates ?? []

  const emitTypingStop = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
      typingStopTimerRef.current = null
    }

    if (!roomId || !isTypingRef.current) {
      return
    }

    isTypingRef.current = false
    const socket = socketRef.current
    if (!socket || joinedRoomIdRef.current !== roomId) {
      return
    }

    socket.emit("typing:stop-direct", { roomId })
  }, [roomId])

  const emitTypingStart = useCallback(() => {
    if (!roomId) {
      return
    }

    const socket = socketRef.current
    if (!socket || joinedRoomIdRef.current !== roomId) {
      return
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("typing:start-direct", { roomId })
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current)
    }

    typingStopTimerRef.current = setTimeout(() => {
      emitTypingStop()
    }, 1500)
  }, [emitTypingStop, roomId])

  useEffect(() => {
    return () => {
      emitTypingStop()
    }
  }, [emitTypingStop])

  const activeReplyPreview = useMemo(() => {
    if (!replyToMessageId) {
      return null
    }

    const target = messages.find((message) => message.id === replyToMessageId)
    if (!target) {
      return { senderName: "Message", content: "" }
    }

    const senderName = target.senderUserId === currentUser?.id
      ? "You"
      : getDisplayName(target.sender.firstName, target.sender.lastName, undefined)
    const content = target.text || (target.attachment?.name ? `Attachment: ${target.attachment.name}` : "")

    return { senderName, content }
  }, [currentUser?.id, messages, replyToMessageId])

  const toggleReplyTo = useCallback((messageId: string) => {
    if (messageId.startsWith("client-")) {
      toast.error("Message is not delivered yet")
      return
    }

    setReplyToMessageId((previous) => previous === messageId ? null : messageId)
  }, [])

  const emitSocketAck = useCallback(
    <T,>(eventName: string, payload: Record<string, unknown>) => {
      const socket = socketRef.current
      if (!socket || !roomId || joinedRoomIdRef.current !== roomId || !socket.connected) {
        return Promise.resolve<SocketAck<T> | null>(null)
      }

      return new Promise<SocketAck<T> | null>((resolve) => {
        let settled = false
        const timer = window.setTimeout(() => {
          if (settled) {
            return
          }

          settled = true
          resolve(null)
        }, 4000)

        socket.emit(eventName, payload, (ack: SocketAck<T>) => {
          if (settled) {
            return
          }

          settled = true
          window.clearTimeout(timer)
          resolve(ack)
        })
      })
    },
    [roomId]
  )

  useEffect(() => {
    if (!accessToken || !roomId || !currentUser?.id) {
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

      setOnlineUserIds(raw.onlineUserIds.filter((value): value is string => typeof value === "string"))
    }

    const handleTypingUpdate = (payload: unknown) => {
      const raw = payload as TypingUpdatePayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return
      if (typeof raw.userId !== "string" || raw.userId === currentUser.id) return
      if (typeof raw.isTyping !== "boolean") return

      setTypingUserIds((previous) => {
        if (raw.isTyping) {
          return previous.includes(raw.userId) ? previous : [...previous, raw.userId]
        }

        return previous.filter((userId) => userId !== raw.userId)
      })
    }

    const refetchMessages = () => {
      void queryClient.invalidateQueries({ queryKey: directMessagesQueryKey })
    }

    const handleMessageNew = (payload: unknown) => {
      const raw = payload as MessageNewPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return

      refetchMessages()
    }

    const handleMessageEdited = (payload: unknown) => {
      const raw = payload as MessageEditedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return

      refetchMessages()
    }

    const handleMessageDeleted = (payload: unknown) => {
      const raw = payload as MessageDeletedPayload
      if (!raw || typeof raw !== "object") return
      if (typeof raw.roomId !== "string" || raw.roomId !== roomId) return

      refetchMessages()
    }

    const joinRoom = () => {
      socket.emit(
        "chat:join-direct",
        { roomId },
        (ack: SocketAck<DirectChatJoinAckData>) => {
          if (!ack || typeof ack !== "object") return
          if (ack.ok !== true) {
            toast.error(ack.error?.message ?? "Failed to join direct chat")
            return
          }

          joinedRoomIdRef.current = ack.data.roomId
          setOnlineUserIds(ack.data.onlineUserIds)
          setIsSocketReady(true)

          socket.emit(
            "presence:get-direct",
            { roomId: ack.data.roomId },
            (presenceAck: SocketAck<PresenceUpdatePayload>) => {
              if (!presenceAck || typeof presenceAck !== "object") return
              if (presenceAck.ok !== true) return
              if (presenceAck.data.roomId !== roomId && presenceAck.data.roomId !== ack.data.roomId) return

              setOnlineUserIds(presenceAck.data.onlineUserIds)
            }
          )
        }
      )
    }

    const handleConnect = () => {
      joinedRoomIdRef.current = null
      setIsSocketReady(false)
      joinRoom()
    }

    const handleDisconnect = () => {
      joinedRoomIdRef.current = null
      setIsSocketReady(false)
      setOnlineUserIds([])
      setTypingUserIds([])
      isTypingRef.current = false
    }

    socket.on("presence:update", handlePresenceUpdate)
    socket.on("typing:update", handleTypingUpdate)
    socket.on("message:new", handleMessageNew)
    socket.on("message:edited", handleMessageEdited)
    socket.on("message:deleted", handleMessageDeleted)
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    if (socket.connected) {
      handleConnect()
    }

    return () => {
      emitTypingStop()
      socket.off("presence:update", handlePresenceUpdate)
      socket.off("typing:update", handleTypingUpdate)
      socket.off("message:new", handleMessageNew)
      socket.off("message:edited", handleMessageEdited)
      socket.off("message:deleted", handleMessageDeleted)
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      releaseChatSocket(socket)

      if (socketRef.current === socket) {
        socketRef.current = null
      }

      joinedRoomIdRef.current = null
      setIsSocketReady(false)
      setOnlineUserIds([])
      setTypingUserIds([])
    }
  }, [accessToken, currentUser?.id, directMessagesQueryKey, emitTypingStop, queryClient, roomId, tenantDomain])

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!roomId) {
        throw new Error("Room is not ready")
      }

      let attachment = null
      if (pendingAttachment) {
        attachment = await uploadDirectChatAttachment({
          roomId,
          file: pendingAttachment,
        })
      }

      const socket = socketRef.current
      if (socket?.connected && joinedRoomIdRef.current === roomId) {
        return new Promise<ChatMessage>((resolve, reject) => {
          socket.emit(
            "message:send-direct",
            {
              roomId,
              ...(replyToMessageId ? { replyToMessageId } : null),
              ...(draftMessage.trim() ? { text: draftMessage.trim() } : null),
              ...(attachment ? { attachment } : null),
            },
            (ack: SocketAck<{ message: ChatMessage }>) => {
              if (!ack || typeof ack !== "object") {
                reject(new Error("Failed to send message"))
                return
              }

              if (ack.ok !== true) {
                reject(new Error(ack.error?.message ?? "Failed to send message"))
                return
              }

              resolve(ack.data.message)
            }
          )
        })
      }

      return sendDirectChatMessage({ roomId, text: draftMessage, replyToMessageId, attachment })
    },
    onSuccess: async () => {
      setDraftMessage("")
      setPendingAttachment(null)
      setReplyToMessageId(null)
      emitTypingStop()
      await directMessagesQuery.refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message")
    },
  })

  const handleAttachmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""

    if (!file) {
      return
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachment must be 5MB or smaller")
      return
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
      toast.error("This file type is not supported for direct chat")
      return
    }

    setPendingAttachment(file)
  }, [])

  const handleSendMessage = useCallback(() => {
    if (sendMessageMutation.isPending) {
      return
    }

    if (!draftMessage.trim() && !pendingAttachment) {
      return
    }

    sendMessageMutation.mutate()
  }, [draftMessage, pendingAttachment, sendMessageMutation])

  const handleDraftMessageChange = useCallback(
    (value: string) => {
      setDraftMessage(value)

      if (!roomId) {
        return
      }

      if (value.trim()) {
        emitTypingStart()
      } else {
        emitTypingStop()
      }
    },
    [emitTypingStart, emitTypingStop, roomId]
  )

  const editMessage = useCallback(
    async (messageId: string) => {
      if (!roomId) {
        return
      }

      const target = messages.find((message) => message.id === messageId)
      if (!target) {
        return
      }

      if (target.senderUserId !== currentUser?.id) {
        toast.error("You can only edit your own messages")
        return
      }

      const nextTextRaw = window.prompt("Edit message", target.text ?? "")
      if (nextTextRaw === null) {
        return
      }

      const text = nextTextRaw.trim()
      if (!text) {
        toast.error("Message text is required")
        return
      }

      const ack = await emitSocketAck<unknown>("message:edit-direct", {
        roomId,
        messageId,
        text,
      })

      if (ack?.ok === false) {
        toast.error(ack.error?.message ?? "Failed to edit message")
        return
      }

      if (ack === null) {
        await editDirectChatMessage({ roomId, messageId, text })
      }

      await directMessagesQuery.refetch()
    },
    [currentUser?.id, directMessagesQuery, emitSocketAck, messages, roomId]
  )

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!roomId || !emoji.trim()) {
        return
      }

      const target = messages.find((message) => message.id === messageId)
      if (!target) {
        return
      }

      const existingReaction = target.reactions?.myReaction ?? null

      try {
        if (existingReaction === emoji) {
          await removeDirectChatReaction({ roomId, messageId })
        } else {
          await setDirectChatReaction({ roomId, messageId, emoji })
        }

        await directMessagesQuery.refetch()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update reaction")
      }
    },
    [directMessagesQuery, messages, roomId]
  )

  const togglePin = useCallback(
    async (messageId: string) => {
      if (!roomId) {
        return
      }

      const target = messages.find((message) => message.id === messageId)
      if (!target) {
        return
      }

      try {
        if (target.isPinned) {
          await unpinDirectChatMessage({ roomId, messageId })
        } else {
          await pinDirectChatMessage({ roomId, messageId })
        }

        await directMessagesQuery.refetch()
        await directPinsQuery.refetch()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update pin")
      }
    },
    [directMessagesQuery, directPinsQuery, messages, roomId]
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!roomId) {
        return
      }

      const target = messages.find((message) => message.id === messageId)
      if (!target) {
        return
      }

      if (target.senderUserId !== currentUser?.id) {
        toast.error("You can only delete your own messages")
        return
      }

      const confirmed = window.confirm("Delete this message? This cannot be undone.")
      if (!confirmed) {
        return
      }

      const ack = await emitSocketAck<unknown>("message:delete-direct", {
        roomId,
        messageId,
      })

      if (ack?.ok === false) {
        toast.error(ack.error?.message ?? "Failed to delete message")
        return
      }

      if (ack === null) {
        await deleteDirectChatMessage({ roomId, messageId })
      }

      if (replyToMessageId === messageId) {
        setReplyToMessageId(null)
      }

      await directMessagesQuery.refetch()
    },
    [currentUser?.id, directMessagesQuery, emitSocketAck, messages, replyToMessageId, roomId]
  )

  const markReadUpToLatest = useCallback(
    async (messageId: string) => {
      if (!roomId || !messageId || messageId.startsWith("client-")) {
        return
      }

      if (lastReadUpToMessageIdRef.current === messageId) {
        return
      }

      lastReadUpToMessageIdRef.current = messageId

      try {
        await markDirectChatReadUpTo({ roomId, messageId })
        await directMessagesQuery.refetch()
      } catch {
        lastReadUpToMessageIdRef.current = null
      }
    },
    [directMessagesQuery, roomId]
  )

  const latestDeliveredMessageId = messages.length > 0 ? messages[messages.length - 1]?.id ?? null : null

  useEffect(() => {
    if (!latestDeliveredMessageId) {
      return
    }

    void markReadUpToLatest(latestDeliveredMessageId)
  }, [latestDeliveredMessageId, markReadUpToLatest])

  const lastReadIndexByUserId = useMemo(() => {
    const indexByMessageId = new Map<string, number>()
    messages.forEach((message, index) => {
      indexByMessageId.set(message.id, index)
    })

    const map = new Map<string, number>()
    readStates.forEach((state) => {
      map.set(state.userId, indexByMessageId.get(state.lastReadMessageId) ?? -1)
    })

    return map
  }, [messages, readStates])

  const counterpartReadIndex = effectiveSelectedCounterpartUserId
    ? (lastReadIndexByUserId.get(effectiveSelectedCounterpartUserId) ?? -1)
    : -1

  const pinnedMessages = useMemo(() => {
    const messageById = new Map(messages.map((message) => [message.id, message]))

    return (directPinsQuery.data ?? [])
      .map((pin) => {
        const message = pin.message ?? messageById.get(pin.messageId) ?? null
        if (!message) {
          return null
        }

        return { pin, message }
      })
      .filter((item): item is { pin: NonNullable<(typeof directPinsQuery.data)>[number]; message: ChatMessage } => item !== null)
      .sort((left, right) => new Date(right.pin.pinnedAt).getTime() - new Date(left.pin.pinnedAt).getTime())
  }, [directPinsQuery.data, messages])

  const isCounterpartLoading = actorRole === "coordinator"
    ? advisorsQuery.isLoading
    : advisorVisibleCoordinatorsQuery.isLoading

  const isCounterpartFetchingNext = actorRole === "advisor" && advisorVisibleCoordinatorsQuery.isFetchingNextPage

  const hasMoreCounterparts = actorRole === "advisor" && Boolean(advisorVisibleCoordinatorsQuery.hasNextPage)

  const counterpartError = actorRole === "coordinator"
    ? advisorsQuery.error
    : advisorVisibleCoordinatorsQuery.error

  const title = actorRole === "advisor" ? "Coordinator Direct Chat" : "Advisor Direct Chat"
  const description = actorRole === "advisor"
    ? "Use this space for one-to-one department chat with a coordinator."
    : "Use this space for one-to-one department chat with an advisor."
  const counterpartTyping = typingUserIds.includes(effectiveSelectedCounterpartUserId ?? "")
  const counterpartOnline = effectiveSelectedCounterpartUserId ? onlineUserIds.includes(effectiveSelectedCounterpartUserId) : false

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[60vh] flex-col overflow-hidden rounded-lg border bg-background shadow-sm sm:min-h-[500px] sm:flex-row">
      <div className="flex min-h-0 w-full flex-shrink-0 flex-col border-b sm:w-80 sm:border-b-0 sm:border-r">
        <div className="border-b p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={counterpartSearch}
              onChange={(event) => setCounterpartSearch(event.target.value)}
              className="pl-9"
              placeholder={actorRole === "advisor" ? "Search coordinators..." : "Search advisors..."}
            />
          </div>

          {actorRole === "advisor" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Coordinators are filtered server-side by advisor eligibility, tenant, and department rules.
            </p>
          )}
        </div>

        <ScrollArea className="flex-1">
          {isCounterpartLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {counterpartError && (
            <div className="px-4 py-8 text-center text-sm text-destructive">
              Failed to load available {actorRole === "advisor" ? "coordinators" : "advisors"}.
            </div>
          )}

          {!isCounterpartLoading && !counterpartError && counterpartOptions.length === 0 && actorRole === "coordinator" && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No available {actorRole === "advisor" ? "coordinators" : "advisors"} found.
            </div>
          )}

          {actorRole === "advisor" && !isCounterpartLoading && !counterpartError && counterpartOptions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No eligible coordinators found for direct chat.
            </div>
          )}

          <div className="space-y-1 p-2">
            {counterpartOptions.map((option) => {
              const isActive = option.userId === effectiveSelectedCounterpartUserId

              return (
                <button
                  key={option.userId}
                  type="button"
                  onClick={() => handleSelectCounterpart(option.userId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60",
                    isActive && "bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={option.avatarUrl ?? undefined} alt={option.displayName} />
                    <AvatarFallback>{getInitials(option.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{option.displayName}</div>
                    <div className="truncate text-sm text-muted-foreground">{option.email}</div>
                  </div>
                  <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                    {option.roleLabel}
                  </span>
                </button>
              )
            })}

            {hasMoreCounterparts && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isCounterpartFetchingNext}
                  onClick={() => void advisorVisibleCoordinatorsQuery.fetchNextPage()}
                >
                  {isCounterpartFetchingNext ? "Loading..." : "Load more coordinators"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {!selectedCounterpart && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Choose a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Select {actorRole === "advisor" ? "a coordinator" : "an advisor"} to create or open the direct room.
              </p>
            </div>
          </div>
        )}

        {selectedCounterpart && (
          <>
            <div className="border-b px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={selectedCounterpart.avatarUrl ?? undefined} alt={selectedCounterpart.displayName} />
                  <AvatarFallback>{getInitials(selectedCounterpart.displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{selectedCounterpart.displayName}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedCounterpart.email} · {counterpartOnline ? "Online" : isSocketReady ? "Offline" : "Syncing"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isPinnedTrayOpen ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsPinnedTrayOpen((previous) => !previous)}
                >
                  <Pin className="h-4 w-4" />
                  Pins {pinnedMessages.length > 0 ? `(${pinnedMessages.length})` : ""}
                </Button>
              </div>

              {counterpartTyping && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedCounterpart.displayName} is typing...
                </p>
              )}

              {directRoomQuery.error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{directRoomQuery.error.message || "Unable to open this direct chat room."}</span>
                </div>
              )}

              {isPinnedTrayOpen && (
                <div className="mt-3 rounded-lg border bg-muted/20">
                  <div className="border-b px-3 py-2 text-sm font-medium">Pinned messages</div>

                  {directPinsQuery.isLoading ? (
                    <div className="flex items-center justify-center px-3 py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : pinnedMessages.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      No pinned messages yet.
                    </div>
                  ) : (
                    <div className="max-h-56 space-y-2 overflow-y-auto px-3 py-3">
                      {pinnedMessages.map(({ pin, message }) => {
                        const author = message.senderUserId === currentUser?.id
                          ? "You"
                          : getDisplayName(message.sender.firstName, message.sender.lastName, undefined)
                        const summary = message.text || message.attachment?.name || "Pinned message"

                        return (
                          <div key={`${pin.messageId}-${pin.pinnedAt}`} className="rounded-lg border bg-background px-3 py-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{author}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {formatMessageTimestamp(message.createdAt)}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => void togglePin(message.id)}
                              >
                                Unpin
                              </Button>
                            </div>
                            <div className="mt-2 text-sm text-foreground/90">{summary}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 px-4 py-4 sm:px-6">
              {directRoomQuery.isLoading || directMessagesQuery.isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {directMessagesQuery.hasNextPage && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => directMessagesQuery.fetchNextPage()}
                        disabled={directMessagesQuery.isFetchingNextPage}
                      >
                        {directMessagesQuery.isFetchingNextPage ? "Loading..." : "Load older messages"}
                      </Button>
                    </div>
                  )}

                  {messages.length === 0 && (
                    <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
                      No messages yet. Start the conversation with {selectedCounterpart.displayName}.
                    </div>
                  )}

                  {messages.map((message) => {
                    const isOwn = message.senderUserId === currentUser?.id
                    const senderName = getDisplayName(
                      message.sender?.firstName,
                      message.sender?.lastName,
                      undefined
                    )
                    const messageIndex = messages.findIndex((item) => item.id === message.id)
                    const isReadByCounterpart = isOwn && counterpartReadIndex >= messageIndex

                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl border px-4 py-3 sm:max-w-[70%]",
                            message.isPinned && "ring-1 ring-yellow-400/70",
                            isOwn ? "bg-primary text-primary-foreground" : "bg-muted/50"
                          )}
                        >
                          {message.isPinned && (
                            <Pin className={cn("absolute", "-mt-5 ml-[calc(100%-0.5rem)] h-3.5 w-3.5 text-yellow-500")} />
                          )}

                          {message.replyToMessageId && (
                            <div className={cn(
                              "mb-2 rounded-lg border-l-2 px-2 py-1 text-xs",
                              isOwn ? "border-primary-foreground/60 bg-primary-foreground/10" : "border-primary bg-background"
                            )}>
                              <div className="font-medium">
                                {message.replyTo?.senderUserId === currentUser?.id
                                  ? "You"
                                  : getDisplayName(
                                      message.replyTo?.sender.firstName,
                                      message.replyTo?.sender.lastName,
                                      undefined
                                    )}
                              </div>
                              <div className={cn("truncate", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                {message.replyTo?.text || message.replyTo?.attachment?.name || "Original message"}
                              </div>
                            </div>
                          )}

                          <div className={cn("mb-1 text-xs", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {isOwn ? "You" : senderName} · {formatMessageTimestamp(message.createdAt)}{message.editedAt ? " · edited" : ""}
                          </div>

                          {message.text && (
                            <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                          )}

                          {message.attachment && (
                            <a
                              href={message.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "mt-3 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                                isOwn
                                  ? "border-primary-foreground/20 bg-primary-foreground/10"
                                  : "border-border bg-background"
                              )}
                            >
                              <Paperclip className="h-4 w-4" />
                              <div className="min-w-0">
                                <div className="truncate font-medium">{message.attachment.name}</div>
                                <div className={cn("text-xs", isOwn ? "text-primary-foreground/75" : "text-muted-foreground")}>
                                  {formatFileSize(message.attachment.size)}
                                </div>
                              </div>
                            </a>
                          )}

                          {!!message.reactions?.items?.length && (
                            <div className={cn("mt-2 flex flex-wrap gap-1", isOwn ? "justify-end" : "justify-start")}>
                              {message.reactions.items.map((reaction) => {
                                const isMine = message.reactions?.myReaction === reaction.emoji
                                return (
                                  <button
                                    key={`${message.id}-${reaction.emoji}`}
                                    type="button"
                                    onClick={() => void toggleReaction(message.id, reaction.emoji)}
                                    className={cn(
                                      "rounded-full border px-2 py-1 text-xs transition-colors",
                                      isMine
                                        ? isOwn
                                          ? "border-primary-foreground/50 bg-primary-foreground/15"
                                          : "border-primary bg-primary/10"
                                        : isOwn
                                          ? "border-primary-foreground/20 bg-primary-foreground/10"
                                          : "border-border bg-background"
                                    )}
                                  >
                                    {reaction.emoji} {reaction.count}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          <div className={cn(
                            "mt-3 flex transition-opacity duration-150",
                            isOwn ? "justify-end" : "justify-start",
                            "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                          )}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 px-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48">
                                <DropdownMenuLabel>Message actions</DropdownMenuLabel>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <SmilePlus className="h-4 w-4" />
                                    React
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="w-44">
                                    {COMMON_REACTIONS.map((emoji) => {
                                      const isActive = message.reactions?.myReaction === emoji
                                      return (
                                        <DropdownMenuItem
                                          key={`${message.id}-${emoji}-picker`}
                                          onSelect={() => void toggleReaction(message.id, emoji)}
                                        >
                                          <span className="text-base">{emoji}</span>
                                          <span>{isActive ? "Remove reaction" : "Add reaction"}</span>
                                        </DropdownMenuItem>
                                      )
                                    })}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onSelect={() => toggleReplyTo(message.id)}>
                                  <Reply className="h-4 w-4" />
                                  Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => void togglePin(message.id)}>
                                  <Pin className={cn("h-4 w-4", message.isPinned && "text-yellow-500")} />
                                  {message.isPinned ? "Unpin" : "Pin"}
                                </DropdownMenuItem>
                                {isOwn && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => void editMessage(message.id)}>
                                      <Pencil className="h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onSelect={() => void deleteMessage(message.id)}>
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {isOwn && (
                            <div className="mt-1 text-right text-[11px] text-primary-foreground/75">
                              {isReadByCounterpart ? "Read" : "Delivered"}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="border-t px-4 py-4 sm:px-6">
              {pendingAttachment && (
                <div className="mb-3 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{pendingAttachment.name}</div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(pendingAttachment.size)}</div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPendingAttachment(null)}>
                    Remove
                  </Button>
                </div>
              )}

              {activeReplyPreview && replyToMessageId && (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-primary">Replying to {activeReplyPreview.senderName}</div>
                    <div className="truncate text-muted-foreground">{activeReplyPreview.content || "Original message"}</div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setReplyToMessageId(null)}>
                    Clear
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Textarea
                    value={draftMessage}
                    onChange={(event) => handleDraftMessageChange(event.target.value)}
                    placeholder="Type your message..."
                    className="min-h-24 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleAttachmentChange}
                    />
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attach
                      </span>
                    </Button>
                  </label>

                  <Button type="button" onClick={handleSendMessage} disabled={sendMessageMutation.isPending || !roomId}>
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}