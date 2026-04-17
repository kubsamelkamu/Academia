"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, ChevronDown, FileText, FolderKanban, Send } from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  getEvaluatorProjectEvaluationDetail,
  saveEvaluatorProjectEvaluationDraft,
  submitEvaluatorProjectEvaluation,
  type AdvisorEvaluationDashboardStage,
  type EvaluatorProjectEvaluationMutationSummary,
} from "@/lib/api/advisor"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"

import {
  EVALUATE_REASON_CODES,
  RUBRIC_TOTAL_MAX_PERCENT,
  getEvaluateCriteriaByStage,
} from "./advisor-evaluator-evaluate-shared"
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
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

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

export function AdvisorEvaluatorEvaluatePage({
  projectId,
  stage,
}: {
  projectId: string
  stage?: AdvisorEvaluatorStage | null
}) {
  const authHydrated = useAuthStoreHydrated()
  const apiStage = React.useMemo(() => normalizeStageForApi(stage), [stage])
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
  const activeCriteria = React.useMemo(
    () => [...stageSpecificCriteria, ...commonCriteria],
    [stageSpecificCriteria, commonCriteria],
  )
  const selectedMaxTotal = React.useMemo(
    () => activeCriteria.reduce((sum, c) => sum + c.maxPercent, 0),
    [activeCriteria],
  )

  const teamMembers = React.useMemo(() => {
    return (detail?.students ?? []).map((student) => ({
      id: student.userId,
      name: student.fullName,
      studentId: student.userId,
      email: student.email,
    }))
  }, [detail?.students])

  type StudentEvaluationDraft = {
    studentUserId: string
    score: number | null
    criterionScores: Record<string, number>
    reasonCode: string
    comment: string
    savedAt: string | null
    evaluationStatus: string
  }

  type BulkEvaluationDraft = {
    score: number | null
    criterionScores: Record<string, number>
    reasonCode: string
    comment: string
  }

  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("")
  const [studentEvaluations, setStudentEvaluations] = React.useState<Record<string, StudentEvaluationDraft>>({})
  const [bulkDraft, setBulkDraft] = React.useState<BulkEvaluationDraft>({
    score: null,
    criterionScores: {},
    reasonCode: "",
    comment: "",
  })
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([])
  const [evaluationMode, setEvaluationMode] = React.useState<"individual" | "selected">("individual")
  const [evaluationSummary, setEvaluationSummary] = React.useState<EvaluatorProjectEvaluationMutationSummary | null>(null)
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState<string | null>(null)
  const [submitMissingStudentIds, setSubmitMissingStudentIds] = React.useState<string[]>([])

  const [expandedCriteria, setExpandedCriteria] = React.useState<Record<string, boolean>>({})
  const selectedStage = stageLabel(stage)

  React.useEffect(() => {
    if (!detail?.evaluation) return

    setEvaluationSummary((prev) => prev ?? detail.evaluation)
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
          criterionScores: existing?.criterionScores ?? {},
          reasonCode: existing?.reasonCode ?? "",
          comment: existing?.comment ?? student.evaluation.comment ?? "",
          savedAt: student.evaluation.savedAt,
          evaluationStatus: student.evaluation.status,
        }
      }
      return next
    })
  }, [detail?.students])

  React.useEffect(() => {
    if (teamMembers.length === 0) return
    setSelectedStudentId((prev) => (prev ? prev : teamMembers[0].id))
  }, [teamMembers])

  const selectedStudent = React.useMemo(
    () => teamMembers.find((member) => member.id === selectedStudentId) ?? null,
    [teamMembers, selectedStudentId],
  )

  const selectedEvaluation = studentEvaluations[selectedStudentId] ?? {
    studentUserId: selectedStudentId,
    score: null,
    criterionScores: {},
    reasonCode: "",
    comment: "",
    savedAt: null,
    evaluationStatus: "NOT_STARTED",
  }

  const isSelectedMode = evaluationMode === "selected" && selectedMemberIds.length > 0
  const criterionScores = isSelectedMode ? bulkDraft.criterionScores : selectedEvaluation.criterionScores
  const scores = criterionScores
  const reasonCode = isSelectedMode ? bulkDraft.reasonCode : selectedEvaluation.reasonCode
  const comments = isSelectedMode ? bulkDraft.comment : selectedEvaluation.comment
  const effectiveEvaluationSummary = evaluationSummary ?? detail?.evaluation ?? null
  const isSubmitted = effectiveEvaluationSummary?.status === "SUBMITTED"
  const submittedAt = effectiveEvaluationSummary?.submittedAt ?? null
  const totalStudents = effectiveEvaluationSummary?.totalStudents ?? detail?.evaluation.totalStudents ?? teamMembers.length
  const studentsReadyForSubmit = React.useMemo(
    () => Object.values(studentEvaluations).filter((draft) => draft.score !== null).length,
    [studentEvaluations],
  )
  const missingStudentIds = React.useMemo(
    () => teamMembers.filter((member) => studentEvaluations[member.id]?.score === null || studentEvaluations[member.id]?.score === undefined),
    [studentEvaluations, teamMembers],
  )

  const totalScore = React.useMemo(
    () => {
      const criterionTotal = activeCriteria.reduce((sum, c) => sum + (criterionScores[c.id] ?? 0), 0)
      if (criterionTotal > 0) {
        return criterionTotal
      }

      return isSelectedMode ? (bulkDraft.score ?? 0) : (selectedEvaluation.score ?? 0)
    },
    [activeCriteria, bulkDraft.score, criterionScores, isSelectedMode, selectedEvaluation.score],
  )

  const setCriterion = React.useCallback((id: string, value: number) => {
    if (isSelectedMode) {
      const nextCriterionScores = {
        ...bulkDraft.criterionScores,
        [id]: value,
      }
      const nextScore = activeCriteria.reduce((sum, criterion) => sum + (nextCriterionScores[criterion.id] ?? 0), 0)

      setBulkDraft((prev) => ({
        ...prev,
        score: nextScore,
        criterionScores: nextCriterionScores,
      }))
      return
    }

    const nextCriterionScores = {
      ...(studentEvaluations[selectedStudentId]?.criterionScores ?? {}),
      [id]: value,
    }
    const nextScore = activeCriteria.reduce((sum, criterion) => sum + (nextCriterionScores[criterion.id] ?? 0), 0)

    setStudentEvaluations((prev) => ({
      ...prev,
      [selectedStudentId]: {
        studentUserId: prev[selectedStudentId]?.studentUserId ?? selectedStudentId,
        score: nextScore,
        criterionScores: nextCriterionScores,
        reasonCode: prev[selectedStudentId]?.reasonCode ?? "",
        comment: prev[selectedStudentId]?.comment ?? "",
        savedAt: prev[selectedStudentId]?.savedAt ?? null,
        evaluationStatus: prev[selectedStudentId]?.evaluationStatus ?? "NOT_STARTED",
      },
    }))
  }, [activeCriteria, bulkDraft.criterionScores, isSelectedMode, selectedStudentId, studentEvaluations])

  const updateReasonCode = React.useCallback((value: string) => {
    if (isSubmitted) return

    if (isSelectedMode) {
      setBulkDraft((prev) => ({
        ...prev,
        reasonCode: value,
      }))
      return
    }

    setStudentEvaluations((prev) => ({
      ...prev,
      [selectedStudentId]: {
        studentUserId: prev[selectedStudentId]?.studentUserId ?? selectedStudentId,
        score: prev[selectedStudentId]?.score ?? null,
        criterionScores: prev[selectedStudentId]?.criterionScores ?? {},
        reasonCode: value,
        comment: prev[selectedStudentId]?.comment ?? "",
        savedAt: prev[selectedStudentId]?.savedAt ?? null,
        evaluationStatus: prev[selectedStudentId]?.evaluationStatus ?? "NOT_STARTED",
      },
    }))
  }, [selectedStudentId, isSelectedMode, isSubmitted])

  const updateComments = React.useCallback((value: string) => {
    if (isSubmitted) return

    if (isSelectedMode) {
      setBulkDraft((prev) => ({
        ...prev,
        comment: value,
      }))
      return
    }

    setStudentEvaluations((prev) => ({
      ...prev,
      [selectedStudentId]: {
        studentUserId: prev[selectedStudentId]?.studentUserId ?? selectedStudentId,
        score: prev[selectedStudentId]?.score ?? null,
        criterionScores: prev[selectedStudentId]?.criterionScores ?? {},
        reasonCode: prev[selectedStudentId]?.reasonCode ?? "",
        comment: value,
        savedAt: prev[selectedStudentId]?.savedAt ?? null,
        evaluationStatus: prev[selectedStudentId]?.evaluationStatus ?? "NOT_STARTED",
      },
    }))
  }, [selectedStudentId, isSelectedMode, isSubmitted])

  const buildDraftPayload = React.useCallback(() => {
    if (isSelectedMode) {
      return selectedMemberIds
        .map((memberId) => {
          const draft = studentEvaluations[memberId]
          const score = bulkDraft.score ?? draft?.score ?? null
          if (score === null) return null

          return {
            studentUserId: memberId,
            score,
            comment: bulkDraft.comment || draft?.comment || undefined,
          }
        })
        .filter((student): student is { studentUserId: string; score: number; comment?: string } => Boolean(student))
    }

    if (!selectedStudentId) {
      return []
    }

    const score = selectedEvaluation.score ?? null
    if (score === null) {
      return []
    }

    return [
      {
        studentUserId: selectedEvaluation.studentUserId,
        score,
        comment: selectedEvaluation.comment || undefined,
      },
    ]
  }, [bulkDraft.comment, bulkDraft.score, isSelectedMode, selectedEvaluation.comment, selectedEvaluation.score, selectedEvaluation.studentUserId, selectedMemberIds, selectedStudentId, studentEvaluations])

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!apiStage) {
        throw new Error("Choose a capstone stage first")
      }

      const students = buildDraftPayload()
      if (!students.length) {
        throw new Error(isSelectedMode ? "Add a score for at least one selected student" : "Add a score before saving draft")
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
            criterionScores: current?.criterionScores ?? {},
            reasonCode: current?.reasonCode ?? "",
            comment: student.comment ?? current?.comment ?? "",
            savedAt: result.evaluation.lastSavedAt,
            evaluationStatus: student.status,
          }
        }
        return next
      })

      toast.success(result.message, {
        description: `${result.evaluation.studentsEvaluated}/${result.evaluation.totalStudents} students saved for ${selectedStage}.`,
      })
    },
    onError: (error: Error) => {
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
            criterionScores: current?.criterionScores ?? {},
            reasonCode: current?.reasonCode ?? "",
            comment: student.comment ?? current?.comment ?? "",
            savedAt: result.evaluation.submittedAt ?? result.evaluation.lastSavedAt,
            evaluationStatus: student.status,
          }
        }
        return next
      })
      setEvaluationMode("individual")
      setSelectedMemberIds([])

      toast.success(result.message, {
        description: `Submitted ${result.evaluation.studentsEvaluated}/${result.evaluation.totalStudents} students for ${selectedStage}.`,
      })
    },
    onError: (error: Error) => {
      const missingIds = parseMissingStudentIdsFromError(error.message)
      setSubmitErrorMessage(error.message)
      setSubmitMissingStudentIds(missingIds)

      toast.error("Submit failed", {
        description: error.message,
      })
    },
  })

  const toggleCriterionDetails = React.useCallback((id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

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
      setSubmitErrorMessage("All students must be scored before submit.")
      setSubmitMissingStudentIds(missingStudentIds.map((student) => student.id))
      toast.error("All students must be scored before submit", {
        description: `Missing: ${missingStudentIds.map((student) => student.name).join(", ")}`,
      })
      return
    }

    submitMutation.mutate()
  }, [apiStage, isSubmitted, missingStudentIds, submitMutation])

  const toggleMemberSelection = React.useCallback((memberId: string, checked: boolean) => {
    setSelectedMemberIds((prev) => {
      if (checked) return prev.includes(memberId) ? prev : [...prev, memberId]
      return prev.filter((id) => id !== memberId)
    })
  }, [])

  const selectAllMembers = React.useCallback((checked: boolean) => {
    setSelectedMemberIds(checked ? teamMembers.map((member) => member.id) : [])
  }, [teamMembers])

  const evaluateSelectedMembers = React.useCallback(() => {
    if (selectedMemberIds.length === 0) {
      toast.error("Choose at least one member")
      return
    }
    const seedId = selectedMemberIds[0]
    const seed = studentEvaluations[seedId] ?? {
      studentUserId: seedId,
      score: null,
      criterionScores: {},
      reasonCode: "",
      comment: "",
      savedAt: null,
      evaluationStatus: "NOT_STARTED",
    }
    setBulkDraft({
      score: seed.score,
      criterionScores: { ...seed.criterionScores },
      reasonCode: seed.reasonCode,
      comment: seed.comment,
    })
    setEvaluationMode("selected")
  }, [selectedMemberIds, studentEvaluations])

  const evaluateSingleMember = React.useCallback((memberId: string) => {
    setSelectedStudentId(memberId)
    setEvaluationMode("individual")
  }, [])

  const handleSaveDraft = React.useCallback(() => {
    if (isSubmitted) {
      toast.message("Evaluation already submitted", {
        description: "Submitted evaluator evaluations are read-only.",
      })
      return
    }

    saveDraftMutation.mutate()
  }, [isSubmitted, saveDraftMutation])

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
              <Link href={`/dashboard/advisor/evaluator/projects/${projectId}?stage=${apiStage}`}>
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
          <Link href={`/dashboard/advisor/evaluator${apiStage ? `?stage=${apiStage}` : ""}`}>
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
              <Link href={`/dashboard/advisor/evaluator/pending${apiStage ? `?stage=${apiStage}` : ""}`}>Back to pending</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const effectiveMaxTotal = selectedMaxTotal || RUBRIC_TOTAL_MAX_PERCENT
  const totalPct = effectiveMaxTotal > 0 ? (totalScore / effectiveMaxTotal) * 100 : 0

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href={`/dashboard/advisor/evaluator/projects/${projectId}${apiStage ? `?stage=${apiStage}` : ""}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to project
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/advisor/evaluator/rubric${apiStage ? `?stage=${apiStage}` : ""}`}>
              <BookOpen className="h-4 w-4" aria-hidden />
              Rubric
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/dashboard/advisor/evaluator/pending${apiStage ? `?stage=${apiStage}` : ""}`}>Pending queue</Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title={`${selectedStage} evaluation`}
        description={`${project.title} · ${project.groupName ?? "Group"} — score each criterion (lines sum to ${effectiveMaxTotal}%).`}
      />

      {detail ? (
        <Card className="border-primary/20 bg-primary/[0.04] shadow-sm">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-1 font-medium text-foreground">{String(effectiveEvaluationSummary?.status ?? detail.evaluation.status).replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students evaluated</p>
              <p className="mt-1 font-medium text-foreground">{effectiveEvaluationSummary?.studentsEvaluated ?? detail.evaluation.studentsEvaluated}/{effectiveEvaluationSummary?.totalStudents ?? detail.evaluation.totalStudents}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average score</p>
              <p className="mt-1 font-medium text-foreground">{effectiveEvaluationSummary?.averageScoreGiven ?? detail.evaluation.averageScoreGiven}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last saved</p>
              <p className="mt-1 font-medium text-foreground">{formatSavedAtLabel(effectiveEvaluationSummary?.lastSavedAt ?? detail.evaluation.lastSavedAt)}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isSubmitted ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Evaluator evaluation submitted</p>
            <p className="mt-1 text-muted-foreground">Submitted at {formatSavedAtLabel(submittedAt)}. The form is now read-only.</p>
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
                Missing students: {teamMembers.filter((member) => submitMissingStudentIds.includes(member.id)).map((member) => member.name).join(", ")}
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

      <div className="space-y-6">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-background/60">
            <CardTitle className="text-base">Scoring context</CardTitle>
            <CardDescription>Project</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-5 lg:grid-cols-2">
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
                  Advisor <span className="text-foreground">{project.advisorName ?? "—"}</span>
                </p>
                <Button variant="outline" size="sm" className="w-full rounded-lg sm:w-auto" asChild>
                  <Link href={`/dashboard/advisor/evaluator/projects/${projectId}${apiStage ? `?stage=${apiStage}` : ""}`}>
                    <FolderKanban className="mr-2 h-4 w-4" aria-hidden />
                    Open project detail
                  </Link>
                </Button>
              </div>

              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Team members</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => selectAllMembers(true)}
                    disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => selectAllMembers(false)}
                    disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isSelectedMode ? "default" : "secondary"}
                    onClick={evaluateSelectedMembers}
                    disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                  >
                    Evaluate selected ({selectedMemberIds.length})
                  </Button>
                </div>
                <div className="space-y-2">
                  {teamMembers.map((member) => {
                    const isSelected = member.id === selectedStudentId
                    const isChecked = selectedMemberIds.includes(member.id)
                    return (
                      <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => toggleMemberSelection(member.id, checked === true)}
                            aria-label={`Select ${member.name}`}
                            disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                          />
                          <div className="min-w-0">
                            {(() => {
                              const memberEvaluation = studentEvaluations[member.id]
                              return (
                                <>
                            <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {member.studentId}</p>
                            <p className={`text-xs ${submitMissingStudentIds.includes(member.id) ? "text-destructive" : "text-muted-foreground"}`}>
                              {String(memberEvaluation?.evaluationStatus ?? "NOT_STARTED").replace(/_/g, " ")}
                              {memberEvaluation?.score !== null && memberEvaluation?.score !== undefined ? ` · Score ${memberEvaluation.score}` : ""}
                              {submitMissingStudentIds.includes(member.id) ? " · Missing for submit" : ""}
                            </p>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={!isSelectedMode && isSelected ? "default" : "outline"}
                          onClick={() => evaluateSingleMember(member.id)}
                          disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                        >
                          {!isSelectedMode && isSelected ? "Evaluating" : "Evaluate"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-lg">Rubric scores</CardTitle>
              <CardDescription>
                {isSelectedMode
                  ? `Evaluating selected members: ${selectedMemberIds.length}`
                  : selectedStudent
                  ? `Evaluating student: ${selectedStudent.name}, ID=${selectedStudent.studentId}`
                  : "Select a student to start scoring."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {!isSelectedMode && selectedEvaluation.score !== null && selectedEvaluation.score !== undefined ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Saved evaluator draft found</p>
                  <p className="mt-1">
                    Score {selectedEvaluation.score}/100
                    {selectedEvaluation.savedAt ? ` · Saved at ${formatSavedAtLabel(selectedEvaluation.savedAt)}` : ""}
                  </p>
                  {selectedEvaluation.comment ? <p className="mt-2">Comment: {selectedEvaluation.comment}</p> : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total so far</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary sm:text-4xl">
                      {totalScore}
                      <span className="text-xl font-semibold text-muted-foreground sm:text-2xl">
                        /{effectiveMaxTotal}%
                      </span>
                    </p>
                  </div>
                  <p className="max-w-sm text-right text-xs text-muted-foreground">
                    Full marks on every line equals {effectiveMaxTotal}%.
                  </p>
                </div>
                <Progress value={totalPct} className="mt-4 h-3" />
              </div>

              {stage ? (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {selectedStage} specific criteria
                      </h3>
                      <Badge variant="outline">{stageSpecificCriteria.length} criteria</Badge>
                    </div>
                    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                      {stageSpecificCriteria.map((c) => {
                        const v = scores[c.id] ?? 0
                        const pct = c.maxPercent > 0 ? (v / c.maxPercent) * 100 : 0
                        const detailsOpen = !!expandedCriteria[c.id]
                        return (
                          <div key={c.id} className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <Label htmlFor={`criterion-${c.id}`} className="text-sm font-semibold leading-snug">
                                  {c.label}
                                </Label>
                              </div>
                              <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">
                                <span className="text-primary">{v}</span>
                                <span className="text-muted-foreground">/{c.maxPercent}%</span>
                              </span>
                            </div>
                            <Slider
                              id={`criterion-${c.id}`}
                              value={[v]}
                              onValueChange={(next) => setCriterion(c.id, next[0] ?? 0)}
                              max={c.maxPercent}
                              step={1}
                              className="w-full py-1"
                              disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                            />
                            <Progress value={pct} className="h-2.5 bg-muted/80" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => toggleCriterionDetails(c.id)}
                            >
                              <ChevronDown
                                className={`mr-1 h-3.5 w-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                                aria-hidden
                              />
                              Criterion details
                            </Button>
                            {detailsOpen ? (
                              <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                                {c.description}
                              </p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Common criteria
                      </h3>
                      <Badge variant="outline">{commonCriteria.length} criteria</Badge>
                    </div>
                    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                      {commonCriteria.map((c) => {
                        const v = scores[c.id] ?? 0
                        const pct = c.maxPercent > 0 ? (v / c.maxPercent) * 100 : 0
                        const detailsOpen = !!expandedCriteria[c.id]
                        return (
                          <div key={c.id} className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <Label htmlFor={`criterion-${c.id}`} className="text-sm font-semibold leading-snug">
                                  {c.label}
                                </Label>
                              </div>
                              <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">
                                <span className="text-primary">{v}</span>
                                <span className="text-muted-foreground">/{c.maxPercent}%</span>
                              </span>
                            </div>
                            <Slider
                              id={`criterion-${c.id}`}
                              value={[v]}
                              onValueChange={(next) => setCriterion(c.id, next[0] ?? 0)}
                              max={c.maxPercent}
                              step={1}
                              className="w-full py-1"
                              disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                            />
                            <Progress value={pct} className="h-2.5 bg-muted/80" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => toggleCriterionDetails(c.id)}
                            >
                              <ChevronDown
                                className={`mr-1 h-3.5 w-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                                aria-hidden
                              />
                              Criterion details
                            </Button>
                            {detailsOpen ? (
                              <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                                {c.description}
                              </p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  Select Capstone I or Capstone II to load the correct evaluation criteria and common criteria.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-base sm:text-lg">Summary &amp; submission</CardTitle>
              <CardDescription>Reason code, written feedback, and submit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <Label>Reason code</Label>
                <Select value={reasonCode} onValueChange={updateReasonCode} disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a reason code" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVALUATE_REASON_CODES.map((reason) => (
                      <SelectItem key={reason.code} value={reason.code}>
                        {reason.code}: {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eval-page-comments">Comments</Label>
                <Textarea
                  id="eval-page-comments"
                  placeholder="Feedback for students and records…"
                  value={comments}
                  onChange={(e) => updateComments(e.target.value)}
                  className="mt-1.5 min-h-[120px] resize-y"
                  disabled={isSubmitted || saveDraftMutation.isPending || submitMutation.isPending}
                />
              </div>
              {!isSubmitted ? (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                  Ready to submit: <span className="font-medium text-foreground">{studentsReadyForSubmit}/{totalStudents}</span>
                  {missingStudentIds.length > 0 ? ` · Missing ${missingStudentIds.map((student) => student.name).join(", ")}` : " · All students scored"}
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {!isSubmitted ? (
                  <Button type="button" variant="outline" className="gap-2" onClick={handleSaveDraft} disabled={!apiStage || saveDraftMutation.isPending || submitMutation.isPending}>
                    <FileText className="h-4 w-4" aria-hidden />
                    {saveDraftMutation.isPending ? "Saving draft..." : "Save Draft"}
                  </Button>
                ) : null}
                <Button type="button" className="btn-gradient gap-2" onClick={handleSubmit} disabled={!apiStage || isSubmitted || saveDraftMutation.isPending || submitMutation.isPending || missingStudentIds.length > 0}>
                  <Send className="h-4 w-4" aria-hidden />
                  {submitMutation.isPending ? "Submitting..." : isSubmitted ? "Submitted" : "Submit evaluation"}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/advisor/evaluator/pending${apiStage ? `?stage=${apiStage}` : ""}`}>Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
