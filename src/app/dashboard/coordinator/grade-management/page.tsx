"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  Target,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api/errors"
import {
  finalizeCoordinatorEvaluationProject,
  getCoordinatorEvaluationDashboard,
  getCoordinatorEvaluationProjectDetail,
  previewCoordinatorEvaluationProject,
  type CoordinatorAggregationStatus,
  type CoordinatorDashboardProjectGroup,
  type CoordinatorEvaluationPreviewResult,
  type CoordinatorEvaluationProjectDetail,
  type CoordinatorEvaluationStage,
  type CoordinatorFinalizationStatus,
  type CoordinatorNextAction,
} from "@/lib/api/coordinator-evaluations"
import { mockComplaints } from "@/data/mockData"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type CapstonePhase = "capstone1" | "capstone2"

function phaseLabel(phase: CapstonePhase) {
  return phase === "capstone1" ? "Capstone I" : "Capstone II"
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

function normalizeEvaluationStatus(status: string | null | undefined) {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "_")
}

function isAdvisorSubmitted(status: string, submittedAt: string | null) {
  if (submittedAt) return true

  const normalized = normalizeEvaluationStatus(status)
  return ["SUBMITTED", "COMPLETED", "FINALIZED", "APPROVED"].includes(normalized)
}

function isAdvisorScoringComplete(detail: CoordinatorEvaluationProjectDetail) {
  return detail.advisorEvaluation.studentsEvaluated > 0 && detail.advisorEvaluation.studentsPendingEvaluation === 0
}

function deriveAggregationStatusFromProject(project: CoordinatorDashboardProjectGroup): CoordinatorAggregationStatus {
  if (project.weights.advisorPercentage === null || project.weights.evaluatorPercentage === null) {
    return "WAITING_FOR_WEIGHTS"
  }

  if (!isAdvisorSubmitted(project.advisorEvaluation.status, project.advisorEvaluation.submittedAt)) {
    return "WAITING_FOR_ADVISOR"
  }

  if (!project.evaluatorEvaluation.allSubmitted) {
    return "WAITING_FOR_EVALUATORS"
  }

  return "READY_FOR_AGGREGATION"
}

function deriveAggregationStatusFromDetail(detail: CoordinatorEvaluationProjectDetail): CoordinatorAggregationStatus {
  if (!detail.weights.isConfigured) {
    return "WAITING_FOR_WEIGHTS"
  }

  if (!isAdvisorSubmitted(detail.advisorEvaluation.status, detail.advisorEvaluation.submittedAt)) {
    return "WAITING_FOR_ADVISOR"
  }

  if (!detail.evaluatorEvaluation.allSubmitted) {
    return "WAITING_FOR_EVALUATORS"
  }

  return "READY_FOR_AGGREGATION"
}

function deriveNextAction(
  aggregationStatus: CoordinatorAggregationStatus,
  finalizationStatus: CoordinatorFinalizationStatus
): CoordinatorNextAction {
  if (finalizationStatus === "APPROVED") return "VIEW_APPROVED_RESULT"
  if (finalizationStatus === "REJECTED") return "REVIEW_REJECTED_RESULT"
  if (finalizationStatus === "FINALIZED_PENDING_DEPARTMENT_HEAD") return "VIEW_FINALIZED_RESULT"

  switch (aggregationStatus) {
    case "WAITING_FOR_WEIGHTS":
      return "CONFIGURE_WEIGHTS"
    case "WAITING_FOR_ADVISOR":
      return "WAIT_FOR_ADVISOR_SUBMISSION"
    case "WAITING_FOR_EVALUATORS":
      return "WAIT_FOR_EVALUATOR_SUBMISSIONS"
    case "READY_FOR_AGGREGATION":
      return "OPEN_PREVIEW"
  }
}

function advisorEvaluationDetailLabel(detail: CoordinatorEvaluationProjectDetail) {
  if (isAdvisorSubmitted(detail.advisorEvaluation.status, detail.advisorEvaluation.submittedAt)) {
    return "SUBMITTED"
  }

  if (isAdvisorScoringComplete(detail)) {
    return "SCORING COMPLETE"
  }

  return detail.advisorEvaluation.status.replace(/_/g, " ")
}

function aggregationStatusConfig(status: CoordinatorAggregationStatus) {
  switch (status) {
    case "WAITING_FOR_WEIGHTS":
      return {
        label: "Waiting for weights",
        className: "bg-amber-50 text-amber-900 border-amber-200",
      }
    case "WAITING_FOR_ADVISOR":
      return {
        label: "Waiting for advisor",
        className: "bg-muted text-foreground border-border",
      }
    case "WAITING_FOR_EVALUATORS":
      return {
        label: "Waiting for evaluators",
        className: "bg-primary/[0.06] text-primary/80 border-primary/10",
      }
    case "READY_FOR_AGGREGATION":
      return {
        label: "Ready for aggregation",
        className: "bg-primary/10 text-primary border-primary/20",
      }
  }
}

