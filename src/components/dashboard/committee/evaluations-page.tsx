"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckSquare, ClipboardList, Clock3, FileText } from "lucide-react"

type EvaluationFilter = "All" | "Pending" | "Completed"

interface CommitteeEvaluation {
  id: string
  team: string
  rubric: string
  status: Exclude<EvaluationFilter, "All">
}

const initialEvaluations: CommitteeEvaluation[] = [
  { id: "ce1", team: "Team Atlas", rubric: "Title Relevance", status: "Pending" },
  { id: "ce2", team: "Team Orion", rubric: "Scope Feasibility", status: "Pending" },
  { id: "ce3", team: "Team Nova", rubric: "Innovation Score", status: "Completed" },
]

export function CommitteeEvaluationsPage() {
  const [filter, setFilter] = useState<EvaluationFilter>("All")
  const [rows, setRows] = useState(initialEvaluations)

  const visibleRows = useMemo(
    () => rows.filter((row) => (filter === "All" ? true : row.status === filter)),
    [rows, filter]
  )

  const markComplete = (id: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "Completed" } : row)))
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Evaluations"
        description="Submit committee evaluations for title submissions and project readiness."
        badge="Committee"
      />

      <DashboardKpiGrid
        items={[
          { title: "Evaluation Tasks", value: "11", note: "Current workload", icon: ClipboardList },
          { title: "Pending", value: "4", note: "Need scoring", icon: Clock3 },
          { title: "Completed", value: "7", note: "Submitted this week", icon: CheckSquare },
          { title: "Rubric Sets", value: "3", note: "Active templates", icon: FileText },
        ]}
      />

      <DashboardSectionCard
        title="Evaluation Queue"
        description="Filter evaluations and mark completed once submitted."
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
                  <div>
                    <p className="text-sm font-medium">{row.team}</p>
                    <p className="text-xs text-muted-foreground">{row.rubric}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={row.status === "Completed" ? "secondary" : "outline"}>
                      {row.status}
                    </Badge>
                    {row.status === "Pending" ? (
                      <Button size="sm" variant="outline" onClick={() => markComplete(row.id)}>
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