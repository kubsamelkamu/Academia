"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, ClipboardCheck, FileText, Layers, ListOrdered, Scale } from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import { EVALUATION_CRITERIA, RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

const TOP_WEIGHTS = [...EVALUATION_CRITERIA].sort((a, b) => b.maxPercent - a.maxPercent).slice(0, 5)

export function AdvisorEvaluatorRubricPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href="/dashboard/advisor/evaluator">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Evaluator overview
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/advisor/evaluator/pending">Pending queue</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/advisor/evaluator/documents">
              <FileText className="mr-2 h-4 w-4" aria-hidden />
              Documents
            </Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title="Evaluation rubric"
        description={`Weighted criteria for the advisor evaluator workspace. Each line shows its share of the ${RUBRIC_TOTAL_MAX_PERCENT}% rubric total.`}
      />

      <div className="flex min-w-0 flex-col gap-8">
        <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-lg">Criteria (line weights)</CardTitle>
                    <CardDescription>
                      On the evaluation form you score each row from 0 up to its maximum; those points add up to at most{" "}
                      {RUBRIC_TOTAL_MAX_PERCENT}%.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
                {EVALUATION_CRITERIA.map((c) => (
                  <div key={c.id} className="space-y-2 rounded-xl border border-border/70 bg-card/40 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{c.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
                      </div>
                      <span className="shrink-0 tabular-nums text-sm font-semibold text-primary">
                        max {c.maxPercent}%
                      </span>
                    </div>
                    <Progress
                      value={RUBRIC_TOTAL_MAX_PERCENT > 0 ? (c.maxPercent / RUBRIC_TOTAL_MAX_PERCENT) * 100 : 0}
                      className="h-2.5 bg-muted/80"
                    />
                  </div>
                ))}
              </div>

              <Separator className="my-8" />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
                <span className="text-sm font-medium text-muted-foreground">Rubric total</span>
                <span className="text-2xl font-bold tabular-nums text-foreground">{RUBRIC_TOTAL_MAX_PERCENT}%</span>
              </div>
            </CardContent>
          </Card>

        <section
          aria-label="Rubric reference notes"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch"
        >
          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Layers className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Program vs session</p>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              This grid is the canonical {RUBRIC_TOTAL_MAX_PERCENT}% rubric. Session detail pages may show other
              percentages for conversation only—map notes back here before you submit scores.
            </p>
          </div>
          <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Scale className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Fairness</p>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              Use consistent “meets bar” anchors across teams. If unsure, cite evidence in comments instead of nudging
              scores without a paper trail.
            </p>
          </div>
          <div className="flex flex-col rounded-2xl border border-border/70 bg-muted/20 p-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-primary">
              <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Heaviest lines</p>
            </div>
            <ol className="mt-3 space-y-2 text-sm">
              {TOP_WEIGHTS.map((c, i) => (
                <li key={c.id} className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background text-xs font-bold shadow-sm">
                    {i + 1}
                  </span>
                  <span className="min-w-0 leading-snug text-muted-foreground">
                    <span className="font-medium text-foreground">{c.label}</span> · up to {c.maxPercent}%
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/[0.05] to-background p-5 sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-sm font-semibold text-foreground">Use this rubric</p>
              <p className="mt-1 text-xs text-muted-foreground">Open a team, then enter scores on the form.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="btn-gradient w-full gap-2 rounded-xl" size="sm" asChild>
                <Link href="/dashboard/advisor/evaluator/pending">
                  <ClipboardCheck className="h-4 w-4" aria-hidden />
                  Pending
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl" size="sm" asChild>
                <Link href="/dashboard/advisor/evaluator/projects">
                  <FileText className="h-4 w-4 shrink-0" aria-hidden />
                  Projects
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
