"use client"

import * as React from "react"
import { ChevronDown, ClipboardList, Layers, Scale } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import {
  ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT,
  ADVISOR_SRS_SDD_SECTIONS,
  assertAdvisorSrsSddRubricTotals,
  sumCriterionWeights,
  type AdvisorRubricCriterion,
  type AdvisorRubricSection,
} from "./advisor-capstone-srs-sdd-rubric-data"
import type { CapstoneStage } from "./capstone-evaluation-data"

function criterionLabel(section: AdvisorRubricSection, c: AdvisorRubricCriterion) {
  return `${section.letter}.${c.number}`
}

function RubricCriterionDetails({
  section,
  criterion,
  compact,
}: {
  section: AdvisorRubricSection
  criterion: AdvisorRubricCriterion
  compact: boolean
}) {
  const blockMax = sumCriterionWeights(criterion)
  const heading = `${criterionLabel(section, criterion)} ${criterion.title}`

  return (
    <details
      className={cn(
        "group rounded-xl border border-border/70 bg-card/40 shadow-sm transition-[box-shadow,background-color]",
        "open:border-primary/25 open:bg-primary/[0.03] open:shadow-md",
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden",
          compact ? "px-3 py-2.5" : "px-4 py-3.5",
        )}
      >
        <div className="min-w-0 flex-1 text-left">
          <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-sm sm:text-base")}>{heading}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {criterion.lines.length} checkpoints · max {blockMax}% of total rubric
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180",
            "group-open:text-primary",
          )}
          aria-hidden
        />
      </summary>
      <div className={cn("border-t border-border/60 bg-muted/10", compact ? "px-3 pb-3 pt-2" : "px-4 pb-4 pt-3")}>
        {criterion.intro ? (
          <p className={cn("mb-3 text-xs font-medium text-muted-foreground", compact && "mb-2")}>{criterion.intro}</p>
        ) : null}
        <ol className={cn("space-y-2", compact && "space-y-1.5")}>
          {criterion.lines.map((line) => (
            <li
              key={`${criterion.id}-${line.index}`}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 leading-snug">
                <span className="tabular-nums font-medium text-primary">{criterionLabel(section, criterion)}.{line.index}</span>{" "}
                <span className="text-foreground">{line.label}</span>
              </span>
              <Badge variant="secondary" className="shrink-0 tabular-nums text-xs font-semibold">
                {line.weightPercent}%
              </Badge>
            </li>
          ))}
        </ol>
        <div className={cn("mt-3 flex items-center gap-2", compact && "mt-2")}>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Criterion subtotal</span>
          <Progress value={blockMax} className="h-1.5 flex-1 bg-muted/80" />
          <span className="text-xs font-semibold tabular-nums text-foreground">{blockMax}%</span>
        </div>
      </div>
    </details>
  )
}

function SectionCard({
  section,
  compact,
}: {
  section: AdvisorRubricSection
  compact: boolean
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div
        className={cn(
          "border-b border-border/60 bg-gradient-to-r from-primary/[0.07] to-transparent",
          compact ? "px-4 py-3" : "px-5 py-4",
        )}
      >
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            {section.id === "SRS" ? <ClipboardList className="h-5 w-5" aria-hidden /> : <Layers className="h-5 w-5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Section {section.letter}</p>
            <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-base" : "text-lg")}>{section.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tabular-nums">
                Section pool {section.sectionMaxPercent}%
              </Badge>
              <Badge variant="secondary" className="tabular-nums">
                {section.criteria.length} criteria
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <CardContent className={cn("space-y-2", compact ? "p-3" : "p-4 sm:p-5")}>
        {section.criteria.map((criterion) => (
          <RubricCriterionDetails key={criterion.id} section={section} criterion={criterion} compact={compact} />
        ))}
      </CardContent>
    </Card>
  )
}

export function AdvisorCapstoneSrsSddRubricReadonly({
  stage,
  compact = false,
}: {
  stage: CapstoneStage
  compact?: boolean
}) {
  React.useEffect(() => {
    assertAdvisorSrsSddRubricTotals()
  }, [])

  const stageNote =
    stage === "Capstone I"
      ? "Use this checklist while reviewing first-semester documentation packages (SRS / SDD emphasis)."
      : "Use the same checklist for design maturity, traceability to SRS, and readiness before final implementation sign-off."

  return (
    <div className={cn("space-y-5", compact && "space-y-3")}>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] sm:flex-row sm:items-center sm:justify-between",
          compact ? "p-3" : "p-4 sm:p-5",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>Weighted read-only template</p>
            <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
              Expand each criterion to see numbered checkpoints. Line weights are advisory only and sum to{" "}
              <span className="font-medium text-foreground">{ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT}%</span> — your saved score
              remains one holistic 0–100 mark per student.
            </p>
            <p className={cn("mt-2 text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>{stageNote}</p>
          </div>
        </div>
        <Badge className="h-fit shrink-0 bg-primary text-primary-foreground tabular-nums">Σ = {ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT}%</Badge>
      </div>

      <div className={cn("grid gap-5", compact ? "gap-3" : "gap-6 lg:grid-cols-1")}>
        {ADVISOR_SRS_SDD_SECTIONS.map((section) => (
          <SectionCard key={section.id} section={section} compact={compact} />
        ))}
      </div>
    </div>
  )
}