function finalizationStatusConfig(status: CoordinatorFinalizationStatus) {
  switch (status) {
    case "NOT_FINALIZED":
      return {
        label: "Not finalized",
        className: "bg-muted text-foreground border-border",
      }
    case "FINALIZED_PENDING_DEPARTMENT_HEAD":
      return {
        label: "Pending department head",
        className: "bg-primary/10 text-primary border-primary/20",
      }
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      }
    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      }
  }
}

function nextActionLabel(action: CoordinatorNextAction) {
  switch (action) {
    case "CONFIGURE_WEIGHTS":
      return "Configure weights"
    case "WAIT_FOR_ADVISOR_SUBMISSION":
      return "Waiting for advisor"
    case "WAIT_FOR_EVALUATOR_SUBMISSIONS":
      return "Waiting for evaluators"
    case "OPEN_PREVIEW":
      return "Open preview"
    case "VIEW_FINALIZED_RESULT":
      return "View finalized result"
    case "VIEW_APPROVED_RESULT":
      return "View approved result"
    case "REVIEW_REJECTED_RESULT":
      return "Review rejected result"
  }
}

function actionButtonVariant(action: CoordinatorNextAction): "default" | "outline" | "secondary" {
  if (action === "OPEN_PREVIEW") return "default"
  if (action === "CONFIGURE_WEIGHTS") return "secondary"
  return "outline"
}

function previewBlockedMessage(
  detail: CoordinatorEvaluationProjectDetail,
  aggregationStatus: CoordinatorAggregationStatus
) {
  if (!detail.weights.isConfigured) {
    return "Configure department grading weights before previewing final grades."
  }

  if (detail.finalizationStatus !== "NOT_FINALIZED") {
    return "This project is already in a finalized review state, so preview is no longer editable."
  }

  if (aggregationStatus === "WAITING_FOR_ADVISOR") {
    return "Advisor evaluation must be submitted before preview is available."
  }

  if (aggregationStatus === "WAITING_FOR_EVALUATORS") {
    return "All evaluator submissions must be completed before preview is available."
  }

  if (aggregationStatus === "WAITING_FOR_WEIGHTS") {
    return "Weights must be configured before preview is available."
  }

  return "Preview is not available for this project yet."
}

