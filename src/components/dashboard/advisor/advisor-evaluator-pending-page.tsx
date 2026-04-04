"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Search,
  Users,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockProjects, formatDate } from "@/data/mockData"
import { mockProjectTimelines } from "@/data/timelineData"
import type { Project } from "@/data/mockData"

import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"
import {
  DueBadge,
  TimelineStatusRow,
  filterAdvisorPendingProjects,
  getNextMilestoneDueDate,
  timelineStatusForProject,
} from "./advisor-evaluator-timeline"

type SortKey = "due" | "title" | "progress"

export function AdvisorEvaluatorPendingPage() {
  const baseList = React.useMemo(() => filterAdvisorPendingProjects(mockProjects), [])
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("due")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = baseList.filter((p) => {
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.groupName?.toLowerCase().includes(q) ?? false) ||
        (p.advisorName?.toLowerCase().includes(q) ?? false)
      )
    })

    rows = [...rows].sort((a, b) => {
      const ta = mockProjectTimelines.find((t) => t.projectId === a.id)
      const tb = mockProjectTimelines.find((t) => t.projectId === b.id)
      if (sort === "title") {
        return a.title.localeCompare(b.title)
      }
      if (sort === "progress") {
        return (b.progress ?? 0) - (a.progress ?? 0)
      }
      const da = ta?.daysRemaining ?? 999
      const db = tb?.daysRemaining ?? 999
      return da - db
    })

    return rows
  }, [baseList, search, sort])

  const dueSoonProjects = React.useMemo(() => {
    return baseList.filter((p) => {
      const t = mockProjectTimelines.find((x) => x.projectId === p.id)
      const d = t?.daysRemaining
      return d !== undefined && d >= 0 && d <= 7
    })
  }, [baseList])

  const dueSoonCount = dueSoonProjects.length

  const atRiskCount = React.useMemo(() => {
    return baseList.filter((p) => {
      const t = mockProjectTimelines.find((x) => x.projectId === p.id)
      return t?.status === "at_risk"
    }).length
  }, [baseList])

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-8 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
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
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <Download className="h-4 w-4" aria-hidden />
              Document library
            </Link>
          </Button>
        </div>
      </div>

      <section aria-label="Queue summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="In queue"
          value={baseList.length}
          subtitle="Match advisor filters"
          icon={ClipboardCheck}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Due within 7 days"
          value={dueSoonCount}
          subtitle="By timeline mock"
          icon={Calendar}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="At risk"
          value={atRiskCount}
          subtitle="Timeline status"
          icon={Filter}
          iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          title="Showing"
          value={filtered.length}
          subtitle={search.trim() ? "After search" : "All in queue"}
          icon={Search}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
      </section>

      {dueSoonCount > 0 ? (
        <section aria-label="Due soon spotlight">
          <Card className="border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] via-background to-background shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    <Clock className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-base">Due within 7 days</CardTitle>
                    <CardDescription>
                      {dueSoonCount} project{dueSoonCount === 1 ? "" : "s"} — consider reviewing these first.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {dueSoonProjects.map((p) => (
                  <li key={p.id} className="min-w-0 flex-1 sm:min-w-[240px]">
                    <Link
                      href={`/dashboard/advisor/evaluator/evaluate/${p.id}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <span className="min-w-0 truncate font-medium">{p.title}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section
        aria-label="Queue insights"
        className="rounded-2xl border border-border/60 bg-muted/20 p-1 sm:bg-muted/25"
      >
        <div className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 sm:px-4 md:grid md:grid-cols-3 md:overflow-visible md:p-4 [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[min(100%,17.5rem)] shrink-0 snap-start rounded-xl border border-border/50 bg-background/90 p-4 shadow-sm md:min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <Filter className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">How the queue is built</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Demo: under 100% progress and in-scope status in mock data. Swap for real assignment rules when you connect
              APIs.
            </p>
          </div>
          <div className="min-w-[min(100%,17.5rem)] shrink-0 snap-start rounded-xl border border-border/50 bg-background/90 p-4 shadow-sm md:min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Reading each card</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Timeline strip = mock milestone health. Due soon = ≤7 days and not complete. Sort by soonest deadline when the
              list grows.
            </p>
          </div>
          <div className="min-w-[min(100%,17.5rem)] shrink-0 snap-start rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-sm md:min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Scores &amp; rubric</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Comments follow department policy. The form uses the shared {RUBRIC_TOTAL_MAX_PERCENT}% program rubric.
            </p>
            <Button variant="secondary" size="sm" className="mt-3 h-8 w-full text-xs" asChild>
              <Link href="/dashboard/advisor/evaluator/rubric">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Rubric
              </Link>
            </Button>
          </div>
        </div>
      </section>

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
                {filtered.length} project{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                  <p className="font-medium">Nothing matches</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Clear the search to see projects in the queue again.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((project) => (
                  <PendingProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

        <footer
          aria-label="Workspace links and API note"
          className="rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-muted/30 via-background to-background p-5 sm:p-6"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-10">
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
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-sm text-muted-foreground lg:max-w-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden />
              <p>
                <span className="font-medium text-foreground">Mock data.</span> Wire APIs so queue ordering (SLA, assignee
                load) is enforced server-side for a consistent priority view.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function PendingProjectCard({ project }: { project: Project }) {
  const timeline = mockProjectTimelines.find((t) => t.projectId === project.id)
  const tStatus = timelineStatusForProject(timeline, project.progress ?? 0)
  const nextDue = getNextMilestoneDueDate(project.id)
  const progress = project.progress ?? 0
  const dueSoon =
    timeline?.daysRemaining !== undefined && timeline.daysRemaining <= 7 && progress < 100

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 shadow-sm transition-[box-shadow,transform] hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug sm:text-lg">{project.title}</CardTitle>
            <CardDescription className="mt-1.5 line-clamp-2">
              {project.groupName ?? "Group"} · Advisor: {project.advisorName ?? "—"}
            </CardDescription>
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TimelineStatusRow status={tStatus} />
            {dueSoon ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Due soon
              </span>
            ) : null}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 border-t border-border/50 bg-muted/20 pt-4">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            <span>3 members</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span>5 documents</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {nextDue ? (
              <span>
                Next milestone: <span className="font-medium text-foreground">{formatDate(nextDue)}</span>
              </span>
            ) : (
              <span>Schedule: see timeline</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-0">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Window</span>
            <DueBadge timeline={timeline} projectProgress={progress} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="sm" className="h-10 w-full sm:min-w-0 sm:flex-1" asChild>
            <Link href={`/dashboard/advisor/evaluator/projects/${project.id}`}>
              <Eye className="mr-2 h-4 w-4" aria-hidden />
              View project
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-full sm:min-w-0 sm:flex-1" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Documents
            </Link>
          </Button>
          <Button
            className="group h-10 w-full btn-gradient shadow-md shadow-primary/20 transition-[box-shadow] hover:shadow-lg hover:shadow-primary/25 sm:min-w-0 sm:flex-[1.15]"
            size="sm"
            asChild
          >
            <Link href={`/dashboard/advisor/evaluator/evaluate/${project.id}`}>
              <ClipboardCheck className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              Evaluate now
              <ArrowRight className="ml-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
