"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"
import { Calendar, Clock3, CheckCircle2, FolderKanban, Users } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import type { MilestoneTemplate } from "@/types/milestone-templates"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function normalizeMilestoneName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

function addDays(baseDate: string, daysToAdd: number): string {
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return baseDate
  const next = new Date(date)
  next.setDate(next.getDate() + Math.max(0, daysToAdd))
  return next.toISOString().split("T")[0]
}

function getActiveMilestoneTemplate(templates: MilestoneTemplate[]): MilestoneTemplate | null {
  if (!templates.length) return null
  return templates.find((t) => t.isActive) ?? templates[0]
}

type UiMilestoneStatus = "pending" | "submitted" | "approved" | "overdue"

function mapMilestoneStatus(status: string): UiMilestoneStatus {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  if (normalized === "overdue" || normalized === "rejected") return "overdue"
  return "pending"
}

function useStudentWidgetData() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null

  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken))
  const myGroup = myProjectGroupQuery.data ?? null

  const projectsQuery = useStudentProjects({ departmentId, studentId })
  const templatesQuery = useMilestoneTemplatesList(departmentId, { page: 1, limit: 100 })

  const activeProject = useMemo(() => {
    const items = projectsQuery.data?.items ?? []
    if (!items.length) return null
    return (
      items.find((project) => project.status.toLowerCase() === "in-progress") ??
      items.find((project) => project.status.toLowerCase() === "active") ??
      items[0]
    )
  }, [projectsQuery.data?.items])

  const milestonesQuery = useProjectMilestones({
    projectId: activeProject?.id,
    enabled: Boolean(activeProject?.id),
  })

  const activeTemplate = useMemo(() => {
    const templates = templatesQuery.data?.templates ?? []
    return getActiveMilestoneTemplate(templates)
  }, [templatesQuery.data?.templates])

  const mergedMilestones = useMemo(() => {
    const template = activeTemplate
    const templateMilestones = (() => {
      if (!template?.milestones?.length) return []

      const baseDate = template.createdAt
      let cumulativeDays = 0
      return template.milestones
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .map((milestone) => {
          cumulativeDays += Math.max(0, milestone.defaultDurationDays ?? 0)
          return {
            id: `${template.templateId}:${milestone.sequence}`,
            title: milestone.title,
            dueDate: addDays(baseDate, cumulativeDays),
            status: "pending" as UiMilestoneStatus,
            sequence: milestone.sequence,
          }
        })
    })()

    const projectMilestonesByName = new Map(
      (milestonesQuery.data?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    if (templateMilestones.length) {
      return templateMilestones.map((t) => {
        const matched = projectMilestonesByName.get(normalizeMilestoneName(t.title))
        if (!matched) return t
        return {
          ...t,
          id: matched.id,
          status: mapMilestoneStatus(matched.status),
          dueDate: matched.dueDate,
        }
      })
    }

    return (milestonesQuery.data?.items ?? []).map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      dueDate: milestone.dueDate,
      status: mapMilestoneStatus(milestone.status),
      sequence: undefined as number | undefined,
    }))
  }, [activeTemplate, milestonesQuery.data?.items])

  const nextMilestone = useMemo(() => {
    if (!mergedMilestones.length) return null
    return (
      mergedMilestones.find((m) => m.status === "pending" || m.status === "submitted") ??
      mergedMilestones[mergedMilestones.length - 1] ??
      null
    )
  }, [mergedMilestones])

  const completedCount = useMemo(() => {
    return mergedMilestones.filter((m) => m.status === "approved" || m.status === "submitted").length
  }, [mergedMilestones])

  const totalCount = mergedMilestones.length
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const teamCount = myGroup ? 1 + (myGroup.members?.length ?? 0) : 0

  return {
    accessToken,
    activeProject,
    activeTemplate,
    mergedMilestones,
    nextMilestone,
    completedCount,
    totalCount,
    progressPercent,
    teamCount,
    projectDisplayName: myGroup?.name?.trim() || activeProject?.title?.trim() || "My Project",
    isLoading:
      projectsQuery.isLoading || templatesQuery.isLoading || (activeProject?.id ? milestonesQuery.isLoading : false),
  }
}

function StudentKpisWidget() {
  const {
    isLoading,
    activeProject,
    projectDisplayName,
    teamCount,
    completedCount,
    totalCount,
    nextMilestone,
    progressPercent,
  } = useStudentWidgetData()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">My Project</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{activeProject ? "1" : "0"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {isLoading ? "Loading…" : projectDisplayName}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{isLoading ? "—" : teamCount}</p>
          <p className="text-xs text-muted-foreground">Including you</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed Milestones</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {isLoading ? "—" : `${completedCount}/${totalCount || 0}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalCount ? `${progressPercent}% complete` : "No milestones yet"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Next Deadline</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{isLoading ? "—" : nextMilestone ? formatDate(nextMilestone.dueDate) : "—"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {isLoading ? "Loading…" : nextMilestone ? nextMilestone.title : "No deadline"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentTimelineWidget() {
  const { isLoading, mergedMilestones } = useStudentWidgetData()
  const topItems = useMemo(() => mergedMilestones.slice(0, 2), [mergedMilestones])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading timeline…</p>
          </div>
        ) : topItems.length ? (
          <div className="space-y-3">
            {topItems.map((milestone) => (
              <div key={milestone.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium truncate">{milestone.title}</p>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(milestone.dueDate)} • {milestone.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No milestones yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your timeline will appear once milestones are available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StudentActionsWidget() {
  const { isLoading, nextMilestone, activeTemplate, activeProject } = useStudentWidgetData()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Items</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Loading action items…</p>
          </div>
        ) : nextMilestone ? (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium truncate">Next: {nextMilestone.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={nextMilestone.status === "overdue" ? "destructive" : "secondary"}>
                  Due {formatDate(nextMilestone.dueDate)}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {nextMilestone.status}
                </Badge>
              </div>
            </div>
            {activeTemplate ? (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium truncate">Template: {activeTemplate.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTemplate.isActive ? "Active" : "Inactive"} • Created {formatDate(activeTemplate.createdAt)}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No action items yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {!activeProject
                ? "Create a project to receive milestones and action items."
                : "Once milestones are available, your next actions will show here."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StudentDefenseWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          Upcoming Defense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium">Defense schedule pending</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your coordinator will publish the final defense slot soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const StudentWidgets = {
  "st.kpis": {
    meta: {
      id: "st.kpis",
      title: "KPIs",
      rolesAllowed: ["student"],
      defaultSize: { w: 12, h: 3 },
      minSize: { w: 6, h: 3 },
    },
    component: StudentKpisWidget,
  },
  "st.timeline": {
    meta: {
      id: "st.timeline",
      title: "Progress Timeline",
      rolesAllowed: ["student"],
      defaultSize: { w: 8, h: 5 },
      minSize: { w: 4, h: 4 },
    },
    component: StudentTimelineWidget,
  },
  "st.actions": {
    meta: {
      id: "st.actions",
      title: "Action Items",
      rolesAllowed: ["student"],
      defaultSize: { w: 4, h: 5 },
      minSize: { w: 4, h: 4 },
    },
    component: StudentActionsWidget,
  },
  "st.defense": {
    meta: {
      id: "st.defense",
      title: "Upcoming Defense",
      rolesAllowed: ["student"],
      defaultSize: { w: 12, h: 4 },
      minSize: { w: 6, h: 4 },
    },
    component: StudentDefenseWidget,
  },
} as const
