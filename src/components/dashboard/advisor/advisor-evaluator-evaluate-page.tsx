"use client"

import * as React from "react"
import Link from "next/link"
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
import { mockProjects, mockStudentGroups } from "@/data/mockData"

import {
  EVALUATE_REASON_CODES,
  RUBRIC_TOTAL_MAX_PERCENT,
  getEvaluateCriteriaByStage,
} from "./advisor-evaluator-evaluate-shared"
import type { AdvisorEvaluatorStage } from "./advisor-evaluator-stage-menu"

function stageLabel(stage?: AdvisorEvaluatorStage | null) {
  if (stage === "capstone-i") return "Capstone I"
  if (stage === "capstone-ii") return "Capstone II"
  return "Capstone"
}

export function AdvisorEvaluatorEvaluatePage({
  projectId,
  stage,
}: {
  projectId: string
  stage?: AdvisorEvaluatorStage | null
}) {
  const project = mockProjects.find((p) => p.id === projectId) ?? null
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
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "")
    const projectTitle = normalize(project?.title ?? "")
    const projectGroup = normalize(project?.groupName ?? "")

    const group = mockStudentGroups.find((candidate) => {
      const candidateTitle = normalize(candidate.projectTitle)
      const candidateName = normalize(candidate.name)
      return (
        candidateTitle === projectTitle
        || candidateName === projectTitle
        || (projectGroup.length > 0 && candidateName === projectGroup)
      )
    })

    if (group) {
      return group.members.map((member, index) => ({
        id: member.id,
        name: member.name,
        studentId: `${group.id}-${index + 1}`,
      }))
    }

    return [
      { id: `${projectId}-s1`, name: "Student 1", studentId: `${projectId}-1` },
      { id: `${projectId}-s2`, name: "Student 2", studentId: `${projectId}-2` },
      { id: `${projectId}-s3`, name: "Student 3", studentId: `${projectId}-3` },
    ]
  }, [project?.groupName, project?.title, projectId])

  type StudentEvaluation = {
    scores: Record<string, number>
    reasonCode: string
    comments: string
  }

  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("")
  const [studentEvaluations, setStudentEvaluations] = React.useState<Record<string, StudentEvaluation>>({})
  const [bulkDraft, setBulkDraft] = React.useState<StudentEvaluation>({
    scores: {},
    reasonCode: "",
    comments: "",
  })
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([])
  const [evaluationMode, setEvaluationMode] = React.useState<"individual" | "selected">("individual")

  const [expandedCriteria, setExpandedCriteria] = React.useState<Record<string, boolean>>({})
  const selectedStage = stageLabel(stage)

  React.useEffect(() => {
    if (teamMembers.length === 0) return
    setSelectedStudentId((prev) => (prev ? prev : teamMembers[0].id))
  }, [teamMembers])

  const selectedStudent = React.useMemo(
    () => teamMembers.find((member) => member.id === selectedStudentId) ?? null,
    [teamMembers, selectedStudentId],
  )

  const selectedEvaluation = studentEvaluations[selectedStudentId] ?? {
    scores: {},
    reasonCode: "",
    comments: "",
  }

  const isSelectedMode = evaluationMode === "selected" && selectedMemberIds.length > 0
  const scores = isSelectedMode ? bulkDraft.scores : selectedEvaluation.scores
  const reasonCode = isSelectedMode ? bulkDraft.reasonCode : selectedEvaluation.reasonCode
  const comments = isSelectedMode ? bulkDraft.comments : selectedEvaluation.comments

  const totalScore = React.useMemo(
    () => activeCriteria.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0),
    [activeCriteria, scores],
  )

  const setCriterion = React.useCallback((id: string, value: number) => {
    if (isSelectedMode) {
      setBulkDraft((prev) => ({
        ...prev,
        scores: {
          ...prev.scores,
          [id]: value,
        },
      }))
      return
    }

    setStudentEvaluations((prev) => ({
      ...prev,
      [selectedStudentId]: {
        scores: {
          ...(prev[selectedStudentId]?.scores ?? {}),
          [id]: value,
        },
        reasonCode: prev[selectedStudentId]?.reasonCode ?? "",
        comments: prev[selectedStudentId]?.comments ?? "",
      },
    }))
  }, [selectedStudentId, isSelectedMode])

  const updateReasonCode = React.useCallback((value: string) => {
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
        scores: prev[selectedStudentId]?.scores ?? {},
        reasonCode: value,
        comments: prev[selectedStudentId]?.comments ?? "",
      },
    }))
  }, [selectedStudentId, isSelectedMode])

  const updateComments = React.useCallback((value: string) => {
    if (isSelectedMode) {
      setBulkDraft((prev) => ({
        ...prev,
        comments: value,
      }))
      return
    }

    setStudentEvaluations((prev) => ({
      ...prev,
      [selectedStudentId]: {
        scores: prev[selectedStudentId]?.scores ?? {},
        reasonCode: prev[selectedStudentId]?.reasonCode ?? "",
        comments: value,
      },
    }))
  }, [selectedStudentId, isSelectedMode])

  const toggleCriterionDetails = React.useCallback((id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleSubmit = React.useCallback(() => {
    if (isSelectedMode) {
      setStudentEvaluations((prev) => {
        const next = { ...prev }
        selectedMemberIds.forEach((memberId) => {
          next[memberId] = {
            scores: { ...bulkDraft.scores },
            reasonCode: bulkDraft.reasonCode,
            comments: bulkDraft.comments,
          }
        })
        return next
      })

      toast.success("Evaluation submitted", {
        description: `Rubric total ${totalScore}/${selectedMaxTotal || RUBRIC_TOTAL_MAX_PERCENT}% recorded for ${selectedMemberIds.length} selected member(s).`,
      })
      return
    }

    if (!selectedStudent) {
      toast.error("Select a student first")
      return
    }

    toast.success("Evaluation submitted", {
      description: `Rubric total ${totalScore}/${selectedMaxTotal || RUBRIC_TOTAL_MAX_PERCENT}% recorded for ${selectedStudent.name} (${selectedStudent.studentId}).`,
    })
  }, [totalScore, selectedMaxTotal, selectedStudent, isSelectedMode, selectedMemberIds, bulkDraft])

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
    const seed = studentEvaluations[seedId] ?? { scores: {}, reasonCode: "", comments: "" }
    setBulkDraft({
      scores: { ...seed.scores },
      reasonCode: seed.reasonCode,
      comments: seed.comments,
    })
    setEvaluationMode("selected")
  }, [selectedMemberIds, studentEvaluations])

  const evaluateSingleMember = React.useCallback((memberId: string) => {
    setSelectedStudentId(memberId)
    setEvaluationMode("individual")
  }, [])

  if (!project) {
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
            <CardTitle>Project not found</CardTitle>
            <CardDescription>No project with id {projectId}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard/advisor/evaluator/pending">Back to pending</Link>
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
          <Link href={`/dashboard/advisor/evaluator/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to project
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/rubric">
              <BookOpen className="h-4 w-4" aria-hidden />
              Rubric
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <FileText className="h-4 w-4" aria-hidden />
              Documents
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/advisor/evaluator/pending">Pending queue</Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title={`${selectedStage} evaluation`}
        description={`${project.title} · ${project.groupName ?? "Group"} — score each criterion (lines sum to ${effectiveMaxTotal}%).`}
      />

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
                  <Link href={`/dashboard/advisor/evaluator/projects/${projectId}`}>
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
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => selectAllMembers(false)}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isSelectedMode ? "default" : "secondary"}
                    onClick={evaluateSelectedMembers}
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
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {member.studentId}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={!isSelectedMode && isSelected ? "default" : "outline"}
                          onClick={() => evaluateSingleMember(member.id)}
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
                <Select value={reasonCode} onValueChange={updateReasonCode}>
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
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button type="button" className="btn-gradient gap-2" onClick={handleSubmit}>
                  <Send className="h-4 w-4" aria-hidden />
                  Submit evaluation
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/advisor/evaluator/pending">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
