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

type EvaluationFilter = "All" | "Pending" | "Completed"

interface AdvisorEvaluation {
  id: string
  team: string
  type: string
  status: Exclude<EvaluationFilter, "All">
}

const initialEvaluations: AdvisorEvaluation[] = [
  { id: "ae1", team: "Team Atlas", type: "Midterm", status: "Pending" },
  { id: "ae2", team: "Team Orion", type: "Final", status: "Pending" },
  { id: "ae3", team: "Team Nova", type: "Progress", status: "Completed" },
]

export function AdvisorEvaluationsPage() {
  const [filter, setFilter] = useState<EvaluationFilter>("All")
  const [rows, setRows] = useState(initialEvaluations)

  const visibleRows = useMemo(
    () => rows.filter((row) => (filter === "All" ? true : row.status === filter)),
    [filter, rows]
  )

  const markDone = (rowId: string) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, status: "Completed" } : row)))
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Evaluations"
        description="Complete project evaluations and keep submission turnaround healthy."
        badge="Advisor"
      />

      <DashboardKpiGrid
        items={[
          { title: "Pending", value: "4", note: "Need completion", icon: ClipboardList },
          { title: "Completed", value: "16", note: "This cycle", icon: CheckCircle2 },
          { title: "Overdue", value: "1", note: "Requires attention", icon: Clock3 },
          { title: "Teams Evaluated", value: "8", note: "Assigned supervision set", icon: Users },
        ]}
      />

      <DashboardSectionCard
        title="Evaluation Tasks"
        description="Use filters and quickly mark evaluations complete."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Pending", "Completed"] as EvaluationFilter[]).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluations in this filter.</p>
          ) : (
            visibleRows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{row.team} • {row.type}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={row.status === "Completed" ? "secondary" : "outline"}>{row.status}</Badge>
                    {row.status === "Pending" ? (
                      <Button size="sm" variant="outline" onClick={() => markDone(row.id)}>
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
    </div>
  )
}
