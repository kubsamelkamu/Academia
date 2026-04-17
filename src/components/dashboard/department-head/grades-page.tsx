"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import { getErrorMessage } from "@/lib/api/errors"
import {
  approveDepartmentHeadEvaluationProject,
  getDepartmentHeadEvaluationDashboard,
  getDepartmentHeadEvaluationProjectDetail,
  rejectDepartmentHeadEvaluationProject,
  type DepartmentHeadDashboardProjectGroup,
  type DepartmentHeadEvaluationProjectDetail,
  type DepartmentHeadEvaluationStage,
  type DepartmentHeadFinalizationStatus,
  type DepartmentHeadNextAction,
} from "@/lib/api/department-head-evaluations"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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

function finalizationStatusConfig(status: DepartmentHeadFinalizationStatus) {
  switch (status) {
    case "FINALIZED_PENDING_DEPARTMENT_HEAD":
      return {
        label: "Pending review",
        className: "bg-amber-50 text-amber-900 border-amber-200",
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

function nextActionLabel(action: DepartmentHeadNextAction) {
  switch (action) {
    case "REVIEW_FINALIZED_RESULT":
      return "Review finalized result"
    case "VIEW_APPROVED_RESULT":
      return "View approved result"
    case "REVIEW_REJECTED_RESULT":
      return "Review rejected result"
  }
}

function actionButtonVariant(action: DepartmentHeadNextAction): "default" | "outline" {
  return action === "REVIEW_FINALIZED_RESULT" ? "default" : "outline"
}

function ProjectReviewCard({
  project,
  onOpenDetail,
}: {
  project: DepartmentHeadDashboardProjectGroup
  onOpenDetail: (project: DepartmentHeadDashboardProjectGroup) => void
}) {
  const status = finalizationStatusConfig(project.finalizationStatus)

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

        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Weights</p>
          <p className="mt-1 font-semibold">
            {project.weights.advisorPercentage}% / {project.weights.evaluatorPercentage}%
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Finalized by</p>
          <p className="mt-1 font-semibold">{project.finalizedBy.fullName}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Reviewed by</p>
          <p className="mt-1 font-semibold">{project.reviewedBy?.fullName ?? "Pending"}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">Notes</p>
          <p className="mt-1 font-semibold">
            {project.hasApprovalNote ? "Approval note" : project.hasRejectionReason ? "Rejection reason" : "No review note"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="text-xs text-muted-foreground">
          {project.finalizationStatus === "APPROVED"
            ? `Approved ${formatDateTime(project.approvedAt)}`
            : project.finalizationStatus === "REJECTED"
              ? `Rejected ${formatDateTime(project.rejectedAt)}`
              : `Finalized ${formatDateTime(project.finalizedAt)}`}
        </div>

        <Button size="sm" variant={actionButtonVariant(project.nextAction)} className="gap-1.5" onClick={() => onOpenDetail(project)}>
          <Eye className="h-3.5 w-3.5" /> {nextActionLabel(project.nextAction)}
        </Button>
      </div>
    </div>
  )
}

function ProjectDetailDialog({
  open,
  onOpenChange,
  summaryProject,
  detail,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onApprove,
  onReject,
  isApprovePending,
  isRejectPending,
  actionErrorMessage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  summaryProject: DepartmentHeadDashboardProjectGroup | null
  detail: DepartmentHeadEvaluationProjectDetail | undefined
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  onRetry: () => void
  onApprove: (note: string) => void
  onReject: (reason: string) => void
  isApprovePending: boolean
  isRejectPending: boolean
  actionErrorMessage: string | null
}) {
  const [approvalNote, setApprovalNote] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  React.useEffect(() => {
    if (!open) {
      setApprovalNote("")
      setRejectionReason("")
      return
    }

    if (detail?.finalResult.status !== "FINALIZED_PENDING_DEPARTMENT_HEAD") {
      setApprovalNote(detail?.finalResult.approvalNote ?? "")
      setRejectionReason(detail?.finalResult.rejectionReason ?? "")
    }
  }, [detail?.finalResult.approvalNote, detail?.finalResult.rejectionReason, detail?.finalResult.status, open])

  const status = detail
    ? finalizationStatusConfig(detail.finalResult.status)
    : summaryProject
      ? finalizationStatusConfig(summaryProject.finalizationStatus)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{detail?.project.title ?? summaryProject?.projectTitle ?? "Project review"}</DialogTitle>
          <DialogDescription>
            Review the finalized backend snapshot, raw advisor and evaluator comments, and chronological review history.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-56 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : isError ? (
          <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">Unable to load finalized project detail</p>
                  <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={status?.className}>{status?.label}</Badge>
              {summaryProject ? <Badge variant="outline">{nextActionLabel(summaryProject.nextAction)}</Badge> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Project group</p>
                  <p className="font-semibold">{detail.group.name}</p>
                  <p className="text-xs text-muted-foreground">{detail.group.totalMembers} members</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Weights snapshot</p>
                  <p className="font-semibold">
                    {detail.finalResult.weights.advisorPercentage}% advisor · {detail.finalResult.weights.evaluatorPercentage}% evaluator
                  </p>
                  <p className="text-xs text-muted-foreground">Captured at finalization time</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Review status</p>
                  <p className="font-semibold">{status?.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.finalResult.status === "APPROVED"
                      ? `Approved ${formatDateTime(detail.finalResult.approvedAt)}`
                      : detail.finalResult.status === "REJECTED"
                        ? `Rejected ${formatDateTime(detail.finalResult.rejectedAt)}`
                        : `Awaiting department-head action`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Final result summary</CardTitle>
                <CardDescription>
                  Finalized metadata and department-head review context from the backend snapshot.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Coordinator finalized by</p>
                  <p className="mt-1 font-semibold">{detail.finalResult.finalizedBy.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(detail.finalResult.finalizedAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Advisor evaluation</p>
                  <p className="mt-1 font-semibold">{detail.advisorEvaluation.status.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted {formatDateTime(detail.advisorEvaluation.submittedAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Evaluator coverage</p>
                  <p className="mt-1 font-semibold">
                    {detail.evaluatorEvaluation.submittedEvaluators}/{detail.evaluatorEvaluation.totalAssignedEvaluators} submitted
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Final grades were generated from submitted evaluator inputs.</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Finalization note</p>
                  <p className="mt-1 text-sm text-foreground">{detail.finalResult.finalizationNote ?? "No coordinator note provided."}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Approval note</p>
                  <p className="mt-1 text-sm text-foreground">{detail.finalResult.approvalNote ?? "No approval note yet."}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Rejection reason</p>
                  <p className="mt-1 text-sm text-foreground">{detail.finalResult.rejectionReason ?? "No rejection reason."}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assigned evaluators</CardTitle>
                <CardDescription>Evaluator submissions included in the finalized project result.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.evaluatorEvaluation.evaluators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evaluators were returned for this finalized result.</p>
                ) : (
                  detail.evaluatorEvaluation.evaluators.map((evaluator) => (
                    <div key={evaluator.evaluatorUserId} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{evaluator.fullName}</p>
                        <p className="text-xs text-muted-foreground">{evaluator.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{evaluator.status.replace(/_/g, " ")}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">Submitted {formatDateTime(evaluator.submittedAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Per-student final grades</CardTitle>
                <CardDescription>
                  Final grades, letter grades, and raw advisor and evaluator comments from the finalized backend result.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.students.map((student) => (
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

                    <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Advisor score</p>
                        <p className="mt-1 font-semibold">{formatNumber(student.advisorScore.score)}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{student.advisorScore.comment ?? "No advisor comment."}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <p className="font-medium">Evaluator comments</p>
                          <p className="text-xs text-muted-foreground">Average {formatNumber(student.evaluatorAverageScore)}</p>
                        </div>
                        {student.evaluatorScores.length === 0 ? (
                          <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">No evaluator comments were returned.</div>
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
                              <p className="mt-2 text-xs text-muted-foreground">{score.comment ?? "No evaluator comment."}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review history</CardTitle>
                <CardDescription>Chronological actions on this finalized result.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.reviewHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No review history has been recorded yet.</p>
                ) : (
                  detail.reviewHistory.map((item, index) => (
                    <div key={`${item.action}-${item.actedAt}-${index}`} className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.action}</Badge>
                          <Badge variant="outline" className={finalizationStatusConfig(item.status).className}>
                            {finalizationStatusConfig(item.status).label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDateTime(item.actedAt)}</p>
                      </div>
                      <p className="mt-2 font-medium">{item.actedBy.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.note ?? "No note attached to this action."}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-primary/5 shadow-sm">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Department-head decision</p>
                  <p className="mt-1 text-muted-foreground">
                    {detail.finalResult.status === "FINALIZED_PENDING_DEPARTMENT_HEAD"
                      ? "Approve to publish final grades, or reject to send the result back for coordinator re-finalization."
                      : "This result is now read-only because the department-head review decision has already been recorded."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {actionErrorMessage ? (
              <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                <CardContent className="p-4 text-sm">
                  <p className="font-medium text-foreground">Review action failed</p>
                  <p className="mt-1 text-muted-foreground">{actionErrorMessage}</p>
                </CardContent>
              </Card>
            ) : null}

            {detail.finalResult.status === "FINALIZED_PENDING_DEPARTMENT_HEAD" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Approve final result</CardTitle>
                    <CardDescription>
                      Approval note is optional. Approval publishes the final result for student visibility.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={approvalNote}
                      onChange={(event) => setApprovalNote(event.target.value.slice(0, 1000))}
                      placeholder="Approved after review of comments and final scores."
                      className="min-h-[110px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">Optional. Up to 1000 characters.</p>
                    <div className="flex justify-end">
                      <Button onClick={() => onApprove(approvalNote)} disabled={isApprovePending || isRejectPending} className="gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> {isApprovePending ? "Approving..." : "Approve result"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Reject final result</CardTitle>
                    <CardDescription>
                      Rejection reason is required. Rejection returns the finalized result to the coordinator for revision.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value.slice(0, 1000))}
                      placeholder="Explain what must be corrected before re-finalization."
                      className="min-h-[110px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">Required. Up to 1000 characters.</p>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        onClick={() => onReject(rejectionReason)}
                        disabled={!rejectionReason.trim() || isApprovePending || isRejectPending}
                        className="gap-1.5"
                      >
                        <XCircle className="h-4 w-4" /> {isRejectPending ? "Rejecting..." : "Reject result"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function DepartmentHeadGradesPage() {
  const [selectedCapstone, setSelectedCapstone] = useState<CapstonePhase>("capstone1")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DepartmentHeadFinalizationStatus | "all">("all")
  const [selectedProject, setSelectedProject] = useState<DepartmentHeadDashboardProjectGroup | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)
  const stage: DepartmentHeadEvaluationStage = "CAPSTONE_I"

  const dashboardQuery = useQuery({
    queryKey: ["department-head", "evaluation-dashboard", stage],
    queryFn: () => getDepartmentHeadEvaluationDashboard(stage),
    staleTime: 30_000,
    retry: 1,
  })

  const selectedProjectId = selectedProject?.projectId ?? null

  const detailQuery = useQuery({
    queryKey: ["department-head", "evaluation-project-detail", selectedProjectId, stage],
    queryFn: () => getDepartmentHeadEvaluationProjectDetail(selectedProjectId as string, stage),
    enabled: detailOpen && Boolean(selectedProjectId),
    staleTime: 15_000,
    retry: 1,
  })

  const approveMutation = useMutation({
    mutationFn: ({ projectId, note }: { projectId: string; note: string }) =>
      approveDepartmentHeadEvaluationProject(projectId, stage, {
        note: note.trim() || undefined,
      }),
    onSuccess: async (result) => {
      setActionErrorMessage(null)
      toast.success("Final result approved", {
        description: `${result.approvedBy.fullName} approval was recorded and the result is now published.`,
      })

      const [dashboardResult] = await Promise.all([dashboardQuery.refetch(), detailQuery.refetch()])
      const refreshedProject = dashboardResult.data?.projectGroups.find((project) => project.projectId === result.projectId) ?? null
      setSelectedProject(refreshedProject)
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to approve final result.")
      setActionErrorMessage(message)
      toast.error("Approval failed", {
        description: message,
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ projectId, reason }: { projectId: string; reason: string }) =>
      rejectDepartmentHeadEvaluationProject(projectId, stage, {
        reason: reason.trim(),
      }),
    onSuccess: async (result) => {
      setActionErrorMessage(null)
      toast.success("Final result rejected", {
        description: `${result.rejectedBy.fullName} rejection was recorded and returned to the coordinator.`,
      })

      const [dashboardResult] = await Promise.all([dashboardQuery.refetch(), detailQuery.refetch()])
      const refreshedProject = dashboardResult.data?.projectGroups.find((project) => project.projectId === result.projectId) ?? null
      setSelectedProject(refreshedProject)
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to reject final result.")
      setActionErrorMessage(message)
      toast.error("Rejection failed", {
        description: message,
      })
    },
  })

  const dashboard = dashboardQuery.data

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    const projects = dashboard?.projectGroups ?? []

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.projectTitle.toLowerCase().includes(query) ||
        project.group?.name.toLowerCase().includes(query)

      const matchesStatus = statusFilter === "all" || project.finalizationStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [dashboard?.projectGroups, search, statusFilter])

  const reviewDistribution = useMemo(() => {
    const summary = dashboard?.summary
    const total = summary?.totalFinalizedProjectGroups ?? 0

    return [
      {
        label: "Pending review",
        count: summary?.pendingReviewCount ?? 0,
        className: "[&>div]:bg-amber-500",
      },
      {
        label: "Approved",
        count: summary?.approvedCount ?? 0,
        className: "[&>div]:bg-emerald-500",
      },
      {
        label: "Rejected",
        count: summary?.rejectedCount ?? 0,
        className: "[&>div]:bg-destructive",
      },
    ].map((item) => ({
      ...item,
      total,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }))
  }, [dashboard?.summary])

  const kpi = [
    {
      label: "Finalized Results",
      value: dashboard?.summary.totalFinalizedProjectGroups ?? 0,
      sub: "Coordinator submissions ready for oversight",
      icon: GraduationCap,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Pending Review",
      value: dashboard?.summary.pendingReviewCount ?? 0,
      sub: "Need department-head decision",
      icon: Clock,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Approved",
      value: dashboard?.summary.approvedCount ?? 0,
      sub: "Published for student visibility",
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Rejected",
      value: dashboard?.summary.rejectedCount ?? 0,
      sub: "Returned for coordinator revision",
      icon: XCircle,
      color: "bg-destructive/10 text-destructive",
    },
  ]

  const dashboardErrorMessage = dashboardQuery.isError
    ? getErrorMessage(dashboardQuery.error, "Failed to load department-head review dashboard.")
    : null

  const detailErrorMessage = detailQuery.isError
    ? getErrorMessage(detailQuery.error, "Failed to load finalized project review detail.")
    : null

  const openDetail = (project: DepartmentHeadDashboardProjectGroup) => {
    setSelectedProject(project)
    setDetailOpen(true)
    setActionErrorMessage(null)
  }

  const handleApprove = (note: string) => {
    if (!selectedProjectId) return
    setActionErrorMessage(null)
    approveMutation.mutate({ projectId: selectedProjectId, note })
  }

  const handleReject = (reason: string) => {
    if (!selectedProjectId || !reason.trim()) return
    setActionErrorMessage(null)
    rejectMutation.mutate({ projectId: selectedProjectId, reason })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Grades &amp; Review
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review finalized coordinator results, track approval outcomes, and manage department-level publishing.
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2 sm:mt-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", dashboardQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard/department-head/reports">
              <FileText className="h-3.5 w-3.5" />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={selectedCapstone} onValueChange={(value) => setSelectedCapstone(value as CapstonePhase)}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="capstone1">Capstone I</TabsTrigger>
          <TabsTrigger value="capstone2" disabled>Capstone II</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map((item) => (
          <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Department-head review scope</p>
          <p className="text-xs text-muted-foreground">
            This dashboard only reviews finalized coordinator results. Approval publishes the result, while rejection sends it back for coordinator re-finalization.
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
              <p className="font-medium text-foreground">Unable to load department-head review dashboard</p>
              <p className="text-sm text-muted-foreground">{dashboardErrorMessage}</p>
              <Button variant="outline" size="sm" onClick={() => dashboardQuery.refetch()} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1.5 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="overview"
              className="shrink-0 gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="shrink-0 gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Review Queue
              {(dashboard?.summary.pendingReviewCount ?? 0) > 0 ? (
                <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">
                  {dashboard?.summary.pendingReviewCount ?? 0}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="shrink-0 gap-1.5 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Distribution
            </TabsTrigger>
          </TabsList>

          {!dashboardErrorMessage ? (
            <div className="flex w-full items-center gap-2 flex-wrap xl:w-auto">
              <div className="relative w-full sm:w-auto sm:flex-1 xl:w-auto xl:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search project or group..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-9 w-full pl-9 sm:w-[220px]"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DepartmentHeadFinalizationStatus | "all")}>
                <SelectTrigger className="h-9 w-full text-xs gap-1.5 border-border/70 bg-background sm:w-[190px]">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="FINALIZED_PENDING_DEPARTMENT_HEAD">Pending review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{dashboard?.summary.pendingReviewCount ?? 0}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">Awaiting department-head action</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{dashboard?.summary.approvedCount ?? 0}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">Approved and published</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold text-destructive">{dashboard?.summary.rejectedCount ?? 0}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">Rejected for coordinator revision</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Finalized project groups</CardTitle>
                  <CardDescription>Backend-driven list of finalized results for department-head review.</CardDescription>
                </div>
                <Badge variant="secondary">{filteredProjects.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {dashboardQuery.isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-44 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : filteredProjects.length === 0 && !dashboardErrorMessage ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                  <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="font-medium text-muted-foreground">No finalized project groups match your filters</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try a different search or status filter.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <ProjectReviewCard key={project.finalResultId} project={project} onOpenDetail={openDetail} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="mt-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">Review queue</CardTitle>
                  <CardDescription>
                    {dashboard?.summary.pendingReviewCount
                      ? `${dashboard.summary.pendingReviewCount} finalized result${dashboard.summary.pendingReviewCount !== 1 ? "s" : ""} currently await department-head action.`
                      : "No finalized results are waiting for review."}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
                  Pending review: {dashboard?.summary.pendingReviewCount ?? 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {dashboardQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : filteredProjects.length === 0 && !dashboardErrorMessage ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold">No items in the current queue</p>
                  <p className="mt-1 text-xs text-muted-foreground">Adjust your filters or wait for coordinator finalizations.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProjects.map((project) => {
                    const status = finalizationStatusConfig(project.finalizationStatus)

                    return (
                      <div
                        key={project.finalResultId}
                        className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <GraduationCap className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{project.projectTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.group?.name ?? "No group assigned"} · finalized by {project.finalizedBy.fullName}
                          </p>
                        </div>

                        <div className="w-full shrink-0 sm:block sm:w-36">
                          <p className="text-xs text-muted-foreground">Review status</p>
                          <Badge variant="outline" className={status.className}>{status.label}</Badge>
                        </div>

                        <div className="w-full shrink-0 text-left sm:ml-auto sm:w-28 sm:text-right">
                          <p className="text-xs text-muted-foreground">Updated</p>
                          <p className="text-xs font-medium">
                            {project.finalizationStatus === "APPROVED"
                              ? formatDateTime(project.approvedAt)
                              : project.finalizationStatus === "REJECTED"
                                ? formatDateTime(project.rejectedAt)
                                : formatDateTime(project.finalizedAt)}
                          </p>
                        </div>

                        <Button variant={actionButtonVariant(project.nextAction)} size="sm" className="gap-1.5 shrink-0 self-start sm:self-auto" onClick={() => openDetail(project)}>
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{nextActionLabel(project.nextAction)}</span>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review status distribution</CardTitle>
                <CardDescription>Current breakdown of finalized results by department-head review outcome.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewDistribution.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{item.count} of {item.total}</span>
                    </div>
                    <Progress value={item.percentage} className={cn("h-2", item.className)} />
                    <p className="text-xs text-muted-foreground">{item.percentage}% of finalized results</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weight and workflow summary</CardTitle>
                <CardDescription>Reference information from the dashboard response for final-result oversight.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    label: "Advisor weight",
                    value: dashboard?.weights.advisorPercentage !== null && dashboard?.weights.advisorPercentage !== undefined
                      ? `${dashboard.weights.advisorPercentage}%`
                      : "Not configured",
                    color: "text-primary",
                  },
                  {
                    label: "Evaluator weight",
                    value: dashboard?.weights.evaluatorPercentage !== null && dashboard?.weights.evaluatorPercentage !== undefined
                      ? `${dashboard.weights.evaluatorPercentage}%`
                      : "Not configured",
                    color: "text-primary",
                  },
                  {
                    label: "Weights updated",
                    value: formatDateTime(dashboard?.weights.updatedAt ?? null),
                    color: "text-foreground",
                  },
                  {
                    label: "Pending review count",
                    value: `${dashboard?.summary.pendingReviewCount ?? 0}`,
                    color: "text-amber-600",
                  },
                  {
                    label: "Approved count",
                    value: `${dashboard?.summary.approvedCount ?? 0}`,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Rejected count",
                    value: `${dashboard?.summary.rejectedCount ?? 0}`,
                    color: "text-destructive",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ProjectDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setActionErrorMessage(null)
          }
        }}
        summaryProject={selectedProject}
        detail={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        errorMessage={detailErrorMessage}
        onRetry={() => detailQuery.refetch()}
        onApprove={handleApprove}
        onReject={handleReject}
        isApprovePending={approveMutation.isPending}
        isRejectPending={rejectMutation.isPending}
        actionErrorMessage={actionErrorMessage}
      />
    </div>
  )
}
