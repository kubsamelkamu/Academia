"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Eye,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
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
import { mockProjects, formatDate, type Project } from "@/data/mockData"
import { mockProjectTimelines } from "@/data/timelineData"
import { type AdvisorEvaluationDashboardStage } from "@/lib/api/advisor"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"
import { AdvisorEvaluatorStageMenu } from "./advisor-evaluator-stage-menu"
import {
  DueBadge,
  TimelineStatusRow,
  filterAdvisorPendingProjects,
  getNextMilestoneDueDate,
  timelineStatusForProject,
} from "./advisor-evaluator-timeline"

type StatusFilter = "all" | "in_progress" | "completed"
type SortKey = "title" | "progress"

function normalizeDashboardStage(rawStage: string | null): AdvisorEvaluationDashboardStage {
  const normalized = rawStage?.trim().toUpperCase().replace(/-/g, "_")
  return normalized === "CAPSTONE_II" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function formatDashboardStageLabel(stage: AdvisorEvaluationDashboardStage) {
  return stage === "CAPSTONE_II" ? "Capstone II" : "Capstone I"
}

export function AdvisorEvaluatorProjectsListPage() {
  const searchParams = useSearchParams()
  const activeStage = React.useMemo(
    () => normalizeDashboardStage(searchParams.get("stage")),
    [searchParams],
  )
  const stageLabel = formatDashboardStageLabel(activeStage)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [sort, setSort] = React.useState<SortKey>("title")

  const pendingQueueProjects = React.useMemo(() => filterAdvisorPendingProjects(mockProjects), [])
  const pendingProjectIds = React.useMemo(
    () => new Set(pendingQueueProjects.map((p) => p.id)),
    [pendingQueueProjects],
  )

  const stats = React.useMemo(() => {
    const total = mockProjects.length
    const active = mockProjects.filter((p) => p.status === "in_progress").length
    return { total, active, pendingEval: pendingQueueProjects.length }
  }, [pendingQueueProjects.length])

  const filteredProjects = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = mockProjects.filter((p) => {
      if (statusFilter === "in_progress" && p.status !== "in_progress") return false
      if (statusFilter === "completed" && !(p.progress === 100 || p.status === "completed")) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.groupName?.toLowerCase().includes(q) ?? false) ||
        (p.advisorName?.toLowerCase().includes(q) ?? false) ||
        p.id.toLowerCase().includes(q)
      )
    })
    rows = [...rows].sort((a, b) => {
      if (sort === "progress") return (b.progress ?? 0) - (a.progress ?? 0)
      return a.title.localeCompare(b.title)
    })
    return rows
  }, [search, sort, statusFilter])

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
            <Link href="/dashboard/advisor/evaluator">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Evaluator overview
            </Link>
          </Button>
          <PageHeader
            title={`${stageLabel} projects`}
            description={`Browse projects you can evaluate for ${stageLabel} — open detail for milestones and files, or jump straight to the scoring form.`}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="default" size="sm" className="btn-gradient gap-2 shadow-md shadow-primary/20" asChild>
            <Link href={`/dashboard/advisor/evaluator/rubric?stage=${activeStage}`}>
              <BookOpen className="h-4 w-4" aria-hidden />
              Open rubric
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/advisor/evaluator/pending?stage=${activeStage}`}>
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              Pending queue
            </Link>
          </Button>
        </div>
      </div>

      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total projects"
          value={stats.total}
          subtitle={`In ${stageLabel} evaluator list`}
          icon={FolderKanban}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active"
          value={stats.active}
          subtitle="In progress"
          icon={LayoutDashboard}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          title="In pending queue"
          value={stats.pendingEval}
          subtitle="Eligible for evaluation"
          icon={ClipboardCheck}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Showing"
          value={filteredProjects.length}
          subtitle={search.trim() || statusFilter !== "all" ? "After filters" : "All projects"}
          icon={Search}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </section>

      {pendingQueueProjects.length > 0 ? (
        <section aria-label="Evaluation queue shortcut">
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-background to-background shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ready for {stageLabel} evaluation</CardTitle>
              <CardDescription>
                {pendingQueueProjects.length} project{pendingQueueProjects.length === 1 ? "" : "s"} match the {stageLabel}
                pending queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {pendingQueueProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/advisor/evaluator/evaluate/${p.id}`}
                    className="inline-flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-muted/40 sm:min-w-[200px]"
                  >
                    <span className="truncate">{p.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                ))}
              </div>
              <Button variant="link" className="mt-3 h-auto p-0 text-sm" asChild>
                <Link href={`/dashboard/advisor/evaluator/pending?stage=${activeStage}`}>Open full pending list</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <div className="min-w-0 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-3">
              <CardTitle className="text-base">Find projects</CardTitle>
              <CardDescription>Search and filter the {stageLabel} grid below.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-5 lg:flex-row lg:items-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  placeholder="Search title, group, advisor, or id…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search projects"
                />
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[280px]">
                <div>
                  <Label htmlFor="proj-status" className="sr-only">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger id="proj-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="proj-sort" className="sr-only">
                    Sort
                  </Label>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <SelectTrigger id="proj-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title (A–Z)</SelectItem>
                      <SelectItem value="progress">Progress (high first)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div
            aria-label="Projects browser help"
            className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-background p-5 ring-1 ring-border/30 sm:flex-row sm:items-stretch sm:gap-8 sm:p-6"
          >
            <div className="min-w-0 flex-1 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <GitBranch className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-foreground">Detail vs evaluate</p>
                  <p className="mt-1 leading-relaxed">
                    <strong className="text-foreground">View project</strong> is the long brief (milestones, roster,
                    files). <strong className="text-foreground">Evaluate now</strong> jumps to the {RUBRIC_TOTAL_MAX_PERCENT}%
                    form when you already know the artifacts.
                  </p>
                </div>
              </div>
              <p className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-xs leading-relaxed sm:text-sm">
                <strong className="text-foreground">In queue</strong> matches the {stageLabel} pending page filter; finished
                capstones drop the badge but stay open for audits.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col justify-center gap-2 border-t border-border/50 pt-4 sm:w-52 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <Button variant="secondary" size="sm" className="w-full rounded-xl" asChild>
                <Link href={`/dashboard/advisor/evaluator/rubric?stage=${activeStage}`}>
                  <BookOpen className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Rubric
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
                <Link href="/dashboard/advisor/my-projects">
                  <LayoutDashboard className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Advisor projects
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
                <Link href="/dashboard/advisor/evaluator/scheduled">
                  <Calendar className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Sessions
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
                <Link href={`/dashboard/advisor/evaluator/completed?stage=${activeStage}`}>Completed</Link>
              </Button>
            </div>
          </div>

          <section aria-label="Project grid" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">All {stageLabel} projects</h2>
              <p className="text-sm text-muted-foreground">
                {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}
              </p>
            </div>

            {filteredProjects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <FolderKanban className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                  <p className="font-medium">No projects match</p>
                  <p className="max-w-sm text-sm text-muted-foreground">Try clearing search or status filter.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSearch("")
                      setStatusFilter("all")
                    }}
                  >
                    Reset filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredProjects.map((project) => (
                  <EvaluatorProjectCard
                    key={project.id}
                    project={project}
                    inPendingQueue={pendingProjectIds.has(project.id)}
                    activeStage={activeStage}
                  />
                ))}
              </div>
            )}
          </section>
      </div>
    </div>
  )
}

