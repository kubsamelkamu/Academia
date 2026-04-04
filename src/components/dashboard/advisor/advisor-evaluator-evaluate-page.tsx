"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, FileText, FolderKanban, Gauge, Scale, Send, Tags } from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { mockProjects } from "@/data/mockData"

import {
  EVALUATION_CRITERIA,
  EVALUATE_REASON_CODES,
  RUBRIC_TOTAL_MAX_PERCENT,
} from "./advisor-evaluator-evaluate-shared"

function emptyScores(): Record<string, number> {
  return Object.fromEntries(EVALUATION_CRITERIA.map((c) => [c.id, 0])) as Record<string, number>
}

export function AdvisorEvaluatorEvaluatePage({ projectId }: { projectId: string }) {
  const project = mockProjects.find((p) => p.id === projectId) ?? null
  const [scores, setScores] = React.useState<Record<string, number>>(emptyScores)
  const [reasonCode, setReasonCode] = React.useState<string>("")
  const [comments, setComments] = React.useState("")

  const totalScore = React.useMemo(
    () => EVALUATION_CRITERIA.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0),
    [scores],
  )

  const setCriterion = React.useCallback((id: string, value: number) => {
    setScores((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleSubmit = React.useCallback(() => {
    toast.success("Evaluation submitted", {
      description: `Rubric total ${totalScore}/${RUBRIC_TOTAL_MAX_PERCENT}% recorded for ${project?.title ?? "project"}.`,
    })
  }, [totalScore, project?.title])

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

  const totalPct = RUBRIC_TOTAL_MAX_PERCENT > 0 ? (totalScore / RUBRIC_TOTAL_MAX_PERCENT) * 100 : 0

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
        title="Submit evaluation"
        description={`${project.title} · ${project.groupName ?? "Group"} — score each criterion (lines sum to ${RUBRIC_TOTAL_MAX_PERCENT}%).`}
      />

      <div className="flex min-w-0 flex-col gap-8 xl:grid xl:grid-cols-12 xl:items-start xl:gap-8 2xl:gap-10">
        <div className="min-w-0 space-y-6 xl:order-2 xl:col-span-8 2xl:col-span-8">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-lg">Rubric scores</CardTitle>
              <CardDescription>
                Each tile is one criterion. Adjust sliders, then review the total before submitting.
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
                        /{RUBRIC_TOTAL_MAX_PERCENT}%
                      </span>
                    </p>
                  </div>
                  <p className="max-w-sm text-right text-xs text-muted-foreground">
                    Full marks on every line equals {RUBRIC_TOTAL_MAX_PERCENT}%.
                  </p>
                </div>
                <Progress value={totalPct} className="mt-4 h-3" />
              </div>

              <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                {EVALUATION_CRITERIA.map((c) => {
                  const v = scores[c.id] ?? 0
                  const pct = c.maxPercent > 0 ? (v / c.maxPercent) * 100 : 0
                  return (
                    <div
                      key={c.id}
                      className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Label htmlFor={`criterion-${c.id}`} className="text-sm font-semibold leading-snug">
                            {c.label}
                          </Label>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
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
                    </div>
                  )
                })}
              </div>
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
                <Select value={reasonCode} onValueChange={setReasonCode}>
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
                  onChange={(e) => setComments(e.target.value)}
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

        <aside
          aria-label="Scoring form guidance"
          className="flex min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 bg-muted/15 shadow-sm ring-1 ring-border/40 xl:order-1 xl:col-span-4 xl:sticky xl:top-20 2xl:col-span-4"
        >
          <div className="space-y-4 border-b border-border/60 bg-background/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scoring context</p>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project</p>
              <p className="mt-1 font-semibold leading-snug text-foreground">{project.title}</p>
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
            <Button variant="outline" size="sm" className="w-full rounded-lg" asChild>
              <Link href={`/dashboard/advisor/evaluator/projects/${projectId}`}>
                <FolderKanban className="mr-2 h-4 w-4" aria-hidden />
                Open project detail
              </Link>
            </Button>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-primary">
              <Gauge className="h-4 w-4" aria-hidden />
              <span className="text-sm font-semibold text-foreground">Running total</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-primary">
              {totalScore}
              <span className="text-lg font-semibold text-muted-foreground">/{RUBRIC_TOTAL_MAX_PERCENT}%</span>
            </p>
            <Progress value={totalPct} className="h-2" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Zeros are valid when a row does not apply—say why in comments instead of shifting points to other lines.
            </p>
          </div>
          <div className="space-y-3 border-t border-border/60 p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Tags className="h-4 w-4 text-primary" aria-hidden />
              Reason &amp; comments
            </div>
            <p>Reason code = dominant story of the review, not only the weakest criterion.</p>
            <p>Comments = audit trail: cite demos or files, separate must-fix from polish.</p>
          </div>
          <div className="space-y-3 border-t border-border/60 p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Scale className="h-4 w-4 text-primary" aria-hidden />
              Calibration
            </div>
            <p>Watch for every line landing on the same numbers—adjust where evidence truly differs.</p>
            <p className="text-xs">Demo: submit only toasts; add autosave in production.</p>
          </div>
          <div className="flex flex-col gap-2 border-t border-dashed border-border/60 bg-muted/25 p-5">
            <Button variant="secondary" size="sm" className="w-full justify-center rounded-lg" asChild>
              <Link href="/dashboard/advisor/evaluator/rubric">
                <BookOpen className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Rubric
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-center rounded-lg" asChild>
              <Link href="/dashboard/advisor/evaluator/documents">
                <FileText className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Documents
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
