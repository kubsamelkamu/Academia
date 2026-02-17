"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, Clock3, Users } from "lucide-react"

type SessionStatus = "All" | "Ready" | "Pending" | "Conflict"

interface CommitteeDefenseSession {
  id: string
  team: string
  slot: string
  status: Exclude<SessionStatus, "All">
  note: string
}

const initialSessions: CommitteeDefenseSession[] = [
  {
    id: "cd1",
    team: "Team Atlas",
    slot: "Feb 20 • 10:00 AM • Room A-301",
    status: "Ready",
    note: "All committee members confirmed",
  },
  {
    id: "cd2",
    team: "Team Orion",
    slot: "Feb 21 • 11:30 AM • Room B-102",
    status: "Conflict",
    note: "Reviewer overlap with another panel",
  },
  {
    id: "cd3",
    team: "Team Nova",
    slot: "Feb 22 • 09:00 AM • Room A-205",
    status: "Pending",
    note: "Waiting for final rubric upload",
  },
]

export function CommitteeDefenseSchedulePage() {
  const [statusFilter, setStatusFilter] = useState<SessionStatus>("All")
  const [sessions, setSessions] = useState(initialSessions)

  const visibleSessions = useMemo(
    () => sessions.filter((session) => (statusFilter === "All" ? true : session.status === statusFilter)),
    [sessions, statusFilter]
  )

  const resolveConflict = (sessionId: string) => {
    setSessions((current) =>
      current.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              status: "Ready",
              note: "Conflict resolved and panel updated",
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Defense Schedule"
        description="Review your assigned defense sessions and panel readiness."
        badge="Committee"
      />

      <DashboardKpiGrid
        items={[
          { title: "Assigned Sessions", value: "4", note: "Current cycle", icon: Calendar },
          { title: "Ready", value: "2", note: "No blockers", icon: CheckCircle2 },
          { title: "Pending", value: "1", note: "Awaiting updates", icon: Clock3 },
          { title: "Panel Members", value: "3", note: "Per defense session", icon: Users },
        ]}
      />

      <DashboardSectionCard
        title="Session Board"
        description="Filter sessions by status and resolve conflicts quickly."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Ready", "Pending", "Conflict"] as SessionStatus[]).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={statusFilter === item ? "default" : "outline"}
              onClick={() => setStatusFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions in this status.</p>
          ) : (
            visibleSessions.map((session) => (
              <div key={session.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{session.team}</p>
                <p className="mt-1 text-xs text-muted-foreground">{session.slot}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{session.note}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        session.status === "Conflict"
                          ? "destructive"
                          : session.status === "Pending"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {session.status}
                    </Badge>
                    {session.status === "Conflict" ? (
                      <Button size="sm" variant="outline" onClick={() => resolveConflict(session.id)}>
                        Resolve
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
