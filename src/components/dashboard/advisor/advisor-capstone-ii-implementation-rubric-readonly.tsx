"use client"

import * as React from "react"
import { ChevronDown, Cpu, Scale, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import {
  ADVISOR_CAPSTONE_II_FINAL_ASSESSMENT,
  ADVISOR_CAPSTONE_II_IMPLEMENTATION_CRITERIA,
  ADVISOR_CII_RUBRIC_TOTAL_PERCENT,
  assertAdvisorCapstoneIiRubricTotals,
  type CiiFinalAssessmentArea,
  type CiiImplementationCriterion,
} from "./advisor-capstone-ii-implementation-rubric-data"

function implLabel(num: number) {
  return `I.${num}`
}

function ImplementationCriterionDetails({ criterion, compact }: { criterion: CiiImplementationCriterion; compact: boolean }) {
  const heading = `${implLabel(criterion.number)} ${criterion.title}`

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
            {criterion.checkpoints.length} checkpoints · max {criterion.maxPercent}% of rubric total
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
        <p className={cn("mb-3 text-xs font-medium text-muted-foreground", compact && "mb-2")}>{criterion.intro}</p>
        <ol className={cn("space-y-2", compact && "space-y-1.5")}>
          {criterion.checkpoints.map((label, idx) => (
            <li
              key={`${criterion.id}-cp-${idx}`}
              className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm leading-snug text-foreground"
            >
              <span className="tabular-nums font-medium text-primary">
                {implLabel(criterion.number)}.{idx + 1}
              </span>{" "}
              {label}
            </li>
          ))}
        </ol>
        <div className={cn("mt-3 flex items-center gap-2", compact && "mt-2")}>
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Criterion weight cap</span>
          <Progress value={criterion.maxPercent} className="h-1.5 flex-1 bg-muted/80" />
          <span className="text-xs font-semibold tabular-nums text-foreground">{criterion.maxPercent}%</span>
        </div>
      </div>
    </details>
  )
}

function FinalAssessmentBlock({ area, compact }: { area: CiiFinalAssessmentArea; compact: boolean }) {
  return (
    <details
      className={cn(
        "group rounded-xl border border-border/70 bg-muted/15 shadow-sm",
        "open:border-emerald-500/30 open:bg-emerald-500/[0.04]",
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden",
          compact ? "px-3 py-2.5" : "px-4 py-3",
        )}
      >
        <p className="text-sm font-semibold text-foreground">{area.title}</p>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className={cn("space-y-1.5 border-t border-border/60 px-4 pb-3 pt-2 text-sm text-muted-foreground", compact && "px-3")}>
        {area.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-primary">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function AdvisorCapstoneIIImplementationRubricReadonly({ compact = false }: { compact?: boolean }) {
  React.useEffect(() => {
    assertAdvisorCapstoneIiRubricTotals()
  }, [])

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
            <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>Weighted implementation template</p>
            <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
              Twenty scored criteria (I.1–I.20) use the point caps shown; together they sum to{" "}
              <span className="font-medium text-foreground">{ADVISOR_CII_RUBRIC_TOTAL_PERCENT}%</span>. Expand any row for the
              technical checklist. The final assessment block below is a closing reference only.
            </p>
          </div>
        </div>
        <Badge className="h-fit shrink-0 bg-primary text-primary-foreground tabular-nums">Σ = {ADVISOR_CII_RUBRIC_TOTAL_PERCENT}%</Badge>
      </div>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div
          className={cn(
            "border-b border-border/60 bg-gradient-to-r from-primary/[0.07] to-transparent",
            compact ? "px-4 py-3" : "px-5 py-4",
          )}
        >
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Cpu className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Section I</p>
              <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-base" : "text-lg")}>
                System Implementation Advisor Evaluation Rubric
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">System implementation advisor technical checklist</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="tabular-nums">
                  20 criteria · {ADVISOR_CII_RUBRIC_TOTAL_PERCENT}% total
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <CardContent className={cn("space-y-2", compact ? "p-3" : "p-4 sm:p-5")}>
          {ADVISOR_CAPSTONE_II_IMPLEMENTATION_CRITERIA.map((criterion) => (
            <ImplementationCriterionDetails key={criterion.id} criterion={criterion} compact={compact} />
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div
          className={cn(
            "border-b border-border/60 bg-gradient-to-r from-emerald-500/10 to-transparent",
            compact ? "px-4 py-3" : "px-5 py-4",
          )}
        >
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
              <Target className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Reference</p>
              <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-base" : "text-lg")}>
                Final Implementation Assessment
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Advisor final evaluation areas (no separate weights — align with I.1–I.20)</p>
            </div>
          </div>
        </div>
        <CardContent className={cn("space-y-2", compact ? "p-3" : "p-4 sm:p-5")}>
          {ADVISOR_CAPSTONE_II_FINAL_ASSESSMENT.map((area) => (
            <FinalAssessmentBlock key={area.title} area={area} compact={compact} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
