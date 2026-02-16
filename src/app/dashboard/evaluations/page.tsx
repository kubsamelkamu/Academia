"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ClipboardList, Clock3, Users } from "lucide-react"

type EvaluationStatus = "All" | "Pending" | "Overdue" | "Completed"

interface EvaluationItem {
  id: string
  team: string
  type: string
  status: Exclude<EvaluationStatus, "All">
  detail: string
}

const initialEvaluations: EvaluationItem[] = [
  {
    id: "e1",
    team: "Team Sigma",
    type: "Midterm evaluation",
    status: "Pending",
    detail: "Missing one committee score",
  },
  {
    id: "e2",
    team: "Team Nova",
    type: "Final evaluation",
    status: "Overdue",
    detail: "Overdue by 1 day",
  },
  {
    id: "e3",
    team: "Team Atlas",
    type: "Progress checkpoint",
    status: "Completed",
    detail: "Submitted yesterday",
  },
]

export default function EvaluationsPage() {
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus>("All")
  const [items, setItems] = useState<EvaluationItem[]>(initialEvaluations)

  const visibleItems = useMemo(
    () => items.filter((item) => (statusFilter === "All" ? true : item.status === statusFilter)),
    [items, statusFilter]
  )

  const markCompleted = (itemId: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "Completed",
              detail: "Marked complete just now",
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Evaluations"
        description="Monitor pending evaluations, completion pace, and committee response windows."
        badge="Coordinator"
      />

      <DashboardKpiGrid
        items={[
          { title: "Pending Evaluations", value: "27", note: "Awaiting action", icon: ClipboardList },
          { title: "Completed This Week", value: "19", note: "Reviewed and submitted", icon: CheckCircle2 },
          { title: "Overdue", value: "4", note: "Past expected deadline", icon: Clock3 },
          { title: "Active Committees", value: "12", note: "Contributing this cycle", icon: Users },
        ]}
      />

      <DashboardSectionCard
        title="Evaluation Queue"
        description="Latest items requiring follow-up from coordinator."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Pending", "Overdue", "Completed"] as EvaluationStatus[]).map((item) => (
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
          {visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluations in this status.</p>
          ) : (
            visibleItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.team} • {item.type}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === "Overdue"
                          ? "destructive"
                          : item.status === "Pending"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.status !== "Completed" ? (
                      <Button size="sm" variant="outline" onClick={() => markCompleted(item.id)}>
                        Mark Complete
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
        title="Committee Response Health"
        description="Response quality indicators across active committees."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">SE Committee A</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Average turnaround: 1.8 days</p>
              <Badge variant="secondary">Healthy</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">CS Committee B</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Average turnaround: 3.9 days</p>
              <Badge variant="outline">Needs attention</Badge>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
