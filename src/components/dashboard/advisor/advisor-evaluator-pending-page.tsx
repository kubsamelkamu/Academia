"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/data/mockData"
import {
  getAdvisorSubmittedDocuments,
  type AdvisorEvaluationDashboardStage,
} from "@/lib/api/advisor"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"
import { useAdvisorProjectsWithOptions } from "@/lib/hooks/use-advisor-projects"
import { useEvaluatorProjectEvaluationDashboardWithOptions } from "@/lib/hooks/use-evaluator-project-evaluation-dashboard"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"
import { AdvisorEvaluatorStageMenu } from "./advisor-evaluator-stage-menu"
import {
  TimelineStatusRow,
} from "./advisor-evaluator-timeline"

type SortKey = "due" | "title" | "progress"

type PendingQueueProject = {
  id: string
  title: string
  groupName: string
  advisorName: string
  status: string
  evaluationState: "pending" | "evaluated"
  progress: number
  membersCount: number
  documentsCount: number
  nextDue: string | null
  daysRemaining: number | null
  timelineStatus: "on_track" | "at_risk" | "overdue" | "completed" | "pending"
}

function normalizeDashboardStage(rawStage: string | null): AdvisorEvaluationDashboardStage {
  const normalized = rawStage?.trim().toUpperCase().replace(/-/g, "_")
  return normalized === "CAPSTONE_II" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function formatDashboardStageLabel(stage: AdvisorEvaluationDashboardStage) {
  return stage === "CAPSTONE_II" ? "Capstone II" : "Capstone I"
}

function normalizeStatusToken(status?: string | null, fallback = "pending") {
  const value = status?.trim().toLowerCase().replace(/[_\s]+/g, "-")
  return value || fallback
}

function getEvaluationState(evaluation: {
  studentsEvaluated: number
  lastSavedAt?: string | null
  submittedAt?: string | null
  status?: string | null
}): PendingQueueProject["evaluationState"] {
  const normalizedStatus = normalizeStatusToken(evaluation.status)

  if (
    evaluation.studentsEvaluated > 0 ||
    Boolean(evaluation.lastSavedAt) ||
    Boolean(evaluation.submittedAt) ||
    ["submitted", "completed", "reviewed"].includes(normalizedStatus)
  ) {
    return "evaluated"
  }

  return "pending"
}

function getNextMilestoneDueDate(details: Array<{ dueDate: string; status: string }> | undefined): string | null {
  const candidates = (details ?? [])
    .filter((detail) => !["approved", "completed"].includes(normalizeStatusToken(detail.status)))
    .map((detail) => detail.dueDate)
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())

  return candidates[0] ?? null
}

function getDaysRemaining(isoDate: string | null): number | null {
  if (!isoDate) return null

  const dueDate = new Date(isoDate)
  if (Number.isNaN(dueDate.getTime())) return null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const diff = startOfDueDate.getTime() - startOfToday.getTime()

  return Math.round(diff / 86_400_000)
}

function getTimelineStatus(progress: number, daysRemaining: number | null): PendingQueueProject["timelineStatus"] {
  if (progress >= 100) return "completed"
  if (daysRemaining === null) return "pending"
  if (daysRemaining < 0) return "overdue"
  if (daysRemaining <= 7 || progress < 35) return "at_risk"
  return "on_track"
}

function DueSummary({ daysRemaining, projectProgress }: { daysRemaining: number | null; projectProgress: number }) {
  if (daysRemaining === null) {
    return <span className="text-muted-foreground">—</span>
  }

  if (projectProgress >= 100) {
    return <span className="text-muted-foreground">Complete</span>
  }

  if (daysRemaining < 0) {
    return <span className="font-medium text-destructive">Overdue {Math.abs(daysRemaining)}d</span>
  }

  if (daysRemaining === 0) {
    return <span className="font-medium text-amber-600 dark:text-amber-500">Due today</span>
  }

  return <span className="text-muted-foreground">{daysRemaining}d left</span>
}

