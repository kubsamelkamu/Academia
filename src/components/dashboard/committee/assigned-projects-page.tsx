"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock3, FolderKanban, RotateCcw } from "lucide-react"

type ProjectFilter = "All" | "Pending" | "Approved" | "Rejected" | "Resubmitted"

interface CommitteeProjectTitle {
  id: string
  student: string
  title: string
  track: string
  status: Exclude<ProjectFilter, "All">
}

const initialProjects: CommitteeProjectTitle[] = [
  {
    id: "cp1",
    student: "Amina Niyonsaba",
    title: "Campus Smart Parking Prediction",
    track: "Software Systems",
    status: "Pending",
  },
  {
    id: "cp2",
    student: "Jean Claude",
    title: "Automated Defense Q&A Preparation Assistant",
    track: "Artificial Intelligence",
    status: "Resubmitted",
  },
  {
    id: "cp3",
    student: "Grace Uwase",
    title: "Student Internship Matching Platform",
    track: "Information Systems",
    status: "Approved",
  },
]

export function CommitteeAssignedProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilter>("All")
  const [rows, setRows] = useState(initialProjects)

  const visibleRows = useMemo(
    () => rows.filter((row) => (filter === "All" ? true : row.status === filter)),
    [rows, filter]
  )

  const approve = (id: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "Approved" } : row)))
  }

  const reject = (id: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "Rejected" } : row)))
  }

  const requestResubmit = (id: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "Resubmitted" } : row)))
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Assigned Projects"
        description="Review student title submissions and decide approval or revision requests."
        badge="Committee"
      />

      <DashboardKpiGrid
        items={[
          { title: "Titles in Queue", value: "18", note: "Current batch", icon: FolderKanban },
          { title: "Pending", value: "7", note: "Awaiting your decision", icon: Clock3 },
          { title: "Approved", value: "9", note: "Ready for assignment", icon: CheckCircle2 },
          { title: "Resubmitted", value: "2", note: "Back for review", icon: RotateCcw },
        ]}
      />

      <DashboardSectionCard
        title="Title Submission Review"
        description="Filter title submissions and apply committee decisions directly."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "Pending", "Approved", "Rejected", "Resubmitted"] as ProjectFilter[]).map((item) => (
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
            <p className="text-sm text-muted-foreground">No project titles in this filter.</p>
          ) : (
            visibleRows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{row.student}</p>
                <p className="mt-1 text-sm">{row.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Track: {row.track}</p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant={
                      row.status === "Approved"
                        ? "secondary"
                        : row.status === "Rejected"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {row.status}
                  </Badge>

                  <div className="flex flex-wrap items-center gap-2">
                    {row.status !== "Approved" ? (
                      <Button size="sm" variant="outline" onClick={() => approve(row.id)}>
                        Approve
                      </Button>
                    ) : null}

                    {row.status !== "Rejected" ? (
                      <Button size="sm" variant="outline" onClick={() => reject(row.id)}>
                        Reject
                      </Button>
                    ) : null}

                    {row.status === "Rejected" ? (
                      <Button size="sm" variant="outline" onClick={() => requestResubmit(row.id)}>
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
    </div>
  )
}