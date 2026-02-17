"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FolderKanban, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react"

type ProjectStatus = "All" | "On Track" | "At Risk" | "Review"

interface AdvisorProject {
  id: string
  title: string
  team: string
  status: Exclude<ProjectStatus, "All">
  due: string
}

const projects: AdvisorProject[] = [
  { id: "ap1", title: "Smart Defense Assistant", team: "Team Atlas", status: "On Track", due: "In 5 days" },
  { id: "ap2", title: "Learning Analytics Model", team: "Team Nova", status: "At Risk", due: "Overdue by 1 day" },
  { id: "ap3", title: "Cloud Thesis Archive", team: "Team Orion", status: "Review", due: "In 2 days" },
]

export function AdvisorMyProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus>("All")

  const visibleProjects = useMemo(
    () => projects.filter((project) => (status === "All" ? true : project.status === status)),
    [status]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Projects"
        description="Monitor your assigned projects and prioritize advisory follow-ups."
        badge="Advisor"
      />

      <DashboardKpiGrid
        items={[
          { title: "Assigned Projects", value: "8", note: "Current cycle", icon: FolderKanban },
          { title: "On Track", value: "5", note: "Progress healthy", icon: CheckCircle2 },
          { title: "At Risk", value: "2", note: "Need intervention", icon: AlertTriangle },
          { title: "In Review", value: "1", note: "Awaiting your feedback", icon: Clock3 },
        ]}
      />

      <DashboardSectionCard
        title="Project Pipeline"
        description="Filter your project list by status."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {(["All", "On Track", "At Risk", "Review"] as ProjectStatus[]).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={status === item ? "default" : "outline"}
              onClick={() => setStatus(item)}
              type="button"
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects for this status.</p>
          ) : (
            visibleProjects.map((project) => (
              <div key={project.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{project.title}</p>
                  <Badge
                    variant={
                      project.status === "At Risk"
                        ? "destructive"
                        : project.status === "Review"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {project.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{project.team}</p>
                <p className="mt-1 text-xs text-muted-foreground">{project.due}</p>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
