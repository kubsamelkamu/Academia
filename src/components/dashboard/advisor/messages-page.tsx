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

interface AdvisorMessage {
  id: string
  from: string
  subject: string
  status: "Unread" | "Read"
  time: string
}

const inbox: AdvisorMessage[] = [
  { id: "m1", from: "Team Atlas", subject: "Clarification on chapter feedback", status: "Unread", time: "10 min ago" },
  { id: "m2", from: "Coordinator", subject: "Defense rehearsal update", status: "Read", time: "1 hour ago" },
  { id: "m3", from: "Team Nova", subject: "Request for quick review", status: "Unread", time: "3 hours ago" },
]

export function AdvisorMessagesPage() {
  const [query, setQuery] = useState("")

  const visibleInbox = useMemo(
    () =>
      inbox.filter((item) => {
        const normalized = query.toLowerCase().trim()
        return normalized.length === 0
          ? true
          : item.from.toLowerCase().includes(normalized) || item.subject.toLowerCase().includes(normalized)
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
          placeholder="Search by sender or subject"
          className="mb-3"
        />
        <div className="space-y-3">
          {visibleInbox.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages match your search.</p>
          ) : (
            visibleInbox.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.from}</p>
                  <Badge variant={item.status === "Unread" ? "destructive" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-sm">{item.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
