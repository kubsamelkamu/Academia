"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock3, MessageSquare, Send, Users } from "lucide-react"

interface StudentMessage {
  id: string
  from: string
  subject: string
  status: "Unread" | "Read"
}

const inbox: StudentMessage[] = [
  { id: "sm1", from: "Advisor", subject: "Please update chapter 4 references", status: "Unread" },
  { id: "sm2", from: "Coordinator", subject: "Defense rehearsal slot update", status: "Read" },
  { id: "sm3", from: "Team Atlas", subject: "Final slide review request", status: "Unread" },
]

export function StudentMessagesPage() {
  const [query, setQuery] = useState("")

  const visibleMessages = useMemo(
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
        description="Review advisor and coordinator communication in one place."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Inbox", value: "14", note: "Current messages", icon: MessageSquare },
          { title: "Unread", value: "5", note: "Need your attention", icon: Clock3 },
          { title: "Team Threads", value: "4", note: "Active collaboration", icon: Users },
          { title: "Replies Sent", value: "19", note: "This month", icon: Send },
        ]}
      />

      <DashboardSectionCard
        title="Inbox"
        description="Search and scan recent conversations."
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sender or subject"
          className="mb-3"
        />

        <div className="space-y-3">
          {visibleMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages found.</p>
          ) : (
            visibleMessages.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.from}</p>
                  <Badge variant={item.status === "Unread" ? "destructive" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-sm">{item.subject}</p>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
