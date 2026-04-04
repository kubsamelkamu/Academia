"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LayoutPanelLeft,
  Users,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  mockEvaluations,
  mockProjects,
  formatDate,
  type Evaluation,
  type Project,
} from "@/data/mockData"
import { mockProjectTimelines } from "@/data/timelineData"

import { ADVISOR_SCHEDULED_SESSIONS } from "./advisor-evaluator-scheduled-data"
import {
  DueBadge,
  TimelineStatusRow,
  filterAdvisorPendingProjects,
  timelineStatusForProject,
} from "./advisor-evaluator-timeline"

const DISPLAY_SCORE_MAX = 100

function evaluationMaxScore(evaluation: Evaluation): number {
  return (evaluation as Evaluation & { maxScore?: number }).maxScore ?? DISPLAY_SCORE_MAX
}

export function AdvisorEvaluatorDashboard() {
  const pendingProjects = React.useMemo(() => filterAdvisorPendingProjects(mockProjects), [])

  const completedEvaluations = React.useMemo(
    () => mockEvaluations.filter((e) => e.status === "submitted" || e.status === "reviewed"),
    [],
  )

  const scoredEvaluations = completedEvaluations.filter((e) => typeof e.score === "number")
  const averageScore =
    scoredEvaluations.length > 0
      ? (
          scoredEvaluations.reduce((sum, e) => sum + (e.score ?? 0), 0) / scoredEvaluations.length
        ).toFixed(1)
      : "—"

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-2 animate-in fade-in duration-500 sm:gap-8 lg:gap-10">
      <header className="min-w-0">
        <div className="[&_h1]:text-2xl [&_h1]:leading-tight [&_h1]:sm:text-3xl [&_h1]:md:text-4xl [&_p]:text-sm [&_p]:sm:text-base">
          <DashboardPageHeader
            title="Evaluator overview"
            description="Review pending work, completed scores, and upcoming sessions — each primary action opens its own page."
            badge="Advisor · Evaluator"
            actions={
              <Button
                variant="default"
                size="sm"
                className="btn-gradient h-10 w-full min-h-11 shrink-0 sm:h-9 sm:w-auto sm:min-h-9"
                asChild
              >
                <Link href="/dashboard/advisor/evaluator/pending">Full pending list</Link>
              </Button>
            }
          />
        </div>
      </header>

      {/* Quick actions — primary CTAs, touch-friendly on small screens */}
      <section aria-label="Quick actions" className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quick actions
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Button
            className="btn-gradient h-11 w-full min-h-11 justify-center shadow-sm shadow-primary/15 sm:h-10 sm:min-h-10 md:flex-1 md:min-w-[10rem] lg:max-w-none xl:flex-1"
            asChild
          >
            <Link href="/dashboard/advisor/evaluator/pending">
              <Clock className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              Review pending
            </Link>
          </Button>
          <Button variant="outline" className="h-11 min-h-11 w-full justify-center sm:h-10 sm:min-h-10 md:flex-1 md:min-w-[10rem] lg:max-w-none xl:flex-1" asChild>
            <Link href="/dashboard/advisor/evaluator/projects">
              <FolderKanban className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              All projects
            </Link>
          </Button>
          <Button variant="outline" className="h-11 min-h-11 w-full justify-center sm:h-10 sm:min-h-10 md:flex-1 md:min-w-[10rem] lg:max-w-none xl:flex-1" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <FileText className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              Documents
            </Link>
          </Button>
          <Button variant="outline" className="h-11 min-h-11 w-full justify-center sm:h-10 sm:min-h-10 md:flex-1 md:min-w-[10rem] lg:max-w-none xl:flex-1" asChild>
            <Link href="/dashboard/advisor/evaluator/rubric">
              <BookOpen className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              Rubric
            </Link>
          </Button>
        </div>
      </section>

      {/* KPIs */}
      <section aria-label="Summary statistics" className="space-y-3 sm:space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          At a glance
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending evaluations"
            value={pendingProjects.length}
            subtitle="Awaiting your review"
            icon={Clock}
            iconClassName="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Completed"
            value={completedEvaluations.length}
            subtitle="Submitted or reviewed"
            icon={CheckCircle}
            iconClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Scheduled sessions"
            value={ADVISOR_SCHEDULED_SESSIONS.length}
            subtitle="Upcoming"
            icon={Calendar}
            iconClassName="bg-sky-500/15 text-sky-600 dark:text-sky-400"
          />
          <StatCard
            title="Average score given"
            value={averageScore}
            subtitle={scoredEvaluations.length ? `Across ${scoredEvaluations.length} reviews` : "No scores yet"}
            icon={ClipboardCheck}
            iconClassName="bg-primary/15 text-primary"
          />
        </div>
      </section>

      <div className="flex min-w-0 flex-col gap-6 lg:gap-8 xl:gap-10">
        <div className="flex min-w-0 flex-col gap-6 lg:gap-8">
          {/* Rubric CTA */}
          <Card className="overflow-hidden rounded-xl border-dashed border-primary/25 bg-gradient-to-r from-primary/[0.06] via-background to-background shadow-sm sm:rounded-2xl">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex min-w-0 gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">Evaluation rubric</CardTitle>
                  <CardDescription className="mt-1.5 text-pretty text-sm leading-relaxed">
                    Full criteria live on a dedicated page — keep it open while you score on the evaluate form.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 min-h-10 w-full shrink-0 gap-2 border-primary/20 bg-background/80 hover:bg-primary/5 sm:h-9 sm:min-h-9 sm:w-auto"
                asChild
              >
                <Link href="/dashboard/advisor/evaluator/rubric">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Open rubric page
                </Link>
              </Button>
            </CardHeader>
          </Card>

          {/* Main workspace */}
          <section aria-label="Evaluation workspace" className="min-w-0">
            <Card className="rounded-xl border-border/80 shadow-md shadow-black/[0.04] dark:border-border dark:shadow-none sm:rounded-2xl">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Workspace</CardTitle>
            <CardDescription>Pending queue, completed reviews, and schedule preview</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-5 sm:p-6">
            <Tabs defaultValue="pending" className="w-full gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/60 p-1.5 lg:w-auto">
                  <TabsTrigger
                    value="pending"
                    className="min-h-9 gap-2 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:min-h-8 sm:text-sm"
                  >
                    <Clock className="h-4 w-4 shrink-0" aria-hidden />
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="min-h-9 gap-2 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:min-h-8 sm:text-sm"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                    Completed
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="min-h-9 gap-2 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm sm:min-h-8 sm:text-sm"
                  >
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                    Schedule
                  </TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/dashboard/advisor/evaluator/pending">Open pending page</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/dashboard/advisor/evaluator/scheduled">Open schedule page</Link>
                  </Button>
                </div>
              </div>

              <TabsContent value="pending" className="mt-0 space-y-4 outline-none focus-visible:outline-none">
                {pendingProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/15 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                      <LayoutDashboard className="h-7 w-7 text-muted-foreground" aria-hidden />
                    </div>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      No projects in the pending queue with current filters.
                    </p>
                  </div>
                ) : (
                  pendingProjects.map((project: Project) => {
                    const timeline = mockProjectTimelines.find((t) => t.projectId === project.id)
                    const tStatus = timelineStatusForProject(timeline, project.progress ?? 0)

                    return (
                      <Card
                        key={project.id}
                        className="overflow-hidden rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
                          <div className="w-1 shrink-0 bg-gradient-to-b from-primary to-primary/50" aria-hidden />
                          <CardHeader className="min-w-0 flex-1 space-y-3 pb-4 pt-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg leading-snug sm:text-xl">{project.title}</CardTitle>
                                <CardDescription className="mt-2 text-sm">
                                  {project.groupName ?? "Group"} · Advisor: {project.advisorName ?? "—"}
                                </CardDescription>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <TimelineStatusRow status={tStatus} />
                                <StatusBadge status={project.status} />
                              </div>
                            </div>
                          </CardHeader>
                        </div>
                        <CardContent className="space-y-4 bg-muted/[0.35] px-5 py-5 sm:px-6">
                          <div className="flex flex-col flex-wrap gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1">
                              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              3 members
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1">
                              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              5 documents
                            </span>
                            <span className="inline-flex items-center sm:ml-0">
                              <DueBadge timeline={timeline} projectProgress={project.progress ?? 0} />
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button variant="outline" size="sm" className="w-full rounded-lg sm:w-auto" asChild>
                              <Link href={`/dashboard/advisor/evaluator/projects/${project.id}`}>
                                <Eye className="mr-2 h-4 w-4" aria-hidden />
                                View project
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="w-full rounded-lg sm:w-auto" asChild>
                              <Link href="/dashboard/advisor/evaluator/documents">
                                <FileText className="mr-2 h-4 w-4" aria-hidden />
                                Documents
                              </Link>
                            </Button>
                            <Button
                              className="group w-full rounded-xl btn-gradient shadow-md shadow-primary/20 transition-[transform,box-shadow] hover:shadow-lg hover:shadow-primary/25 sm:w-auto"
                              size="sm"
                              asChild
                            >
                              <Link href={`/dashboard/advisor/evaluator/evaluate/${project.id}`}>
                                <ClipboardCheck className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                                Start evaluation
                                <ArrowRight className="ml-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0 outline-none focus-visible:outline-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">Recent completed</p>
                  <Button variant="outline" size="sm" className="w-full rounded-lg sm:w-auto" asChild>
                    <Link href="/dashboard/advisor/evaluator/completed">Full history</Link>
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  {completedEvaluations.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/70 bg-muted/10 py-10 text-center text-sm text-muted-foreground">
                      No completed evaluations yet.
                    </p>
                  ) : (
                    completedEvaluations.map((evaluation: Evaluation) => {
                      const maxScore = evaluationMaxScore(evaluation)
                      return (
                        <div
                          key={evaluation.id}
                          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/20 hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-500/20">
                              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium leading-snug">Project evaluation</p>
                              <p className="text-sm text-muted-foreground">
                                {evaluation.submittedAt
                                  ? `Submitted ${formatDate(evaluation.submittedAt)}`
                                  : "Submitted"}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {mockProjects.find((p) => p.id === evaluation.projectId)?.title ?? "Project"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="text-2xl font-bold tabular-nums tracking-tight text-primary">
                                {evaluation.score ?? "—"}
                                <span className="text-base font-medium text-muted-foreground">
                                  /{maxScore}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={evaluation.status} />
                              <Button variant="outline" size="icon" className="shrink-0 rounded-lg" asChild>
                                <Link
                                  href={`/dashboard/advisor/evaluator/evaluations/${evaluation.id}`}
                                  aria-label="View evaluation details"
                                >
                                  <Eye className="h-4 w-4" aria-hidden />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-0 outline-none focus-visible:outline-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">Upcoming sessions</p>
                  <Button variant="outline" size="sm" className="w-full rounded-lg sm:w-auto" asChild>
                    <Link href="/dashboard/advisor/evaluator/scheduled">All sessions</Link>
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  {ADVISOR_SCHEDULED_SESSIONS.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-sky-500/25 hover:bg-muted/15 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 ring-1 ring-sky-500/20">
                          <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{session.project}</p>
                          <p className="text-sm text-muted-foreground">{session.group}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 lg:text-right">
                        <div>
                          <p className="font-medium tabular-nums">{formatDate(session.date)}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.time} · {session.venue}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 rounded-lg" asChild>
                          <Link href={`/dashboard/advisor/evaluator/scheduled/${session.id}`}>Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </section>
        </div>

        <section
          aria-label="Overview and workspace help"
          className="grid gap-4 border-t border-border/60 pt-6 lg:grid-cols-2 lg:gap-6 lg:pt-8"
        >
          <div className="relative overflow-hidden rounded-2xl bg-muted/40 p-5 ring-1 ring-border/60 sm:p-6">
            <LayoutPanelLeft className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-muted-foreground/10" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace tabs</p>
            <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Pending</span> — quick scan with timelines and{" "}
                <strong className="text-foreground">Start evaluation</strong>; use the full pending page to sort or see the
                whole queue.
              </li>
              <li>
                <span className="font-medium text-foreground">Completed</span> — recent scores for spot checks; export-ready
                history stays on the completed page.
              </li>
              <li>
                <span className="font-medium text-foreground">Schedule</span> — next sessions with venue or link; open
                details for agenda, roster, and session weights.
              </li>
            </ul>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-border/70 bg-background p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-foreground">About these numbers</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                KPI tiles are mock placeholders until you connect your LMS or queue. When two teams feel equally urgent,
                favor the one with a sooner session, then the tighter due badge in Pending.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/advisor/evaluator/scheduled">
                  <Calendar className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Full schedule
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/advisor/evaluator/completed">
                  <CheckCircle className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Completed list
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
