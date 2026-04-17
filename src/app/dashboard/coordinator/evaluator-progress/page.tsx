"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQueries, useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  RefreshCw,
  Scale,
  Send,
  TrendingUp,
  Users,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CoordinatorEvaluationProjectDetail,
  CoordinatorEvaluationStage,
  getCoordinatorEvaluationDashboard,
  getCoordinatorEvaluationProjectDetail,
} from "@/lib/api/coordinator-evaluations"
import { toast } from "sonner"

type CapstonePhase = "capstone1" | "capstone2"

type EvaluatorPerformance = "excellent" | "good" | "needs_attention" | "no_activity"

interface EvaluatorProjectSnapshot {
  projectId: string
  projectTitle: string
  groupName: string
  score: number | null
  status: string
  submittedAt: string | null
}

interface EvaluatorMetrics {
  id: string
  name: string
  assignedProjects: number
  submittedProjects: number
  pendingProjects: number
  avgScore: number | null
  completionRate: number
  lastActivity: string
  performance: EvaluatorPerformance
  projectSnapshots: EvaluatorProjectSnapshot[]
}

interface MutableEvaluatorMetrics {
  id: string
  name: string
  assignedProjects: number
  submittedProjects: number
  pendingProjects: number
  totalScore: number
  scoreCount: number
  latestSubmittedAt: string | null
  projectSnapshots: EvaluatorProjectSnapshot[]
}

const PERFORMANCE_CONFIG: Record<
  EvaluatorPerformance,
  { label: string; className: string; dotClassName: string }
