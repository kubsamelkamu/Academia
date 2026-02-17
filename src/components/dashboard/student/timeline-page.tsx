"use client"

import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Calendar, CheckCircle2, Clock3, Flag } from "lucide-react"

export function StudentTimelinePage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Timeline"
        description="Follow your project milestones and upcoming deadlines."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Milestones", value: "5", note: "Planned phases", icon: Flag },
          { title: "Completed", value: "3", note: "Achieved on time", icon: CheckCircle2 },
          { title: "Upcoming", value: "2", note: "Next 2 weeks", icon: Calendar },
          { title: "Critical Deadlines", value: "1", note: "This week", icon: Clock3 },
        ]}
      />

      <DashboardSectionCard
        title="Milestone Timeline"
        description="Sequential progress across project lifecycle."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Proposal Approval</p>
            <p className="text-xs text-muted-foreground">Completed • Jan 28</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Implementation Review</p>
            <p className="text-xs text-muted-foreground">Upcoming • Feb 21</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Final Defense</p>
            <p className="text-xs text-muted-foreground">Tentative • Feb 28</p>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
