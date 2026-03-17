"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, CheckCheck, Clock3, MessageSquare, Send, Users } from "lucide-react"
import { getOutgoingReceiptLabel } from "@/lib/dashboard/message-receipts"
import { useMessagesList, useSendMessage } from "@/lib/hooks/use-messages"
import { useAuthStore } from "@/store/auth-store"
import type { ChatMessage, ListMessagesResponse } from "@/types/messages"

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "sm1",
    sender: "Advisor",
    body: "Please update chapter 4 references before Friday.",
    at: "09:11",
    direction: "incoming",
  },
  {
    id: "sm2",
    sender: "You",
    body: "Sure, I already revised citation format and will upload in 2 hours.",
    at: "09:14",
    direction: "outgoing",
    receiptStatus: "delivered",
  },
  {
    id: "sm3",
    sender: "Tofik",
    body: "Can you share the final deck for rehearsal?",
    at: "09:19",
    direction: "incoming",
  },
  {
    id: "sm4",
    sender: "You",
    body: "Yes, sending now. Please check slide 12 and 14 notes.",
    at: "09:21",
    direction: "outgoing",
    receiptStatus: "read",
    readBy: ["Tofik"],
  },
  {
    id: "sm5",
    sender: "You",
    body: "Draft timeline has been aligned with coordinator feedback.",
    at: "09:23",
    direction: "outgoing",
    receiptStatus: "read",
    readBy: ["Tofik", "Meron", "Liya", "Nahom"],
  },
]

const MOCK_MESSAGES_RESPONSE: ListMessagesResponse = {
  messages: MOCK_MESSAGES,
  unreadCount: 2,
  total: MOCK_MESSAGES.length,
  typingUsers: ["Tofik"],
}

function receiptMeta(message: ChatMessage): { label: string; Icon: typeof Check } | null {
  if (message.direction !== "outgoing") {
    return null
  }

  const label = getOutgoingReceiptLabel(message)

  if (message.receiptStatus === "read") {
    return { label: label ?? "Read", Icon: CheckCheck }
  }

  if (message.receiptStatus === "delivered") {
    return { label: label ?? "Delivered", Icon: CheckCheck }
  }

  return { label: label ?? "Sent", Icon: Check }
}

export function StudentMessagesPage() {
  const [query, setQuery] = useState("")
  const [draftMessage, setDraftMessage] = useState("")
  const accessToken = useAuthStore((s) => s.accessToken)

  const listParams = useMemo(() => ({ conversationId: "student-main", limit: 50 }), [])
  const messagesQuery = useMessagesList({
    params: listParams,
    fallbackData: MOCK_MESSAGES_RESPONSE,
    queryOptions: {
      enabled: Boolean(accessToken),
      refetchInterval: 5_000,
      refetchOnWindowFocus: true,
      staleTime: 2_000,
    },
  })
  const sendMessageMutation = useSendMessage(listParams)

  const messagesData = messagesQuery.data ?? MOCK_MESSAGES_RESPONSE
  const activeTypingUser = messagesData.typingUsers[0] ?? "Tofik"
  const isTyping = messagesData.typingUsers.length > 0

  const handleSend = () => {
    const text = draftMessage.trim()
    if (!text) return

    sendMessageMutation.mutate({
      conversationId: listParams.conversationId,
      body: text,
    })
    setDraftMessage("")
  }

  const visibleMessages = useMemo(
    () =>
      messagesData.messages.filter((item) => {
        const normalized = query.toLowerCase().trim()
        return normalized.length === 0
          ? true
          : item.sender.toLowerCase().includes(normalized) || item.body.toLowerCase().includes(normalized)
      }),
    [messagesData.messages, query]
  )

  const unreadIncomingCount = useMemo(
    () =>
      messagesData.messages.filter((item) => item.direction === "incoming" && item.readState !== "Read").length,
    [messagesData.messages]
  )

  const outgoingCount = useMemo(
    () => messagesData.messages.filter((item) => item.direction === "outgoing").length,
    [messagesData.messages]
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <DashboardPageHeader
        title="Messages"
        description="Review advisor and coordinator communication in one place."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Inbox", value: String(messagesData.total), note: "Current messages", icon: MessageSquare },
          { title: "Unread", value: String(unreadIncomingCount), note: "Need your attention", icon: Clock3 },
          { title: "Team Threads", value: "4", note: "Active collaboration", icon: Users },
          { title: "Replies Sent", value: String(outgoingCount), note: "This month", icon: Send },
        ]}
      />

      <DashboardSectionCard
        title="Inbox"
        description="Search and scan recent conversations."
        className="flex min-h-0 flex-1 flex-col"
        contentClassName="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sender or message"
          />

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {visibleMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages found.</p>
            ) : (
              visibleMessages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl border px-3 py-2 sm:max-w-[70%] ${
                      item.direction === "outgoing"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium opacity-80">{item.sender}</p>
                      {item.direction === "incoming" && item.readState !== "Read" ? (
                        <Badge variant="outline">Unread</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{item.body}</p>

                    <div className="mt-2 flex items-center justify-end gap-1 text-[11px] opacity-80">
                      <span>{item.at}</span>
                      {(() => {
                        const meta = receiptMeta(item)
                        if (!meta) return null
                        const Icon = meta.Icon
                        return (
                          <>
                            <Icon className="h-3.5 w-3.5" />
                            <span>{meta.label}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-3">
            <p className="min-h-5 text-xs text-muted-foreground">
              {isTyping ? `${activeTypingUser} typing...` : ""}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="Type a message"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                onClick={handleSend}
                disabled={!draftMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