function ProjectAggregationCard({
  project,
  onOpenAction,
}: {
  project: CoordinatorDashboardProjectGroup
  onOpenAction: (project: CoordinatorDashboardProjectGroup) => void
}) {
  const derivedAggregationStatus = deriveAggregationStatusFromProject(project)
  const derivedNextAction = deriveNextAction(derivedAggregationStatus, project.finalizationStatus)
  const aggregation = aggregationStatusConfig(derivedAggregationStatus)
  const finalization = finalizationStatusConfig(project.finalizationStatus)

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{project.projectTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {project.group?.name ?? "No group assigned"} · {project.group?.totalMembers ?? 0} members
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className={aggregation.className}>{aggregation.label}</Badge>
          <Badge variant="outline" className={finalization.className}>{finalization.label}</Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Advisor</p>
          <p className="mt-1 font-semibold">{project.advisorEvaluation.status.replace(/_/g, " ")}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Evaluators</p>
          <p className="mt-1 font-semibold">
            {project.evaluatorEvaluation.submittedEvaluators}/{project.evaluatorEvaluation.totalAssignedEvaluators} submitted
          </p>
        </div>
        <div className="col-span-2 rounded-lg bg-muted/40 px-3 py-2 sm:col-span-1">
          <p className="text-muted-foreground">Weights</p>
          <p className="mt-1 font-semibold">
            {project.weights.advisorPercentage ?? "—"}% advisor · {project.weights.evaluatorPercentage ?? "—"}% evaluator
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="text-xs text-muted-foreground">
          {project.finalizedAt
            ? `Finalized ${formatDateTime(project.finalizedAt)}`
            : project.advisorEvaluation.submittedAt
              ? `Advisor submitted ${formatDateTime(project.advisorEvaluation.submittedAt)}`
              : "Submission timeline not available yet"}
        </div>

        <div className="flex items-center gap-2">
          {derivedNextAction === "CONFIGURE_WEIGHTS" ? (
            <Link href="/dashboard/coordinator/evaluation-setup">
              <Button size="sm" variant={actionButtonVariant(derivedNextAction)} className="gap-1.5">
                <Scale className="h-3.5 w-3.5" /> {nextActionLabel(derivedNextAction)}
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant={actionButtonVariant(derivedNextAction)}
              className="gap-1.5"
              onClick={() => onOpenAction(project)}
            >
              <Eye className="h-3.5 w-3.5" /> {nextActionLabel(derivedNextAction)}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectDetailSheet({
  open,
  onOpenChange,
  summaryProject,
  detail,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onPreview,
  isPreviewPending,
  previewErrorMessage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  summaryProject: CoordinatorDashboardProjectGroup | null
  detail: CoordinatorEvaluationProjectDetail | undefined
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  onRetry: () => void
  onPreview: () => void
  isPreviewPending: boolean
  previewErrorMessage: string | null
}) {
  const derivedAggregationStatus = detail ? deriveAggregationStatusFromDetail(detail) : null
  const effectiveAggregation = derivedAggregationStatus ? aggregationStatusConfig(derivedAggregationStatus) : null
  const effectiveFinalization = detail ? finalizationStatusConfig(detail.finalizationStatus) : null
  const readyForPreview = detail
    ? derivedAggregationStatus === "READY_FOR_AGGREGATION" && detail.finalizationStatus === "NOT_FINALIZED"
    : false

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-left text-lg">
                {detail?.project.title ?? summaryProject?.projectTitle ?? "Project detail"}
              </SheetTitle>
              <SheetDescription className="mt-1 text-left text-xs">
                {detail?.group.name ?? summaryProject?.group?.name ?? "No group assigned"} · {detail?.group.totalMembers ?? summaryProject?.group?.totalMembers ?? 0} members
              </SheetDescription>
            </div>
            {effectiveAggregation && effectiveFinalization ? (
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant="outline" className={effectiveAggregation.className}>{effectiveAggregation.label}</Badge>
                <Badge variant="outline" className={effectiveFinalization.className}>{effectiveFinalization.label}</Badge>
              </div>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : isError ? (
            <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-foreground">Unable to load project detail</p>
                    <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
              </CardContent>
            </Card>
          ) : detail ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border-none shadow-sm">
                  <CardContent className="space-y-1 p-4 text-sm">
                    <p className="text-xs text-muted-foreground">Weights</p>
                    <p className="font-semibold">
                      {detail.weights.advisorPercentage ?? "—"}% advisor · {detail.weights.evaluatorPercentage ?? "—"}% evaluator
                    </p>
                    <p className="text-xs text-muted-foreground">Updated {formatDateTime(detail.weights.updatedAt)}</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="space-y-1 p-4 text-sm">
                    <p className="text-xs text-muted-foreground">Advisor evaluation</p>
                    <p className="font-semibold">{advisorEvaluationDetailLabel(detail)}</p>
                    <p className="text-xs text-muted-foreground">
                      {detail.advisorEvaluation.studentsEvaluated} evaluated · {detail.advisorEvaluation.studentsPendingEvaluation} pending
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="space-y-1 p-4 text-sm">
                    <p className="text-xs text-muted-foreground">Evaluator progress</p>
                    <p className="font-semibold">
                      {detail.evaluatorEvaluation.submittedEvaluators}/{detail.evaluatorEvaluation.totalAssignedEvaluators} submitted
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detail.evaluatorEvaluation.pendingEvaluators} pending evaluator{detail.evaluatorEvaluation.pendingEvaluators === 1 ? "" : "s"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Evaluation sources</CardTitle>
                  <CardDescription>Advisor and evaluator submissions used for final grade review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm font-medium">Assigned evaluators</p>
                    <div className="mt-3 space-y-2">
                      {detail.evaluatorEvaluation.evaluators.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No evaluators assigned yet.</p>
                      ) : (
                        detail.evaluatorEvaluation.evaluators.map((evaluator) => (
                          <div key={evaluator.evaluatorUserId} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium">{evaluator.fullName}</p>
                              <p className="text-xs text-muted-foreground">Submitted {formatDateTime(evaluator.submittedAt)}</p>
                            </div>
                            <Badge variant="outline">{evaluator.status.replace(/_/g, " ")}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {detail.students.map((student) => (
                      <div key={student.studentUserId} className="rounded-xl border bg-background p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{student.fullName}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <Badge variant="outline" className={student.isReadyForFinalCalculation ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-50 text-amber-900 border-amber-200"}>
                            {student.isReadyForFinalCalculation ? "Ready for calculation" : "Missing scores"}
                          </Badge>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
                          <div className="rounded-lg bg-muted/40 p-3 text-sm">
                            <p className="text-xs text-muted-foreground">Advisor score</p>
                            <p className="mt-1 font-semibold">{formatNumber(student.advisorScore.score)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{student.advisorScore.status.replace(/_/g, " ")}</p>
                            {student.advisorScore.comment ? (
                              <p className="mt-2 text-xs text-muted-foreground">{student.advisorScore.comment}</p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <p className="font-medium">Evaluator scores</p>
                              <p className="text-xs text-muted-foreground">Average {formatNumber(student.evaluatorAverageScore)}</p>
                            </div>
                            {student.evaluatorScores.length === 0 ? (
                              <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">No evaluator scores submitted yet.</div>
                            ) : (
                              student.evaluatorScores.map((score) => (
                                <div key={score.evaluatorUserId} className="rounded-lg border bg-muted/20 p-3 text-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-medium">{score.evaluatorName}</p>
                                      <p className="text-xs text-muted-foreground">{score.status.replace(/_/g, " ")}</p>
                                    </div>
                                    <p className="font-semibold">{formatNumber(score.score)}</p>
                                  </div>
                                  {score.comment ? (
                                    <p className="mt-2 text-xs text-muted-foreground">{score.comment}</p>
                                  ) : null}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {previewErrorMessage ? (
                <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                  <CardContent className="p-4 text-sm">
                    <p className="font-medium text-foreground">Preview failed</p>
                    <p className="mt-1 text-muted-foreground">{previewErrorMessage}</p>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Coordinator preview step</CardTitle>
                  <CardDescription>
                    Review final grades before the separate finalize step sends the project to department-head review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {readyForPreview
                      ? "This project is ready for final grade preview."
                      : previewBlockedMessage(detail, derivedAggregationStatus ?? detail.aggregationStatus)}
                  </div>

                  <Button
                    className="gap-1.5"
                    onClick={onPreview}
                    disabled={!readyForPreview || isPreviewPending}
                  >
                    <Eye className="h-4 w-4" /> {isPreviewPending ? "Generating preview..." : "Preview final grades"}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PreviewDialog({
  open,
  onOpenChange,
  preview,
  onFinalize,
  isFinalizePending,
  finalizeErrorMessage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: CoordinatorEvaluationPreviewResult | null
  onFinalize: (note: string) => void
  isFinalizePending: boolean
  finalizeErrorMessage: string | null
}) {
  const [note, setNote] = useState("")

  React.useEffect(() => {
    if (!open) {
      setNote("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Final grade preview</DialogTitle>
          <DialogDescription>
            Review the final grade snapshot for {preview?.project.title ?? "selected project"} before finalization.
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Weights used</p>
                  <p className="font-semibold">
                    {preview.weights.advisorPercentage}% advisor · {preview.weights.evaluatorPercentage}% evaluator
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Preview generated</p>
                  <p className="font-semibold">{formatDateTime(preview.previewGeneratedAt)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Ready to finalize</p>
                  <p className="font-semibold">{preview.readyToFinalize ? "Yes" : "No"}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Per-student final grades</CardTitle>
                <CardDescription>
                  Final grade and letter grade are shown here for review before finalization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {preview.students.map((student) => (
                  <div key={student.studentUserId} className="rounded-xl border bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Final {formatNumber(student.finalGrade)}
                        </Badge>
                        <Badge variant="outline">{student.letterGrade}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Advisor score</p>
                        <p className="mt-1 font-semibold">{formatNumber(student.advisorScore.score)}</p>
                        {student.advisorScore.comment ? (
                          <p className="mt-2 text-xs text-muted-foreground">{student.advisorScore.comment}</p>
                        ) : null}
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Evaluator average</p>
                        <p className="mt-1 font-semibold">{formatNumber(student.evaluatorAverageScore)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Letter grade</p>
                        <p className="mt-1 font-semibold">{student.letterGrade}</p>
                      </div>
                    </div>

                    {student.evaluatorScores.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {student.evaluatorScores.map((score) => (
                          <div key={score.evaluatorUserId} className="rounded-lg border bg-muted/20 p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{score.evaluatorName}</p>
                                <p className="text-xs text-muted-foreground">Evaluator submission</p>
                              </div>
                              <p className="font-semibold">{formatNumber(score.score)}</p>
                            </div>
                            {score.comment ? (
                              <p className="mt-2 text-xs text-muted-foreground">{score.comment}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            {finalizeErrorMessage ? (
              <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                <CardContent className="p-4 text-sm">
                  <p className="font-medium text-foreground">Finalize failed</p>
                  <p className="mt-1 text-muted-foreground">{finalizeErrorMessage}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Finalize for department-head review</CardTitle>
                <CardDescription>
                  Finalize stores the backend final grade snapshot and moves this project into department-head review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Coordinator note</p>
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 1000))}
                    placeholder="Reviewed and ready for department-head approval."
                    className="min-h-[96px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Optional. Up to 1000 characters.</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isFinalizePending}>
                    Close
                  </Button>
                  <Button onClick={() => onFinalize(note)} disabled={!preview.readyToFinalize || isFinalizePending} className="gap-1.5">
                    <FileCheck className="h-4 w-4" /> {isFinalizePending ? "Finalizing..." : "Finalize grades"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">No preview loaded.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function GradeManagementPage() {
  const [selectedCapstone, setSelectedCapstone] = useState<CapstonePhase>("capstone1")
  const [search, setSearch] = useState("")
  const [aggregationFilter, setAggregationFilter] = useState<CoordinatorAggregationStatus | "all">("all")
  const [finalizationFilter, setFinalizationFilter] = useState<CoordinatorFinalizationStatus | "all">("all")
  const [selectedProject, setSelectedProject] = useState<CoordinatorDashboardProjectGroup | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<CoordinatorEvaluationPreviewResult | null>(null)
  const [previewErrorMessage, setPreviewErrorMessage] = useState<string | null>(null)
  const [finalizeErrorMessage, setFinalizeErrorMessage] = useState<string | null>(null)
  const coordinatorStage: CoordinatorEvaluationStage = "CAPSTONE_I"

  const dashboardQuery = useQuery({
    queryKey: ["coordinator", "evaluation-dashboard", coordinatorStage],
    queryFn: () => getCoordinatorEvaluationDashboard(coordinatorStage),
    staleTime: 30_000,
    retry: 1,
  })

  const selectedProjectId = selectedProject?.projectId ?? null

  const detailQuery = useQuery({
    queryKey: ["coordinator", "evaluation-project-detail", selectedProjectId, coordinatorStage],
    queryFn: () => getCoordinatorEvaluationProjectDetail(selectedProjectId as string, coordinatorStage),
    enabled: detailOpen && Boolean(selectedProjectId),
    staleTime: 15_000,
    retry: 1,
  })

  const previewMutation = useMutation({
    mutationFn: (projectId: string) => previewCoordinatorEvaluationProject(projectId, coordinatorStage),
    onSuccess: (result) => {
      setPreviewErrorMessage(null)
      setFinalizeErrorMessage(null)
      setPreviewData(result)
      setPreviewOpen(true)
      toast.success("Preview generated", {
        description: `Final grade preview is ready for ${result.project.title}.`,
      })
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to generate final grade preview.")
      setPreviewErrorMessage(message)
      toast.error("Preview failed", {
        description: message,
      })
    },
  })

  const finalizeMutation = useMutation({
    mutationFn: ({ projectId, note }: { projectId: string; note: string }) =>
      finalizeCoordinatorEvaluationProject(projectId, coordinatorStage, {
        note: note.trim() || undefined,
      }),
    onSuccess: async (result) => {
      setFinalizeErrorMessage(null)
      setPreviewOpen(false)
      toast.success("Final grades finalized", {
        description: `${result.students.length} student grade snapshot(s) moved to department-head review.`,
      })
      await Promise.all([dashboardQuery.refetch(), detailQuery.refetch()])
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to finalize project grades.")
      setFinalizeErrorMessage(message)
      toast.error("Finalize failed", {
        description: message,
      })
    },
  })

  const dashboard = dashboardQuery.data
  const derivedProjects = useMemo(
    () =>
      (dashboard?.projectGroups ?? []).map((project) => {
        const aggregationStatus = deriveAggregationStatusFromProject(project)
        return {
          ...project,
          aggregationStatus,
          nextAction: deriveNextAction(aggregationStatus, project.finalizationStatus),
        }
      }),
    [dashboard?.projectGroups]
  )

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    const projects = derivedProjects

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.projectTitle.toLowerCase().includes(query) ||
        project.group?.name.toLowerCase().includes(query)

      const matchesAggregation = aggregationFilter === "all" || project.aggregationStatus === aggregationFilter
      const matchesFinalization = finalizationFilter === "all" || project.finalizationStatus === finalizationFilter

      return matchesSearch && matchesAggregation && matchesFinalization
    })
  }, [aggregationFilter, derivedProjects, finalizationFilter, search])

  const aggregationDistribution = useMemo(() => {
    const total = derivedProjects.length
    return [
      {
        label: "Waiting for weights",
        count: derivedProjects.filter((project) => project.aggregationStatus === "WAITING_FOR_WEIGHTS").length,
        total,
        className: "bg-amber-50 text-amber-900 border-amber-200",
      },
      {
        label: "Waiting for advisor",
        count: derivedProjects.filter((project) => project.aggregationStatus === "WAITING_FOR_ADVISOR").length,
        total,
        className: "bg-muted text-foreground border-border",
      },
      {
        label: "Waiting for evaluators",
        count: derivedProjects.filter((project) => project.aggregationStatus === "WAITING_FOR_EVALUATORS").length,
        total,
        className: "bg-primary/[0.06] text-primary/80 border-primary/10",
      },
      {
        label: "Ready for aggregation",
        count: derivedProjects.filter((project) => project.aggregationStatus === "READY_FOR_AGGREGATION").length,
        total,
        className: "bg-primary/10 text-primary border-primary/20",
      },
    ]
  }, [derivedProjects])

  const finalizationDistribution = useMemo(() => {
    return [
      {
        label: "Pending department head",
        count: derivedProjects.filter((project) => project.finalizationStatus === "FINALIZED_PENDING_DEPARTMENT_HEAD").length,
      },
      {
        label: "Approved",
        count: derivedProjects.filter((project) => project.finalizationStatus === "APPROVED").length,
      },
      {
        label: "Rejected",
        count: derivedProjects.filter((project) => project.finalizationStatus === "REJECTED").length,
      },
    ]
  }, [derivedProjects])

  const kpi = [
    {
      label: "Project Groups",
      value: derivedProjects.length,
      icon: Users,
      bg: "bg-primary/10",
      color: "text-primary",
    },
    {
      label: "Waiting Review Inputs",
      value:
        derivedProjects.filter((project) => project.aggregationStatus === "WAITING_FOR_ADVISOR").length +
        derivedProjects.filter((project) => project.aggregationStatus === "WAITING_FOR_EVALUATORS").length,
      icon: Clock,
      bg: "bg-primary/[0.06]",
      color: "text-primary/80",
    },
    {
      label: "Ready for Aggregation",
      value: derivedProjects.filter((project) => project.aggregationStatus === "READY_FOR_AGGREGATION").length,
      icon: Target,
      bg: "bg-primary/10",
      color: "text-primary",
    },
    {
      label: "Pending Approval",
      value: derivedProjects.filter((project) => project.finalizationStatus === "FINALIZED_PENDING_DEPARTMENT_HEAD").length,
      icon: FileCheck,
      bg: "bg-muted",
      color: "text-foreground",
    },
  ]

  const handleOpenAction = (project: CoordinatorDashboardProjectGroup) => {
    setSelectedProject(project)
    setDetailOpen(true)
    setPreviewOpen(false)
    setPreviewData(null)
    setPreviewErrorMessage(null)
    setFinalizeErrorMessage(null)
  }

  const handlePreview = () => {
    if (!selectedProjectId) return
    setPreviewErrorMessage(null)
    setFinalizeErrorMessage(null)
    previewMutation.mutate(selectedProjectId)
  }

  const handleFinalize = (note: string) => {
    if (!selectedProjectId || !previewData?.readyToFinalize) return
    setFinalizeErrorMessage(null)
    finalizeMutation.mutate({ projectId: selectedProjectId, note })
  }

  const dashboardErrorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error, "Failed to load coordinator aggregation dashboard.")
    : null

  const detailErrorMessage = detailQuery.isError
    ? getErrorMessage(detailQuery.error, "Failed to load coordinator project detail.")
    : null

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Grade Management
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review coordinator aggregation readiness and final-grade workflow by project group.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${dashboardQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh dashboard
          </Button>
          <Link href="/dashboard/coordinator/evaluation-setup">
            <Button size="sm" className="gap-1.5">
              <Scale className="h-4 w-4" /> Configure weights
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={selectedCapstone} onValueChange={(value) => setSelectedCapstone(value as CapstonePhase)}>
        <TabsList>
          <TabsTrigger value="capstone1">Capstone I</TabsTrigger>
          <TabsTrigger value="capstone2" disabled>Capstone II</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((item) => (
          <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.bg} transition-transform group-hover:scale-110`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Aggregation prerequisites</p>
          <p className="text-xs text-muted-foreground">
            Final grade aggregation depends on configured advisor/evaluator weights and complete advisor + evaluator submissions.
          </p>
          <p className="text-xs text-muted-foreground">
            Active stage: {phaseLabel(selectedCapstone)} {selectedCapstone === "capstone2" ? "(not supported yet)" : ""}
          </p>
        </div>
      </div>

      {!dashboardQuery.isLoading && dashboardErrorMessage ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Unable to load coordinator aggregation dashboard</p>
              <p className="text-sm text-muted-foreground">{dashboardErrorMessage}</p>
              <Button variant="outline" size="sm" onClick={() => dashboardQuery.refetch()} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="overview" className="gap-2 shrink-0"><GraduationCap className="h-4 w-4" /> Grades</TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2 shrink-0"><BarChart3 className="h-4 w-4" /> Distribution</TabsTrigger>
          <TabsTrigger value="actions" className="gap-2 shrink-0"><SlidersHorizontal className="h-4 w-4" /> Bulk Actions</TabsTrigger>
          <TabsTrigger value="complaints" className="relative gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4" /> Complaints
            {mockComplaints.filter((complaint) => complaint.status === "open").length > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {mockComplaints.filter((complaint) => complaint.status === "open").length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {!dashboardErrorMessage ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by project title or group name..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <Select value={aggregationFilter} onValueChange={(value) => setAggregationFilter(value as CoordinatorAggregationStatus | "all")}>
                <SelectTrigger className="h-10 w-full shrink-0 sm:w-52">
                  <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Aggregation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All aggregation states</SelectItem>
                  <SelectItem value="WAITING_FOR_WEIGHTS">Waiting for weights</SelectItem>
                  <SelectItem value="WAITING_FOR_ADVISOR">Waiting for advisor</SelectItem>
                  <SelectItem value="WAITING_FOR_EVALUATORS">Waiting for evaluators</SelectItem>
                  <SelectItem value="READY_FOR_AGGREGATION">Ready for aggregation</SelectItem>
                </SelectContent>
              </Select>

              <Select value={finalizationFilter} onValueChange={(value) => setFinalizationFilter(value as CoordinatorFinalizationStatus | "all")}>
                <SelectTrigger className="h-10 w-full shrink-0 sm:w-56">
                  <FileCheck className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Finalization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All finalization states</SelectItem>
                  <SelectItem value="NOT_FINALIZED">Not finalized</SelectItem>
                  <SelectItem value="FINALIZED_PENDING_DEPARTMENT_HEAD">Pending department head</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {(search || aggregationFilter !== "all" || finalizationFilter !== "all") ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 shrink-0 text-xs"
                  onClick={() => {
                    setSearch("")
                    setAggregationFilter("all")
                    setFinalizationFilter("all")
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          ) : null}

          {dashboardQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 animate-pulse rounded bg-muted" />
                      <div className="h-16 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-9 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 && !dashboardErrorMessage ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">No project groups match your filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search or aggregation status.</p>
            </div>
          ) : (
            <>
              {(search || aggregationFilter !== "all" || finalizationFilter !== "all") && !dashboardErrorMessage ? (
                <p className="text-sm text-muted-foreground">
                  {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectAggregationCard key={project.projectId} project={project} onOpenAction={handleOpenAction} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" /> Aggregation Readiness
                </CardTitle>
                <CardDescription>Department project groups grouped by aggregation status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aggregationDistribution.map((item) => {
                  const percent = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <Badge variant="outline" className={`w-40 justify-center text-xs font-medium ${item.className}`}>
                        {item.label}
                      </Badge>
                      <div className="flex-1">
                        <Progress value={percent} className="h-2" />
                      </div>
                      <div className="flex w-24 shrink-0 items-center justify-end gap-1.5">
                        <span className="text-xs text-muted-foreground">{item.count} groups</span>
                        <span className="w-9 text-right text-xs font-bold text-primary">{percent}%</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-primary" /> Finalization Snapshot
                </CardTitle>
                <CardDescription>Current department-head review outcomes from finalized projects.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Configured weights", value: dashboard?.weights.isConfigured ? "Yes" : "No" },
                  { label: "Advisor share", value: dashboard?.weights.advisorPercentage !== null && dashboard?.weights.advisorPercentage !== undefined ? `${dashboard.weights.advisorPercentage}%` : "Not set" },
                  { label: "Evaluator share", value: dashboard?.weights.evaluatorPercentage !== null && dashboard?.weights.evaluatorPercentage !== undefined ? `${dashboard.weights.evaluatorPercentage}%` : "Not set" },
                  { label: "Weights updated", value: formatDateTime(dashboard?.weights.updatedAt ?? null) },
                  ...finalizationDistribution.map((item) => ({ label: item.label, value: item.count })),
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

        <TabsContent value="actions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Scale,
                title: "Weight configuration",
                desc: dashboard?.weights.isConfigured
                  ? `Weights are configured at ${dashboard?.weights.advisorPercentage ?? 0}% advisor and ${dashboard?.weights.evaluatorPercentage ?? 0}% evaluator.`
                  : "The coordinator must configure department grading weights before preview/finalize can work.",
                cta: dashboard?.weights.isConfigured ? "Review weights" : "Configure weights",
                href: "/dashboard/coordinator/evaluation-setup",
              },
              {
                icon: Eye,
                title: "Projects ready for preview",
                desc: `${derivedProjects.filter((project) => project.aggregationStatus === "READY_FOR_AGGREGATION").length} project group(s) are ready for final grade preview.`,
                cta: "Refresh status",
                action: () => dashboardQuery.refetch(),
                disabled: dashboardQuery.isFetching,
              },
              {
                icon: ShieldAlert,
                title: "Blocked projects",
                desc: `${derivedProjects.filter((project) => project.aggregationStatus !== "READY_FOR_AGGREGATION").length} project group(s) are still missing prerequisites before final aggregation.`,
                cta: "View overview",
                action: () => toast.info("Use the overview filters", {
                  description: "Filter by waiting states to inspect blocked projects before preview/finalize integration.",
                }),
                disabled: false,
              },
              {
                icon: FileText,
                title: "Department-head queue",
                desc: `${derivedProjects.filter((project) => project.finalizationStatus === "FINALIZED_PENDING_DEPARTMENT_HEAD").length} project group(s) are currently pending department-head review.`,
                cta: "Review status",
                action: () => toast.info("Finalized review state loaded", {
                  description: "Approved and rejected results are already visible through the dashboard summary and project cards.",
                }),
                disabled: false,
              },
              {
                icon: RefreshCw,
                title: "Sync aggregation dashboard",
                desc: "Refresh coordinator dashboard counts and project readiness using the live backend response.",
                cta: "Refresh",
                action: () => dashboardQuery.refetch(),
                disabled: dashboardQuery.isFetching,
              },
              {
                icon: AlertTriangle,
                title: "Grade Appeal Summary",
                desc: "View open complaints while coordinator aggregation progresses to department-head review.",
                cta: "Open complaints",
                href: "/dashboard/coordinator/complaints",
              },
            ].map((item) => (
              <Card key={item.title} className="group border-none shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="flex-1 text-sm text-muted-foreground">{item.desc}</p>
                  {"href" in item && item.href ? (
                    <Link href={item.href}>
                      <Button variant="outline" size="sm" className="w-full gap-1.5 hover:border-primary hover:text-primary">
                        {item.cta} <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 hover:border-primary hover:text-primary"
                      onClick={item.action}
                      disabled={item.disabled}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4 border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Aggregation Readiness Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Department weights configured", ok: dashboard?.weights.isConfigured ?? false },
                  { label: "Advisor submissions progressing", ok: (dashboard?.summary.waitingForAdvisorCount ?? 0) < (dashboard?.summary.totalProjectGroups ?? 0) },
                  { label: "Evaluator submissions progressing", ok: (dashboard?.summary.waitingForEvaluatorsCount ?? 0) < (dashboard?.summary.totalProjectGroups ?? 0) },
                  { label: "Ready projects available", ok: (dashboard?.summary.readyForAggregationCount ?? 0) > 0 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                      item.ok
                        ? "border-primary/10 bg-primary/5 text-foreground"
                        : "border-destructive/10 bg-destructive/5 text-destructive"
                    }`}
                  >
                    {item.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    {item.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          {(() => {
            const total = mockComplaints.length
            const openCount = mockComplaints.filter((complaint) => complaint.status === "open").length
            const reviewingCount = mockComplaints.filter((complaint) => complaint.status === "under_review").length
            const resolvedCount = mockComplaints.filter((complaint) => complaint.status === "resolved").length

            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total", value: total, bg: "bg-muted/60", text: "text-foreground", icon: MessageSquare },
                  { label: "Open", value: openCount, bg: "bg-destructive/10", text: "text-destructive", icon: AlertTriangle },
                  { label: "Under Review", value: reviewingCount, bg: "bg-primary/10", text: "text-primary", icon: Eye },
                  { label: "Resolved", value: resolvedCount, bg: "bg-primary/[0.06]", text: "text-primary/70", icon: CheckCircle2 },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-3 rounded-xl border p-4 ${item.bg}`}>
                    <item.icon className={`h-5 w-5 shrink-0 ${item.text}`} />
                    <div>
                      <p className={`text-2xl font-bold ${item.text}`}>{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Recent Complaints
              </CardTitle>
              <Link href="/dashboard/coordinator/complaints">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {mockComplaints.slice(0, 8).map((complaint) => {
                  const statusConfig = {
                    open: { label: "Open", className: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
                    under_review: { label: "Under Review", className: "bg-primary/10 text-primary border-primary/30", icon: Eye },
                    resolved: { label: "Resolved", className: "bg-muted text-foreground border-border", icon: CheckCircle2 },
                    rejected: { label: "Rejected", className: "bg-muted text-muted-foreground border-border", icon: XCircle },
                  }[complaint.status]

                  const typeConfig = {
                    grade: { label: "Grade Dispute", className: "bg-primary/10 text-primary" },
                    evaluation: { label: "Evaluation Dispute", className: "bg-primary/[0.06] text-primary/80" },
                    assignment: { label: "Assignment", className: "bg-muted text-foreground" },
                    defense: { label: "Defense Dispute", className: "bg-muted text-muted-foreground" },
                  }[complaint.targetType]

                  const StatusIcon = statusConfig.icon

                  return (
                    <div key={complaint.id} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {complaint.studentName.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{complaint.studentName}</p>
                        <p className="truncate text-xs text-muted-foreground">{complaint.targetName}</p>
                      </div>
                      <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${typeConfig.className}`}>
                        {typeConfig.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusConfig.className}`}>
                        <StatusIcon className="h-2.5 w-2.5" /> {statusConfig.label}
                      </span>
                      <Link href="/dashboard/coordinator/complaints">
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary">
                          Review
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Unresolved Complaints</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mockComplaints.filter((complaint) => complaint.status === "open" || complaint.status === "under_review").length} complaint(s) still require attention while aggregation moves forward.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Resolution Rate</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mockComplaints.length > 0
                    ? Math.round((mockComplaints.filter((complaint) => complaint.status === "resolved").length / mockComplaints.length) * 100)
                    : 0}% of all complaints have been resolved.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ProjectDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setPreviewErrorMessage(null)
            setFinalizeErrorMessage(null)
          }
        }}
        summaryProject={selectedProject}
        detail={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        errorMessage={detailErrorMessage}
        onRetry={() => detailQuery.refetch()}
        onPreview={handlePreview}
        isPreviewPending={previewMutation.isPending}
        previewErrorMessage={previewErrorMessage}
      />

      <PreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) {
            setFinalizeErrorMessage(null)
          }
        }}
        preview={previewData}
        onFinalize={handleFinalize}
        isFinalizePending={finalizeMutation.isPending}
        finalizeErrorMessage={finalizeErrorMessage}
      />
    </div>
  )
}
