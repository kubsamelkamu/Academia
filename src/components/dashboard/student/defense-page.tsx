"use client"

import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Clock3, Users } from "lucide-react"

export function StudentDefensePage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Defense"
        description="Prepare your team for defense readiness and final presentation."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Defense Status", value: "Preparing", note: "Not yet finalized", icon: Clock3 },
          { title: "Practice Sessions", value: "2", note: "Completed rehearsals", icon: CheckCircle2 },
          { title: "Committee Members", value: "3", note: "Expected panel", icon: Users },
          { title: "Tentative Slot", value: "Feb 28", note: "Awaiting confirmation", icon: Calendar },
        ]}
      />

      <DashboardSectionCard
        title="Defense Checklist"
        description="Track what is ready before final defense day."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Slides prepared</p>
              <Badge variant="secondary">Done</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Demo environment check</p>
              <Badge variant="outline">Pending</Badge>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Final report approval</p>
              <Badge variant="destructive">Action Needed</Badge>
            </div>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