> = {
  excellent: {
    label: "Excellent",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  good: {
    label: "Good",
    className: "bg-blue-500/10 text-blue-700 border-blue-300",
    dotClassName: "bg-blue-500",
  },
  needs_attention: {
    label: "Needs attention",
    className: "bg-amber-500/10 text-amber-700 border-amber-300",
    dotClassName: "bg-amber-500",
  },
  no_activity: {
    label: "No activity",
    className: "bg-muted text-muted-foreground border-border",
    dotClassName: "bg-muted-foreground",
  },
}

function phaseLabel(phase: CapstonePhase) {
  return phase === "capstone1" ? "Capstone I" : "Capstone II"
}

function phaseSetupHref(phase: CapstonePhase) {
  return phase === "capstone1"
    ? "/dashboard/coordinator/evaluation-setup?stage=capstone-i"
    : "/dashboard/coordinator/evaluation-setup?stage=capstone-ii"
}

function stageFromPhase(phase: CapstonePhase): CoordinatorEvaluationStage {
  return phase === "capstone2" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function formatDateTime(value: string | null) {
  if (!value) return "No submissions yet"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function isSubmittedEvaluatorStatus(status: string, submittedAt: string | null) {
  if (submittedAt) return true

  return ["SUBMITTED", "REVIEWED", "COMPLETED", "APPROVED"].includes(status.toUpperCase())
}

function formatEvaluatorStatus(status: string, submittedAt: string | null) {
  if (isSubmittedEvaluatorStatus(status, submittedAt)) {
    return "Submitted"
  }

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function derivePerformance(completionRate: number, assignedProjects: number, pendingProjects: number): EvaluatorPerformance {
  if (assignedProjects === 0) return "no_activity"
  if (completionRate >= 75 && pendingProjects === 0) return "excellent"
  if (completionRate >= 40) return "good"
  return "needs_attention"
}

function buildEvaluatorMetrics(projectDetails: CoordinatorEvaluationProjectDetail[]) {
  const metrics = new Map<string, MutableEvaluatorMetrics>()

  for (const detail of projectDetails) {
    for (const evaluator of detail.evaluatorEvaluation.evaluators) {
      const existing = metrics.get(evaluator.evaluatorUserId) ?? {
        id: evaluator.evaluatorUserId,
        name: evaluator.fullName,
        assignedProjects: 0,
        submittedProjects: 0,
        pendingProjects: 0,
        totalScore: 0,
        scoreCount: 0,
        latestSubmittedAt: null,
        projectSnapshots: [],
      }

      const evaluatorScores = detail.students.flatMap((student) =>
        student.evaluatorScores
          .filter(
            (score) =>
              score.evaluatorUserId === evaluator.evaluatorUserId &&
              typeof score.score === "number"
          )
          .map((score) => score.score as number)
      )

      const submitted = isSubmittedEvaluatorStatus(evaluator.status, evaluator.submittedAt)
      const projectAverage = evaluatorScores.length
        ? Math.round(
            evaluatorScores.reduce((sum, score) => sum + score, 0) / evaluatorScores.length
          )
        : null

      existing.assignedProjects += 1
      existing.submittedProjects += submitted ? 1 : 0
      existing.pendingProjects += submitted ? 0 : 1
      existing.totalScore += evaluatorScores.reduce((sum, score) => sum + score, 0)
      existing.scoreCount += evaluatorScores.length
      existing.latestSubmittedAt =
        evaluator.submittedAt && (!existing.latestSubmittedAt || evaluator.submittedAt > existing.latestSubmittedAt)
          ? evaluator.submittedAt
          : existing.latestSubmittedAt
      existing.projectSnapshots.push({
        projectId: detail.project.id,
        projectTitle: detail.project.title,
        groupName: detail.group.name,
        score: projectAverage,
        status: evaluator.status,
        submittedAt: evaluator.submittedAt,
      })

      metrics.set(evaluator.evaluatorUserId, existing)
    }
  }

  return Array.from(metrics.values())
    .map<EvaluatorMetrics>((metric) => {
      const completionRate = metric.assignedProjects
        ? Math.round((metric.submittedProjects / metric.assignedProjects) * 100)
        : 0

      return {
        id: metric.id,
        name: metric.name,
        assignedProjects: metric.assignedProjects,
        submittedProjects: metric.submittedProjects,
        pendingProjects: metric.pendingProjects,
        avgScore: metric.scoreCount ? Math.round(metric.totalScore / metric.scoreCount) : null,
        completionRate,
        lastActivity: formatDateTime(metric.latestSubmittedAt),
        performance: derivePerformance(
          completionRate,
          metric.assignedProjects,
          metric.pendingProjects
        ),
        projectSnapshots: metric.projectSnapshots.sort((left, right) =>
          left.projectTitle.localeCompare(right.projectTitle)
        ),
      }
    })
    .sort((left, right) => {
      if (right.completionRate !== left.completionRate) {
        return right.completionRate - left.completionRate
      }

      if (left.pendingProjects !== right.pendingProjects) {
        return left.pendingProjects - right.pendingProjects
      }

      return left.name.localeCompare(right.name)
    })
}

export default function EvaluatorProgressPage() {
  const [selectedCapstone, setSelectedCapstone] = useState<CapstonePhase>("capstone1")
  const [activeTab, setActiveTab] = useState("overview")

  const selectedStage = stageFromPhase(selectedCapstone)

  const dashboardQuery = useQuery({
    queryKey: ["coordinator", "evaluation-dashboard", selectedStage, "evaluator-progress"],
    queryFn: () => getCoordinatorEvaluationDashboard(selectedStage),
    staleTime: 30_000,
    retry: 1,
  })

  const projectGroups = dashboardQuery.data?.projectGroups ?? []

  const detailQueries = useQueries({
    queries: projectGroups.map((project) => ({
      queryKey: [
        "coordinator",
        "evaluation-project-detail",
        project.projectId,
        selectedStage,
        "evaluator-progress",
      ],
      queryFn: () => getCoordinatorEvaluationProjectDetail(project.projectId, selectedStage),
      staleTime: 15_000,
      retry: 1,
      enabled: dashboardQuery.isSuccess,
    })),
  })

  const projectDetails = useMemo(
    () => detailQueries.map((query) => query.data).filter(Boolean) as CoordinatorEvaluationProjectDetail[],
    [detailQueries]
  )

  const detailError = detailQueries.find((query) => query.isError)?.error
  const detailErrorMessage = detailError
    ? getErrorMessage(detailError, "Failed to load evaluator project analytics.")
    : null
  const detailsLoading = detailQueries.some((query) => query.isLoading)
  const detailsFetching = detailQueries.some((query) => query.isFetching)

  const evaluatorMetrics = useMemo(() => buildEvaluatorMetrics(projectDetails), [projectDetails])

  const totalAssigned = evaluatorMetrics.reduce((sum, evaluator) => sum + evaluator.assignedProjects, 0)
  const totalSubmitted = evaluatorMetrics.reduce((sum, evaluator) => sum + evaluator.submittedProjects, 0)
  const totalPending = evaluatorMetrics.reduce((sum, evaluator) => sum + evaluator.pendingProjects, 0)
  const overallRate = totalAssigned ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  const summaryStats = [
    {
      label: "Evaluators",
      value: evaluatorMetrics.length,
      icon: Users,
      className: "text-primary",
      background: "bg-primary/10",
    },
    {
      label: "Overall completion",
      value: `${overallRate}%`,
      icon: TrendingUp,
      className: "text-emerald-600",
      background: "bg-emerald-500/10",
    },
    {
      label: "Pending evaluator submissions",
      value: totalPending,
      icon: AlertTriangle,
      className: "text-amber-600",
      background: "bg-amber-500/10",
    },
    {
      label: "Ready projects",
      value: dashboardQuery.data?.projectGroups.filter((project) => project.readyForPreview).length ?? 0,
      icon: CheckCircle2,
      className: "text-blue-600",
      background: "bg-blue-500/10",
    },
  ]

  const dashboardErrorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error, "Failed to load evaluator progress analytics.")
    : null

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        title="Evaluator Progress & Analytics"
        description={`Live coordinator analytics for ${phaseLabel(selectedCapstone)} evaluator submissions and scoring readiness.`}
      />

      <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Stage analytics</p>
          <p className="text-xs text-muted-foreground">
            Aggregated from the live coordinator evaluation dashboard and per-project evaluator detail responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              void dashboardQuery.refetch()
              void Promise.all(detailQueries.map((query) => query.refetch()))
            }}
            disabled={dashboardQuery.isFetching || detailsFetching}
          >
            <RefreshCw className={`h-4 w-4 ${dashboardQuery.isFetching || detailsFetching ? "animate-spin" : ""}`} />
            Refresh analytics
          </Button>
          <Link href={phaseSetupHref(selectedCapstone)}>
            <Button size="sm" className="gap-1.5">
              <Scale className="h-4 w-4" /> Configure weights
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={selectedCapstone} onValueChange={(value) => setSelectedCapstone(value as CapstonePhase)}>
        <TabsList>
          <TabsTrigger value="capstone1">Capstone I</TabsTrigger>
          <TabsTrigger value="capstone2">Capstone II</TabsTrigger>
        </TabsList>
      </Tabs>

      {dashboardErrorMessage || detailErrorMessage ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Unable to load live evaluator analytics</p>
              <p className="text-sm text-muted-foreground">{dashboardErrorMessage ?? detailErrorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  void dashboardQuery.refetch()
                  void Promise.all(detailQueries.map((query) => query.refetch()))
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {dashboardQuery.isLoading || detailsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-none shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryStats.map((item) => (
              <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{item.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.background} transition-transform group-hover:scale-110`}>
                    <item.icon className={`h-5 w-5 ${item.className}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Department evaluator completion</p>
                  <p className="text-xs text-muted-foreground">
                    {totalSubmitted} submitted assignments out of {totalAssigned} evaluator assignments in {phaseLabel(selectedCapstone)}.
                  </p>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {overallRate}% complete
                </Badge>
              </div>
              <Progress value={overallRate} className="h-3" />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{dashboardQuery.data?.weights.isConfigured ? "Weights configured" : "Weights pending"}</span>
                <span>Advisor {dashboardQuery.data?.weights.advisorPercentage ?? "—"}%</span>
                <span>Evaluator {dashboardQuery.data?.weights.evaluatorPercentage ?? "—"}%</span>
                <span>{dashboardQuery.data?.projectGroups.length ?? 0} project groups</span>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="overview" className="shrink-0 gap-2">
                <Activity className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="shrink-0 gap-2">
                <BarChart3 className="h-4 w-4" /> Performance
              </TabsTrigger>
              <TabsTrigger value="communication" className="shrink-0 gap-2">
                <Send className="h-4 w-4" /> Coordination
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {evaluatorMetrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="font-medium text-muted-foreground">No evaluator assignments found for {phaseLabel(selectedCapstone)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Once evaluators are assigned to project groups, this page will show live submission analytics.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluatorMetrics.map((evaluator) => {
                    const performance = PERFORMANCE_CONFIG[evaluator.performance]

                    return (
                      <Card key={evaluator.id} className="group border-none shadow-sm transition-all hover:shadow-md">
                        <CardContent className="space-y-4 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold">{evaluator.name}</p>
                                <Badge variant="outline" className={performance.className}>
                                  {performance.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Last submission activity: {evaluator.lastActivity}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                              <div className="rounded-lg bg-muted/40 px-3 py-2">
                                <p className="text-muted-foreground">Assigned</p>
                                <p className="mt-1 font-semibold">{evaluator.assignedProjects}</p>
                              </div>
                              <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-700">
                                <p className="text-emerald-700/80">Submitted</p>
                                <p className="mt-1 font-semibold">{evaluator.submittedProjects}</p>
                              </div>
                              <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-700">
                                <p className="text-amber-700/80">Pending</p>
                                <p className="mt-1 font-semibold">{evaluator.pendingProjects}</p>
                              </div>
                              <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-blue-700">
                                <p className="text-blue-700/80">Avg score</p>
                                <p className="mt-1 font-semibold">{evaluator.avgScore !== null ? `${evaluator.avgScore}%` : "—"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Completion rate</span>
                              <span className="font-medium">{evaluator.completionRate}%</span>
                            </div>
                            <Progress value={evaluator.completionRate} className="h-2" />
                          </div>

                          <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                            {evaluator.projectSnapshots.map((project) => (
                              <div key={`${evaluator.id}-${project.projectId}`} className="rounded-xl border bg-muted/25 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{project.projectTitle}</p>
                                    <p className="truncate text-xs text-muted-foreground">{project.groupName}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px]">
                                    {formatEvaluatorStatus(project.status, project.submittedAt)}
                                  </Badge>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Score</span>
                                  <span className="font-medium text-foreground">
                                    {project.score !== null ? `${project.score}%` : "Not scored"}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Submitted</span>
                                  <span>{formatDateTime(project.submittedAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-primary" /> Performance distribution
                    </CardTitle>
                    <CardDescription>Evaluator completion quality for the selected capstone stage.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      ["excellent", "good", "needs_attention", "no_activity"] as EvaluatorPerformance[]
                    ).map((performanceKey) => {
                      const config = PERFORMANCE_CONFIG[performanceKey]
                      const count = evaluatorMetrics.filter(
                        (evaluator) => evaluator.performance === performanceKey
                      ).length
                      const percent = evaluatorMetrics.length
                        ? Math.round((count / evaluatorMetrics.length) * 100)
                        : 0

                      return (
                        <div key={performanceKey} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${config.dotClassName}`} />
                              <span>{config.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {count} evaluator{count !== 1 ? "s" : ""}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {percent}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={percent} className="h-1.5" />
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardCheck className="h-4 w-4 text-primary" /> Stage insights
                    </CardTitle>
                    <CardDescription>Live coordinator signals derived from evaluator submissions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      {
                        label: "Highest completion",
                        value: evaluatorMetrics.length
                          ? `${Math.max(...evaluatorMetrics.map((evaluator) => evaluator.completionRate))}%`
                          : "0%",
                      },
                      {
                        label: "Lowest completion",
                        value: evaluatorMetrics.length
                          ? `${Math.min(...evaluatorMetrics.map((evaluator) => evaluator.completionRate))}%`
                          : "0%",
                      },
                      {
                        label: "Average evaluator score",
                        value: (() => {
                          const scoredEvaluators = evaluatorMetrics.filter(
                            (evaluator) => evaluator.avgScore !== null
                          )

                          if (scoredEvaluators.length === 0) return "—"

                          const average = Math.round(
                            scoredEvaluators.reduce(
                              (sum, evaluator) => sum + (evaluator.avgScore ?? 0),
                              0
                            ) / scoredEvaluators.length
                          )

                          return `${average}%`
                        })(),
                      },
                      {
                        label: "Ready for preview",
                        value: dashboardQuery.data?.projectGroups.filter((project) => project.readyForPreview)
                          .length ?? 0,
                      },
                      {
                        label: "Weights updated",
                        value: formatDateTime(dashboardQuery.data?.weights.updatedAt ?? null),
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="communication">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Send,
                    title: "Notify evaluators",
                    description: "Open the coordinator notification workflow for evaluator reminders and announcements.",
                    href: "/dashboard/coordinator/notify-evaluators",
                  },
                  {
                    icon: Scale,
                    title: "Adjust stage weights",
                    description: `Review ${phaseLabel(selectedCapstone)} advisor and evaluator weighting before aggregation.`,
                    href: phaseSetupHref(selectedCapstone),
                  },
                  {
                    icon: Clock,
                    title: "Review pending workload",
                    description: `${totalPending} evaluator assignment(s) are still pending in ${phaseLabel(selectedCapstone)}.`,
                    onClick: () => {
                      toast.info("Pending evaluator workload", {
                        description: `${totalPending} assignment(s) still need evaluator submission before final aggregation is available.`,
                      })
                    },
                  },
                ].map((item) => (
                  <Card key={item.title} className="group border-none shadow-sm transition-all hover:shadow-md">
                    <CardContent className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold">{item.title}</p>
                      </div>
                      <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
                      {"href" in item ? (
                        <Link href={item.href}>
                          <Button variant="outline" size="sm" className="w-full gap-1.5 hover:border-primary hover:text-primary">
                            Open <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 hover:border-primary hover:text-primary"
                          onClick={item.onClick}
                        >
                          Review <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
