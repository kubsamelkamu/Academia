"use client"

import * as React from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Clock, FolderKanban, PlayCircle, Send, ShieldAlert, Users } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { AdvisorEvaluationDashboardStage, AdvisorProjectEvaluationDetail } from "@/lib/api/advisor"
import { useAuthStoreHydrated } from "@/lib/hooks/use-auth-store-hydrated"
import { advisorProjectEvaluationDashboardKeys, useAdvisorProjectEvaluationDashboardWithOptions } from "@/lib/hooks/use-advisor-project-evaluation-dashboard"
import { advisorProjectEvaluationDetailKeys, useAdvisorProjectEvaluationDetail } from "@/lib/hooks/use-advisor-project-evaluation-detail"
import { useAdvisorProjectsWithOptions } from "@/lib/hooks/use-advisor-projects"
import { useSaveAdvisorProjectEvaluationDraft } from "@/lib/hooks/use-save-advisor-project-evaluation-draft"
import { useSubmitAdvisorProjectEvaluation } from "@/lib/hooks/use-submit-advisor-project-evaluation"
import { CAPSTONE_GROUPS, type CapstoneCriterion, type CapstoneGroup, type CapstoneStage, type EvaluationStatus } from "./capstone-evaluation-data"

const STATUS_CLASSES: Record<EvaluationStatus, string> = {
  "Pending Review": "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
  Evaluated: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
  "Needs Revision": "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
}

const ADVISOR_MAX_SCORE = 100

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const icon = status === "Evaluated" ? CheckCircle2 : status === "Needs Revision" ? ShieldAlert : Clock
  const Icon = icon

  return (
    <Badge variant="outline" className={`${STATUS_CLASSES[status]} border`}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {status}
    </Badge>
  )
}

function routeForStage(stage: CapstoneStage) {
  return stage === "Capstone I" ? "/dashboard/advisor/evaluations/capstone-i" : "/dashboard/advisor/evaluations/capstone-ii"
}

function toApiStage(stage: CapstoneStage): AdvisorEvaluationDashboardStage {
  return stage === "Capstone I" ? "CAPSTONE_I" : "CAPSTONE_II"
}

function toEvaluationStatus(status?: string | null): EvaluationStatus {
  const normalized = status?.trim().toUpperCase() ?? "PENDING"

  if (["EVALUATED", "COMPLETED", "APPROVED"].includes(normalized)) {
    return "Evaluated"
  }

  if (["NEEDS_REVISION", "REJECTED"].includes(normalized)) {
    return "Needs Revision"
  }

  return "Pending Review"
}

function criteriaForStage(stage: CapstoneStage): CapstoneCriterion[] {
  return CAPSTONE_GROUPS.find((group) => group.stage === stage)?.criteria ?? []
}

