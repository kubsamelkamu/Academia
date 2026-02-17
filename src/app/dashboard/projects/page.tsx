"use client"

import { useMemo, useState } from "react"
import {
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardSectionCard,
} from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FolderKanban, GitBranch, TrendingUp } from "lucide-react"

type ProjectStage = "All" | "Proposal" | "Execution" | "Review" | "Defense"

interface ProjectRecord {
  id: string
  title: string
  stage: Exclude<ProjectStage, "All">
  advisor: string
  risk: "Normal" | "High"
  due: string
}

const stageSummary = [
  { stage: "Proposal", value: 34 },
  { stage: "Execution", value: 112 },
  { stage: "Review", value: 38 },
  { stage: "Defense", value: 30 },
]

const projectRecords: ProjectRecord[] = [
  {
    id: "p1",
    title: "AI-driven Thesis Similarity Detection",
    stage: "Execution",
    advisor: "Dr. Sara Ibrahim",
    risk: "Normal",
    due: "In 12 days",
  },
  {
    id: "p2",
    title: "Cloud-native Department Archive",
    stage: "Review",
    advisor: "Dr. Mohamed Adel",
    risk: "High",
    due: "Overdue by 2 days",
  },
  {
    id: "p3",
    title: "Smart Defense Scheduling Assistant",
    stage: "Defense",
    advisor: "Dr. Nadia Hassan",
    risk: "Normal",
    due: "In 4 days",
  },
  {
    id: "p4",
    title: "Adaptive Learning Analytics Dashboard",
    stage: "Proposal",
    advisor: "Prof. Ahmed Saleh",
    risk: "High",
    due: "Overdue by 1 day",
  },
]

const delayedProjects = [
  { title: "Cloud-native Department Archive", delay: "2 days", owner: "SE Track" },
  { title: "Adaptive Learning Analytics Dashboard", delay: "1 day", owner: "Research Track" },
]

export default function ProjectsOverviewPage() {
  const [activeStage, setActiveStage] = useState<ProjectStage>("All")

  const filteredProjects = useMemo(
    () =>
      projectRecords.filter((project) => {
        return activeStage === "All" ? true : project.stage === activeStage
      }),
    [activeStage]
  )

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Projects Overview"
        description="Track project delivery and risks inside your department only."
        badge="Department Head"
      />

      <DashboardKpiGrid
        items={[
          { title: "Total Projects", value: "96", note: "Current department cycle", icon: FolderKanban },
          { title: "On Track", value: "74", note: "Within expected timeline", icon: TrendingUp },
          { title: "At Risk", value: "7", note: "Need intervention this week", icon: AlertTriangle },
          { title: "In Review", value: "15", note: "Awaiting academic decisions", icon: GitBranch },
        ]}
      />

      <DashboardSectionCard
        title="Stage Focus"
        description="Filter project records by stage to focus decisions."
      >
        <div className="flex flex-wrap gap-2">
          {(["All", "Proposal", "Execution", "Review", "Defense"] as ProjectStage[]).map((stage) => (
            <Button
              key={stage}
              type="button"
              size="sm"
              variant={activeStage === stage ? "default" : "outline"}
              onClick={() => setActiveStage(stage)}
            >
              {stage}
            </Button>
          ))}
        </div>
      </DashboardSectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardSectionCard
          className="xl:col-span-2"
          title="Stage Funnel"
          description="Project distribution by stage in this department."
        >
          <div className="space-y-4">
            {stageSummary.map((item) => (
              <div key={item.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium">{item.stage}</p>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, item.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Delayed Projects"
          description="Projects currently behind schedule in this department."
        >
          <div className="space-y-3">
            {delayedProjects.map((item) => (
              <div key={item.title} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.owner}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="destructive">Delayed {item.delay}</Badge>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardSectionCard>
      </div>

      <DashboardSectionCard
        title="Project Watchlist"
        description="Actionable projects filtered by selected stage."
      >
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects found for this stage.</p>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{project.title}</p>
                  <Badge variant={project.risk === "High" ? "destructive" : "secondary"}>{project.risk}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Advisor: {project.advisor}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.stage}</span>
                  <span>{project.due}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSectionCard>
    </div>
  )
}