function EvaluatorProjectCard({
  project,
  inPendingQueue,
  activeStage,
}: {
  project: Project
  inPendingQueue: boolean
  activeStage: AdvisorEvaluationDashboardStage
}) {
  const timeline = mockProjectTimelines.find((t) => t.projectId === project.id)
  const tStatus = timelineStatusForProject(timeline, project.progress ?? 0)
  const nextDue = getNextMilestoneDueDate(project.id)
  const progress = project.progress ?? 0

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 shadow-sm transition-[box-shadow] hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug sm:text-lg">{project.title}</CardTitle>
            <CardDescription className="mt-1.5">
              {project.groupName ?? "Group"} · {project.advisorName ?? "Advisor"}
            </CardDescription>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TimelineStatusRow status={tStatus} />
          {inPendingQueue ? (
            <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
              In queue
            </Badge>
          ) : null}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 border-t border-border/50 bg-muted/15 pt-4">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            <span>Team (see detail)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {nextDue ? (
              <span>
                Next milestone: <span className="font-medium text-foreground">{formatDate(nextDue)}</span>
              </span>
            ) : (
              <span>Milestones in project view</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Window</span>
            <DueBadge timeline={timeline} projectProgress={progress} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <AdvisorEvaluatorStageMenu
                projectId={project.id}
                trigger={
                  <Button variant="default" size="sm" className="rounded-lg">
                    <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden />
                    Evaluate {formatDashboardStageLabel(activeStage)}
                  </Button>
                }
              />
        </div>
      </CardContent>
    </Card>
  )
}
