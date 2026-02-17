"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar, CheckCircle2, Users } from "lucide-react"

type DefenseStatus = "All" | "Ready" | "Conflict" | "Pending"

interface DefenseSession {
  id: string
  team: string
  slot: string
  status: Exclude<DefenseStatus, "All">
  note: string
}

const initialSessions: DefenseSession[] = [
  {
    id: "d1",
    team: "Team Atlas",
    slot: "Feb 20, 10:00 AM • Room A-301",
    status: "Ready",
    note: "Committee complete",
  },
  {
    id: "d2",
    team: "Team Orion",
    slot: "Feb 21, 11:00 AM • Room B-102",
    status: "Conflict",
    note: "Reviewer overlap detected",
  },
  {
    id: "d3",
    team: "Team Sigma",
    slot: "Feb 22, 09:30 AM • Room A-205",
    status: "Pending",
    note: "Waiting for final reviewer confirmation",
  },
]

export default function DefensesPage() {
  const [statusFilter, setStatusFilter] = useState<DefenseStatus>("All")
  const [sessions, setSessions] = useState<DefenseSession[]>(initialSessions)

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
        title="Defenses"
        description="Coordinate defense scheduling, room allocation, and committee readiness."
        badge="Coordinator"
      />

      <DashboardKpiGrid
        items={[
          { title: "Scheduled Defenses", value: "18", note: "Next 30 days", icon: Calendar },
          { title: "Ready Panels", value: "14", note: "Committee assigned", icon: CheckCircle2 },
          { title: "Conflicts", value: "2", note: "Need schedule fix", icon: AlertTriangle },
          { title: "Teams Pending Slot", value: "6", note: "Awaiting final schedule", icon: Users },
        ]}
      />

      <DashboardSectionCard
        title="Upcoming Sessions"
        description="Nearest defense sessions and their readiness."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Ready", "Conflict", "Pending"] as DefenseStatus[]).map((item) => (
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
            <p className="text-sm text-muted-foreground">No sessions found for this status.</p>
          ) : (
            visibleSessions.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.team} • {item.slot}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === "Conflict"
                          ? "destructive"
                          : item.status === "Pending"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.status === "Conflict" ? (
                      <Button size="sm" variant="outline" onClick={() => resolveConflict(item.id)}>
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

      <DashboardSectionCard
        title="Room Allocation Alerts"
        description="Track room capacity and booking risks."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Room B-102</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Two sessions overlap on Feb 21</p>
              <Badge variant="destructive">Action Needed</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Room A-205</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Equipment check pending confirmation</p>
              <Badge variant="outline">Pending</Badge>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
