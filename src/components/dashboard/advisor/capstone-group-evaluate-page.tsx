"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  FolderKanban, 
  PlayCircle, 
  ShieldAlert, 
  Users,
  Target,
  FileText,
  BarChart3,
  Info,
  GraduationCap,
  ClipboardCheck,
  Award
} from "lucide-react"

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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
    const found = CAPSTONE_GROUPS.find((item) => item.id === groupId)
    if (found) {
      // Ensure the group object has the correct stage for calculation logic
      return { ...found, stage: stage }
    }
    return CAPSTONE_GROUPS.find((item) => item.stage === stage) ?? CAPSTONE_GROUPS[0]
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

  const pendingStudents = group.students.filter((student) => {
    const status = stage === "Capstone I" ? student.capstone1Status : student.capstone2Status
    return status === "Pending Review" || status === "Needs Revision"
  }).length
  const evaluatedStudents = group.students.filter((student) => {
    const status = stage === "Capstone I" ? student.capstone1Status : student.capstone2Status
    return status === "Evaluated"
  }).length
  const lockedStudents = stage === "Capstone II" ? group.students.filter((student) => student.capstone1Status !== "Evaluated").length : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={routeForStage(stage)}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Evaluate Group
              </h1>
              <Badge className="bg-primary/10 text-primary border-primary/20">{stage}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Record student-level scores for {group.groupName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary font-medium">
            <Target className="mr-1.5 h-3.5 w-3.5" />
            Max Score: {ADVISOR_MAX_SCORE} pts
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-card">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/30" />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Project Information
              </CardTitle>
              <Badge variant="secondary" className="rounded-full">{group.students.length} Members</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Group Name</p>
                  <p className="font-semibold text-lg">{group.groupName}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Project Title</p>
                  <p className="font-medium text-sm leading-relaxed">{group.projectTitle}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Deadline</p>
                    <p className="font-semibold">{group.dueLabel}</p>
                  </div>
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Current Stage</p>
                    <p className="font-semibold">{stage}</p>
                  </div>
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Group Progress</span>
                <span className="text-sm font-bold text-primary">{group.progress}%</span>
              </div>
              <Progress value={group.progress} className="h-2 rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evaluation Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="text-xl font-bold text-amber-600">{pendingStudents}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">Evaluated</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">{evaluatedStudents}</span>
            </div>
            {lockedStudents > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-medium">Locked</span>
                </div>
                <span className="text-xl font-bold text-rose-600">{lockedStudents}</span>
              </div>
            )}
            <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Info className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Advisor Note</span>
              </div>
              <p className="text-xs text-primary/80 leading-relaxed">
                Each student is evaluated individually based on the rubric below. Total score is capped at {ADVISOR_MAX_SCORE} points.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Evaluation Rubric
          </CardTitle>
          <CardDescription>Criteria used for grading this capstone phase</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0">
            {group.criteria.map((criterion) => (
              <div key={criterion.title} className="p-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter bg-primary/5 border-primary/20 text-primary">
                    {criterion.maxScore} pts
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{criterion.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="font-bold text-sm mb-1">{criterion.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{criterion.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden bg-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student List
          </CardTitle>
          <CardDescription>Select a student to begin their individual evaluation</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Student</TableHead>
                <TableHead>Individual Progress</TableHead>
                <TableHead>Capstone I</TableHead>
                <TableHead>Capstone II</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.students.map((student) => {
  const actionStage: "capstone1" | "capstone2" = stage === "Capstone I" ? "capstone1" : "capstone2"
  const actionStatus = actionStage === "capstone1" ? student.capstone1Status : student.capstone2Status
  const isLocked = actionStage === "capstone2" && student.capstone1Status !== "Evaluated"

                return (
                  <TableRow key={student.id} className="hover:bg-muted/10 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm">{student.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{student.studentId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-40 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary">{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-1.5 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.capstone1Status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.capstone2Status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        className="rounded-full px-4 font-semibold shadow-sm group-hover:shadow-md transition-all"
                        variant={actionStatus === "Pending Review" && !isLocked ? "default" : "outline"}
                        disabled={actionStatus !== "Pending Review" || isLocked}
                        onClick={() => openEvaluationSheet(student.id)}
                      >
                        {isLocked ? (
                          <span className="flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Locked</span>
                        ) : actionStatus === "Pending Review" ? (
                          <span className="flex items-center gap-1.5"><PlayCircle className="h-3.5 w-3.5" /> Evaluate</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Evaluated</span>
                        )}
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
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl border-none shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/30" />
          <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-8 py-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold">Student Evaluation</SheetTitle>
                <SheetDescription className="text-base font-medium">
                  {activeStudent ? `${activeStudent.name} • ${activeStudent.studentId}` : "Select a student to evaluate."}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-8 p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Project</p>
                <p className="font-bold text-sm truncate">{group.projectTitle}</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-muted/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Phase</p>
                <p className="font-bold text-sm">{stage}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rubric Scoring</p>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Individual Assessment</Badge>
              </div>
              
              <div className="space-y-3">
                {group.criteria.map((criterion) => {
                  const maxAllowed = criterionCap(criterion.maxScore)
                  return (
                    <div key={criterion.title} className="group/item space-y-3 rounded-2xl border p-5 hover:border-primary/30 hover:bg-primary/5 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-bold group-hover/item:text-primary transition-colors">{criterion.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{criterion.description}</p>
                        </div>
                        <Badge variant="secondary" className="bg-white shadow-sm shrink-0">Max {maxAllowed}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            min={0}
                            max={maxAllowed}
                            step={0.5}
                            value={criteriaDraft[criterion.title] ?? ""}
                            onChange={(event) => {
                              const value = event.target.value
                              setCriteriaDraft((previous) => ({ ...previous, [criterion.title]: value }))
                            }}
                            className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 text-center font-bold text-lg"
                          />
                        </div>
                        <div className="w-2/3">
                          <Progress value={(Number(criteriaDraft[criterion.title]) / maxAllowed) * 100} className="h-1.5 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold">Final Assessment Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{draftTotal.toFixed(1)}</span>
                      <span className="text-lg opacity-80">/ {ADVISOR_MAX_SCORE}</span>
                    </div>
                  </div>
                  <Award className="h-12 w-12 opacity-20" />
                </div>
                <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500" 
                    style={{ width: `${(draftTotal / ADVISOR_MAX_SCORE) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Advisor Remarks</Label>
              <Textarea
                placeholder="Provide constructive feedback for the student's contribution..."
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="min-h-[120px] rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 p-4 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSheetOpen(false)} className="flex-1 rounded-full h-12 font-bold">
                Cancel
              </Button>
              <Button 
                className="flex-[2] rounded-full h-12 font-bold shadow-lg shadow-primary/20" 
                onClick={handleSaveEvaluation} 
                disabled={saving || !activeStudent}
              >
                {saving ? "Recording..." : `Submit ${stage} Evaluation`}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
