"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  FolderKanban,
  Send,
  Users,
} from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  getEvaluatorProjectEvaluationDetail,
  saveEvaluatorProjectEvaluationDraft,
  submitEvaluatorProjectEvaluation,
  type AdvisorEvaluationDashboardStage,
  type EvaluatorProjectEvaluationMutationSummary,
} from "@/lib/api/advisor"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"

import { getEvaluateCriteriaByStage } from "./advisor-evaluator-evaluate-shared"
import type { AdvisorEvaluatorStage } from "./advisor-evaluator-stage-menu"

function normalizeStageForApi(stage?: AdvisorEvaluatorStage | null): AdvisorEvaluationDashboardStage | null {
  if (stage === "capstone-i") return "CAPSTONE_I"
  if (stage === "capstone-ii") return "CAPSTONE_II"
  return null
}

function stageLabel(stage?: AdvisorEvaluatorStage | null) {
  if (stage === "capstone-i") return "Capstone I"
  if (stage === "capstone-ii") return "Capstone II"
  return "Capstone"
}

function formatSavedAtLabel(value: string | null) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function parseMissingStudentIdsFromError(message: string) {
  const marker = "Missing studentUserIds:"
  const markerIndex = message.indexOf(marker)
  if (markerIndex === -1) {
    return []
  }

  return message
    .slice(markerIndex + marker.length)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function normalizeScoreInput(value: string) {
  if (value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return null
  }

  return Math.min(100, Math.max(0, parsed))
}

function getEvaluationStatusLabel(status?: string | null) {
  return String(status ?? "NOT_STARTED").replace(/_/g, " ")
}

function isSubmittedEvaluationStatus(status?: string | null) {
  const normalized = String(status ?? "").trim().toUpperCase()
  return normalized === "SUBMITTED" || normalized === "COMPLETED" || normalized === "REVIEWED"
}

type StudentEvaluationDraft = {
  studentUserId: string
  score: number | null
  comment: string
  savedAt: string | null
  evaluationStatus: string
}

export function AdvisorEvaluatorEvaluatePage({
  projectId,
  stage,
}: {
  projectId: string
  stage?: AdvisorEvaluatorStage | null
}) {
  const authHydrated = useAuthStoreHydrated()
  const apiStage = React.useMemo(() => normalizeStageForApi(stage), [stage])
  const stageQuery = stage ? `?stage=${stage}` : ""
  const detailQuery = useQuery({
    queryKey: ["advisor", "evaluator-project-evaluate", projectId, apiStage],
    queryFn: () => getEvaluatorProjectEvaluationDetail(projectId, apiStage ?? "CAPSTONE_I"),
    enabled: authHydrated && Boolean(projectId) && Boolean(apiStage),
    staleTime: 30_000,
    retry: 1,
  })

  const detail = detailQuery.data
  const project = detail
    ? {
        id: detail.project.id,
        title: detail.project.title,
        groupName: detail.group.name,
        advisorName: detail.advisor.fullName,
        status: detail.project.status,
      }
    : null

  const { stageSpecificCriteria, commonCriteria } = React.useMemo(
    () => getEvaluateCriteriaByStage(stage),
    [stage],
  )

  const teamMembers = React.useMemo(() => {
    return (detail?.students ?? []).map((student) => ({
      id: student.userId,
      name: student.fullName,
      studentId: student.userId,
      email: student.email,
    }))
  }, [detail?.students])

  const [studentEvaluations, setStudentEvaluations] = React.useState<Record<string, StudentEvaluationDraft>>({})
  const [evaluationSummary, setEvaluationSummary] = React.useState<EvaluatorProjectEvaluationMutationSummary | null>(null)
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState<string | null>(null)
  const [submitMissingStudentIds, setSubmitMissingStudentIds] = React.useState<string[]>([])
  const selectedStage = stageLabel(stage)

  React.useEffect(() => {
    if (!detail?.evaluation) return

    setEvaluationSummary((prev) => {
      if (!prev) {
        return detail.evaluation
      }

      if (
        (detail.evaluation.submittedAt && !prev.submittedAt) ||
        (isSubmittedEvaluationStatus(detail.evaluation.status) && !isSubmittedEvaluationStatus(prev.status))
      ) {
        return detail.evaluation
      }

      return prev
    })
  }, [detail?.evaluation])

  React.useEffect(() => {
    if (!detail?.students.length) return

    setStudentEvaluations((prev) => {
      const next = { ...prev }
      for (const student of detail.students) {
        const existing = next[student.userId]
        next[student.userId] = {
          studentUserId: student.userId,
          score: existing?.score ?? student.evaluation.score,
          comment: existing?.comment ?? student.evaluation.comment ?? "",
          savedAt: student.evaluation.savedAt,
          evaluationStatus: student.evaluation.status,
        }
      }
      return next
    })
  }, [detail?.students])

  const effectiveEvaluationSummary = evaluationSummary ?? detail?.evaluation ?? null
  const isSubmitted =
    Boolean(effectiveEvaluationSummary?.submittedAt) ||
    isSubmittedEvaluationStatus(effectiveEvaluationSummary?.status)
  const submittedAt = effectiveEvaluationSummary?.submittedAt ?? null
  const totalStudents = effectiveEvaluationSummary?.totalStudents ?? detail?.evaluation.totalStudents ?? teamMembers.length

  const studentsReadyForSubmit = React.useMemo(
    () => Object.values(studentEvaluations).filter((draft) => draft.score !== null).length,
    [studentEvaluations],
  )

  const missingStudentIds = React.useMemo(
    () =>
      teamMembers.filter(
        (member) =>
          studentEvaluations[member.id]?.score === null ||
          studentEvaluations[member.id]?.score === undefined,
      ),
    [studentEvaluations, teamMembers],
  )

  const updateStudentScore = React.useCallback(
    (studentId: string, rawValue: string) => {
      if (isSubmitted) return

      const nextScore = normalizeScoreInput(rawValue)
      setSubmitErrorMessage(null)
      setSubmitMissingStudentIds([])
      setStudentEvaluations((prev) => ({
        ...prev,
        [studentId]: {
          studentUserId: prev[studentId]?.studentUserId ?? studentId,
          score: nextScore,
          comment: prev[studentId]?.comment ?? "",
          savedAt: prev[studentId]?.savedAt ?? null,
          evaluationStatus: prev[studentId]?.evaluationStatus ?? "NOT_STARTED",
        },
      }))
    },
    [isSubmitted],
  )

  const updateStudentComment = React.useCallback(
    (studentId: string, value: string) => {
      if (isSubmitted) return

      setSubmitErrorMessage(null)
      setSubmitMissingStudentIds([])
      setStudentEvaluations((prev) => ({
        ...prev,
        [studentId]: {
          studentUserId: prev[studentId]?.studentUserId ?? studentId,
          score: prev[studentId]?.score ?? null,
          comment: value,
          savedAt: prev[studentId]?.savedAt ?? null,
          evaluationStatus: prev[studentId]?.evaluationStatus ?? "NOT_STARTED",
        },
      }))
    },
    [isSubmitted],
  )

  const buildDraftPayload = React.useCallback(() => {
    return teamMembers
      .map((member) => {
        const draft = studentEvaluations[member.id]
        if (!draft || draft.score === null) {
          return null
        }

        return {
          studentUserId: member.id,
          score: draft.score,
          comment: draft.comment || undefined,
        }
      })
      .filter(
        (student): student is { studentUserId: string; score: number; comment?: string } =>
          Boolean(student),
      )
  }, [studentEvaluations, teamMembers])

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!apiStage) {
        throw new Error("Choose a capstone stage first")
      }

      const students = buildDraftPayload()
      if (!students.length) {
        throw new Error("Enter at least one student score before saving draft")
      }

      return saveEvaluatorProjectEvaluationDraft(projectId, apiStage, { students })
    },
    onSuccess: (result) => {
      setSubmitErrorMessage(null)
      setSubmitMissingStudentIds([])
      setEvaluationSummary(result.evaluation)
      setStudentEvaluations((prev) => {
        const next = { ...prev }
        for (const student of result.savedStudents) {
          const current = next[student.studentUserId]
          next[student.studentUserId] = {
            studentUserId: student.studentUserId,
            score: student.score,
            comment: student.comment ?? current?.comment ?? "",
            savedAt: result.evaluation.lastSavedAt,
            evaluationStatus: student.status,
          }
        }
        return next
      })

      toast.success(result.message, {
        description: `${result.evaluation.studentsEvaluated}/${result.evaluation.totalStudents} student drafts saved for ${selectedStage}.`,
      })
    },
    onError: (error: Error) => {
      if (error.message.includes("cannot be edited")) {
        void detailQuery.refetch()
      }

      toast.error("Draft save failed", {
        description: error.message,
      })
    },
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!apiStage) {
        throw new Error("Choose a capstone stage first")
      }

      return submitEvaluatorProjectEvaluation(projectId, apiStage)
    },
    onSuccess: (result) => {
      setSubmitErrorMessage(null)
      setSubmitMissingStudentIds([])
      setEvaluationSummary(result.evaluation)
      setStudentEvaluations((prev) => {
        const next = { ...prev }
        for (const student of result.submittedStudents) {
          const current = next[student.studentUserId]
          next[student.studentUserId] = {
            studentUserId: student.studentUserId,
            score: student.score,
            comment: student.comment ?? current?.comment ?? "",
            savedAt: result.evaluation.submittedAt ?? result.evaluation.lastSavedAt,
            evaluationStatus: student.status,
          }
        }
        return next
      })

      toast.success(result.message, {
        description: `Submitted ${result.evaluation.studentsEvaluated}/${result.evaluation.totalStudents} student scores for ${selectedStage}.`,
      })
    },
    onError: (error: Error) => {
      const missingIds = parseMissingStudentIdsFromError(error.message)
      setSubmitErrorMessage(error.message)
      setSubmitMissingStudentIds(missingIds)

      if (error.message.includes("cannot be edited")) {
        void detailQuery.refetch()
      }

      toast.error("Submit failed", {
        description: error.message,
      })
    },
  })

  const handleSaveDraft = React.useCallback(() => {
    if (isSubmitted) {
      toast.message("Evaluation already submitted", {
        description: "Submitted evaluator evaluations are read-only.",
      })
      return
    }

    saveDraftMutation.mutate()
  }, [isSubmitted, saveDraftMutation])

  const handleSubmit = React.useCallback(() => {
    if (isSubmitted) {
      toast.message("Evaluation already submitted", {
        description: "Submitted evaluator evaluations are read-only.",
      })
      return
    }

    if (!apiStage) {
      toast.error("Choose a capstone stage first")
      return
    }

    if (missingStudentIds.length > 0) {
      setSubmitErrorMessage("All students must have a score between 0 and 100 before submit.")
      setSubmitMissingStudentIds(missingStudentIds.map((student) => student.id))
      toast.error("Complete all student scores before submit", {
        description: `Missing: ${missingStudentIds.map((student) => student.name).join(", ")}`,
      })
      return
    }

    submitMutation.mutate()
  }, [apiStage, isSubmitted, missingStudentIds, submitMutation])

  if (!authHydrated || (apiStage ? detailQuery.isLoading : false)) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href="/dashboard/advisor/evaluator">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Evaluator overview
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading evaluation workspace</CardTitle>
            <CardDescription>Fetching assigned project and student evaluation state.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (apiStage && detailQuery.error) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href="/dashboard/advisor/evaluator">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Evaluator overview
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Evaluation workspace unavailable</CardTitle>
            <CardDescription>{detailQuery.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/advisor/evaluator/projects/${projectId}${stageQuery}`}>
                Back to project
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href={`/dashboard/advisor/evaluator${stageQuery}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Evaluator overview
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Project not found</CardTitle>
            <CardDescription>No project with id {projectId}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/advisor/evaluator/pending${stageQuery}`}>Back to pending</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href={`/dashboard/advisor/evaluator/projects/${projectId}${stageQuery}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to project
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/advisor/evaluator/rubric${stageQuery}`}>
              <BookOpen className="h-4 w-4" aria-hidden />
              Rubric
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/advisor/evaluator/pending${stageQuery}`}>Pending queue</Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title={`${selectedStage} evaluation`}
        description={`${project.title} · ${project.groupName ?? "Group"} — enter a score from 0 to 100 for each student, save drafts, then submit after all rows are complete.`}
      />

      {detail ? (
        <Card className="border-primary/20 bg-primary/[0.04] shadow-sm">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 font-medium text-foreground">
                {getEvaluationStatusLabel(effectiveEvaluationSummary?.status ?? detail.evaluation.status)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students evaluated</p>
              <p className="mt-1 font-medium text-foreground">
                {effectiveEvaluationSummary?.studentsEvaluated ?? detail.evaluation.studentsEvaluated}/
                {effectiveEvaluationSummary?.totalStudents ?? detail.evaluation.totalStudents}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average score</p>
              <p className="mt-1 font-medium text-foreground">
                {effectiveEvaluationSummary?.averageScoreGiven ?? detail.evaluation.averageScoreGiven}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last saved</p>
              <p className="mt-1 font-medium text-foreground">
                {formatSavedAtLabel(effectiveEvaluationSummary?.lastSavedAt ?? detail.evaluation.lastSavedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isSubmitted ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Evaluator evaluation submitted</p>
            <p className="mt-1 text-muted-foreground">
              Submitted at {formatSavedAtLabel(submittedAt)}. Scores and comments are now read-only.
            </p>
            <p className="mt-2 text-muted-foreground">
              This submit action is final for the current evaluator record. Re-submit is not expected in the Capstone II flow.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isSubmitted && submitErrorMessage ? (
        <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Submit issue</p>
            <p className="mt-1 text-muted-foreground">{submitErrorMessage}</p>
            {submitMissingStudentIds.length > 0 ? (
              <p className="mt-2 text-muted-foreground">
                Missing students: {teamMembers
                  .filter((member) => submitMissingStudentIds.includes(member.id))
                  .map((member) => member.name)
                  .join(", ")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!stage ? (
        <Card className="border-dashed border-primary/20 bg-primary/[0.04] shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">Choose a capstone stage</p>
              <p className="text-sm text-muted-foreground">
                Use the stage selector to start Capstone I or Capstone II for this project.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/advisor/evaluator/evaluate/${projectId}?stage=capstone-i`}>Capstone I</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/advisor/evaluator/evaluate/${projectId}?stage=capstone-ii`}>Capstone II</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-background/60">
              <CardTitle className="text-base">Scoring context</CardTitle>
              <CardDescription>Project and evaluation workflow.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold leading-snug text-foreground">{project.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {project.groupName ?? "Group"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {String(project.status).replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Advisor <span className="text-foreground">{project.advisorName ?? "-"}</span>
                </p>
                <Button variant="outline" size="sm" className="w-full rounded-lg sm:w-auto" asChild>
                  <Link href={`/dashboard/advisor/evaluator/projects/${projectId}${stageQuery}`}>
                    <FolderKanban className="mr-2 h-4 w-4" aria-hidden />
                    Open project detail
                  </Link>
                </Button>
              </div>

              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Evaluator workflow</p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Review the rubric reference for {selectedStage}.</p>
                  <p>2. Enter each student score from 0 to 100.</p>
                  <p>3. Save all entered scores as draft.</p>
                  <p>4. Submit after every student row is complete.</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">Draft completion:</span>{" "}
                  <span className="text-muted-foreground">{studentsReadyForSubmit}/{totalStudents} students scored</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-base sm:text-lg">Rubric reference</CardTitle>
              <CardDescription>
                {selectedStage} criteria are shown here as read-only guidance for scoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {stage ? (
                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {selectedStage} specific criteria
                      </h3>
                      <Badge variant="outline">{stageSpecificCriteria.length} items</Badge>
                    </div>
                    <div className="space-y-3">
                      {stageSpecificCriteria.map((criterion) => {
                        const pct = criterion.maxPercent > 0 ? (criterion.maxPercent / criterion.maxPercent) * 100 : 0

                        return (
                          <div key={criterion.id} className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-snug text-foreground">{criterion.label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>
                              </div>
                              <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">
                                <span className="text-primary">Reference</span>
                                <span className="text-muted-foreground"> {criterion.maxPercent}%</span>
                              </span>
                            </div>
                            <Progress value={pct} className="h-2.5 bg-muted/80" />
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Common criteria
                      </h3>
                      <Badge variant="outline">{commonCriteria.length} items</Badge>
                    </div>
                    <div className="space-y-3">
                      {commonCriteria.map((criterion) => {
                        const pct = criterion.maxPercent > 0 ? (criterion.maxPercent / criterion.maxPercent) * 100 : 0

                        return (
                          <div key={criterion.id} className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-snug text-foreground">{criterion.label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>
                              </div>
                              <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">
                                <span className="text-primary">Reference</span>
                                <span className="text-muted-foreground"> {criterion.maxPercent}%</span>
                              </span>
                            </div>
                            <Progress value={pct} className="h-2.5 bg-muted/80" />
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  Select Capstone I or Capstone II to load the correct rubric reference.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-lg">Student score sheet</CardTitle>
              <CardDescription>Keep the rubric as reference, then draft scores for all students here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {teamMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  No students are assigned to this project yet.
                </div>
              ) : (
                teamMembers.map((member) => {
                  const memberEvaluation = studentEvaluations[member.id] ?? {
                    studentUserId: member.id,
                    score: null,
                    comment: "",
                    savedAt: null,
                    evaluationStatus: "NOT_STARTED",
                  }
                  const isMissing = submitMissingStudentIds.includes(member.id)

                  return (
                    <div
                      key={member.id}
                      className={
                        isMissing
                          ? "rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/20"
                          : "rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm"
                      }
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-foreground">{member.name}</p>
                            <Badge variant={memberEvaluation.score !== null ? "secondary" : "outline"}>
                              {getEvaluationStatusLabel(memberEvaluation.evaluationStatus)}
                            </Badge>
                            {isMissing ? <Badge variant="destructive">Missing score</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {member.studentId}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Last saved: {formatSavedAtLabel(memberEvaluation.savedAt)}
                          </p>
                        </div>

                        <div className="w-full max-w-full rounded-xl border border-primary/20 bg-primary/[0.04] p-3 lg:w-56">
                          <Label
                            htmlFor={`student-score-${member.id}`}
                            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            Score
                          </Label>
                          <div className="mt-2 flex items-end gap-2">
                            <Input
                              id={`student-score-${member.id}`}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={100}
                              step={1}
                              value={memberEvaluation.score ?? ""}
                              onChange={(event) => updateStudentScore(member.id, event.target.value)}
                              placeholder="0 - 100"
                              disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                              className="text-lg font-semibold"
                            />
                            <span className="pb-2 text-sm text-muted-foreground">/100</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor={`student-comment-${member.id}`}>Comment</Label>
                        <Textarea
                          id={`student-comment-${member.id}`}
                          placeholder="Optional evaluator note for this student"
                          value={memberEvaluation.comment}
                          onChange={(event) => updateStudentComment(member.id, event.target.value)}
                          className="min-h-[96px] resize-y"
                          disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-base sm:text-lg">Draft and submit</CardTitle>
              <CardDescription>
                Save all entered scores first, then submit once every student has a grade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {!isSubmitted ? (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                  Ready to submit: <span className="font-medium text-foreground">{studentsReadyForSubmit}/{totalStudents}</span>
                  {missingStudentIds.length > 0
                    ? ` · Missing ${missingStudentIds.map((student) => student.name).join(", ")}`
                    : " · All students scored"}
                </div>
              ) : null}

              {!isSubmitted ? (
                <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-sm text-muted-foreground">
                  Save drafts as often as needed, then submit once after the full Capstone II evaluator review is complete.
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                {!isSubmitted ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleSaveDraft}
                    disabled={!apiStage || saveDraftMutation.isPending || submitMutation.isPending}
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    {saveDraftMutation.isPending ? "Saving drafts..." : "Save all drafts"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="btn-gradient w-full gap-2"
                  onClick={handleSubmit}
                  disabled={
                    !apiStage ||
                    isSubmitted ||
                    saveDraftMutation.isPending ||
                    submitMutation.isPending ||
                    missingStudentIds.length > 0
                  }
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {submitMutation.isPending ? "Submitting..." : isSubmitted ? "Submitted" : "Submit all scores"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/advisor/evaluator/pending${stageQuery}`}>Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-base">Team members</CardTitle>
              <CardDescription>Student list for this evaluator assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
