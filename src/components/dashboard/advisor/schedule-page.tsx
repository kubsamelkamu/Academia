"use client"

import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock3, Users, CheckCircle2 } from "lucide-react"

export function AdvisorSchedulePage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Schedule"
        description="Manage your upcoming advising meetings, reviews, and defense preparations."
        badge="Advisor"
      />

      <DashboardKpiGrid
        items={[
          { title: "Meetings This Week", value: "9", note: "Student check-ins", icon: Calendar },
          { title: "Review Slots", value: "6", note: "Project review sessions", icon: Clock3 },
          { title: "Defense Rehearsals", value: "2", note: "Planned this week", icon: Users },
          { title: "Completed Sessions", value: "14", note: "This month", icon: CheckCircle2 },
        ]}
      />

      <DashboardSectionCard
        title="Upcoming Calendar"
        description="Nearest advisor sessions."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Team Atlas • Methodology review</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Tue, 10:00 AM</p>
              <Badge variant="secondary">Confirmed</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Team Nova • Implementation sync</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Wed, 1:30 PM</p>
              <Badge variant="outline">Pending RSVP</Badge>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