export function AdvisorEvaluatorPendingPage() {
  const authHydrated = useAuthStoreHydrated()
  const searchParams = useSearchParams()
  const requestedStage = searchParams.get("stage")
  const explicitStage = React.useMemo(
    () => (requestedStage ? normalizeDashboardStage(requestedStage) : null),
    [requestedStage],
  )
  const capstoneOneQuery = useEvaluatorProjectEvaluationDashboardWithOptions("CAPSTONE_I", {
    enabled: authHydrated && (!explicitStage || explicitStage === "CAPSTONE_I"),
  })
  const capstoneTwoQuery = useEvaluatorProjectEvaluationDashboardWithOptions("CAPSTONE_II", {
    enabled: authHydrated && (!explicitStage || explicitStage === "CAPSTONE_II"),
  })
  const projectsQuery = useAdvisorProjectsWithOptions({ enabled: authHydrated })
  const submittedDocumentsQuery = useQuery({
    queryKey: ["advisor", "submitted-documents", "evaluator-pending"],
    queryFn: getAdvisorSubmittedDocuments,
    enabled: authHydrated,
    staleTime: 30_000,
    retry: 1,
  })
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("due")

  const evaluatorDashboardQuery = React.useMemo(() => {
    if (explicitStage === "CAPSTONE_I") {
      return capstoneOneQuery
    }

    if (explicitStage === "CAPSTONE_II") {
      return capstoneTwoQuery
    }

    const capstoneOneCount = capstoneOneQuery.data?.projectGroups.filter(
      (projectGroup) => projectGroup.evaluation.studentsPendingEvaluation > 0,
    ).length ?? 0
    const capstoneTwoCount = capstoneTwoQuery.data?.projectGroups.filter(
      (projectGroup) => projectGroup.evaluation.studentsPendingEvaluation > 0,
    ).length ?? 0

    if (capstoneOneCount > 0 || capstoneTwoCount > 0) {
      return capstoneTwoCount > capstoneOneCount ? capstoneTwoQuery : capstoneOneQuery
    }

    const capstoneOneProjects = capstoneOneQuery.data?.projectGroups.length ?? 0
    const capstoneTwoProjects = capstoneTwoQuery.data?.projectGroups.length ?? 0

    if (capstoneOneProjects > 0 || capstoneTwoProjects > 0) {
      return capstoneTwoProjects > capstoneOneProjects ? capstoneTwoQuery : capstoneOneQuery
    }

    if (capstoneOneQuery.data) {
      return capstoneOneQuery
    }

    return capstoneTwoQuery
  }, [capstoneOneQuery, capstoneTwoQuery, explicitStage])
  const activeStage = explicitStage ?? evaluatorDashboardQuery.data?.stage ?? "CAPSTONE_I"

  const projectMap = React.useMemo(
    () => new Map((projectsQuery.data ?? []).map((project) => [project.id, project])),
    [projectsQuery.data],
  )

  const documentCountByProject = React.useMemo(() => {
    const counts = new Map<string, number>()

    for (const document of submittedDocumentsQuery.data?.documents ?? []) {
      const projectId = document.project.id.trim()
      counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
    }

    return counts
  }, [submittedDocumentsQuery.data?.documents])

  const baseList = React.useMemo<PendingQueueProject[]>(() => {
    const projectGroups = evaluatorDashboardQuery.data?.projectGroups ?? []
    const strictlyPendingGroups = projectGroups.filter(
      (projectGroup) => projectGroup.evaluation.studentsPendingEvaluation > 0,
    )
    const sourceGroups = strictlyPendingGroups.length > 0 ? strictlyPendingGroups : projectGroups

    return sourceGroups
      .map((projectGroup) => {
        const project = projectMap.get(projectGroup.projectId)
        const progress = project?.milestones.progressPercent ?? projectGroup.milestones.progressPercent
        const nextDue = getNextMilestoneDueDate(project?.milestones.details)
        const daysRemaining = getDaysRemaining(nextDue)

        return {
          id: projectGroup.projectId,
          title: projectGroup.projectTitle,
          groupName: project?.group.name ?? projectGroup.group.name,
          advisorName: projectGroup.advisor.fullName,
          status: normalizeStatusToken(project?.status ?? projectGroup.projectStatus, "in-progress"),
          evaluationState: getEvaluationState(projectGroup.evaluation),
          progress,
          membersCount: project?.group.studentCount ?? projectGroup.group.totalMembers ?? projectGroup.groupMembers.length,
          documentsCount: documentCountByProject.get(projectGroup.projectId) ?? 0,
          nextDue,
          daysRemaining,
          timelineStatus: getTimelineStatus(progress, daysRemaining),
        }
      })
  }, [documentCountByProject, evaluatorDashboardQuery.data?.projectGroups, projectMap])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = baseList.filter((project) => {
      if (!q) return true
      return (
        project.title.toLowerCase().includes(q) ||
        project.groupName.toLowerCase().includes(q) ||
        project.advisorName.toLowerCase().includes(q)
      )
    })

    rows = [...rows].sort((a, b) => {
      if (sort === "title") {
        return a.title.localeCompare(b.title)
      }
      if (sort === "progress") {
        return b.progress - a.progress
      }
      const da = a.daysRemaining ?? Number.MAX_SAFE_INTEGER
      const db = b.daysRemaining ?? Number.MAX_SAFE_INTEGER
      return da - db
    })

    return rows
  }, [baseList, search, sort])

  const hasSearch = search.trim().length > 0
  const isLoading = !authHydrated || (
    explicitStage
      ? evaluatorDashboardQuery.isLoading
      : !capstoneOneQuery.data && !capstoneTwoQuery.data && (capstoneOneQuery.isLoading || capstoneTwoQuery.isLoading)
  )

  return (
    <div className="flex w-full min-w-0 overflow-x-hidden flex-col gap-6 pb-8 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
            <Link href="/dashboard/advisor/evaluator">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Evaluator overview
            </Link>
          </Button>
          <PageHeader
            title="Pending evaluations"
            description="Projects awaiting your review — open a project for context, then score on the evaluation form using the rubric."
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="default"
            size="sm"
            className="btn-gradient gap-2 shadow-md shadow-primary/20"
            asChild
          >
            <Link href="/dashboard/advisor/evaluator/rubric">
              <BookOpen className="h-4 w-4" aria-hidden />
              Open rubric
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/projects">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              All projects
            </Link>
          </Button>
        </div>
      </div>

      {evaluatorDashboardQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{evaluatorDashboardQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {projectsQuery.error || submittedDocumentsQuery.error ? (
        <Card className="border-border/70">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Some queue details could not be loaded. Project titles and evaluation status are shown with available backend data.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="min-w-0 space-y-6">
          <section aria-label="Filters and sort">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
                <CardTitle className="text-base">Find &amp; order</CardTitle>
                <CardDescription>Search by title, group, or advisor. Sort to prioritize deadlines.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search pending evaluations"
                  />
                </div>
                <div className="w-full sm:w-52">
                  <Label htmlFor="pending-sort" className="sr-only">
                    Sort by
                  </Label>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <SelectTrigger id="pending-sort" className="w-full">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due">Soonest deadline</SelectItem>
                      <SelectItem value="title">Title (A–Z)</SelectItem>
                      <SelectItem value="progress">Progress (high first)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-label="Evaluation queue" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Queue</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${filtered.length} project${filtered.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {isLoading ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                  <p className="font-medium">Loading pending queue</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Fetching evaluator assignments from the backend.
                  </p>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                  <p className="font-medium">{hasSearch ? "Nothing matches" : "No pending evaluations found"}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {hasSearch
                      ? "Clear the search to see projects in the queue again."
                      : "No backend queue items are available for this stage right now."}
                  </p>
                  {hasSearch ? (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                {filtered.map((project) => (
                  <PendingProjectCard key={project.id} project={project} activeStage={activeStage} />
                ))}
              </div>
            )}
          </section>

        <footer
          aria-label="Workspace links and API note"
          className="rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-muted/30 via-background to-background p-5 sm:p-6"
        >
          <div className="grid gap-6 lg:gap-10">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/advisor/evaluator">
                  <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden />
                  Overview
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/advisor/evaluator/projects">
                  <FolderKanban className="mr-2 h-4 w-4" aria-hidden />
                  All projects
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/advisor/evaluator/scheduled">
                  <Calendar className="mr-2 h-4 w-4" aria-hidden />
                  Sessions
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/advisor/evaluator/rubric">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden />
                  Rubric reference
                </Link>
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function PendingProjectCard({
  project,
  activeStage,
}: {
  project: PendingQueueProject
  activeStage: AdvisorEvaluationDashboardStage
}) {
  const dueSoon = project.daysRemaining !== null && project.daysRemaining >= 0 && project.daysRemaining <= 7 && project.progress < 100
  const evaluatedButtonLabel = `Evaluated ${formatDashboardStageLabel(activeStage)}`

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden border-border/80 shadow-sm transition-[box-shadow,transform] hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug sm:text-lg">{project.title}</CardTitle>
            <CardDescription className="mt-1.5 line-clamp-2">
              {project.groupName} · Advisor: {project.advisorName}
            </CardDescription>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TimelineStatusRow status={project.timelineStatus} />
            {dueSoon ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Due soon
              </span>
            ) : null}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums font-medium text-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 border-t border-border/50 bg-muted/20 pt-4">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            <span>{project.membersCount} members</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span>{project.documentsCount} documents</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {project.nextDue ? (
              <span>
                Next milestone: <span className="font-medium text-foreground">{formatDate(project.nextDue)}</span>
              </span>
            ) : (
              <span>Schedule: see timeline</span>
            )}
          </div>
          <DueSummary daysRemaining={project.daysRemaining} projectProgress={project.progress} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="sm" className="h-10 w-full sm:min-w-0 sm:flex-1" asChild>
            <Link href={`/dashboard/advisor/evaluator/projects/${project.id}?stage=${activeStage}`}>
              <Eye className="mr-2 h-4 w-4" aria-hidden />
              View project
            </Link>
          </Button>
          {project.evaluationState === "evaluated" ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-10 w-full sm:min-w-0 sm:flex-[1.15]"
              type="button"
              disabled
            >
              <CheckCircle className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              {evaluatedButtonLabel}
            </Button>
          ) : (
            <AdvisorEvaluatorStageMenu
              projectId={project.id}
              trigger={
                <Button className="group h-10 w-full btn-gradient shadow-md shadow-primary/20 transition-[box-shadow] hover:shadow-lg hover:shadow-primary/25 sm:min-w-0 sm:flex-[1.15]" size="sm">
                  <ClipboardCheck className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Evaluate now
                  <ArrowRight className="ml-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Button>
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
