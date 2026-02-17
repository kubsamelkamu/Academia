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
import { AlertTriangle, CheckCircle2, UserCheck, Users } from "lucide-react"

type AdvisorFilter = "All" | "At Capacity" | "Healthy" | "Open"

interface AdvisorLoad {
  id: string
  name: string
  teams: number
  status: Exclude<AdvisorFilter, "All">
  specialty: string
}

const advisorLoadRows: AdvisorLoad[] = [
  {
    id: "a1",
    name: "Dr. Sara Ibrahim",
    teams: 8,
    status: "At Capacity",
    specialty: "AI Systems",
  },
  {
    id: "a2",
    name: "Prof. Mohamed Adel",
    teams: 5,
    status: "Healthy",
    specialty: "Cloud Platforms",
  },
  {
    id: "a3",
    name: "Dr. Lina Omar",
    teams: 3,
    status: "Open",
    specialty: "Data Engineering",
  },
]

export default function AdvisorsPage() {
  const [statusFilter, setStatusFilter] = useState<AdvisorFilter>("All")
  const [query, setQuery] = useState("")

  const filteredAdvisors = useMemo(
    () =>
      advisorLoadRows.filter((row) => {
        const statusMatch = statusFilter === "All" ? true : row.status === statusFilter
        const queryMatch =
          query.trim().length === 0 ||
          row.name.toLowerCase().includes(query.toLowerCase()) ||
          row.specialty.toLowerCase().includes(query.toLowerCase())

        return statusMatch && queryMatch
      }),
    [query, statusFilter]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Advisors"
        description="Balance advisor workload and monitor supervision coverage."
        badge="Coordinator"
      />

      <DashboardKpiGrid
        items={[
          { title: "Total Advisors", value: "36", note: "Department faculty", icon: Users },
          { title: "Fully Assigned", value: "28", note: "Within load threshold", icon: CheckCircle2 },
          { title: "Need Rebalancing", value: "6", note: "Near capacity", icon: AlertTriangle },
          { title: "Open Advisor Slots", value: "4", note: "For new projects", icon: UserCheck },
        ]}
      />

      <DashboardSectionCard
        title="Advisor Load Highlights"
        description="Quick view of advisor load conditions."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "At Capacity", "Healthy", "Open"] as AdvisorFilter[]).map((item) => (
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
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search advisor by name or specialty"
          className="mb-3"
        />
        <div className="space-y-3">
          {filteredAdvisors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No advisors match the selected filters.</p>
          ) : (
            filteredAdvisors.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{row.name}</p>
                  <Badge
                    variant={
                      row.status === "At Capacity"
                        ? "destructive"
                        : row.status === "Open"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {row.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{row.specialty}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{row.teams} active teams</p>
                  <Button size="sm" variant="outline">Adjust</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Reassignment Queue"
        description="Projects waiting for advisor assignment decisions."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Team Vega • Needs data engineering advisor</p>
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="outline">Candidate: Dr. Lina Omar</Badge>
              <Button size="sm">Assign</Button>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Team Orion • Advisor overload conflict</p>
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="destructive">High Priority</Badge>
              <Button size="sm" variant="outline">Rebalance</Button>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
