"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, BookOpen, ClipboardCheck, Layers, ListOrdered, Scale } from "lucide-react"

import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type AdvisorEvaluationDashboardStage } from "@/lib/api/advisor"

import {
  CAPSTONE_I_RUBRICS,
  CAPSTONE_II_RUBRICS,
  EVALUATION_CRITERIA,
  RUBRIC_TOTAL_MAX_PERCENT,
  type RubricDefinition,
} from "./advisor-evaluator-shared"

const TOP_WEIGHTS = [...EVALUATION_CRITERIA].sort((a, b) => b.maxPercent - a.maxPercent).slice(0, 5)

function normalizeDashboardStage(rawStage: string | null): AdvisorEvaluationDashboardStage {
  const normalized = rawStage?.trim().toUpperCase().replace(/-/g, "_")
  return normalized === "CAPSTONE_II" ? "CAPSTONE_II" : "CAPSTONE_I"
}

function formatDashboardStageLabel(stage: AdvisorEvaluationDashboardStage) {
  return stage === "CAPSTONE_II" ? "Capstone II" : "Capstone I"
}

export function AdvisorEvaluatorRubricPage() {
  const searchParams = useSearchParams()
  const activeStage = React.useMemo(
    () => normalizeDashboardStage(searchParams.get("stage")),
    [searchParams],
  )
  const stageLabel = formatDashboardStageLabel(activeStage)
  const capstoneIRubrics = React.useMemo(() => (activeStage === "CAPSTONE_I" ? CAPSTONE_I_RUBRICS : null), [activeStage])
  const capstoneIIRubrics = React.useMemo(() => (activeStage === "CAPSTONE_II" ? CAPSTONE_II_RUBRICS : null), [activeStage])
  const structuredRubrics = capstoneIRubrics ?? capstoneIIRubrics
  const defaultStructuredTab =
    capstoneIRubrics?.[0]?.id ?? capstoneIIRubrics?.[0]?.id ?? "proposal"

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-10 animate-in fade-in duration-300 sm:gap-8 lg:gap-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" asChild>
          <Link href={`/dashboard/advisor/evaluator?stage=${activeStage}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Evaluator overview
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/advisor/evaluator/pending?stage=${activeStage}`}>Pending queue</Link>
          </Button>
        </div>
      </div>

      <PageHeader
        title={`${stageLabel} evaluation rubric`}
        description={
          structuredRubrics
            ? `Weighted criteria for ${stageLabel}. Expand each row for checkpoints; category weights are validated against a 100% cap per sheet.`
            : `Weighted criteria for the ${stageLabel} advisor evaluator workspace. Each line shows its share of the ${RUBRIC_TOTAL_MAX_PERCENT}% rubric total.`
        }
      />

      <div className="flex min-w-0 flex-col gap-8">
        {structuredRubrics ? (
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
                      Expand each criterion to see the sub-points. Totals are validated to never exceed 100%.
                      {activeStage === "CAPSTONE_II" ? (
                        <>
                          {" "}
                          Implementation uses twelve weighted rows (A–L) that sum to 100%; penalty sheet is reference-only.
                        </>
                      ) : null}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue={defaultStructuredTab}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className="w-full flex-wrap sm:w-auto">
                    {structuredRubrics.map((rubric) => (
                      <TabsTrigger key={rubric.id} value={rubric.id} className="min-w-[6rem] flex-1 sm:flex-none">
                        {rubricTabLabel(rubric.id, activeStage)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <p className="text-xs text-muted-foreground">
                    Tip: Use the dropdown rows below as a checklist while you score.
                  </p>
                </div>

                {structuredRubrics.map((rubric) => (
                  <TabsContent key={rubric.id} value={rubric.id}>
                    <RubricSection rubric={rubric} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
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
        )}

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
                <Link href={`/dashboard/advisor/evaluator/pending?stage=${activeStage}`}>
                  <ClipboardCheck className="h-4 w-4" aria-hidden />
                  {stageLabel} pending
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function rubricTabLabel(id: string, stage: AdvisorEvaluationDashboardStage) {
  if (stage === "CAPSTONE_I") {
    if (id === "proposal") return "Proposal"
    return id.toUpperCase()
  }
  if (id === "implementation") return "Implementation"
  if (id === "demonstration") return "Demo"
  if (id === "penalties") return "Penalties"
  return id
}

function RubricPenaltyTable({
  columns,
  rows,
}: {
  columns: readonly [string, string]
  rows: readonly { left: string; right: string }[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="px-4 py-3 text-left font-semibold text-foreground">{columns[0]}</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.left}-${row.right}`} className="border-b border-border/40 last:border-0">
              <td className="px-4 py-3 align-top font-medium text-foreground">{row.left}</td>
              <td className="px-4 py-3 align-top text-muted-foreground">{row.right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RubricSection({ rubric }: { rubric: RubricDefinition }) {
  const total = React.useMemo(
    () => rubric.criteria.reduce((sum, c) => sum + c.weightPercent, 0),
    [rubric.criteria],
  )
  const exceedsMax = !rubric.referenceOnly && total > rubric.totalMaxPercent
  const remaining = rubric.totalMaxPercent - total

  if (rubric.referenceOnly && rubric.penaltyTable && rubric.criteria.length === 0) {
    return (
      <div className="mt-5 space-y-5">
        <div>
          <p className="text-base font-semibold text-foreground">{rubric.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reference-only — apply deductions according to your department policy.
          </p>
        </div>
        <RubricPenaltyTable columns={rubric.penaltyTable.columns} rows={rubric.penaltyTable.rows} />
        <Separator />
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">{rubric.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Total weight:{" "}
            <span className={exceedsMax ? "font-semibold text-destructive" : "font-semibold text-foreground"}>
              {total}%
            </span>{" "}
            {exceedsMax ? (
              <span className="ml-1">(exceeds 100%)</span>
            ) : remaining === 0 ? (
              <span className="ml-1">(exactly 100%)</span>
            ) : (
              <span className="ml-1">({remaining}% remaining)</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Max total</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{rubric.totalMaxPercent}%</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rubric.criteria.map((criterion) => (
          <details
            key={`${rubric.id}-${criterion.key}`}
            className="group rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm open:bg-card"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium leading-snug text-foreground">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground/80">
                    {criterion.key}
                  </span>
                  {criterion.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {criterion.points.length} checkpoints
                  {criterion.supplements?.length ? ` · ${criterion.supplements.length} extra lists` : ""}
                  {criterion.referenceTable ? " · scoring guide" : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-sm font-semibold text-primary">{criterion.weightPercent}%</p>
                <p className="mt-1 text-[11px] text-muted-foreground group-open:hidden">Show</p>
                <p className="mt-1 hidden text-[11px] text-muted-foreground group-open:block">Hide</p>
              </div>
            </summary>

            <div className="mt-3 space-y-3">
              <Progress value={rubric.totalMaxPercent > 0 ? (criterion.weightPercent / rubric.totalMaxPercent) * 100 : 0} className="h-2.5 bg-muted/80" />
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-1">
                {criterion.points.map((p, idx) => (
                  <li key={`${criterion.key}-p-${idx}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>

              {criterion.referenceTable ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scoring guide</p>
                  <RubricPenaltyTable columns={criterion.referenceTable.columns} rows={criterion.referenceTable.rows} />
                </div>
              ) : null}

              {criterion.supplements?.map((block) => (
                <div key={block.title} className="rounded-xl border border-border/60 bg-muted/15 px-3 py-3">
                  <p className="text-xs font-semibold text-foreground">{block.title}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {block.items.map((item, i) => (
                      <li key={`${block.title}-${i}`} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/25" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {rubric.penaltyTable && rubric.criteria.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Common penalties (reference)</p>
          <RubricPenaltyTable columns={rubric.penaltyTable.columns} rows={rubric.penaltyTable.rows} />
        </div>
      ) : null}

      <Separator />
    </div>
  )
}
