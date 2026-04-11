"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Clock, FolderKanban, PlayCircle, ShieldAlert, Users } from "lucide-react"

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
import { CAPSTONE_GROUPS, type CapstoneGroup, type CapstoneStage, type EvaluationStatus } from "./capstone-evaluation-data"

const STATUS_CLASSES: Record<EvaluationStatus, string> = {
  "Pending Review": "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800",
  Evaluated: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
  "Needs Revision": "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
}

const ADVISOR_MAX_SCORE = 20

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

export function AdvisorCapstoneGroupEvaluatePage({ stage, groupId }: { stage: CapstoneStage; groupId: string }) {
  const [group, setGroup] = React.useState<CapstoneGroup>(() => {
    return CAPSTONE_GROUPS.find((item) => item.id === groupId && item.stage === stage) ?? CAPSTONE_GROUPS.find((item) => item.stage === stage) ?? CAPSTONE_GROUPS[0]
  })
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeStudentId, setActiveStudentId] = React.useState<string | null>(null)
  const [criteriaDraft, setCriteriaDraft] = React.useState<Record<string, string>>({})
  const [feedback, setFeedback] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const activeStudent = React.useMemo(
    () => group.students.find((student) => student.id === activeStudentId) ?? null,
    [activeStudentId, group.students],
  )

  const maxCriteriaScore = React.useMemo(
    () => group.criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0),
    [group.criteria],
  )

  const criterionCap = React.useCallback((criterionMax: number) => {
    if (maxCriteriaScore <= 0) return 0
    return Math.round(((criterionMax / maxCriteriaScore) * ADVISOR_MAX_SCORE) * 10) / 10
  }, [maxCriteriaScore])

  const draftTotal = React.useMemo(
    () => group.criteria.reduce((sum, criterion) => sum + (Number(criteriaDraft[criterion.title] ?? "0") || 0), 0),
    [criteriaDraft, group.criteria],
  )

  const openEvaluationSheet = (studentId: string) => {
    const student = group.students.find((item) => item.id === studentId)
    if (!student) return

    if (stage === "Capstone II" && student.capstone1Status !== "Evaluated") {
      toast.error("Capstone II is locked", {
        description: "Finish the Capstone I evaluation for this student first.",
      })
      return
    }

    const defaultScores = Object.fromEntries(group.criteria.map((criterion) => [criterion.title, String(criterionCap(criterion.maxScore))]))
    setCriteriaDraft(defaultScores)
    setFeedback("")
    setActiveStudentId(studentId)
    setSheetOpen(true)
  }

  const handleSaveEvaluation = async () => {
    if (!activeStudent) return

    for (const criterion of group.criteria) {
      const value = Number(criteriaDraft[criterion.title] ?? "")
      const maxAllowed = criterionCap(criterion.maxScore)
      if (Number.isNaN(value) || value < 0 || value > maxAllowed) {
        toast.error(`Invalid score for ${criterion.title}`, {
          description: `Enter a value between 0 and ${maxAllowed}.`,
        })
        return
      }
    }

    if (draftTotal > ADVISOR_MAX_SCORE) {
      toast.error("Total score cannot exceed 20", {
        description: "Please reduce criterion scores so the sum is at most 20.",
      })
      return
    }

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 450))

    const stageScoreOutOf20 = Math.round(Math.min(draftTotal, ADVISOR_MAX_SCORE) * 10) / 10

    setGroup((previous) => ({
      ...previous,
      students: previous.students.map((student) => {
        if (student.id !== activeStudent.id) return student

        if (stage === "Capstone I") {
          return {
            ...student,
            capstone1Status: "Evaluated",
            capstone1Score: stageScoreOutOf20,
            progress: Math.max(student.progress, 85),
          }
        }

        return {
          ...student,
          capstone2Status: "Evaluated",
          capstone2Score: stageScoreOutOf20,
          progress: Math.max(student.progress, 90),
        }
      }),
    }))

    setSaving(false)
    setSheetOpen(false)
    toast.success(`${stage} evaluation recorded`, {
      description: `${activeStudent.name} scored ${stageScoreOutOf20}/20.`,
    })
  }

  const pendingStudents = group.students.filter((student) => student.capstone1Status === "Pending Review" || student.capstone2Status === "Pending Review").length
  const evaluatedStudents = group.students.filter((student) => student.capstone1Status === "Evaluated" && student.capstone2Status === "Evaluated").length
  const lockedStudents = stage === "Capstone II" ? group.students.filter((student) => student.capstone1Status !== "Evaluated").length : 0

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardPageHeader
          title={`${stage} Open Capstone`}
          description="Open the group for evaluation and record student-level Capstone scores."
          badge={group.groupName}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={routeForStage(stage)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{stage}</Badge>
            <Badge variant="secondary">{group.students.length} students</Badge>
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
                  <p className="font-medium">{group.groupName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderKanban className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{group.projectTitle}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Label</p>
                  <p className="font-medium">{group.dueLabel}</p>
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
                <p className="text-2xl font-semibold text-primary">{group.progress}%</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Criteria</CardTitle>
          <CardDescription>{stage} rubric items for this group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {group.criteria.map((criterion) => (
            <div key={criterion.title} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{criterion.title}</p>
                  <p className="text-sm text-muted-foreground">{criterion.description}</p>
                </div>
                <Badge variant="outline">{criterion.maxScore} pts</Badge>
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
                <TableHead>Progress</TableHead>
                <TableHead>Capstone I</TableHead>
                <TableHead>Capstone II</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students.map((student) => {
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
                    <TableCell>
                      <StatusBadge status={student.capstone2Status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        variant={actionStatus === "Pending Review" && !isLocked ? "default" : "outline"}
                        disabled={actionStatus !== "Pending Review" || isLocked}
                        onClick={() => openEvaluationSheet(student.id)}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {isLocked ? "Locked" : actionStatus === "Pending Review" ? `Evaluate ${stage}` : "Evaluated"}
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
              <p className="mt-1 font-medium">{group.projectTitle}</p>
              <p className="text-sm text-muted-foreground">{group.groupName}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Criteria Scores</p>
              {group.criteria.map((criterion) => (
                <div key={criterion.title} className="space-y-1.5 rounded-lg border p-3">
                  {(() => {
                    const maxAllowed = criterionCap(criterion.maxScore)
                    return (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{criterion.title}</p>
                    <Badge variant="outline">Max {maxAllowed}</Badge>
                  </div>
                    )
                  })()}
                  <p className="text-xs text-muted-foreground">{criterion.description}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="text-xs text-muted-foreground">Score</Label>
                    <Input
                      type="number"
                      min={0}
                      max={criterionCap(criterion.maxScore)}
                      step={0.5}
                      value={criteriaDraft[criterion.title] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value
                        setCriteriaDraft((previous) => ({ ...previous, [criterion.title]: value }))
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Score Summary</p>
              <p className="mt-1 text-sm">Advisor Score: <span className="font-semibold">{draftTotal.toFixed(1)}/{ADVISOR_MAX_SCORE}</span></p>
              <p className="text-sm text-muted-foreground">Total from all criteria must be at most {ADVISOR_MAX_SCORE}.</p>
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

            <Button className="w-full" onClick={handleSaveEvaluation} disabled={saving || !activeStudent}>
              {saving ? "Saving..." : `Save ${stage} Evaluation`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
