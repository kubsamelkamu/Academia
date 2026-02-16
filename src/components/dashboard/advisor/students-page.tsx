"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Clock3, GraduationCap, Users } from "lucide-react"

interface AdvisorStudent {
  id: string
  name: string
  team: string
  status: "On Track" | "Needs Feedback" | "Pending"
}

const students: AdvisorStudent[] = [
  { id: "as1", name: "Rana Youssef", team: "Team Atlas", status: "Needs Feedback" },
  { id: "as2", name: "Salma Wael", team: "Team Nova", status: "On Track" },
  { id: "as3", name: "Yousef Tarek", team: "Team Orion", status: "Pending" },
]

export function AdvisorStudentsPage() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () =>
      students.filter((item) => {
        const normalized = query.toLowerCase().trim()
        return normalized.length === 0
          ? true
          : item.name.toLowerCase().includes(normalized) || item.team.toLowerCase().includes(normalized)
      }),
    [query]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Students"
        description="Track assigned students and quickly detect who needs advisor action."
        badge="Advisor"
      />

      <DashboardKpiGrid
        items={[
          { title: "Assigned Students", value: "27", note: "Across your teams", icon: Users },
          { title: "Active Teams", value: "8", note: "Current supervision set", icon: GraduationCap },
          { title: "Need Feedback", value: "6", note: "Awaiting your review", icon: Clock3 },
          { title: "On Track", value: "18", note: "Progress healthy", icon: CheckCircle2 },
        ]}
      />

      <DashboardSectionCard
        title="Student Directory"
        description="Search students by name or team."
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student or team"
          className="mb-3"
        />

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <Badge
                    variant={
                      item.status === "Needs Feedback"
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
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
