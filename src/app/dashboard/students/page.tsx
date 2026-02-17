"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GraduationCap, Users, AlertTriangle, Clock3 } from "lucide-react"

type WatchlistPriority = "All" | "High" | "Medium"

interface StudentWatchItem {
  id: string
  team: string
  issue: string
  detail: string
  priority: Exclude<WatchlistPriority, "All">
}

interface StudentProgressItem {
  id: string
  student: string
  team: string
  milestone: string
  status: "On Track" | "Delayed" | "Pending"
}

const watchlist: StudentWatchItem[] = [
  {
    id: "w1",
    team: "Team Orion",
    issue: "Milestone delay",
    detail: "Proposal revision overdue by 2 days",
    priority: "High",
  },
  {
    id: "w2",
    team: "Team Aurora",
    issue: "Advisor mismatch",
    detail: "Awaiting advisor reassignment approval",
    priority: "Medium",
  },
  {
    id: "w3",
    team: "Team Nova",
    issue: "Missing submission",
    detail: "Progress report not uploaded",
    priority: "High",
  },
]

const studentProgress: StudentProgressItem[] = [
  {
    id: "s1",
    student: "Rana Youssef",
    team: "Team Orion",
    milestone: "Methodology Draft",
    status: "Delayed",
  },
  {
    id: "s2",
    student: "Ahmed Nader",
    team: "Team Nova",
    milestone: "Implementation Checkpoint",
    status: "On Track",
  },
  {
    id: "s3",
    student: "Salma Wael",
    team: "Team Aurora",
    milestone: "Advisor Approval",
    status: "Pending",
  },
]

export default function StudentsPage() {
  const [priorityFilter, setPriorityFilter] = useState<WatchlistPriority>("All")
  const [query, setQuery] = useState("")

  const filteredWatchlist = useMemo(
    () =>
      watchlist.filter((item) => {
        const priorityMatch = priorityFilter === "All" ? true : item.priority === priorityFilter
        const searchMatch =
          query.trim().length === 0 ||
          item.team.toLowerCase().includes(query.toLowerCase()) ||
          item.issue.toLowerCase().includes(query.toLowerCase())

        return priorityMatch && searchMatch
      }),
    [priorityFilter, query]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Students"
        description="Track student engagement, submissions, and advisory status in your department."
        badge="Coordinator"
      />

      <DashboardKpiGrid
        items={[
          { title: "Active Students", value: "214", note: "Current cycle", icon: Users },
          { title: "Capstone Teams", value: "72", note: "Across all tracks", icon: GraduationCap },
          { title: "At Risk", value: "9", note: "Need intervention", icon: AlertTriangle },
          { title: "Pending Submissions", value: "18", note: "Awaiting review", icon: Clock3 },
        ]}
      />

      <DashboardSectionCard
        title="Student Watchlist"
        description="Students and teams requiring coordinator follow-up this week."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "High", "Medium"] as WatchlistPriority[]).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={priorityFilter === item ? "default" : "outline"}
              onClick={() => setPriorityFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by team or issue"
          className="mb-3"
        />
        <div className="space-y-3">
          {filteredWatchlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No watchlist items for the selected filters.</p>
          ) : (
            filteredWatchlist.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.team} • {item.issue}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>{item.priority}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Student Progress Board"
        description="Quick status board for key milestones."
      >
        <div className="space-y-3">
          {studentProgress.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.student}</p>
                <Badge
                  variant={
                    item.status === "Delayed"
                      ? "destructive"
                      : item.status === "Pending"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.team}</p>
              <p className="mt-1 text-sm">{item.milestone}</p>
            </div>
          ))}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