function buildDueLabel(detail: AdvisorProjectEvaluationDetail): string {
  const nextMilestone = detail.milestones.find((milestone) => milestone.status !== "APPROVED") ?? detail.milestones[0]

  if (!nextMilestone?.dueDate) {
    return "Awaiting update"
  }

  const dueDate = new Date(nextMilestone.dueDate)
  if (Number.isNaN(dueDate.getTime())) {
    return "Awaiting update"
  }

  return `Due ${dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
}

function mapDetailToGroup(detail: AdvisorProjectEvaluationDetail, stage: CapstoneStage): CapstoneGroup {
  const currentCriteria = criteriaForStage(stage)
  const stageStatus = toEvaluationStatus(detail.evaluation.status)

  return {
    id: detail.group.id,
    groupName: detail.group.name,
    projectTitle: detail.project.title,
    stage,
    progress: detail.milestoneProgress.progressPercent,
    pending: detail.evaluation.studentsPendingEvaluation,
    evaluated: detail.evaluation.studentsEvaluated,
    dueLabel: buildDueLabel(detail),
    criteria: currentCriteria,
    milestones: [],
    students: detail.students.map((student) => ({
      id: student.userId,
      name: student.fullName,
      studentId: student.email,
      capstone1Status: stage === "Capstone I" ? toEvaluationStatus(student.evaluation.status) : "Evaluated",
      capstone2Status: stage === "Capstone II" ? toEvaluationStatus(student.evaluation.status) : "Pending Review",
      progress: detail.milestoneProgress.progressPercent,
      capstone1Score: stage === "Capstone I" ? (student.evaluation.score ?? undefined) : undefined,
      capstone2Score: stage === "Capstone II" ? (student.evaluation.score ?? undefined) : undefined,
      submittedDate: student.evaluation.savedAt ?? detail.generatedAt,
    })),
  }
}

export function AdvisorCapstoneGroupEvaluatePage({ stage, groupId }: { stage: CapstoneStage; groupId: string }) {
  const queryClient = useQueryClient()
  const authHydrated = useAuthStoreHydrated()
  const dashboardStage = toApiStage(stage)
  const projectsQuery = useAdvisorProjectsWithOptions({ enabled: authHydrated })
  const dashboardQuery = useAdvisorProjectEvaluationDashboardWithOptions(dashboardStage, { enabled: authHydrated })
  const resolvedProjectId = React.useMemo(() => {
    const advisorProjects = projectsQuery.data ?? []
    const matchedAdvisorProject = advisorProjects.find(
      (project) => project.id === groupId || project.group.id === groupId
    )

    if (matchedAdvisorProject) {
      return matchedAdvisorProject.id
    }

    const projectGroups = dashboardQuery.data?.projectGroups ?? []
    const matchedProject = projectGroups.find(
      (group) => group.projectId === groupId || group.group.id === groupId
    )

    return matchedProject?.projectId ?? ""
  }, [dashboardQuery.data?.projectGroups, groupId, projectsQuery.data])
  const detailQuery = useAdvisorProjectEvaluationDetail(resolvedProjectId, dashboardStage, {
    enabled: authHydrated && Boolean(resolvedProjectId),
  })
  const [group, setGroup] = React.useState<CapstoneGroup | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeStudentId, setActiveStudentId] = React.useState<string | null>(null)
  const [advisorScore, setAdvisorScore] = React.useState("")
  const [feedback, setFeedback] = React.useState("")
  const saveDraftMutation = useSaveAdvisorProjectEvaluationDraft()
  const submitEvaluationMutation = useSubmitAdvisorProjectEvaluation()

  React.useEffect(() => {
    if (detailQuery.data) {
      setGroup(mapDetailToGroup(detailQuery.data, stage))
    }
  }, [detailQuery.data, stage])

  const criteria = React.useMemo(() => criteriaForStage(stage), [stage])
  const isLoading = !authHydrated || projectsQuery.isLoading || dashboardQuery.isLoading || (Boolean(resolvedProjectId) && detailQuery.isLoading)

  const activeStudent = React.useMemo(
    () => group?.students.find((student) => student.id === activeStudentId) ?? null,
    [activeStudentId, group],
  )

  const openEvaluationSheet = (studentId: string) => {
    if (!group) return
    const student = group.students.find((item) => item.id === studentId)
    if (!student) return

    if (stage === "Capstone II" && student.capstone1Status !== "Evaluated") {
      toast.error("Capstone II is locked", {
        description: "Finish the Capstone I evaluation for this student first.",
      })
      return
    }

    setAdvisorScore("")
    setFeedback("")
    setActiveStudentId(studentId)
    setSheetOpen(true)
  }

  const handleSaveEvaluation = async () => {
    if (!activeStudent || !group) return

    const normalizedScore = Number(advisorScore)
    if (Number.isNaN(normalizedScore) || normalizedScore < 0 || normalizedScore > ADVISOR_MAX_SCORE) {
      toast.error("Invalid advisor score", {
        description: `Enter a value between 0 and ${ADVISOR_MAX_SCORE}.`,
      })
      return
    }

    const finalScore = Math.round(normalizedScore * 10) / 10

    try {
      const result = await saveDraftMutation.mutateAsync({
        projectId: resolvedProjectId,
        stage: dashboardStage,
        input: {
          students: [
            {
              studentUserId: activeStudent.id,
              score: finalScore,
              comment: feedback.trim(),
            },
          ],
        },
      })

      setGroup((previous) => {
        if (!previous) return previous

        const savedStudent = result.savedStudents.find(
          (student) => student.studentUserId === activeStudent.id
        )

        return {
          ...previous,
          pending: result.evaluation.studentsPendingEvaluation,
          evaluated: result.evaluation.studentsEvaluated,
          students: previous.students.map((student) => {
            if (student.id !== activeStudent.id) {
              return student
            }

            if (stage === "Capstone I") {
              return {
                ...student,
                capstone1Status: toEvaluationStatus(savedStudent?.status),
                capstone1Score: finalScore,
              }
            }

            return {
              ...student,
              capstone2Status: toEvaluationStatus(savedStudent?.status),
              capstone2Score: finalScore,
            }
          }),
        }
      })

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: advisorProjectEvaluationDetailKeys.detail(resolvedProjectId, dashboardStage),
        }),
        queryClient.invalidateQueries({
          queryKey: advisorProjectEvaluationDashboardKeys.root,
        }),
      ])

      setSheetOpen(false)
      setAdvisorScore("")
      setFeedback("")
      setActiveStudentId(null)
      toast.success(`${stage} evaluation recorded`, {
        description: `${activeStudent.name} scored ${finalScore}/100.`,
      })
    } catch (error) {
      toast.error(`Failed to save ${stage} evaluation`, {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const pendingStudents = group?.pending ?? 0
  const evaluatedStudents = group?.evaluated ?? 0
  const lockedStudents = stage === "Capstone II" ? (group?.students.filter((student) => student.capstone1Status !== "Evaluated").length ?? 0) : 0
  const evaluationSummary = detailQuery.data?.evaluation ?? null
  const isSubmitted = Boolean(evaluationSummary?.submittedAt) || evaluationSummary?.status === "SUBMITTED"
  const canSubmitEvaluation =
    Boolean(resolvedProjectId) &&
    !isSubmitted &&
    (evaluationSummary?.studentsPendingEvaluation ?? pendingStudents) === 0 &&
    (evaluationSummary?.studentsEvaluated ?? evaluatedStudents) > 0

  const handleSubmitEvaluation = async () => {
    if (!resolvedProjectId) return

    try {
      const result = await submitEvaluationMutation.mutateAsync({
        projectId: resolvedProjectId,
        stage: dashboardStage,
      })

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: advisorProjectEvaluationDetailKeys.detail(resolvedProjectId, dashboardStage),
        }),
        queryClient.invalidateQueries({
          queryKey: advisorProjectEvaluationDashboardKeys.root,
        }),
      ])

      toast.success(`${stage} evaluation submitted`, {
        description: `Submitted ${result.evaluation.studentsEvaluated}/${result.evaluation.totalStudents} students for coordinator aggregation.`,
      })
    } catch (error) {
      toast.error(`Failed to submit ${stage} evaluation`, {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardPageHeader
          title={`${stage} Evaluation`}
          description="Review the group, take insight from the rubric, and record student-level evaluation scores."
          badge={isLoading ? "Loading..." : group?.groupName ?? "—"}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={routeForStage(stage)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      {projectsQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{projectsQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {dashboardQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{dashboardQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {detailQuery.error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{detailQuery.error.message}</p>
          </CardContent>
        </Card>
      ) : authHydrated && !projectsQuery.isLoading && !dashboardQuery.isLoading && !projectsQuery.error && !dashboardQuery.error && !resolvedProjectId ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">The selected evaluation project could not be found for this stage.</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{stage}</Badge>
            <Badge variant="secondary">{group?.students.length ?? 0} students</Badge>
            {lockedStudents > 0 ? <Badge variant="outline" className="border-amber-200 bg-amber-500/10 text-amber-700">{lockedStudents} locked</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Group Name</p>
                  <p className="font-medium">{group?.groupName ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderKanban className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{group?.projectTitle ?? "—"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Label</p>
                  <p className="font-medium">{group?.dueLabel ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PlayCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Evaluation Mode</p>
                  <p className="font-medium">{stage} stage review</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pending Students</p>
                <p className="text-2xl font-semibold text-amber-600">{pendingStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Evaluated Students</p>
                <p className="text-2xl font-semibold text-emerald-600">{evaluatedStudents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Group Progress</p>
                <p className="text-2xl font-semibold text-primary">{group?.progress ?? 0}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Advisor submission</p>
                <p className="text-sm text-muted-foreground">
                  {isSubmitted
                    ? `Submitted for coordinator aggregation${evaluationSummary?.submittedAt ? ` on ${new Date(evaluationSummary.submittedAt).toLocaleString()}` : "."}`
                    : canSubmitEvaluation
                      ? "All students are scored. Submit this evaluation so coordinator preview can generate final grades."
                      : "Score every student first, then submit the evaluation for coordinator aggregation."}
                </p>
              </div>

              <Button className="gap-1.5 self-start sm:self-auto" onClick={handleSubmitEvaluation} disabled={!canSubmitEvaluation || submitEvaluationMutation.isPending}>
                <Send className="h-4 w-4" /> {submitEvaluationMutation.isPending ? "Submitting..." : isSubmitted ? "Submitted" : "Submit evaluation"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Criteria</CardTitle>
          <CardDescription>{stage} rubric items for this group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {criteria.map((criterion) => (
            <div key={criterion.title} className="rounded-lg border p-4">
              <div>
                <p className="font-medium">{criterion.title}</p>
                <p className="text-sm text-muted-foreground">{criterion.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Students</CardTitle>
          <CardDescription>Evaluate each member separately and keep Capstone II locked until Capstone I is done.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Group Progress</TableHead>
                <TableHead>Capstone I</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(group?.students ?? []).map((student) => {
                const canEvaluateCapstoneII = student.capstone1Status === "Evaluated"
                const actionStage: "capstone1" | "capstone2" = stage === "Capstone I" ? "capstone1" : "capstone2"
                const isLocked = actionStage === "capstone2" && !canEvaluateCapstoneII
                const actionStatus = actionStage === "capstone1" ? student.capstone1Status : student.capstone2Status

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-40 space-y-1">
                        <div className="text-xs text-muted-foreground">{student.progress}%</div>
                        <Progress value={student.progress} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.capstone1Status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        variant={actionStatus === "Pending Review" && !isLocked ? "default" : "outline"}
                        disabled={actionStatus !== "Pending Review" || isLocked || isSubmitted}
                        onClick={() => openEvaluationSheet(student.id)}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {isSubmitted ? "Submitted" : isLocked ? "Locked" : actionStatus === "Pending Review" ? student.name : "Evaluated"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <SheetTitle className="text-base">Evaluate {stage}</SheetTitle>
            <SheetDescription>
              {activeStudent ? `${activeStudent.name} • ${activeStudent.studentId}` : "Select a student to evaluate."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 p-6">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
              <p className="mt-1 font-medium">{group?.projectTitle ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{group?.groupName ?? "—"}</p>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Rubric Guidance</p>
                <p className="text-sm text-muted-foreground">Review these criteria while assigning one final advisor mark.</p>
              </div>
              <div className="space-y-2">
                {criteria.map((criterion) => (
                  <div key={criterion.title} className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-sm font-medium">{criterion.title}</p>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border p-4">
              <Label htmlFor="advisor-score">Advisor Score</Label>
              <Input
                id="advisor-score"
                type="number"
                min={0}
                max={ADVISOR_MAX_SCORE}
                step={0.5}
                placeholder="Enter score out of 100"
                value={advisorScore}
                onChange={(event) => setAdvisorScore(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">Enter one final mark from 0 to {ADVISOR_MAX_SCORE}. The rubric above is read-only guidance.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Advisor Feedback</Label>
              <Textarea
                placeholder="Add short evaluation remarks..."
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button className="w-full" onClick={handleSaveEvaluation} disabled={saveDraftMutation.isPending || !activeStudent || isSubmitted}>
              {saveDraftMutation.isPending ? "Saving..." : `Save ${stage} Evaluation`}
            </Button>

            {isSubmitted ? (
              <p className="text-sm text-muted-foreground">
                This advisor evaluation has already been submitted and is now read-only.
              </p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
