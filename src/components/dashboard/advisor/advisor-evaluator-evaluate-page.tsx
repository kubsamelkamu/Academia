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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
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

/** Maps all rubric line points (stage-specific + common) to one 0–100 score for the API. */
function percentScoreFromRubricBreakdown(
  breakdown: Record<string, number> | undefined,
  allCriteria: { id: string; maxPercent: number }[],
  rubricMaxSum: number,
): number {
  if (!breakdown || !allCriteria.length || rubricMaxSum <= 0) return 0
  const earned = allCriteria.reduce((sum, c) => sum + (breakdown[c.id] ?? 0), 0)
  return Math.min(100, Math.max(0, Math.round((earned / rubricMaxSum) * 100)))
}

function linePointsEarned(
  breakdown: Record<string, number> | undefined,
  criteria: { id: string }[],
): number {
  if (!breakdown) return 0
  return criteria.reduce((sum, c) => sum + (breakdown[c.id] ?? 0), 0)
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

  const stageSpecificMaxSum = React.useMemo(
    () => stageSpecificCriteria.reduce((sum, c) => sum + c.maxPercent, 0),
    [stageSpecificCriteria],
  )

  const commonMaxSum = React.useMemo(
    () => commonCriteria.reduce((sum, c) => sum + c.maxPercent, 0),
    [commonCriteria],
  )

  const allRubricCriteria = React.useMemo(
    () => [...stageSpecificCriteria, ...commonCriteria],
    [stageSpecificCriteria, commonCriteria],
  )

  const rubricMaxSum = React.useMemo(
    () => stageSpecificMaxSum + commonMaxSum,
    [stageSpecificMaxSum, commonMaxSum],
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
  /** Per student: points per rubric line (stage-specific + common), each 0 … line max. */
  const [criterionScoresByStudent, setCriterionScoresByStudent] = React.useState<
    Record<string, Record<string, number>>
  >({})
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null)
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

  React.useEffect(() => {
    if (!detail?.students?.length || !stage) return

    const { stageSpecificCriteria: sc, commonCriteria: cc } = getEvaluateCriteriaByStage(stage)
    const allCrit = [...sc, ...cc]
    const maxSum = allCrit.reduce((s, c) => s + c.maxPercent, 0)

    setCriterionScoresByStudent(() => {
      const next: Record<string, Record<string, number>> = {}
      for (const st of detail.students) {
        const rawScore = st.evaluation.score
        if (rawScore === null || rawScore === undefined || Number.isNaN(Number(rawScore))) {
          next[st.userId] = Object.fromEntries(allCrit.map((c) => [c.id, 0]))
        } else {
          const scoreNum = Number(rawScore)
          next[st.userId] = Object.fromEntries(
            allCrit.map((c) => {
              const earned = maxSum > 0 ? (c.maxPercent / maxSum) * scoreNum : 0
              return [c.id, Math.round(earned * 10) / 10]
            }),
          )
        }
      }
      return next
    })
  }, [detail?.students, stage, projectId])

  React.useEffect(() => {
    if (teamMembers.length === 0) {
      setSelectedStudentId(null)
      return
    }
    setSelectedStudentId((prev) => (prev && teamMembers.some((m) => m.id === prev) ? prev : teamMembers[0].id))
  }, [teamMembers])

  React.useEffect(() => {
    if (!teamMembers.length || !allRubricCriteria.length) return

    setStudentEvaluations((prev) => {
      const next = { ...prev }
      let changed = false
      for (const m of teamMembers) {
        const breakdown = criterionScoresByStudent[m.id]
        if (!breakdown) continue

        const earned = allRubricCriteria.reduce((sum, c) => sum + (breakdown[c.id] ?? 0), 0)
        const pct = percentScoreFromRubricBreakdown(breakdown, allRubricCriteria, rubricMaxSum)
        const apiRow = detail?.students?.find((s) => s.userId === m.id)
        const hadApiScore =
          apiRow?.evaluation.score !== null &&
          apiRow?.evaluation.score !== undefined &&
          !Number.isNaN(Number(apiRow.evaluation.score))
        const nextScore = earned > 0 || hadApiScore ? pct : null

        const existing = next[m.id]
        if (!existing || existing.score !== nextScore) {
          changed = true
          next[m.id] = {
            studentUserId: m.id,
            score: nextScore,
            comment: existing?.comment ?? "",
            savedAt: existing?.savedAt ?? null,
            evaluationStatus: existing?.evaluationStatus ?? "NOT_STARTED",
          }
        }
      }
      return changed ? next : prev
    })
  }, [criterionScoresByStudent, teamMembers, allRubricCriteria, rubricMaxSum, detail?.students])

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

  const updateCriterionScore = React.useCallback(
    (studentId: string, criterionId: string, raw: number) => {
      if (isSubmitted) return

      const critDef = allRubricCriteria.find((c) => c.id === criterionId)
      const max = critDef?.maxPercent ?? 0
      const clamped = Math.min(max, Math.max(0, raw))

      setSubmitErrorMessage(null)
      setSubmitMissingStudentIds([])
      setCriterionScoresByStudent((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] ?? {}),
          [criterionId]: clamped,
        },
      }))
    },
    [isSubmitted, allRubricCriteria],
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
        description={`${project.title} · ${project.groupName ?? "Group"} — select a student, score every stage-specific and common rubric line with sliders (all lines together map to 0–100), then save drafts and submit when everyone is complete.`}
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

      <div className="flex flex-col gap-6 xl:gap-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-start">
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
                  <p>1. Select a student in the score sheet.</p>
                  <p>2. Use sliders for stage-specific and common criteria (combined total maps to a score out of 100).</p>
                  <p>3. Add an optional comment for that student below the rubric.</p>
                  <p>4. Save drafts, then submit when every student has a score.</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">Draft completion:</span>{" "}
                  <span className="text-muted-foreground">{`${studentsReadyForSubmit}/${totalStudents}`} students scored</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0 lg:sticky lg:top-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <CardTitle className="text-base">Team members</CardTitle>
                <CardDescription>Student list for this evaluator assignment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                  >
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

          <Card className="border-border/80 shadow-sm w-full">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-lg">Student score sheet</CardTitle>
              <CardDescription>
                {isSubmitted ? (
                  <>
                    This evaluation is <span className="font-medium text-foreground">submitted</span>. Click a student to
                    review their final score, rubric breakdown, and comment. You can switch between students; editing is
                    disabled.
                  </>
                ) : (
                  <>
                    Click a student to select them. Their overall score (0–100) is computed from{" "}
                    <span className="font-medium text-foreground">all rubric lines</span> (stage-specific + common) in the
                    section below.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
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
                  const isSelected = member.id === selectedStudentId

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedStudentId(member.id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left shadow-sm transition-[box-shadow,ring,border-color] outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        isMissing
                          ? "border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20"
                          : "border-border/70 bg-card/60 hover:bg-card",
                        isSelected && "ring-2 ring-primary border-primary/40 bg-primary/[0.04]",
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-foreground">{member.name}</p>
                            <Badge variant={memberEvaluation.score !== null ? "secondary" : "outline"}>
                              {getEvaluationStatusLabel(memberEvaluation.evaluationStatus)}
                            </Badge>
                            {isMissing ? <Badge variant="destructive">Missing score</Badge> : null}
                            {isSelected ? (
                              <Badge variant="default" className="bg-primary text-primary-foreground">
                                {isSubmitted ? "Reviewing" : "Selected"}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {member.studentId}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Last saved: {formatSavedAtLabel(memberEvaluation.savedAt)}
                          </p>
                        </div>

                        <div className="w-full shrink-0 rounded-xl border border-primary/20 bg-background/80 px-4 py-3 sm:w-52">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score total</p>
                          <p className="mt-1 font-semibold tabular-nums text-foreground">
                            <span className="text-2xl">{memberEvaluation.score ?? "—"}</span>
                            <span className="text-sm font-normal text-muted-foreground"> /100</span>
                          </p>
                          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                            From {allRubricCriteria.length} rubric lines ({stageSpecificCriteria.length} stage +{" "}
                            {commonCriteria.length} common); combined points scale to a score out of 100.
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm w-full">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-base sm:text-lg">Rubric reference</CardTitle>
              <CardDescription>
                {isSubmitted ? (
                  <>
                    Submitted breakdown for the <span className="font-medium text-foreground">selected student</span>{" "}
                    (read-only). Switch students in the score sheet to compare. Line totals reflect the saved 0–100
                    score (distributed across criteria for display).
                  </>
                ) : (
                  <>
                    Slide each line for the <span className="font-medium text-foreground">selected student</span>. Earned
                    points across lines convert to the 0–100 score shown on their row.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {stage ? (
                <>
                  {selectedStudentId && rubricMaxSum > 0 ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">Rubric total</span>
                      <Badge variant="secondary" className="max-w-full whitespace-normal tabular-nums text-xs sm:text-sm">
                        {`Σ ${linePointsEarned(criterionScoresByStudent[selectedStudentId], allRubricCriteria)}/${rubricMaxSum} pts across all lines → `}
                        <span className="font-semibold">{studentEvaluations[selectedStudentId]?.score ?? "—"}</span>
                        {" /100"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {`Stage ${linePointsEarned(criterionScoresByStudent[selectedStudentId], stageSpecificCriteria)}/${stageSpecificMaxSum} · Common ${linePointsEarned(criterionScoresByStudent[selectedStudentId], commonCriteria)}/${commonMaxSum}`}
                      </span>
                    </div>
                  ) : null}

                  <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {selectedStage} specific criteria
                      </h3>
                      <Badge variant="outline" className="tabular-nums">
                        {stageSpecificCriteria.length} lines · max {stageSpecificMaxSum} pts ({stageSpecificMaxSum}% of total)
                      </Badge>
                    </div>

                    {!selectedStudentId ? (
                      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                        {isSubmitted
                          ? "Select a student in the score sheet to view their submitted rubric breakdown."
                          : "Select a student in the score sheet to enable sliders."}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {stageSpecificCriteria.map((criterion) => {
                          const raw = criterionScoresByStudent[selectedStudentId]?.[criterion.id] ?? 0
                          const max = criterion.maxPercent
                          const fillPct = max > 0 ? (raw / max) * 100 : 0

                          return (
                            <div
                              key={criterion.id}
                              className="space-y-4 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold leading-snug text-foreground">{criterion.label}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>
                                </div>
                                <span className="shrink-0 tabular-nums text-sm font-semibold text-primary">
                                  {raw}
                                  <span className="font-normal text-muted-foreground"> / {max}</span>
                                </span>
                              </div>
                              <Slider
                                min={0}
                                max={max}
                                step={1}
                                value={[raw]}
                                disabled={isSubmitted}
                                onValueChange={(v) =>
                                  updateCriterionScore(selectedStudentId, criterion.id, v[0] ?? 0)
                                }
                                aria-label={`${criterion.label} score`}
                              />
                              <Progress value={fillPct} className="h-2 bg-muted/80" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Common criteria
                      </h3>
                      <Badge variant="outline" className="tabular-nums">
                        {commonCriteria.length} lines · max {commonMaxSum} pts ({commonMaxSum}% of total)
                      </Badge>
                    </div>

                    {!selectedStudentId ? (
                      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                        {isSubmitted
                          ? "Select a student in the score sheet to view their submitted common criteria."
                          : "Select a student to score presentation & professionalism criteria."}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {commonCriteria.map((criterion) => {
                          const raw = criterionScoresByStudent[selectedStudentId]?.[criterion.id] ?? 0
                          const max = criterion.maxPercent
                          const fillPct = max > 0 ? (raw / max) * 100 : 0

                          return (
                            <div
                              key={criterion.id}
                              className="space-y-4 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold leading-snug text-foreground">{criterion.label}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>
                                </div>
                                <span className="shrink-0 tabular-nums text-sm font-semibold text-primary">
                                  {raw}
                                  <span className="font-normal text-muted-foreground"> / {max}</span>
                                </span>
                              </div>
                              <Slider
                                min={0}
                                max={max}
                                step={1}
                                value={[raw]}
                                disabled={isSubmitted}
                                onValueChange={(v) =>
                                  updateCriterionScore(selectedStudentId, criterion.id, v[0] ?? 0)
                                }
                                aria-label={`${criterion.label} score`}
                              />
                              <Progress value={fillPct} className="h-2 bg-muted/80" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  Select Capstone I or Capstone II to load the correct rubric reference.
                </div>
              )}

              {teamMembers.length > 0 && selectedStudentId ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Comment for selected student</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Optional note for{" "}
                        <span className="font-medium text-foreground">
                          {teamMembers.find((m) => m.id === selectedStudentId)?.name ?? "student"}
                        </span>
                        .
                      </p>
                    </div>
                    <Textarea
                      id="evaluator-comment-selected"
                      placeholder="Optional evaluator note for this student"
                      value={studentEvaluations[selectedStudentId]?.comment ?? ""}
                      onChange={(event) => updateStudentComment(selectedStudentId, event.target.value)}
                      className="min-h-[120px] resize-y"
                      disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                    />
                  </div>
                </>
              ) : null}

              <Separator />

              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Draft and submit</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save all entered scores first, then submit once every student has a grade.
                  </p>
                </div>
                {!isSubmitted ? (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                    Ready to submit:{" "}
                    <span className="font-medium text-foreground">{`${studentsReadyForSubmit}/${totalStudents}`}</span>
                    {missingStudentIds.length > 0
                      ? ` · Missing ${missingStudentIds.map((student) => student.name).join(", ")}`
                      : " · All students scored"}
                  </div>
                ) : null}

                {!isSubmitted ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-sm text-muted-foreground">
                    Save drafts as often as needed, then submit once the full evaluator review is complete.
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {!isSubmitted ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 sm:min-w-[200px] sm:flex-1"
                      onClick={handleSaveDraft}
                      disabled={!apiStage || saveDraftMutation.isPending || submitMutation.isPending}
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      {saveDraftMutation.isPending ? "Saving drafts..." : "Save all drafts"}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    className="btn-gradient w-full gap-2 sm:min-w-[200px] sm:flex-1"
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
                  <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <Link href={`/dashboard/advisor/evaluator/pending${stageQuery}`}>Cancel</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
