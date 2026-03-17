"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Users, Clock3 } from "lucide-react"
import type { ChatMessage } from "@/types/messages"

const inbox: ChatMessage[] = [
  {
    id: "m1",
    sender: "Team Atlas",
    body: "Clarification on chapter feedback",
    readState: "Unread",
    at: "10 min ago",
    direction: "incoming",
  },
  {
    id: "m2",
    sender: "Coordinator",
    body: "Defense rehearsal update",
    readState: "Read",
    at: "1 hour ago",
    direction: "incoming",
  },
  {
    id: "m3",
    sender: "Team Nova",
    body: "Request for quick review",
    readState: "Unread",
    at: "3 hours ago",
    direction: "incoming",
  },
]

export function AdvisorMessagesPage() {
  const [query, setQuery] = useState("")

  const visibleInbox = useMemo(
    () =>
      inbox.filter((item) => {
        const normalized = query.toLowerCase().trim()
        return normalized.length === 0
          ? true
          : item.sender.toLowerCase().includes(normalized) || item.body.toLowerCase().includes(normalized)
      }),
    [query]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Messages"
        description="Review communication from students and coordinator quickly."
        badge="Advisor"
      />

      <DashboardKpiGrid
        items={[
          { title: "Inbox", value: "23", note: "Current messages", icon: MessageSquare },
          { title: "Unread", value: "7", note: "Need your response", icon: Clock3 },
          { title: "Student Threads", value: "12", note: "Active conversations", icon: Users },
          { title: "Replies Sent", value: "41", note: "This month", icon: Send },
        ]}
      />

      <DashboardSectionCard
        title="Inbox"
        description="Search and review recent advisor messages."
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by sender or message"
          className="mb-3"
        />
        <div className="space-y-3">
          {visibleInbox.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages match your search.</p>
          ) : (
            visibleInbox.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.sender}</p>
                  <Badge variant={item.readState === "Unread" ? "destructive" : "outline"}>
                    {item.readState ?? "Read"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm">{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.at}</p>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
