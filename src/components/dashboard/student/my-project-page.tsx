"use client"

import { useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock3, FileText, FolderKanban } from "lucide-react"

export function StudentMyProjectPage() {
  const [phase, setPhase] = useState<"Draft" | "Review" | "Final">("Review")

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Project"
        description="Track your project phase, progress, and advisor review status."
        badge="Student"
      />

      <DashboardKpiGrid
        items={[
          { title: "Project Status", value: "Active", note: "Capstone cycle", icon: FolderKanban },
          { title: "Completion", value: "68%", note: "Milestones complete", icon: CheckCircle2 },
          { title: "Pending Reviews", value: "2", note: "Advisor comments", icon: FileText },
          { title: "Next Deadline", value: "4d", note: "Final draft", icon: Clock3 },
        ]}
      />

      <DashboardSectionCard
        title="Project Phase"
        description="Switch your current work phase to organize tasks."
      >
        <div className="flex flex-wrap gap-2">
          {(["Draft", "Review", "Final"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={phase === item ? "default" : "outline"}
              onClick={() => setPhase(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="mt-3 rounded-lg border p-3">
          <p className="text-sm font-medium">Current phase: {phase}</p>
          <p className="text-xs text-muted-foreground">Use this to focus on your immediate deliverables.</p>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Advisor Notes"
        description="Latest advisor guidance for your project."
      >
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Methodology section</p>
              <Badge variant="destructive">Action Needed</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Clarify dataset validation strategy before next submission.</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Implementation chapter</p>
              <Badge variant="secondary">Reviewed</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Good progress. Add architecture diagram references.</p>
          </div>
        </div>
      </DashboardSectionCard>
    </div>
  )
}
