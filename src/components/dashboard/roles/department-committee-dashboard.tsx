"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, ClipboardList, RotateCcw, XCircle } from "lucide-react"

type TitleStatus = "All" | "Pending" | "Approved" | "Rejected" | "Resubmitted"

interface TitleReviewItem {
  id: string
  team: string
  title: string
  submittedOn: string
  status: Exclude<TitleStatus, "All">
  note: string
}

const initialTitleQueue: TitleReviewItem[] = [
  {
    id: "tr1",
    team: "Team Atlas",
    title: "AI-Powered Defense Preparation Coach",
    submittedOn: "Feb 14, 2026",
    status: "Pending",
    note: "Needs committee decision",
  },
  {
    id: "tr2",
    team: "Team Orion",
    title: "University Lab Device Booking Platform",
    submittedOn: "Feb 12, 2026",
    status: "Resubmitted",
    note: "Updated after scope feedback",
  },
  {
    id: "tr3",
    team: "Team Nova",
    title: "Predictive Attendance Insights for Advisors",
    submittedOn: "Feb 10, 2026",
    status: "Approved",
    note: "Approved for project registration",
  },
]

export function DepartmentCommitteeDashboard() {
  const [statusFilter, setStatusFilter] = useState<TitleStatus>("All")
  const [titleQueue, setTitleQueue] = useState(initialTitleQueue)

  const filteredQueue = useMemo(
    () => titleQueue.filter((item) => (statusFilter === "All" ? true : item.status === statusFilter)),
    [statusFilter, titleQueue]
  )

  const approveTitle = (itemId: string) => {
    setTitleQueue((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "Approved",
              note: "Approved by committee for title registration",
            }
          : item
      )
    )
  }

  const rejectTitle = (itemId: string) => {
    setTitleQueue((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "Rejected",
              note: "Rejected with revision request",
            }
          : item
      )
    )
  }

  const markResubmitted = (itemId: string) => {
    setTitleQueue((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "Resubmitted",
              note: "Student resubmitted for committee re-review",
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Department Committee Dashboard"
        description="Review project title submissions and decide approval, rejection, or re-review quickly."
        badge="Department Committee"
      />

      <DashboardKpiGrid
        items={[
          { title: "Pending Titles", value: "8", note: "Awaiting committee decision", icon: ClipboardList },
          { title: "Approved", value: "14", note: "Registered this cycle", icon: CheckCircle2 },
          { title: "Rejected", value: "3", note: "Need revised resubmission", icon: XCircle },
          { title: "Resubmissions", value: "5", note: "Back in review queue", icon: RotateCcw },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          title="Title Review Queue"
          description="Approve, reject, or mark resubmitted title proposals."
          className="xl:col-span-2"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {(["All", "Pending", "Approved", "Rejected", "Resubmitted"] as TitleStatus[]).map((item) => (
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
            {filteredQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No title submissions in this filter.</p>
            ) : (
              filteredQueue.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{item.team}</p>
                  <p className="mt-1 text-sm">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted: {item.submittedOn}</p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.status === "Approved"
                            ? "secondary"
                            : item.status === "Rejected"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {item.status}
                      </Badge>

                      {item.status !== "Approved" ? (
                        <Button size="sm" variant="outline" onClick={() => approveTitle(item.id)}>
                          Approve
                        </Button>
                      ) : null}

                      {item.status !== "Rejected" ? (
                        <Button size="sm" variant="outline" onClick={() => rejectTitle(item.id)}>
                          Reject
                        </Button>
                      ) : null}

                      {item.status === "Rejected" ? (
                        <Button size="sm" variant="outline" onClick={() => markResubmitted(item.id)}>
                          Mark Resubmitted
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
          title="Review Timeline"
          description="Current committee milestones for title governance."
        >
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Submission Window</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Open until Feb 28, 2026</p>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Committee Review Round</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Batch decision meeting every Friday</p>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Finalized Titles</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Forwarded to coordinator for advisor assignment</p>
            </div>
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  )
}
